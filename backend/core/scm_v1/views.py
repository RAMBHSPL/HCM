from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
import datetime

from core.models import (
    Employee, Position, Office, Department, Section, Role, PositionLevel, Project, Facility,
    PositionAssignment
)
from core.authentication import APIKeyAuthentication
from core.scm_v1.serializers import (
    SCMEmployeeSerializer, SCMPositionSerializer, SCMOfficeSerializer,
    SCMDepartmentSerializer, SCMSectionSerializer, SCMRoleSerializer,
    SCMPositionLevelSerializer, SCMProjectSerializer, SCMFacilitySerializer,
    SCMPositionAssignmentSerializer
)


class BaseSCMViewSet(viewsets.ViewSet):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # Store X-Request-Id if provided
        self.request_id = request.headers.get('X-Request-Id') or request.META.get('HTTP_X_REQUEST_ID')

    def finalize_response(self, request, response, *args, **kwargs):
        res = super().finalize_response(request, response, *args, **kwargs)
        if hasattr(self, 'request_id') and self.request_id:
            res['X-Request-Id'] = self.request_id
        return res

    def single_response(self, data, status_code=200):
        return Response({'data': data}, status=status_code)

    def paginated_response(self, data, total, limit, offset, next_url=None):
        return Response({
            'count': total,
            'next': next_url,
            'results': data,
            'data': data,
            'page': {
                'limit': limit,
                'offset': offset,
                'total': total,
                'next': next_url
            }
        }, status=200)

    def error_response(self, code, message, status_code=400):
        return Response({
            'error': {
                'code': code,
                'message': message
            }
        }, status=status_code)


class SCMEmployeeViewSet(BaseSCMViewSet):
    """
    SCM Employee API Suite (P0)
    Excludes all sensitive PII, salary, bank, health, DOB, PAN, Aadhaar, gender, photo.
    """

    def list(self, request):
        qs = Employee.objects.all()

        # Filtering
        status_param = request.query_params.get('status', 'active')
        if status_param == 'active':
            qs = qs.filter(status__in=['Active', 'active'])
        elif status_param == 'inactive':
            qs = qs.filter(status__in=['Inactive', 'inactive', 'Terminated', 'Resigned'])

        office_id = request.query_params.get('office_id')
        if office_id:
            qs = qs.filter(office_id=office_id)

        dept_id = request.query_params.get('department_id')
        if dept_id:
            qs = qs.filter(department_id=dept_id)

        proj_id = request.query_params.get('project_id')
        if proj_id:
            qs = qs.filter(project_id=proj_id)

        role_id = request.query_params.get('role_id')
        if role_id:
            qs = qs.filter(Q(position__role_id=role_id) | Q(positions__role_id=role_id)).distinct()

        q_search = request.query_params.get('q')
        if q_search:
            qs = qs.filter(
                Q(name__icontains=q_search) |
                Q(code__icontains=q_search) |
                Q(email__icontains=q_search)
            )

        ids_param = request.query_params.get('ids')
        if ids_param:
            id_list = [int(i.strip()) for i in ids_param.split(',') if i.strip().isdigit()]
            qs = qs.filter(id__in=id_list)

        # Cross-System IN (...) Joins optimization
        ids_only = request.query_params.get('ids_only') in ['true', '1']
        if ids_only:
            id_array = list(qs.values_list('id', flat=True)[:20000])
            return self.single_response(id_array)

        # Sorting
        sort = request.query_params.get('sort', 'name')
        if sort in ['name', '-name', 'code', '-code', 'created_at', '-created_at']:
            if sort == 'code':
                sort = 'code'
            qs = qs.order_by(sort)
        else:
            qs = qs.order_by('name')

        # Pagination
        try:
            limit = min(500, max(1, int(request.query_params.get('limit', 100))))
            offset = max(0, int(request.query_params.get('offset', 0)))
        except ValueError:
            limit, offset = 100, 0

        total = qs.count()
        page_qs = qs[offset:offset+limit]
        serializer = SCMEmployeeSerializer(page_qs, many=True)

        next_url = None
        if offset + limit < total:
            next_url = f"{request.build_absolute_uri(request.path)}?limit={limit}&offset={offset+limit}"

        return self.paginated_response(serializer.data, total, limit, offset, next_url)

    def retrieve(self, request, pk=None):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No employee with id {pk}', 404)

        serializer = SCMEmployeeSerializer(emp)
        return self.single_response(serializer.data)

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        username = request.query_params.get('username')
        if not username:
            return self.error_response('BAD_REQUEST', 'Missing username query parameter', 400)

        emp = None
        if username.isdigit():
            emp = Employee.objects.filter(id=int(username)).first()
        if not emp:
            emp = Employee.objects.filter(employee_code__iexact=username.strip()).first()
        if not emp:
            emp = Employee.objects.filter(email__iexact=username.strip()).first()

        if not emp:
            return self.error_response('NOT_FOUND', f'No employee found matching username {username}', 404)

        serializer = SCMEmployeeSerializer(emp)
        return self.single_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-code/(?P<code>[^/.]+)')
    def by_code(self, request, code=None):
        if not code:
            return self.error_response('BAD_REQUEST', 'Missing employee_code', 400)

        emp = Employee.objects.filter(employee_code__iexact=code.strip()).first()
        if not emp:
            return self.error_response('NOT_FOUND', f'No employee found with code {code}', 404)

        serializer = SCMEmployeeSerializer(emp)
        return self.single_response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch(self, request):
        ids = request.data.get('ids', [])
        codes = request.data.get('employee_codes', [])

        qs = Employee.objects.none()
        if ids:
            qs = qs | Employee.objects.filter(id__in=ids)
        if codes:
            qs = qs | Employee.objects.filter(employee_code__in=[c.strip() for c in codes])

        found_employees = list(qs.distinct())
        found_ids = {e.id for e in found_employees}
        found_codes = {e.employee_code for e in found_employees if e.employee_code}

        missing_ids = [i for i in ids if i not in found_ids]
        missing_codes = [c for c in codes if c not in found_codes]

        serializer = SCMEmployeeSerializer(found_employees, many=True)
        return Response({
            'data': serializer.data,
            'missing': missing_ids + missing_codes
        }, status=200)

    @action(detail=False, methods=['post'], url_path='resolve-names')
    def resolve_names(self, request):
        ids = request.data.get('ids', [])
        codes = request.data.get('employee_codes', [])

        qs = Employee.objects.none()
        if ids:
            qs = qs | Employee.objects.filter(id__in=ids)
        if codes:
            qs = qs | Employee.objects.filter(employee_code__in=[c.strip() for c in codes])

        res_data = {}
        for emp in qs.distinct():
            item = {
                'name': emp.name,
                'employee_code': emp.employee_code or f"EMP-{emp.id}",
                'status': 'active' if (emp.status or '').upper() == 'ACTIVE' else 'inactive'
            }
            res_data[str(emp.id)] = item
            if emp.employee_code:
                res_data[emp.employee_code] = item

        return self.single_response(res_data)

    @action(detail=True, methods=['get'])
    def context(self, request, pk=None):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No employee with id {pk}', 404)

        emp_data = SCMEmployeeSerializer(emp).data
        positions_qs = emp.positions.all()
        pos_data = SCMPositionSerializer(positions_qs, many=True).data

        active_pos = getattr(emp, 'position', None) or positions_qs.first()
        active_pos_data = SCMPositionSerializer(active_pos).data if active_pos else None

        # Build ancestors
        ancestors = []
        if active_pos:
            curr = active_pos.reporting_to.first() if hasattr(active_pos, 'reporting_to') else None
            depth = 0
            seen = {active_pos.id}
            while curr and depth < 20:
                if curr.id in seen:
                    break
                seen.add(curr.id)
                ancestors.append(SCMPositionSerializer(curr).data)
                curr = curr.reporting_to.first() if hasattr(curr, 'reporting_to') else None
                depth += 1

        # Office path
        office_path = []
        emp_office = active_pos.office if active_pos else None
        if emp_office:
            curr_off = emp_office
            off_seen = set()
            path_rev = []
            while curr_off and curr_off.id not in off_seen:
                off_seen.add(curr_off.id)
                path_rev.append({'id': curr_off.id, 'name': curr_off.name})
                curr_off = curr_off.parent
            office_path = list(reversed(path_rev))

        # Direct reports count
        direct_reports_count = 0
        if active_pos:
            direct_reports_count = Position.objects.filter(reporting_to=active_pos).count()

        return self.single_response({
            'employee': emp_data,
            'positions': pos_data,
            'active_position': active_pos_data,
            'ancestors': ancestors,
            'office_path': office_path,
            'direct_reports_count': direct_reports_count
        })

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        limit = min(50, max(1, int(request.query_params.get('limit', 20))))

        if not q:
            return self.single_response([])

        qs = Employee.objects.filter(
            Q(name__icontains=q) |
            Q(code__icontains=q) |
            Q(email__icontains=q)
        ).filter(status__in=['Active', 'active'])[:limit]

        res = []
        for emp in qs:
            primary_pos = getattr(emp, 'position', None) or emp.positions.first()
            res.append({
                'id': emp.id,
                'name': emp.name,
                'employee_code': emp.code or f"EMP-{emp.id}",
                'status': 'active',
                'office': {'name': emp.office.name} if emp.office else None,
                'primary_position': {'name': primary_pos.name} if primary_pos else None
            })
        return self.single_response(res)

    @action(detail=True, methods=['get'])
    def reports(self, request, pk=None):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No employee with id {pk}', 404)

        depth_param = request.query_params.get('depth', 'direct')
        ids_only = request.query_params.get('ids_only') in ['true', '1']

        positions = emp.positions.all()
        pos_ids = set(positions.values_list('id', flat=True))
        primary_p = getattr(emp, 'position', None)
        if primary_p:
            pos_ids.add(primary_p.id)

        if not pos_ids:
            return self.single_response([]) if ids_only else self.single_response([])

        report_emp_ids = set()
        if depth_param == 'direct':
            child_positions = Position.objects.filter(reporting_to__in=pos_ids)
            for cpos in child_positions:
                for remp in cpos.employees.all():
                    report_emp_ids.add(remp.id)
        else: # depth == 'all'
            visited_pos = set(pos_ids)
            frontier = set(pos_ids)
            while frontier:
                children = set(Position.objects.filter(reporting_to__in=frontier).values_list('id', flat=True))
                new_children = children - visited_pos
                if not new_children:
                    break
                visited_pos.update(new_children)
                frontier = new_children

            child_positions = Position.objects.filter(id__in=visited_pos - pos_ids)
            for cpos in child_positions:
                for remp in cpos.employees.all():
                    report_emp_ids.add(remp.id)

        if ids_only:
            return self.single_response(list(report_emp_ids))

        report_emps = Employee.objects.filter(id__in=report_emp_ids)
        serializer = SCMEmployeeSerializer(report_emps, many=True)
        return self.single_response(serializer.data)

    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No employee with id {pk}', 404)

        pos_qs = emp.positions.all()
        serializer = SCMPositionSerializer(pos_qs, many=True)
        return self.single_response(serializer.data)


class SCMPositionViewSet(BaseSCMViewSet):
    """
    SCM Position API Suite (P0)
    Org chart hierarchy, ancestor reporting chains, cycle detection, seat holders.
    """

    def list(self, request):
        qs = Position.objects.all()

        status_param = request.query_params.get('status', 'active')
        if status_param == 'active':
            qs = qs.filter(status__in=['Active', 'active'])
        elif status_param == 'inactive':
            qs = qs.filter(status__in=['Inactive', 'inactive'])

        role_id = request.query_params.get('role_id')
        if role_id:
            qs = qs.filter(role_id=role_id)

        proj_id = request.query_params.get('project_id')
        if proj_id:
            qs = qs.filter(project_id=proj_id)

        ids_only = request.query_params.get('ids_only') in ['true', '1']
        if ids_only:
            return self.single_response(list(qs.values_list('id', flat=True)[:20000]))

        try:
            limit = min(500, max(1, int(request.query_params.get('limit', 100))))
            offset = max(0, int(request.query_params.get('offset', 0)))
        except ValueError:
            limit, offset = 100, 0

        total = qs.count()
        serializer = SCMPositionSerializer(qs[offset:offset+limit], many=True)
        return self.paginated_response(serializer.data, total, limit, offset)

    def retrieve(self, request, pk=None):
        try:
            pos = Position.objects.get(pk=pk)
        except Position.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No position with id {pk}', 404)

        serializer = SCMPositionSerializer(pos)
        return self.single_response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch(self, request):
        ids = request.data.get('ids', [])
        qs = Position.objects.filter(id__in=ids)
        serializer = SCMPositionSerializer(qs, many=True)
        found_ids = set(qs.values_list('id', flat=True))
        missing = [i for i in ids if i not in found_ids]
        return Response({'data': serializer.data, 'missing': missing}, status=200)

    @action(detail=True, methods=['get'])
    def ancestors(self, request, pk=None):
        try:
            pos = Position.objects.get(pk=pk)
        except Position.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No position with id {pk}', 404)

        max_depth = min(50, max(1, int(request.query_params.get('max_depth', 20))))
        include_holders = request.query_params.get('include_holders') in ['true', '1']

        ancestors = []
        curr = pos.reporting_to.first() if hasattr(pos, 'reporting_to') else None
        seen = {pos.id}
        depth = 1
        warning = None

        while curr and depth <= max_depth:
            if curr.id in seen:
                warning = f"cycle_detected_at_position_id: {curr.id}"
                break
            seen.add(curr.id)
            parent_pos = curr.reporting_to.first() if hasattr(curr, 'reporting_to') else None

            item = {
                'id': curr.id,
                'name': curr.name,
                'role': {'id': curr.role.id, 'name': curr.role.name} if curr.role else None,
                'parent_position_id': parent_pos.id if parent_pos else None,
                'status': 'active' if getattr(curr, 'status', 'Active') in ['Active', 'active'] else 'inactive',
                'depth': depth
            }
            if include_holders:
                item['holders'] = [{'id': h.id, 'name': h.name, 'employee_code': getattr(h, 'employee_code', f"EMP-{h.id}")} for h in curr.employees.filter(status__in=['Active', 'active'])]

            ancestors.append(item)
            curr = parent_pos
            depth += 1

        res = {'data': ancestors}
        if warning:
            res['warning'] = warning
        return Response(res, status=200)

    @action(detail=True, methods=['get'])
    def descendants(self, request, pk=None):
        try:
            pos = Position.objects.get(pk=pk)
        except Position.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No position with id {pk}', 404)

        ids_only = request.query_params.get('ids_only') in ['true', '1']

        visited = {pos.id}
        frontier = {pos.id}
        while frontier:
            children = set(Position.objects.filter(reporting_to__in=frontier).values_list('id', flat=True))
            new_children = children - visited
            if not new_children:
                break
            visited.update(new_children)
            frontier = new_children

        descendant_ids = list(visited - {pos.id})
        if ids_only:
            return self.single_response(descendant_ids)

        desc_qs = Position.objects.filter(id__in=descendant_ids)
        serializer = SCMPositionSerializer(desc_qs, many=True)
        return self.single_response(serializer.data)

    @action(detail=True, methods=['get'])
    def holders(self, request, pk=None):
        try:
            pos = Position.objects.get(pk=pk)
        except Position.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No position with id {pk}', 404)

        holders = pos.employees.filter(status__in=['Active', 'active'])
        res = []
        for h in holders:
            res.append({
                'employee': SCMEmployeeSerializer(h).data,
                'assignment': {
                    'is_primary': True,
                    'status': 'active'
                }
            })
        return self.single_response(res)


class SCMRoleViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Role.objects.all()
        proj_id = request.query_params.get('project_id')
        if proj_id:
            qs = qs.filter(positions__project_id=proj_id).distinct()

        serializer = SCMRoleSerializer(qs, many=True)
        return self.single_response(serializer.data)


class SCMProjectViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Project.objects.all()
        include_hc = request.query_params.get('include_headcount') in ['true', '1']
        serializer = SCMProjectSerializer(qs, many=True, context={'include_headcount': include_hc})
        return self.single_response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            proj = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No project with id {pk}', 404)

        serializer = SCMProjectSerializer(proj)
        return self.single_response(serializer.data)


class SCMOfficeViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Office.objects.all()
        ids_only = request.query_params.get('ids_only') in ['true', '1']
        if ids_only:
            return self.single_response(list(qs.values_list('id', flat=True)[:20000]))

        serializer = SCMOfficeSerializer(qs, many=True)
        return self.single_response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            off = Office.objects.get(pk=pk)
        except Office.DoesNotExist:
            return self.error_response('NOT_FOUND', f'No office with id {pk}', 404)

        serializer = SCMOfficeSerializer(off)
        return self.single_response(serializer.data)


class SCMDepartmentViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Department.objects.all()
        serializer = SCMDepartmentSerializer(qs, many=True)
        return self.single_response(serializer.data)


class SCMSectionViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Section.objects.all()
        serializer = SCMSectionSerializer(qs, many=True)
        return self.single_response(serializer.data)


class SCMPositionLevelViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = PositionLevel.objects.all()
        serializer = SCMPositionLevelSerializer(qs, many=True)
        return self.single_response(serializer.data)


class SCMFacilityViewSet(BaseSCMViewSet):
    def list(self, request):
        qs = Facility.objects.all()
        ids_only = request.query_params.get('ids_only') in ['true', '1']
        if ids_only:
            return self.single_response(list(qs.values_list('id', flat=True)[:20000]))

        serializer = SCMFacilitySerializer(qs, many=True)
        return self.single_response(serializer.data)


class SCMHealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            'data': {
                'status': 'ok',
                'version': 'v1',
                'server_time': timezone.now().isoformat()
            }
        }, status=200)

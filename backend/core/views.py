from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
import builtins
from .models import (
    Office, Facility, FacilityMaster, FacilityDeploymentMode, FacilityClass, FacilitySubClass, Department, Section, JobFamily, RoleType, Role, Job, Task, TaskUrl, Position, 
    Employee, Project, IndianVillage, OrganizationLevel, EmployeeTaskUrlPermission, PositionScreenPermission,
    DocumentType, EmployeeDocument,
    EmployeeEducation, EmployeeExperience, EmployeeEmploymentHistory,
    EmployeeBankDetails, EmployeeEPFODetails, EmployeeHealthDetails, EmployeeSalaryDetails,
    GeoContinent, GeoCountry, GeoState, GeoDistrict,    GeoMandal, GeoCluster, VisitingLocation, Landmark, APIKey, LoginHit, AccountBlockHistory, EmployeeArchive, PositionLevel, PositionAssignment, PositionType, Shift, PositionShiftRoster,
    Segment, RoleSubGroup, OfficeType
)
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    OfficeSerializer, LightOfficeSerializer, FacilitySerializer, DepartmentSerializer, LightDepartmentSerializer, SectionSerializer, JobFamilySerializer, 
    RoleTypeSerializer, RoleSerializer, JobSerializer, TaskSerializer, TaskUrlSerializer,
    PositionLevelSerializer, PositionTypeSerializer, ShiftSerializer,
    PositionSerializer, PositionDetailSerializer, EmployeeSerializer, EmployeeListSerializer, IntegrationEmployeeSerializer, ProjectSerializer, FacilityMasterSerializer, FacilityDeploymentModeSerializer, FacilityClassSerializer, FacilitySubClassSerializer, IndianVillageSerializer, 
    OrganizationLevelSerializer, DocumentTypeSerializer, EmployeeDocumentSerializer, EmployeeDocumentListSerializer, 
    EmployeeEducationSerializer, EmployeeEducationListSerializer, EmployeeExperienceSerializer, EmployeeExperienceListSerializer, EmployeeEmploymentHistorySerializer,
    EmployeeBankDetailsSerializer, EmployeeEPFODetailsSerializer, EmployeeHealthDetailsSerializer, EmployeeSalaryDetailsSerializer,
    GeoContinentSerializer, GeoCountrySerializer, GeoStateSerializer, GeoDistrictSerializer,
    GeoMandalSerializer, GeoClusterSerializer, VisitingLocationSerializer, LandmarkSerializer,
    UserSerializer, EmployeeTaskUrlPermissionSerializer, GeoHierarchySerializer, APIKeySerializer, LoginHitSerializer, AccountBlockHistorySerializer, EmployeeArchiveSerializer, PositionAssignmentSerializer, PositionActivityLogSerializer, PositionShiftRosterSerializer,
    SegmentSerializer, RoleSubGroupSerializer, OfficeTypeSerializer,
    GeoContinentNestedSerializer
)
from .models import PositionActivityLog
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework import status, permissions, filters
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Min, Prefetch
import builtins # For built-in list conversion

def get_client_ip(request):
    """Utility to get real client IP even behind multiple proxies/load balancers."""
    # List of common headers used by proxies to pass the client IP
    headers = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'HTTP_CLIENT_IP',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'HTTP_VIA',
        'REMOTE_ADDR'
    ]
    
    for header in headers:
        val = request.META.get(header)
        if not val:
            continue
            
        # Headers can be a comma-separated list (e.g., ClientIP, Proxy1, Proxy2)
        # We need the first one that is NOT a private internal IP
        parts = [p.strip() for p in val.split(',')]
        for ip in parts:
            # Skip common private/internal IP ranges if there are other options
            is_internal = (
                ip.startswith('10.') or 
                ip.startswith('192.168.') or 
                ip.startswith('172.') or 
                ip.startswith('127.') or
                ip == '::1'
            )
            if not is_internal:
                return ip
                
        # If all IPs in this header were internal, but it's the only header we found, 
        # return the first one as fallback
        return parts[0]
        
    return '0.0.0.0'

def _get_subordinate_ids(employee_id, exclude_self=True):
    from django.core.cache import cache
    cache_key = f"sub_ids_{employee_id}_{exclude_self}"
    cached_val = cache.get(cache_key)
    if cached_val is not None:
        return cached_val

    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return []
    
    from django.utils import timezone
    now = timezone.now()
    
    # Base Position IDs: Permanent + Approved Assignments
    my_pos_ids = set(employee.positions.values_list('id', flat=True))
    assigned_pos_ids = PositionAssignment.objects.filter(
        assignee_id=employee_id,
        status='APPROVED'
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).values_list('position_id', flat=True)
    my_pos_ids.update(assigned_pos_ids)
    
    ids = set()
    current_level_emps = [employee.id]
    processed_emps = {employee.id}
    
    # Add subordinates from ALL positions (permanent + assigned)
    while current_level_emps:
        next_level = builtins.list(Employee.objects.filter(reporting_to_id__in=current_level_emps).values_list('id', flat=True))
        new_ids = [eid for eid in next_level if eid not in processed_emps]
        ids.update(new_ids)
        processed_emps.update(new_ids)
        current_level_emps = new_ids
        
    base_emp_ids = builtins.list(ids)
    if not exclude_self: base_emp_ids.append(employee.id)
    
    initial_pos_ids = set(Position.objects.filter(employees__id__in=base_emp_ids).values_list('id', flat=True))
    manager_pos_ids = my_pos_ids
    
    current_level_pos = builtins.list(initial_pos_ids | manager_pos_ids)
    processed_pos = set(current_level_pos)
    
    while current_level_pos:
        next_level_pos = builtins.list(Position.objects.filter(reporting_to__in=current_level_pos).values_list('id', flat=True))
        new_pos_ids = [pid for pid in next_level_pos if pid not in processed_pos]
        processed_pos.update(new_pos_ids)
        if new_pos_ids:
            incumbents = Employee.objects.filter(positions__id__in=new_pos_ids).values_list('id', flat=True)
            for eid in incumbents:
                if eid != employee.id: ids.add(eid)
        current_level_pos = new_pos_ids
        
    if not exclude_self: ids.add(employee.id)
    elif employee.id in ids: ids.remove(employee.id)
    
    result = builtins.list(ids)
    cache.set(cache_key, result, timeout=15)
    return result

def get_recursive_subordinate_ids(employee, exclude_self=True):
    return _get_subordinate_ids(employee.id, exclude_self)

def _get_office_ids_cached(office_ids_tuple):
    """Traverse office hierarchy downward from the given office IDs.
    NOTE: lru_cache intentionally removed - it caused permanent stale results
    after new offices/departments were created without a server restart."""
    all_ids = set(office_ids_tuple)
    current_level = builtins.list(office_ids_tuple)
    while current_level:
        next_level = builtins.list(Office.objects.filter(parent_id__in=current_level).values_list('id', flat=True))
        new_ids = [oid for oid in next_level if oid not in all_ids]
        all_ids.update(new_ids)
        current_level = new_ids
    return builtins.list(all_ids)

def get_recursive_office_ids(office_ids):
    return _get_office_ids_cached(tuple(sorted(office_ids)))

def _get_accessible_office_ids(employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return []
    
    from django.utils import timezone
    now = timezone.now()
    
    # 1. Base Offices from Permanent Positions
    my_office_ids = set(employee.positions.values_list('office_id', flat=True))
    
    # 2. Add Offices from Assigned Positions (Delegations)
    assigned_office_ids = PositionAssignment.objects.filter(
        assignee_id=employee_id,
        status='APPROVED'
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).values_list('position__office_id', flat=True)
    my_office_ids.update(assigned_office_ids)
    
    # Only recurse DOWN from the combined assigned offices
    accessible_ids = set(get_recursive_office_ids(list(my_office_ids)))
    accessible_ids.discard(None)
    
    return list(accessible_ids)

def get_accessible_office_ids(employee):
    return _get_accessible_office_ids(employee.id)

class ActivityLoggingMixin:
    """Mixin to log CREATE, EDIT, and VIEW actions for NORMAL assignments and Global Audit Logs."""
    def _log_audit(self, action_type, instance, old_data=None, changes=None):
        try:
            request = getattr(self, 'request', None)
            if not request:
                return
            user = getattr(request, 'user', None) if request.user and request.user.is_authenticated else None
            ip = get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT')
            
            qs = getattr(self, 'queryset', None)
            qs_model = qs.model.__name__ if qs and hasattr(qs, 'model') else "Unknown"
            
            # Skip noise models
            if qs_model in ['AuditLog', 'PositionActivityLog', 'LoginHit', 'APIKeyUsageLog']:
                return

            from core.models import AuditLog
            AuditLog.objects.create(
                user=user,
                action=action_type,
                model_name=qs_model,
                record_id=str(instance.id) if instance and hasattr(instance, 'id') else 'N/A',
                changes=changes if changes is not None else (old_data if old_data is not None else {}),
                ip_address=ip,
                user_agent=ua
            )
        except Exception:
            pass

    def _log_activity(self, action_type, instance=None):
        try:
            request = getattr(self, 'request', None)
            user = getattr(request, 'user', None) if request else None
            
            if not user or not user.is_authenticated:
                return

            if not hasattr(user, 'employee_profile'):
                return
            
            # Don't log logs
            qs = getattr(self, 'queryset', None)
            qs_model = qs.model.__name__ if qs and hasattr(qs, 'model') else "Unknown"
            
            if qs is not None and hasattr(qs, 'model'):
                from core.models import PositionActivityLog
                if qs.model == PositionActivityLog:
                    return

            employee = getattr(user, 'employee_profile', None)
            if not employee:
                return
            from django.utils import timezone
            now = timezone.now()
            
            # Check for header-based Context (Explicit Switch)
            context_id = getattr(request, 'headers', {}).get('X-Position-Context')
            
            # STRICT LOGGING: Only log if explicitly in Acting Mode
            if not context_id:
                return

            from .models import PositionAssignment, PositionActivityLog
            active_assignment = PositionAssignment.objects.filter(
                id=context_id,
                assignee=employee,
                status='APPROVED'
            ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).first()
            
            if active_assignment:
                PositionActivityLog.objects.create(
                    user=getattr(request, 'user', None),
                    assignment=active_assignment,
                    action_type=action_type,
                    model_name=qs_model,
                    record_id=str(instance.id) if instance and hasattr(instance, 'id') else None,
                    record_name=str(instance) if instance else None
                )
        except Exception:
            pass

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_activity('CREATE', instance)
        try:
            self._log_audit('CREATE', instance, None, serializer.data)
        except Exception:
            # Silently skip audit logging if serializer.data raises (e.g. DateField/DateTimeField mismatch)
            self._log_audit('CREATE', instance, None, {'id': str(instance.id)})

        
    def perform_update(self, serializer):
        try:
            get_obj = getattr(self, 'get_object', None)
            old_instance = get_obj() if get_obj else None
            get_ser = getattr(self, 'get_serializer', None)
            old_data = get_ser(old_instance).data if old_instance and get_ser else {}
        except Exception:
            old_data = {}
            
        instance = serializer.save()
        try:
            new_data = serializer.data
            changes = {k: {'old': old_data.get(k), 'new': v} for k, v in new_data.items() if old_data.get(k) != v}
        except Exception:
            new_data = {'id': str(instance.id)}
            changes = new_data
        
        self._log_activity('EDIT', instance)
        self._log_audit('UPDATE', instance, old_data, changes)


    def perform_destroy(self, instance):
        try:
            get_ser = getattr(self, 'get_serializer', None)
            old_data = get_ser(instance).data if get_ser else {}
        except Exception:
            old_data = {}
            
        self._log_activity('DELETE', instance)
        self._log_audit('DELETE', instance, old_data, None)
        instance.delete()
        
    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            get_obj = getattr(self, 'get_object', None)
            obj = get_obj() if get_obj else None
            if obj:
                self._log_activity('VIEW', obj)
        return response

    def list(self, request, *args, **kwargs):
        # Optional: Log that they viewed the list index
        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            self._log_activity('VIEW', None) # None record means viewed list
        return response

class ScopedViewSetMixin(ActivityLoggingMixin):
    """Mixin to filter querysets based on the employee reporting hierarchy AND API Key Scopes."""
    def get_queryset(self):
        queryset = Employee.objects.none() # Fallback
        try:
            get_qs = getattr(super(), 'get_queryset', None)
            queryset = get_qs() if get_qs else Employee.objects.none()
            request = self.request
            user = request.user if request else None
            
            # 1. API Key Scope Enforcement (Highest Priority)
            from core.models import APIKey
            auth = getattr(request, 'auth', None)
            if auth and isinstance(auth, APIKey):
                return self._apply_api_key_scoping(queryset, auth)

            # 2. User Hierarchy Enforcement (Standard Access Control)
            if not user or not user.is_authenticated:
                return queryset.none()
                
            # Bypass hierarchical scoping for Superusers and Staff users (not using API Keys)
            if user and (getattr(user, 'is_superuser', False) or (getattr(user, 'is_staff', False) and not auth)):
                return queryset.all() 
                
            employee = getattr(user, 'employee_profile', None)
            if employee:
                model = queryset.model
                
                if model == Employee:
                    accessible_offices = get_accessible_office_ids(employee)
                    sub_ids = get_recursive_subordinate_ids(employee, exclude_self=False)
                    
                    qs = queryset.filter(
                        Q(positions__office_id__in=accessible_offices) |
                        Q(id__in=sub_ids, positions__office__level__rank__gte=employee.positions.aggregate(m=Min('office__level__rank'))['m'] or 99) |
                        Q(positions__isnull=True)  # Include unassigned employees so they can be managed/assigned
                    ).distinct().order_by('-id')
                    
                    if getattr(self, 'action', None) == 'list':
                        qs = qs.exclude(id=employee.id)
                    return qs
                
                sub_ids = get_recursive_subordinate_ids(employee, exclude_self=False)
                accessible_office_ids = get_accessible_office_ids(employee)
                
                if model == User:
                    if not user:
                        return queryset.none()
                    return queryset.filter(
                        Q(id=user.id) | 
                        Q(employee_profile_id__in=sub_ids)
                    ).distinct()

                elif model == Position:
                    return queryset.filter(
                        Q(office_id__in=accessible_office_ids) |
                        Q(employees__id__in=sub_ids) | 
                        Q(employees__id=employee.id) | 
                        Q(reporting_to__employees__id=employee.id)
                    ).distinct().order_by('name')
                elif hasattr(model, 'employee'):
                    return queryset.filter(employee_id__in=sub_ids)
                elif model in [Office, Facility]:
                    return queryset.filter(id__in=accessible_office_ids)
                elif model == Department:
                    return queryset.filter(office_id__in=accessible_office_ids)
                elif model == Section:
                    return queryset.filter(department__office_id__in=accessible_office_ids)
                elif model == Project:
                    ids1 = set(Project.objects.filter(assigned_offices__id__in=accessible_office_ids).values_list('id', flat=True))
                    ids2 = set(Project.objects.filter(assigned_level__offices__id__in=accessible_office_ids).values_list('id', flat=True))
                    ids3 = set(Project.objects.filter(departments__office_id__in=accessible_office_ids).values_list('id', flat=True))
                    return queryset.filter(id__in=ids1 | ids2 | ids3).distinct().order_by('name')
                elif model in [GeoContinent, GeoCountry, GeoState, GeoDistrict, GeoMandal, GeoCluster, IndianVillage, VisitingLocation, Landmark]:
                    return queryset.all()
                elif model in [
                    # Reference / Lookup models - accessible to all authenticated users
                    PositionType, Shift, JobFamily, RoleType, Role, RoleSubGroup,
                    Job, Task, PositionLevel, Segment, FacilityMaster, FacilityDeploymentMode, FacilityClass, FacilitySubClass, DocumentType,
                    OfficeType, OrganizationLevel,
                ]:
                    return queryset.all()
                
            return queryset.none()
        except Exception as e:
            print(f"Hierarchical/Scope Error: {str(e)}")
            return queryset.none()

    def _apply_api_key_scoping(self, queryset, api_key):
        """Helper to apply API Key specified entity scopes to any queryset."""
        scope = api_key.scope
        if scope.get('type') == 'GLOBAL':
            return queryset
            
        entities = scope.get('entities', [])
        if not entities:
            return queryset.none()
            
        grouped = {}
        for ent in entities:
            e_type = ent.get('type')
            e_id = ent.get('id')
            if e_type and e_id:
                if e_type not in grouped:
                    grouped[e_type] = []
                grouped[e_type].append(e_id)
                
        model = queryset.model
        q_obj = Q()
        
        if model == Employee:
            for et, ids in grouped.items():
                if et == 'PROJECT': q_obj |= Q(positions__section__project_id__in=ids) | Q(positions__department__project_id__in=ids)
                elif et == 'OFFICE': q_obj |= Q(positions__office_id__in=ids)
                elif et == 'DEPARTMENT': q_obj |= Q(positions__department_id__in=ids)
                elif et == 'SECTION': q_obj |= Q(positions__section_id__in=ids)
                elif et == 'LEVEL': q_obj |= Q(positions__office__level_id__in=ids)
                elif et == 'POSITION': q_obj |= Q(positions__id__in=ids)
                elif et == 'ROLE': q_obj |= Q(positions__role_id__in=ids)
                elif et == 'EMPLOYEE': q_obj |= Q(id__in=ids)
                elif et == 'CONTINENT': q_obj |= Q(positions__office__country__continent_ref_id__in=ids)
                elif et == 'COUNTRY': q_obj |= Q(positions__office__country_id__in=ids)
                elif et == 'STATE': q_obj |= Q(positions__office__state_id__in=ids)
                elif et == 'DISTRICT': q_obj |= Q(positions__office__district_id__in=ids)
                elif et == 'MANDAL': q_obj |= Q(positions__office__mandal_id__in=ids)
                elif et == 'CLUSTER': q_obj |= Q(positions__office__cluster_id__in=ids)
                
        elif model == Position:
            for et, ids in grouped.items():
                if et == 'PROJECT': q_obj |= Q(section__project_id__in=ids) | Q(department__project_id__in=ids)
                elif et == 'OFFICE': q_obj |= Q(office_id__in=ids)
                elif et == 'DEPARTMENT': q_obj |= Q(department_id__in=ids)
                elif et == 'SECTION': q_obj |= Q(section_id__in=ids)
                elif et == 'LEVEL': q_obj |= Q(office__level_id__in=ids)
                elif et == 'POSITION': q_obj |= Q(id__in=ids)
                elif et == 'ROLE': q_obj |= Q(role_id__in=ids)
                elif et == 'CONTINENT': q_obj |= Q(office__country__continent_ref_id__in=ids)
                elif et == 'COUNTRY': q_obj |= Q(office__country_id__in=ids)
                elif et == 'STATE': q_obj |= Q(office__state_id__in=ids)
                elif et == 'DISTRICT': q_obj |= Q(office__district_id__in=ids)
                elif et == 'MANDAL': q_obj |= Q(office__mandal_id__in=ids)
                elif et == 'CLUSTER': q_obj |= Q(office__cluster_id__in=ids)

        elif model == Department:
            for et, ids in grouped.items():
                if et == 'PROJECT': q_obj |= Q(project_id__in=ids)
                elif et == 'OFFICE': q_obj |= Q(office_id__in=ids)
                elif et == 'LEVEL': q_obj |= Q(office__level_id__in=ids)
                
        elif model == Section:
            for et, ids in grouped.items():
                if et == 'PROJECT': q_obj |= Q(project_id__in=ids)
                elif et == 'DEPARTMENT': q_obj |= Q(department_id__in=ids)
                elif et == 'OFFICE': q_obj |= Q(department__office_id__in=ids)

        elif model == Project:
            for et, ids in grouped.items():
                if et == 'PROJECT': q_obj |= Q(id__in=ids)
                elif et == 'OFFICE': q_obj |= Q(assigned_offices__id__in=ids)
                elif et == 'LEVEL': q_obj |= Q(assigned_level__offices__id__in=ids)

        if not q_obj and model not in [Employee, Position, Department, Section, Project]:
            return queryset
            
        return queryset.filter(q_obj).distinct() if q_obj else queryset.none()

class PerfectUpsertMixin:
    """
    Mixin to enable idempotent POST requests: Update if exists based on lookup fields.
    This solves the 'duplicate records' issue by switching to an update if a unique match is found.
    """
    upsert_lookup_fields = []

    def create(self, request, *args, **kwargs):
        # 1. If NO lookup fields defined, behave normally
        if not self.upsert_lookup_fields:
            return super().create(request, *args, **kwargs)

        data = request.data
        if isinstance(data, builtins.list):
            results = []
            created_count = 0
            updated_count = 0
            errors = []
            
            model = self.queryset.model
            
            with transaction.atomic():
                for index, item in enumerate(data):
                    lookup_data = {}
                    for field in self.upsert_lookup_fields:
                        val = item.get(field)
                        if val:
                            lookup_data[field] = val
                    
                    existing = None
                    if lookup_data:
                        existing = model.objects.filter(**lookup_data).first()
                    
                    if existing:
                        serializer = self.get_serializer(existing, data=item, partial=True)
                        if serializer.is_valid():
                            self.perform_update(serializer)
                            updated_count += 1
                            results.append(serializer.data)
                        else:
                            errors.append({"row": index + 2, "errors": serializer.errors})
                    else:
                        serializer = self.get_serializer(data=item)
                        if serializer.is_valid():
                            self.perform_create(serializer)
                            created_count += 1
                            results.append(serializer.data)
                        else:
                            errors.append({"row": index + 2, "errors": serializer.errors})
            
            return Response({
                "message": f"Processed {builtins.len(data)} items.",
                "created": created_count,
                "updated": updated_count,
                "errors": errors
            }, status=status.HTTP_201_CREATED)

        # 2. Extract lookup data from request
        # Safely resolve FK fields: empty string '' is not valid for FK filter -> treat as None
        lookup_data = {}
        for field in self.upsert_lookup_fields:
            val = data.get(field)
            if val == '' or val is None:
                # For nullable FK fields, explicitly use None so filter works correctly
                lookup_data[field] = None
            elif val:
                lookup_data[field] = val

        # 3. If we have at least the name or key field, try to find an existing record
        # Wrap in try/except to gracefully handle any FK resolution errors
        if lookup_data:
            try:
                model = self.queryset.model
                existing = model.objects.filter(**lookup_data).first()
                if existing:
                    # Found it! Switch to UPDATE mode
                    serializer = self.get_serializer(existing, data=data, partial=True)
                    serializer.is_valid(raise_exception=True)
                    self.perform_update(serializer)
                    return Response(serializer.data, status=status.HTTP_200_OK)
            except (ValueError, TypeError):
                # FK resolution failed (e.g. invalid value type for FK field) - fall through to standard CREATE
                pass

        # 4. Default to standard CREATE
        return super().create(request, *args, **kwargs)


class CachedListMixin:
    """
    Mixin to transparently cache list action responses for viewsets.
    Automatically invalidates on any model change due to model signals clearing cache.
    """
    def list(self, request, *args, **kwargs):
        from django.core.cache import cache
        import hashlib
        from rest_framework.response import Response

        # Check if user-scoped filtering (like reports_to_me) is enabled
        reports_to_me = request.query_params.get('reports_to_me', 'false').lower() == 'true'
        user_id = getattr(request.user, 'id', None)
        auth = getattr(request, 'auth', None)
        
        if reports_to_me and user_id:
            user_identifier = f"user_{user_id}"
            if hasattr(auth, 'id'):
                user_identifier += f"_auth_{auth.id}"
        else:
            user_identifier = "shared"
            if hasattr(auth, 'id'):
                user_identifier += f"_auth_{auth.id}"

        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        model_name = self.serializer_class.Meta.model.__name__.lower()
        cache_key = f"hcm_{model_name}_list_v1_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, 86400) # Cache for 1 day
        return response


class PositionActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing activity logs of delegated positions.
    Only the Assignor of a Normal Assignment can see the logs of their Assignee.
    """
    queryset = PositionActivityLog.objects.all()
    serializer_class = PositionActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        qs = PositionActivityLog.objects.all()
        
        assignment_id = self.request.query_params.get('assignment')
        
        if user.is_superuser:
            if assignment_id: qs = qs.filter(assignment_id=assignment_id)
            return qs.select_related('user', 'assignment', 'assignment__assignee', 'assignment__position')
        
        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            # I want to see activities performed by others under positions I assigned (as Normal)
            qs = qs.filter(
                assignment__assignor=employee,
                assignment__assignment_type='NORMAL'
            )
            if assignment_id:
                qs = qs.filter(assignment_id=assignment_id)
                
            return qs.select_related('user', 'assignment', 'assignment__assignee', 'assignment__position')
        
        return PositionActivityLog.objects.none()

class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] 

    def post(self, request):
        print(f"\n[DEBUG] Login attempt for user: {request.data.get('username')}")
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Capture request metadata
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT')

        # Try to find user by username or employee code
        user_to_check = User.objects.filter(username=username).first()
        if not user_to_check:
            # Try finding via employee code
            emp_by_code = Employee.objects.filter(employee_code=username).first()
            if emp_by_code and emp_by_code.user:
                user_to_check = emp_by_code.user
                username = user_to_check.username # Update for authenticate() later
        if user_to_check and hasattr(user_to_check, 'employee_profile'):
            emp = user_to_check.employee_profile
            
            # 1. Check for brute-force lock
            if emp.is_blocked:
                LoginHit.objects.create(
                    username=username,
                    ip_address=ip,
                    user_agent=ua,
                    status='FAILED'
                )
                return Response({
                    'error': 'Your account is blocked due to 3 failed attempts. Please contact Admin for reactivation.',
                    'blocked': True
                }, status=status.HTTP_403_FORBIDDEN)
            
            
            if emp.status == 'Inactive':
                return Response({
                    'error': 'Your account has been deactivated. Please contact HR.',
                    'status': 'INACTIVE'
                }, status=status.HTTP_403_FORBIDDEN)

        user = authenticate(username=username, password=password)
        
        if user:
            # Log successful login attempt
            hit = LoginHit.objects.create(
                user=user,
                username=username,
                ip_address=ip,
                user_agent=ua,
                status='SUCCESS'
            )

            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)
            # Check if linked employee is active and reset failures
            if hasattr(user, 'employee_profile'):
                emp = user.employee_profile
                
                if emp.status == 'Inactive':
                    return Response({
                        'error': 'Your account has been deactivated. Please contact HR.', 
                        'status': 'INACTIVE'
                    }, status=status.HTTP_403_FORBIDDEN)
                # Reset failed attempts on successful login
                emp.failed_login_attempts = 0
                emp.save()

            permissions_map = {}
            if user.is_superuser:
                permissions_map = {'*': {'view': True, 'create': True, 'edit': True, 'delete': True, 'enabled': True}}
            elif hasattr(user, 'employee_profile'):
                permissions_map = get_employee_permissions(user.employee_profile)
            
            user_data = UserSerializer(user, context={'request': request}).data
            user_data['permissions'] = permissions_map
            
            requires_reset = False
            if hasattr(user, 'employee_profile'):
                requires_reset = user.employee_profile.is_password_reset_required

            return Response({
                'token': token.key,
                'user': user_data,
                'login_hit_id': hit.id,
                'requires_password_change': requires_reset
            })
            
        # Log failed login attempt
        LoginHit.objects.create(
            username=username if username else 'Unknown',
            ip_address=ip,
            user_agent=ua,
            status='FAILED'
        )
        
        # Increment failed attempts
        if user_to_check and hasattr(user_to_check, 'employee_profile'):
            emp = user_to_check.employee_profile
            # Only increment if not already blocked
            if not emp.is_blocked:
                emp.failed_login_attempts += 1
                if emp.failed_login_attempts >= 3:
                    emp.is_blocked = True
                    emp.last_failed_login_count = emp.failed_login_attempts
                    emp.save()
                    
                    # Create AccountBlockHistory record
                    from .models import AccountBlockHistory
                    AccountBlockHistory.objects.create(
                        employee=emp,
                        action='BLOCKED',
                        failed_attempts=emp.failed_login_attempts,
                        block_reason=f'Account automatically blocked after {emp.failed_login_attempts} failed login attempts',
                        ip_address=ip
                    )
                    
                    # Return blocked message immediately
                    return Response({
                        'error': 'Account blocked! Your account has been blocked due to 3 failed login attempts. Please contact the Administrator for reactivation.',
                        'blocked': True
                    }, status=status.HTTP_403_FORBIDDEN)
                emp.save()

        if not user_to_check:
            return Response({'error': 'Invalid username or employee code.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Invalid password.'}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Complexity validation: 8-12 chars, 1 Upper, 1 Special, 1 Numeric
        import re
        if not (8 <= len(new_password) <= 12):
            return Response({'error': 'Password must be between 8 and 12 characters long'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.search(r'[A-Z]', new_password):
            return Response({'error': 'Password must contain at least one uppercase letter'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not re.search(r'[0-9]', new_password):
            return Response({'error': 'Password must contain at least one numeric digit'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not re.search(r'[!@#$%^&*]', new_password):
            return Response({'error': 'Password must contain at least one special character (!@#$%^&*)'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Update login session to prevent logout (optional with Token auth, but good practice)
        # update_session_auth_hash(request, user)  # Requires session auth import

        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            emp.is_password_reset_required = False
            emp.save()

        return Response({'message': 'Password changed successfully'})

import random
from django.core.cache import cache
from django.core.mail import send_mail

class RequestResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username or Employee Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Try finding by username (linked User) or employee_code
            user = User.objects.filter(username=username).first()
            if user and hasattr(user, 'employee_profile'):
                employee = user.employee_profile
            else:
                employee = Employee.objects.filter(employee_code=username).first()
                if employee:
                    user = employee.user
                
            if not employee or not user:
                return Response({'error': 'User not found or not active'}, status=status.HTTP_404_NOT_FOUND)

            email = employee.email or employee.personal_email
            if not email:
                return Response({'error': 'No email associated with this account. Contact HR.'}, status=status.HTTP_400_BAD_REQUEST)

            # Generate OTP
            otp = str(random.randint(100000, 999999))
            cache_key = f"reset_otp_{username}"
            cache.set(cache_key, otp, timeout=600) # 10 minutes

            # Send Email (Async for speed)
            from .email_utils import send_email_async
            subject = "Password Reset OTP - BAVYA HRMS"
            message = f"Hello {employee.name},\n\nYour OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nBAVYA HRMS Team"
            
            send_email_async(subject, message, [email])

            # Obfuscate email for delivery message
            masked_email = f"{email[:3]}***@{email.split('@')[1]}"
            return Response({'message': f'OTP request processed. Check your email ({masked_email}) momentarily.'})

        except Exception as e:
            return Response({'error': f'Failed to process request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordWithOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([username, otp, new_password]):
            return Response({'error': 'Username, OTP, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"reset_otp_{username}"
        saved_otp = cache.get(cache_key)

        if not saved_otp or saved_otp != str(otp):
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(username=username).first()
            if not user:
                employee = Employee.objects.filter(employee_code=username).first()
                if employee:
                    user = employee.user
            
            if not user:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Complexity validation
            import re
            if not (8 <= len(new_password) <= 12):
                return Response({'error': 'Password must be between 8 and 12 characters long'}, status=status.HTTP_400_BAD_REQUEST)
            if not re.search(r'[A-Z]', new_password):
                return Response({'error': 'Password must contain at least one uppercase letter'}, status=status.HTTP_400_BAD_REQUEST)
            if not re.search(r'[0-9]', new_password):
                return Response({'error': 'Password must contain at least one numeric digit'}, status=status.HTTP_400_BAD_REQUEST)
            if not re.search(r'[!@#$%^&*]', new_password):
                return Response({'error': 'Password must contain at least one special character (!@#$%^&*)'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()

            # Clear OTP
            cache.delete(cache_key)

            if hasattr(user, 'employee_profile'):
                emp = user.employee_profile
                emp.is_password_reset_required = False
                emp.save()

            return Response({'message': 'Password reset successfully. You can now login.'})

        except Exception as e:
            return Response({'error': f'Failed to reset password: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.utils import timezone

class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        login_hit_id = request.data.get('login_hit_id')
        if login_hit_id:
            try:
                hit = LoginHit.objects.get(id=login_hit_id, user=request.user)
                hit.logout_timestamp = timezone.now()
                hit.save()
            except LoginHit.DoesNotExist:
                pass
        
        # Also revoke token if desired, but here we just log the time
        return Response({'status': 'Logged out successfully'})

def _get_employee_permissions(employee_id, context_id=None):
    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return {}
        
    """
    Generate a full permission map for an employee based on their positions, roles, jobs, and tasks.
    Optimized with prefetching and simple request-local caching.
    """
    from django.utils import timezone
    now = timezone.now()
    
    # 1. Start with Role-based Defaults
    from django.utils import timezone
    now = timezone.now()

    my_pos_ids = set()
    if context_id:
        # Acting Context: Use only the delegated position
        assignment = PositionAssignment.objects.filter(
            id=context_id, 
            assignee_id=employee_id, 
            status='APPROVED'
        ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).first()
        
        if assignment:
            my_pos_ids.add(assignment.position_id)
        else:
            # Fallback if context is invalid/expired
            my_pos_ids = set(employee.positions.values_list('id', flat=True))
    else:
        # Standard Context: Primary Positions + ALL active assignments
        my_pos_ids = set(employee.positions.values_list('id', flat=True))
        assigned_pos_ids = PositionAssignment.objects.filter(
            assignee_id=employee_id,
            status='APPROVED'
        ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).values_list('position_id', flat=True)
        my_pos_ids.update(assigned_pos_ids)
    
    positions = Position.objects.filter(id__in=my_pos_ids).select_related('job', 'role').prefetch_related(
        'job__tasks__urls',
        'role__jobs__tasks__urls',
        'additional_roles__jobs__tasks__urls',
        'screen_permissions__task_url'
    )
    
    permissions_map = {}
    
    for position in positions:
        # Get tasks from the specific job or all jobs tied to the role
        target_jobs = []
        if position.job:
            target_jobs.append(position.job)
        elif position.role:
            target_jobs.extend(position.role.jobs.all())
            
        # ALWAYS include jobs from additional roles
        for add_role in position.additional_roles.all():
            target_jobs.extend(add_role.jobs.all())
            
        for job in target_jobs:
            for task in job.tasks.all():
                for task_url in task.urls.all():
                    pattern = task_url.url_pattern
                    if pattern not in permissions_map:
                        permissions_map[pattern] = {
                            'view': task_url.can_view,
                            'create': task_url.can_create,
                            'edit': task_url.can_edit,
                            'delete': task_url.can_delete,
                            'enabled': True
                        }
                    else:
                        # Cumulative permissions (logical OR)
                        p = permissions_map[pattern]
                        p['view'] = p['view'] or task_url.can_view
                        p['create'] = p['create'] or task_url.can_create
                        p['edit'] = p['edit'] or task_url.can_edit
                        p['delete'] = p['delete'] or task_url.can_delete

        # Add Direct Position-to-Screen Mapped Permissions
        for pos_perm in position.screen_permissions.all():
            pattern = pos_perm.task_url.url_pattern
            if not pos_perm.is_enabled:
                permissions_map[pattern] = {
                    'view': False, 'create': False, 'edit': False, 'delete': False, 'enabled': False
                }
            else:
                if pattern not in permissions_map:
                    permissions_map[pattern] = {
                        'view': pos_perm.can_view,
                        'create': pos_perm.can_create,
                        'edit': pos_perm.can_edit,
                        'delete': pos_perm.can_delete,
                        'enabled': True
                    }
                else:
                    p = permissions_map[pattern]
                    p['view'] = p['view'] or pos_perm.can_view
                    p['create'] = p['create'] or pos_perm.can_create
                    p['edit'] = p['edit'] or pos_perm.can_edit
                    p['delete'] = p['delete'] or pos_perm.can_delete
    
    # 2. Apply explicit Employee Overrides (Take precedence)
    # Prefetch the related task_url patterns
    overrides = employee.url_permissions.all().select_related('task_url')
    for override in overrides:
        pattern = override.task_url.url_pattern
        if not override.is_enabled:
            # If specifically disabled, set all to False
            permissions_map[pattern] = {
                'view': False, 'create': False, 'edit': False, 'delete': False, 'enabled': False
            }
        else:
            permissions_map[pattern] = {
                'view': override.can_view,
                'create': override.can_create,
                'edit': override.can_edit,
                'delete': override.can_delete,
                'enabled': True
            }
    
    return permissions_map

def get_employee_permissions(employee, context_id=None):
    return _get_employee_permissions(employee.id, context_id)


class UserViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'])
    def my_permissions(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=401)
             
        if request.user.is_superuser:
            return Response({'*': {'view': True, 'create': True, 'edit': True, 'delete': True, 'enabled': True}})
        
        if hasattr(request.user, 'employee_profile'):
            # Enforce active status
            if request.user.employee_profile.status != 'Active':
                 return Response({'error': 'Account Deactivated'}, status=403)
            return Response(get_employee_permissions(request.user.employee_profile))
        
        return Response({})

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Return current user info with fresh permissions"""
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=401)
        
        # Security: Check Employee Status
        if hasattr(request.user, 'employee_profile'):
             if request.user.employee_profile.status != 'Active':
                 return Response({'error': 'Account Deactivated'}, status=403)
        
        context_id = request.headers.get('X-Position-Context')
        active_assignment_obj = None
        if context_id and hasattr(request.user, 'employee_profile'):
             active_assignment_obj = PositionAssignment.objects.filter(
                 id=context_id, 
                 assignee=request.user.employee_profile,
                 status='APPROVED'
             ).first()

        permissions = {}
        if request.user.is_superuser:
            permissions = {'*': {'view': True, 'create': True, 'edit': True, 'delete': True, 'enabled': True}}
        elif hasattr(request.user, 'employee_profile'):
            permissions = get_employee_permissions(request.user.employee_profile, context_id=context_id)
        
        active_assignments = []
        if hasattr(request.user, 'employee_profile'):
            from django.utils import timezone
            now = timezone.now()
            assignments = PositionAssignment.objects.filter(
                assignee=request.user.employee_profile,
                status='APPROVED'
            ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).select_related('position', 'position__office')
            
            for a in assignments:
                active_assignments.append({
                    'id': a.id,
                    'position_name': a.position.name,
                    'office_name': a.position.office.name if a.position.office else None,
                    'assignment_type': a.assignment_type
                })

        # When acting, we want to know WHO we are acting as
        acting_as = None
        if active_assignment_obj:
            acting_as = {
                'id': active_assignment_obj.id,
                'position_name': active_assignment_obj.position.name,
                'assignor_name': active_assignment_obj.assignor.name
            }

        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_superuser': request.user.is_superuser,
            'employee_profile_id': request.user.employee_profile.id if hasattr(request.user, 'employee_profile') else None,
            'employee_name': request.user.employee_profile.name if hasattr(request.user, 'employee_profile') else None,
            'employee_photo': request.user.employee_profile.photo.url if hasattr(request.user, 'employee_profile') and request.user.employee_profile.photo else None,
            'position_name': request.user.employee_profile.positions.first().name if hasattr(request.user, 'employee_profile') and request.user.employee_profile.positions.exists() else None,
            'requires_password_change': request.user.employee_profile.is_password_reset_required if hasattr(request.user, 'employee_profile') else False,
            'permissions': permissions,
            'active_assignments': active_assignments,
            'acting_as': acting_as
        })


class GeoContinentViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoContinent.objects.all()
    serializer_class = GeoContinentSerializer
    upsert_lookup_fields = ['name']
    pagination_class = None

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GeoCountryViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoCountry.objects.all()
    serializer_class = GeoCountrySerializer
    upsert_lookup_fields = ['name']
    pagination_class = None

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        continent_id = self.request.query_params.get('continent') or self.request.query_params.get('continent_id')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(continent_ref_id=continent_id)
        return queryset

class GeoStateViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoState.objects.all()
    serializer_class = GeoStateSerializer
    upsert_lookup_fields = ['country', 'name']
    pagination_class = None

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country') or self.request.query_params.get('country_id')
        if country_id and country_id != 'all':
            queryset = queryset.filter(country_id=country_id)
            
        continent_id = self.request.query_params.get('continent') or self.request.query_params.get('continent_id')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(country__continent_ref_id=continent_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def all_states_list(self, request):
        states = GeoState.objects.all().order_by('name')
        return Response(GeoStateSerializer(states, many=True).data)


class GeoDistrictViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoDistrict.objects.all()
    serializer_class = GeoDistrictSerializer
    upsert_lookup_fields = ['state', 'name']
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^code', '^state_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        state_name = self.request.query_params.get('state_name')
        state_id = self.request.query_params.get('state')
        
        if state_name:
            queryset = queryset.filter(state_name__iexact=state_name)
        if state_id:
            queryset = queryset.filter(state_id=state_id)
        
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(state__country__continent_ref_id=continent_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def by_state(self, request):
        state_name = request.query_params.get('state_name')
        if not state_name:
            return Response([])
        districts = GeoDistrict.objects.filter(state_name__iexact=state_name).order_by('name')
        return Response(GeoDistrictSerializer(districts, many=True).data)


class GeoMandalViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoMandal.objects.select_related(
        'district', 
        'district__state', 
        'district__state__country', 
        'district__state__country__continent_ref'
    ).all()
    serializer_class = GeoMandalSerializer
    upsert_lookup_fields = ['district', 'name']
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^code', '^district_name', '^state_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_mandal_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        district_name = self.request.query_params.get('district_name')
        state_name = self.request.query_params.get('state_name')
        district_id = self.request.query_params.get('district')
        state_id = self.request.query_params.get('state')
        
        if name:
            queryset = queryset.filter(name__iexact=name)
        if district_name:
            queryset = queryset.filter(district_name__iexact=district_name)
        if state_name:
            queryset = queryset.filter(state_name__iexact=state_name)
        if district_id and district_id != 'all':
            queryset = queryset.filter(district_id=district_id)
        if state_id and state_id != 'all':
            queryset = queryset.filter(district__state_id=state_id)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(district__state__country__continent_ref_id=continent_id)
            
        return queryset

    @action(detail=False, methods=['get'])
    def by_district(self, request):
        state_name = request.query_params.get('state_name')
        district_name = request.query_params.get('district_name')
        if not state_name or not district_name:
            return Response([])
        mandals = GeoMandal.objects.filter(state_name__iexact=state_name, district_name__iexact=district_name).order_by('name')
        return Response(GeoMandalSerializer(mandals, many=True).data)

    @action(detail=False, methods=['get'])
    def check_exists(self, request):
        name = request.query_params.get('name')
        district = request.query_params.get('district')
        state = request.query_params.get('state')
        try:
            mandal = GeoMandal.objects.get(name__iexact=name, district_name__iexact=district, state_name__iexact=state)
            return Response(GeoMandalSerializer(mandal).data)
        except GeoMandal.DoesNotExist:
            return Response({"error": "Mandal not found"}, status=404)
        except GeoMandal.MultipleObjectsReturned:
            mandal = GeoMandal.objects.filter(name__iexact=name, district_name__iexact=district, state_name__iexact=state).first()
            return Response(GeoMandalSerializer(mandal).data)
    
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        queryset = self.get_queryset()
        serializer = GeoHierarchySerializer(queryset, many=True)
        return Response(serializer.data)

class GeoClusterViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GeoCluster.objects.select_related(
        'mandal', 
        'mandal__district', 
        'mandal__district__state',
        'mandal__district__state__country',
        'mandal__district__state__country__continent_ref'
    ).all()
    serializer_class = GeoClusterSerializer
    upsert_lookup_fields = ['mandal', 'name']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^code', '^mandal__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_cluster_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        mandal_id = self.request.query_params.get('mandal')
        district_id = self.request.query_params.get('district')
        state_id = self.request.query_params.get('state')
        cluster_type = self.request.query_params.get('cluster_type')
        
        if mandal_id and mandal_id != 'all':
            queryset = queryset.filter(mandal_id=mandal_id)
        if district_id and district_id != 'all':
            queryset = queryset.filter(mandal__district_id=district_id)
        if state_id and state_id != 'all':
            queryset = queryset.filter(mandal__district__state_id=state_id)
        if cluster_type and cluster_type != 'all':
            queryset = queryset.filter(cluster_type=cluster_type)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(mandal__district__state__country__continent_ref_id=continent_id)
        
        return queryset





class VisitingLocationViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = VisitingLocation.objects.select_related(
        'cluster',
        'cluster__mandal',
        'cluster__mandal__district',
        'cluster__mandal__district__state',
        'cluster__mandal__district__state__country',
        'cluster__mandal__district__state__country__continent_ref'
    ).all()
    serializer_class = VisitingLocationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^cluster__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_visloc_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.office_ref:
            return Response(
                {"error": "Protected: Office location. Updates must be done via the Office module."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.office_ref:
            return Response(
                {"error": "Protected: Office location. Deletions must be done via the Office module."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'cluster', 'cluster__mandal', 'cluster__mandal__district'
        )
        
        cluster = self.request.query_params.get('cluster')
        mandal = self.request.query_params.get('mandal')
        district = self.request.query_params.get('district')
        state = self.request.query_params.get('state')

        if cluster and cluster != 'all':
            queryset = queryset.filter(cluster_id=cluster)
        if mandal and mandal != 'all':
            queryset = queryset.filter(cluster__mandal_id=mandal)
        if district and district != 'all':
            queryset = queryset.filter(cluster__mandal__district_id=district)
        if state and state != 'all':
            queryset = queryset.filter(cluster__mandal__district__state_id=state)
        country = self.request.query_params.get('country')
        if country and country != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country_id=country)
            
        continent = self.request.query_params.get('continent')
        if continent and continent != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country__continent_ref_id=continent)
            
        return queryset

class LandmarkViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Landmark.objects.select_related(
        'cluster',
        'cluster__mandal',
        'cluster__mandal__district',
        'cluster__mandal__district__state',
        'cluster__mandal__district__state__country',
        'cluster__mandal__district__state__country__continent_ref'
    ).all()
    serializer_class = LandmarkSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^cluster__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_landmark_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'cluster', 'cluster__mandal', 'cluster__mandal__district'
        )
        
        cluster = self.request.query_params.get('cluster')
        mandal = self.request.query_params.get('mandal')
        district = self.request.query_params.get('district')
        state = self.request.query_params.get('state')

        if cluster and cluster != 'all':
            queryset = queryset.filter(cluster_id=cluster)
        if mandal and mandal != 'all':
            queryset = queryset.filter(cluster__mandal_id=mandal)
        if district and district != 'all':
            queryset = queryset.filter(cluster__mandal__district_id=district)
        if state and state != 'all':
            queryset = queryset.filter(cluster__mandal__district__state_id=state)
        country = self.request.query_params.get('country')
        if country and country != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country_id=country)
            
        continent = self.request.query_params.get('continent')
        if continent and continent != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country__continent_ref_id=continent)
            
        return queryset




class OrganizationLevelViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = OrganizationLevel.objects.all()
    serializer_class = OrganizationLevelSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering = ['rank']

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class OfficeViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sac', 'vehicle_code', 'registered_name', 'country_name', 'state_name', 'district_name', 'mandal_name', 'address', 'location']
    ordering_fields = ['name', 'level__rank']
    ordering = ['name']

    def get_queryset(self):
        # Use ScopedViewSetMixin's filtering and prefetch projects for UI tags
        from django.db.models import Count
        queryset = super().get_queryset().select_related(
            'level', 'parent', 'cluster', 'facility_master', 'facility_master__project', 'facility'
        ).prefetch_related(
            'projects', 'sub_offices',
            'facility_master__position_types', 'facility_master__position_types__shifts'
        )

        # Manual query param filtering for level and status
        level = self.request.query_params.get('level') or self.request.query_params.get('office_level')
        if level and level != 'all':
            if str(level).isdigit():
                queryset = queryset.filter(level_id=level)
            else:
                queryset = queryset.filter(level__name=level)
            
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        office_type = self.request.query_params.get('office_type')
        if office_type and office_type != 'all':
            queryset = queryset.filter(office_type=office_type)
            
        office_id = self.request.query_params.get('id') or self.request.query_params.get('office_id')
        if office_id and office_id != 'all' and str(office_id).isdigit():
            queryset = queryset.filter(id=office_id)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(cluster__mandal__district__state__country__continent_ref_id=continent_id)

        # Geographic Name Filtering (Universal Search Support)
        country_name = self.request.query_params.get('country_name')
        if country_name:
            queryset = queryset.filter(country_name__icontains=country_name)
        state_name = self.request.query_params.get('state_name')
        if state_name:
            queryset = queryset.filter(state_name__icontains=state_name)
        district_name = self.request.query_params.get('district_name')
        if district_name:
            queryset = queryset.filter(district_name__icontains=district_name)
        mandal_name = self.request.query_params.get('mandal_name')
        if mandal_name:
            queryset = queryset.filter(mandal_name__icontains=mandal_name)

        return queryset

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.select_related('level', 'facility_master').prefetch_related('projects')
        serializer = LightOfficeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='swap-candidates')
    def swap_candidates(self, request):
        # Return all active offices with vehicles for swapping
        queryset = Office.objects.filter(status='Active').exclude(vehicle_code__isnull=True).exclude(vehicle_code="").select_related('level', 'facility_master').prefetch_related('projects')
        serializer = LightOfficeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='swap-vehicles')
    def swap_vehicles(self, request):
        office_a_sac = request.data.get('office_a_sac')
        office_b_sac = request.data.get('office_b_sac')
        swap_crew = request.data.get('swap_crew', True)
        triggered_by = request.data.get('triggered_by') or (request.user.username if request.user and request.user.is_authenticated else 'SYSTEM')

        if not office_a_sac or not office_b_sac:
            return Response({'error': 'Both office_a_sac and office_b_sac are required.'}, status=400)

        if office_a_sac == office_b_sac:
            return Response({'error': 'Cannot swap an office with itself.'}, status=400)

        try:
            office_a = Office.objects.get(sac=office_a_sac)
        except Office.DoesNotExist:
            return Response({'error': f'Office with SAC {office_a_sac} not found.'}, status=400)

        try:
            office_b = Office.objects.get(sac=office_b_sac)
        except Office.DoesNotExist:
            return Response({'error': f'Office with SAC {office_b_sac} not found.'}, status=400)

        # Capture old values
        old_v_a = office_a.vehicle_code
        old_v_b = office_b.vehicle_code
        old_no_a = office_a.vehicle_no
        old_no_b = office_b.vehicle_no

        # Run within atomic transaction
        try:
            with transaction.atomic():
                # Swap vehicle codes and numbers
                office_a.vehicle_code = old_v_b
                office_a.vehicle_no = old_no_b
                office_b.vehicle_code = old_v_a
                office_b.vehicle_no = old_no_a
                office_a.save()
                office_b.save()

                # Swap crew if requested
                if swap_crew:
                    from core.models import Position
                    pos_a = list(Position.objects.filter(office=office_a))
                    pos_b = list(Position.objects.filter(office=office_b))

                    for p in pos_a:
                        p.office = office_b
                        p.save()
                    for p in pos_b:
                        p.office = office_a
                        p.save()

                # Log transaction
                from core.models import VehicleSwapLog
                VehicleSwapLog.objects.create(
                    office_a=office_a,
                    office_b=office_b,
                    sac_a=office_a_sac,
                    sac_b=office_b_sac,
                    old_vehicle_code_a=old_v_a,
                    old_vehicle_code_b=old_v_b,
                    new_vehicle_code_a=old_v_b,
                    new_vehicle_code_b=old_v_a,
                    old_vehicle_no_a=old_no_a,
                    old_vehicle_no_b=old_no_b,
                    new_vehicle_no_a=old_no_b,
                    new_vehicle_no_b=old_no_a,
                    crew_swapped=swap_crew,
                    triggered_by=triggered_by,
                    status='SUCCESS'
                )

            return Response({
                'success': True,
                'message': 'Vehicles swapped successfully.',
                'office_a': {
                    'sac': office_a_sac,
                    'new_vehicle_code': old_v_b,
                    'old_vehicle_code': old_v_a,
                    'new_vehicle_no': old_no_b,
                    'old_vehicle_no': old_no_a
                },
                'office_b': {
                    'sac': office_b_sac,
                    'new_vehicle_code': old_v_a,
                    'old_vehicle_code': old_v_b,
                    'new_vehicle_no': old_no_a,
                    'old_vehicle_no': old_no_b
                }
            })

        except Exception as e:
            # Log failure
            try:
                from core.models import VehicleSwapLog
                VehicleSwapLog.objects.create(
                    office_a=office_a,
                    office_b=office_b,
                    sac_a=office_a_sac,
                    sac_b=office_b_sac,
                    old_vehicle_code_a=old_v_a,
                    old_vehicle_code_b=old_v_b,
                    new_vehicle_code_a=old_v_a,
                    new_vehicle_code_b=old_v_b,
                    old_vehicle_no_a=old_no_a,
                    old_vehicle_no_b=old_no_b,
                    new_vehicle_no_a=old_no_a,
                    new_vehicle_no_b=old_no_b,
                    crew_swapped=swap_crew,
                    triggered_by=triggered_by,
                    status='FAILED',
                    error_message=str(e)
                )
            except Exception:
                pass
            return Response({'error': f'Swap transaction failed: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []
        created_offices = []

        # Relationship Caches
        level_cache = {}
        cluster_cache = {}
        office_cache = {}

        with transaction.atomic():
            # Pass 1: Create/Update Offices (Basic Fields)
            for index, row in enumerate(data):
                try:
                    with transaction.atomic():
                        name = str(row.get('Office Name') or row.get('name') or '').strip()
                        code = str(row.get('SAC') or row.get('sac') or row.get('Office Code') or row.get('code') or '').strip()
                        vehicle_code = str(row.get('Vehicle Code') or row.get('vehicle_code') or '').strip()
                        vehicle_no = str(row.get('Vehicle No') or row.get('Vehicle Number') or row.get('vehicle_no') or '').strip()
                        if not name: raise Exception("Office Name is required.")

                        # Level resolution
                        level_val = str(row.get('Structural Tier') or row.get('tier') or row.get('level') or '').strip()
                        if not level_val: raise Exception("Structural Tier (Level) is required.")
                        if level_val not in level_cache:
                            lvl = OrganizationLevel.objects.filter(Q(name__iexact=level_val) | Q(level_code__iexact=level_val)).first()
                            if not lvl: raise Exception(f"Level '{level_val}' not found.")
                            level_cache[level_val] = lvl
                        level = level_cache[level_val]

                        # Cluster resolution
                        cluster_val = str(row.get('Cluster') or row.get('cluster') or '').strip()
                        cluster = None
                        if cluster_val:
                            if cluster_val not in cluster_cache:
                                c_obj = GeoCluster.objects.filter(name__iexact=cluster_val).first()
                                if not c_obj:
                                    # Fallback to code
                                    c_obj = GeoCluster.objects.filter(code__iexact=cluster_val).first()
                                if not c_obj:
                                    raise Exception(f"Cluster '{cluster_val}' not found. Please ensure the geographic hierarchy is uploaded first.")
                                cluster_cache[cluster_val] = c_obj
                            cluster = cluster_cache[cluster_val]

                        # Facility Master (Template) Resolution
                        facility_master = None
                        fm_val = str(row.get('Facility Template') or row.get('facility_master') or '').strip()
                        if fm_val:
                            facility_master = FacilityMaster.objects.filter(name__iexact=fm_val).first()
                            if not facility_master:
                                raise Exception(f"Facility Template '{fm_val}' not found.")

                        office_type_val = str(row.get('Facility Type') or row.get('facility_type') or row.get('Office Type') or row.get('office_type') or '').strip()
                        if office_type_val:
                            ot_lower = office_type_val.lower()
                            if 'mobile' in ot_lower: office_type_val = 'Mobile'
                            elif 'camp' in ot_lower: office_type_val = 'Camp'
                            elif 'perm' in ot_lower: office_type_val = 'Permanent'

                        defaults = {
                            'level': level,
                            'cluster': cluster,
                            'facility_master': facility_master,
                            'registered_name': str(row.get('Registered Name') or row.get('registered_name') or name).strip(),
                            'location': str(row.get('Location') or row.get('location') or '').strip(),
                            'address': str(row.get('Address') or row.get('address') or '').strip(),
                            'phone': str(row.get('Phone') or row.get('Contact Number') or '').strip() or None,
                            'email': str(row.get('Email') or row.get('email') or '').strip() or None,
                            'status': str(row.get('Status') or 'Active').strip(),
                            'start_date': str(row.get('Start Date') or row.get('Operational Start Date') or timezone.now().date()).strip(),
                            'vehicle_code': vehicle_code or None,
                            'vehicle_no': vehicle_no or None
                        }

                        if office_type_val:
                            defaults['office_type'] = office_type_val

                        
                        # Store the provided code for pass 2 processing
                        if code: defaults['sac'] = code

                        # Always use Name for organizational units to avoid collision between suffixes (like '01')
                        # The code will be finalized/prefixed in Pass 2 if it's a suffix.
                        obj, created = Office.objects.update_or_create(name=name, defaults=defaults)

                        if created: created_count += 1
                        else: updated_count += 1
                        created_offices.append((obj, row, index))
                        office_cache[name] = obj
                        if code: office_cache[code] = obj

                except Exception as e:
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

            # Pass 2: Hierarchy Linking & Code Auto-Generation
            for obj, row, index in created_offices:
                try:
                    parent_val = str(row.get('Parent Office') or row.get('parent') or '').strip()
                    if parent_val:
                        parent = Office.objects.filter(Q(sac__iexact=parent_val) | Q(name__iexact=parent_val)).first()
                        if parent:
                            if parent.id == obj.id:
                                raise Exception("An office cannot be its own parent.")
                            obj.parent = parent
                            
                            # --- Auto-Prefix Code Logic (Match UI behavior) ---
                            current_code = str(obj.sac or '').strip()
                            # If code is just a suffix (no hyphens) and we have a parent/level
                            if current_code and '-' not in current_code:
                                project = parent.projects.first()
                                project_prefix = (project.code if project else '').upper()
                                level_prefix = (obj.level.level_code if obj.level else '').upper()
                                
                                prefix = ""
                                if project_prefix: prefix += f"{project_prefix}-"
                                if level_prefix: prefix += f"{level_prefix}-"
                                
                                if prefix:
                                    obj.sac = f"{prefix}{current_code}".upper()
                            
                            obj.save()
                        else:
                            raise Exception(f"Parent office '{parent_val}' not found.")
                except Exception as e:
                    errors.append({'row': index + 2, 'reason': f"Hierarchy error: {str(e)}", 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

class FacilityViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    pagination_class = None

class FacilityMasterViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilityMaster.objects.all()
    serializer_class = FacilityMasterSerializer
    upsert_lookup_fields = ['name', 'project']
    pagination_class = None

class FacilityDeploymentModeViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilityDeploymentMode.objects.all()
    serializer_class = FacilityDeploymentModeSerializer
    upsert_lookup_fields = ['name']
    pagination_class = None
    search_fields = ['name', 'code']

class FacilityClassViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilityClass.objects.all()
    serializer_class = FacilityClassSerializer
    upsert_lookup_fields = ['name']
    pagination_class = None
    search_fields = ['name', 'code']

class FacilitySubClassViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = FacilitySubClass.objects.all()
    serializer_class = FacilitySubClassSerializer
    upsert_lookup_fields = ['facility_class', 'name']
    pagination_class = None
    search_fields = ['name', 'code']

    def get_queryset(self):
        qs = super().get_queryset()
        facility_class_id = self.request.query_params.get('facility_class')
        if facility_class_id:
            qs = qs.filter(facility_class_id=facility_class_id)
        return qs

class DepartmentViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    upsert_lookup_fields = ['office', 'name']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'office__country_name', 'office__state_name', 'office__district_name', 'office__mandal_name']
    ordering = ['name']

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []
        office_cache = {}
        project_cache = {}

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    name = str(row.get('Department Name') or row.get('name') or '').strip()
                    office_val = str(row.get('Office') or row.get('office') or '').strip()
                    
                    if not name: raise Exception("Department Name is required.")
                    if not office_val: raise Exception("Office name or code is required.")

                    if office_val not in office_cache:
                        off = Office.objects.filter(Q(sac__iexact=office_val) | Q(name__iexact=office_val)).first()
                        if not off: raise Exception(f"Office '{office_val}' not found.")
                        office_cache[office_val] = off
                    office = office_cache[office_val]

                    defaults = {
                        'description': str(row.get('Description') or '').strip(),
                        'status': str(row.get('Status') or 'Active').strip()
                    }
                    
                    # Project resolution & Auto-tagging
                    project_val = str(row.get('Project') or row.get('project') or '').strip()
                    project = None
                    if project_val:
                        if project_val not in project_cache:
                            p_obj = Project.objects.filter(Q(name__iexact=project_val) | Q(code__iexact=project_val)).first()
                            project_cache[project_val] = p_obj
                        project = project_cache.get(project_val)
                    
                    if not project:
                        # Auto-tag from office context
                        if office.facility_master and office.facility_master.project:
                            project = office.facility_master.project
                        else:
                            # Use is_currently_active property logic in a query
                            from django.utils import timezone
                            today = timezone.now().date()
                            project = office.projects.filter(
                                status__in=['Active', 'Planning']
                            ).filter(
                                Q(end_date__isnull=True) | Q(end_date__gte=today)
                            ).first()
                            
                            # Fallback if no active project found
                            if not project:
                                project = office.projects.first()
                    
                    if project:
                        defaults['project'] = project

                    code = str(row.get('Department Code') or row.get('code') or '').strip()
                    if code: defaults['code'] = code

                    obj, created = Department.objects.update_or_create(
                        name=name, office=office, defaults=defaults
                    )

                    if created: created_count += 1
                    else: updated_count += 1

                except Exception as e:
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        """
        Bypass hierarchy scoping for dropdown use. When an explicit office ID
        is provided, return all departments for that specific office directly
        from the DB - guaranteeing dropdowns always show correct options.
        """
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_dept_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        office_param = request.query_params.get('office') or request.query_params.get('office_id')
        if office_param and office_param != 'all' and str(office_param).isdigit():
            # Direct unscoped fetch for a specific office (used by Add Section / Add Position forms)
            queryset = (
                Department.objects.filter(office_id=office_param)
                .select_related('office', 'office__level', 'project')
                .order_by('name')
            )
            status_param = request.query_params.get('status')
            if status_param and status_param != 'all':
                queryset = queryset.filter(status=status_param)
            serializer = LightDepartmentSerializer(queryset, many=True)
            res_data = serializer.data
            cache.set(cache_key, res_data, 86400)
            return Response(res_data)
        # Otherwise fall back to the scoped list
        queryset = self.filter_queryset(self.get_queryset())
        queryset = (
            queryset
            .select_related('office', 'office__level', 'project')
        )
        serializer = LightDepartmentSerializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)

    def get_queryset(self):
        queryset = super().get_queryset()
        office = self.request.query_params.get('office') or self.request.query_params.get('office_id')
        level = self.request.query_params.get('office_level') or self.request.query_params.get('level')
        
        if office and office != 'all':
            # Fetch departments for the selected office AND walk up to parent offices
            # so that shared/inherited departments at parent level are also visible.
            try:
                target_office = None
                if str(office).isdigit():
                    target_office = Office.objects.get(id=office)
                else:
                    target_office = Office.objects.filter(Q(sac__iexact=office) | Q(name__iexact=office)).first()
                
                if target_office:
                    # Collect the office itself + all ancestor office IDs
                    ancestor_ids = []
                    curr = target_office
                    while curr:
                        ancestor_ids.append(curr.id)
                        curr = curr.parent
                    queryset = queryset.filter(office_id__in=ancestor_ids)
                else:
                    queryset = queryset.none()
            except Exception:
                queryset = queryset.none()

        if level and level != 'all':
            if str(level).isdigit():
                queryset = queryset.filter(office__level_id=level)
            else:
                queryset = queryset.filter(Q(office__level__name=level) | Q(office__level__level_code=level))
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(office__cluster__mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(office__cluster__mandal__district__state__country__continent_ref_id=continent_id)

        # Geographic Name Filtering (Universal Search Support)
        country_name = self.request.query_params.get('country_name')
        if country_name:
            queryset = queryset.filter(office__country_name__icontains=country_name)
        state_name = self.request.query_params.get('state_name')
        if state_name:
            queryset = queryset.filter(office__state_name__icontains=state_name)
        district_name = self.request.query_params.get('district_name')
        if district_name:
            queryset = queryset.filter(office__district_name__icontains=district_name)
        mandal_name = self.request.query_params.get('mandal_name')
        if mandal_name:
            queryset = queryset.filter(office__mandal_name__icontains=mandal_name)
            
        return queryset

class SectionViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Section.objects.select_related('department__office__level', 'project').all()
    serializer_class = SectionSerializer
    upsert_lookup_fields = ['department', 'name']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'department__office__country_name', 'department__office__state_name', 'department__office__district_name', 'department__office__mandal_name']
    ordering_fields = ['name', 'department__name', 'office__name']
    ordering = ['name']

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []
        dept_cache = {}
        project_cache = {}

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    name = str(row.get('Section Name') or row.get('name') or '').strip()
                    dept_val = str(row.get('Department') or row.get('department') or '').strip()
                    office_val = str(row.get('Office') or row.get('office') or '').strip()

                    if not name: raise Exception("Section Name is required.")
                    if not dept_val: raise Exception("Department name is required.")

                    dept_key = f"{office_val}|{dept_val}"
                    if dept_key not in dept_cache:
                        qs = Department.objects.filter(name__iexact=dept_val)
                        if office_val:
                            qs = qs.filter(Q(office__name__iexact=office_val) | Q(office__sac__iexact=office_val))
                        dept = qs.first()
                        if not dept: raise Exception(f"Department '{dept_val}' not found (context: {office_val}).")
                        dept_cache[dept_key] = dept
                    dept = dept_cache[dept_key]

                    defaults = {
                        'description': str(row.get('Description') or '').strip(),
                        'status': str(row.get('Status') or 'Active').strip()
                    }

                    # Project resolution & Auto-tagging
                    project_val = str(row.get('Project') or row.get('project') or '').strip()
                    project = None
                    if project_val:
                        if project_val not in project_cache:
                            p_obj = Project.objects.filter(Q(name__iexact=project_val) | Q(code__iexact=project_val)).first()
                            project_cache[project_val] = p_obj
                        project = project_cache.get(project_val)
                    
                    if not project:
                        # Auto-tag from parent department
                        project = dept.project
                    
                    if project:
                        defaults['project'] = project

                    code = str(row.get('Section Code') or row.get('code') or '').strip()
                    if code: defaults['code'] = code

                    obj, created = Section.objects.update_or_create(
                        name=name, department=dept, defaults=defaults
                    )

                    if created: created_count += 1
                    else: updated_count += 1

                except Exception as e:
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        """
        Bypass hierarchy scoping for dropdown use. When an explicit department ID
        is provided, return all sections for that department directly from the DB.
        """
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_sect_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        dept_param = request.query_params.get('department')
        office_param = request.query_params.get('office') or request.query_params.get('office_id')
        base_qs = Section.objects.select_related(
            'project',
            'department',
            'department__office',
            'department__office__level'
        )
        if dept_param and dept_param != 'all' and str(dept_param).isdigit():
            queryset = base_qs.filter(department_id=dept_param).order_by('name')
            status_param = request.query_params.get('status')
            if status_param and status_param != 'all':
                queryset = queryset.filter(status=status_param)
            serializer = self.get_serializer(queryset, many=True)
            res_data = serializer.data
            cache.set(cache_key, res_data, 86400)
            return Response(res_data)
        if office_param and office_param != 'all' and str(office_param).isdigit():
            queryset = base_qs.filter(department__office_id=office_param).order_by('name')
            status_param = request.query_params.get('status')
            if status_param and status_param != 'all':
                queryset = queryset.filter(status=status_param)
            serializer = self.get_serializer(queryset, many=True)
            res_data = serializer.data
            cache.set(cache_key, res_data, 86400)
            return Response(res_data)
        # Fallback: return scoped list
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.select_related(
            'project',
            'department',
            'department__office',
            'department__office__level'
        )
        serializer = self.get_serializer(queryset, many=True)
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)


    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        office = self.request.query_params.get('office')
        level = self.request.query_params.get('office_level') or self.request.query_params.get('level')

        if department and department != 'all':
            if str(department).isdigit():
                queryset = queryset.filter(department_id=department)
            else:
                queryset = queryset.filter(department__name__iexact=department)

        office = self.request.query_params.get('office') or self.request.query_params.get('office_id')
        if office and office != 'all':
            if str(office).isdigit():
                queryset = queryset.filter(department__office_id=office)
            else:
                queryset = queryset.filter(Q(department__office__sac__iexact=office) | Q(department__office__name__iexact=office))

        if level and level != 'all':
            if str(level).isdigit():
                queryset = queryset.filter(department__office__level_id=level)
            else:
                queryset = queryset.filter(Q(department__office__level__name=level) | Q(department__office__level__level_code=level))
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(department__office__cluster__mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(department__office__cluster__mandal__district__state__country__continent_ref_id=continent_id)

        # Geographic Name Filtering (Universal Search Support)
        country_name = self.request.query_params.get('country_name')
        if country_name:
            queryset = queryset.filter(department__office__country_name__icontains=country_name)
        state_name = self.request.query_params.get('state_name')
        if state_name:
            queryset = queryset.filter(department__office__state_name__icontains=state_name)
        district_name = self.request.query_params.get('district_name')
        if district_name:
            queryset = queryset.filter(department__office__district_name__icontains=district_name)
        mandal_name = self.request.query_params.get('mandal_name')
        if mandal_name:
            queryset = queryset.filter(department__office__mandal_name__icontains=mandal_name)
            
        return queryset

class JobFamilyViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = JobFamily.objects.all()
    serializer_class = JobFamilySerializer
    pagination_class = None

    def get_queryset(self):
        queryset = JobFamily.objects.all()
        user = self.request.user
        if user.is_superuser:
            return queryset
        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            relevant_ids = get_recursive_subordinate_ids(emp, exclude_self=False)
            return queryset.filter(
                Q(role_types__roles__positions__employees__id__in=relevant_ids) |
                Q(role_types__roles__jobs__positions__employees__id__in=relevant_ids)
            ).distinct()
        return queryset.none()


class RoleTypeViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = RoleType.objects.all()
    serializer_class = RoleTypeSerializer
    upsert_lookup_fields = ['job_family', 'name']
    pagination_class = None

    def get_queryset(self):
        queryset = RoleType.objects.all()
        user = self.request.user
        if user.is_superuser:
            return queryset
        if hasattr(user, 'employee_profile'):
            emp = user.employee_profile
            relevant_ids = get_recursive_subordinate_ids(emp, exclude_self=False)
            return queryset.filter(
                Q(roles__positions__employees__id__in=relevant_ids) |
                Q(roles__jobs__positions__employees__id__in=relevant_ids)
            ).distinct()
        return queryset.none()


class SegmentViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Segment.objects.all()
    serializer_class = SegmentSerializer
    upsert_lookup_fields = ['project', 'name']
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project') or self.request.query_params.get('project_id')
        if project and project != 'all':
            queryset = queryset.filter(project_id=project)
        return queryset

class RoleSubGroupViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = RoleSubGroup.objects.all()
    serializer_class = RoleSubGroupSerializer
    upsert_lookup_fields = ['role_group', 'name']
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        role_group = self.request.query_params.get('role_group') or self.request.query_params.get('role_group_id')
        if role_group and role_group != 'all':
            queryset = queryset.filter(role_group_id=role_group)
        return queryset

class RoleViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    upsert_lookup_fields = ['project', 'segment', 'name']
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'role_type__name']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project') or self.request.query_params.get('project_id')
        segment = self.request.query_params.get('segment') or self.request.query_params.get('segment_id')
        
        if project and project != 'all':
            queryset = queryset.filter(project_id=project)
        if segment and segment != 'all':
            queryset = queryset.filter(segment_id=segment)
            
        role_type = self.request.query_params.get('role_type') or self.request.query_params.get('role_type_id')
        if role_type and role_type != 'all':
            if str(role_type).isdigit():
                queryset = queryset.filter(role_type_id=role_type)
            else:
                queryset = queryset.filter(role_type__name=role_type)
        return queryset.select_related(
            'role_type', 'role_type__job_family', 'project', 'segment'
        ).prefetch_related('jobs', 'jobs__tasks', 'jobs__tasks__urls', 'sub_groups')


class JobViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    upsert_lookup_fields = ['role', 'name']
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role') or self.request.query_params.get('role_id')
        if role and role != 'all':
            if str(role).isdigit():
                queryset = queryset.filter(role_id=role)
            else:
                queryset = queryset.filter(role__name=role)
        return queryset.select_related(
            'role', 'role__role_type', 'role__role_type__job_family'
        ).prefetch_related('tasks', 'tasks__urls').order_by('name')

class TaskUrlViewSet(viewsets.ModelViewSet):
    queryset = TaskUrl.objects.all()
    serializer_class = TaskUrlSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        if isinstance(data, builtins.list):
            # 1. Identify which task this bulk update belongs to
            task_ids = set(item.get('task') for item in data if item.get('task'))
            
            # If data is empty, check query params to know which task to clear
            query_task_id = request.query_params.get('task')
            if query_task_id:
                task_ids.add(query_task_id)

            # If we have a task_id context, we can perform a sync (delete missing ones)
            if task_ids:
                for task_id in task_ids:
                    # Get all URL patterns present in the incoming data for this task
                    incoming_patterns = [
                        item.get('url_pattern') 
                        for item in data 
                        if str(item.get('task')) == str(task_id) and item.get('url_pattern')
                    ]
                    
                    # Delete mappings for this task that are NOT in the incoming list
                    TaskUrl.objects.filter(task_id=task_id).exclude(url_pattern__in=incoming_patterns).delete()

            results = []
            for item in data:
                task_id = item.get('task')
                url_pattern = item.get('url_pattern')
                if not task_id or not url_pattern:
                    continue
                
                # Perform an idempotent upsert to handle re-configurations gracefully
                obj, created = TaskUrl.objects.update_or_create(
                    task_id=task_id,
                    url_pattern=url_pattern,
                    defaults={
                        'can_view': item.get('can_view', True),
                        'can_create': item.get('can_create', False),
                        'can_edit': item.get('can_edit', False),
                        'can_delete': item.get('can_delete', False),
                    }
                )
                results.append(self.get_serializer(obj).data)
            return Response(results, status=status.HTTP_201_CREATED)
        
        return super().create(request, *args, **kwargs)

class TaskViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    upsert_lookup_fields = ['job', 'name']
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        job = self.request.query_params.get('job') or self.request.query_params.get('job_id')
        if job and job != 'all':
            queryset = queryset.filter(job_id=job)
        return queryset


class PositionLevelViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = PositionLevel.objects.all()
    serializer_class = PositionLevelSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['rank', 'name']

class PositionTypeViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = PositionType.objects.all()
    serializer_class = PositionTypeSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']

    def get_queryset(self):
        from django.db.models import Q
        queryset = super().get_queryset()
        project = self.request.query_params.get('project') or self.request.query_params.get('project_id')
        segment = self.request.query_params.get('segment') or self.request.query_params.get('segment_id')
        if project and project != 'all':
            # Return position types for this specific project PLUS global ones (project=null)
            # so that globally-defined position types always appear as options
            queryset = queryset.filter(Q(project_id=project) | Q(project__isnull=True))
        if segment and segment != 'all':
            queryset = queryset.filter(segment_id=segment)
        return queryset.select_related(
            'project', 'segment', 'role', 'job'
        ).prefetch_related('shifts')

class ShiftViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'start_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        project = self.request.query_params.get('project') or self.request.query_params.get('project_id')
        segment = self.request.query_params.get('segment') or self.request.query_params.get('segment_id')
        
        position_type = self.request.query_params.get('position_type') or self.request.query_params.get('position_type_id')
        if position_type and position_type != 'all':
            queryset = queryset.filter(position_types__id=position_type)
            
        if project and project != 'all':
            queryset = queryset.filter(project_id=project)
        if segment and segment != 'all':
            queryset = queryset.filter(segment_id=segment)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        pt_count = instance.position_types.count()
        pos_count = instance.positions.count()
        
        if pt_count > 0 or pos_count > 0:
            details = []
            if pt_count > 0:
                details.append(f"{pt_count} position type(s)")
            if pos_count > 0:
                details.append(f"{pos_count} position(s)")
            return Response(
                {"error": f"Cannot delete shift '{instance.name}' because it is currently assigned to: {', '.join(details)}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

def get_subordinates_recursive(employee, visited=None):
    if not employee:
        return []
    sub_ids = get_recursive_subordinate_ids(employee, exclude_self=True)
    return builtins.list(Employee.objects.filter(id__in=sub_ids, is_deleted=False))

class PositionViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    upsert_lookup_fields = ['office', 'department', 'section', 'role', 'name']
    search_fields = [
        'name', 'code', 
        'employees__name', 'employees__employee_code',
        'office__name', 'department__name', 'section__name',
        'office__country_name', 'office__state_name', 'office__district_name', 'office__mandal_name'
    ]
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        reports_to_me = self.request.query_params.get('reports_to_me', 'false').lower() == 'true'
        if reports_to_me and hasattr(self.request.user, 'employee_profile'):
            emp = self.request.user.employee_profile
            sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
            queryset = queryset.filter(employees__id__in=sub_ids).distinct()

        office = self.request.query_params.get('office')
        department = self.request.query_params.get('department')
        section = self.request.query_params.get('section')
        status = self.request.query_params.get('status')
        level = self.request.query_params.get('level') or self.request.query_params.get('office_level')
        job_family = self.request.query_params.get('job_family')
        role_type = self.request.query_params.get('role_type')
        role = self.request.query_params.get('role') or self.request.query_params.get('role_id')
        job = self.request.query_params.get('job') or self.request.query_params.get('job_id')
        position_level = self.request.query_params.get('position_level')

        # Project and segment scoped filters
        project_id = self.request.query_params.get('project') or self.request.query_params.get('project_id')
        if project_id and project_id != 'all':
            from django.db.models import Q
            queryset = queryset.filter(
                Q(department__project_id=project_id) |
                Q(section__project_id=project_id) |
                Q(office__projects__id=project_id)
            ).distinct()
            
        segment_id = self.request.query_params.get('segment') or self.request.query_params.get('segment_id')
        if segment_id and segment_id != 'all':
            queryset = queryset.filter(role__segment_id=segment_id)

        role_sub_group_id = self.request.query_params.get('role_sub_group') or self.request.query_params.get('role_sub_group_id')
        if role_sub_group_id and role_sub_group_id != 'all':
            queryset = queryset.filter(role_sub_group_id=role_sub_group_id)

        if office and office != 'all':
            if ',' in str(office):
                try:
                    office_ids = [int(x) for x in str(office).split(',') if x.strip().isdigit()]
                    queryset = queryset.filter(office_id__in=office_ids)
                except ValueError:
                    queryset = queryset.filter(office_id=office)
            else:
                queryset = queryset.filter(office_id=office)
        if department and department != 'all':
            queryset = queryset.filter(department_id=department)
        if section and section != 'all':
            queryset = queryset.filter(section_id=section)
        if status and status != 'all':
            queryset = queryset.filter(status=status)
        if level and level != 'all':
            if str(level).isdigit():
                queryset = queryset.filter(office__level_id=level)
            else:
                queryset = queryset.filter(office__level__name=level)
        if job_family and job_family != 'all':
            queryset = queryset.filter(role__role_type__job_family_id=job_family)
        if role_type and role_type != 'all':
            queryset = queryset.filter(role__role_type_id=role_type)
        if role and role != 'all':
            queryset = queryset.filter(role_id=role)
        if job and job != 'all':
            queryset = queryset.filter(job_id=job)
        if position_level and position_level != 'all':
            queryset = queryset.filter(level_id=position_level)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(office__cluster__mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(office__cluster__mandal__district__state__country__continent_ref_id=continent_id)

        # Geographic Name Filtering (Universal Search Support)
        country_name = self.request.query_params.get('country_name')
        if country_name:
            queryset = queryset.filter(office__country_name__icontains=country_name)
        state_name = self.request.query_params.get('state_name')
        if state_name:
            queryset = queryset.filter(office__state_name__icontains=state_name)
        district_name = self.request.query_params.get('district_name')
        if district_name:
            queryset = queryset.filter(office__district_name__icontains=district_name)
        mandal_name = self.request.query_params.get('mandal_name')
        if mandal_name:
            queryset = queryset.filter(office__mandal_name__icontains=mandal_name)
            
        if self.action == 'retrieve':
            return queryset.select_related(
                'office', 'office__level', 'department', 'section', 'role', 'role_sub_group',
                'role__role_type', 'role__role_type__job_family', 'job', 'level',
                'position_type', 'section__project', 'department__project'
            ).prefetch_related(
                'shifts',
                Prefetch('reporting_to', queryset=Position.objects.select_related(
                    'office', 'office__level', 'department', 'section', 'role', 'level'
                ).prefetch_related('employees')),
                'employees',
                'role__jobs',
                'role__jobs__tasks',
                'role__jobs__tasks__urls'
            )
        else:
            return queryset.select_related(
                'office', 'office__level', 'department', 'section', 'role', 'role_sub_group',
                'role__role_type', 'role__role_type__job_family', 'job', 'level',
                'position_type', 'section__project', 'department__project',
                'role__segment', 'role__project'
            ).prefetch_related(
                'shifts',
                'employees',
                'additional_roles',
                'additional_jobs',
                'additional_sub_groups',
                Prefetch('reporting_to', queryset=Position.objects.select_related('office', 'level')),
                Prefetch('office__projects', to_attr='_prefetched_office_projects'),
            )

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('pagination') == 'false':
            return None
        return super().paginate_queryset(queryset)


    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PositionDetailSerializer
        return PositionSerializer
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed position information"""
        position = self.get_object()
        serializer = PositionDetailSerializer(position)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        """Get all positions for dropdowns, bypassing standard scope if needed"""
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_pos_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        positions = Position.objects.filter(status='Active').order_by('id')

        # Optimize query — always prefetch shifts and employees for the roster grid
        positions = positions.select_related(
            'office', 'office__level', 'department', 'section', 'role', 'job', 'level'
        ).prefetch_related('shifts', 'employees')

        # ID filter (for hydration in dropdown/select components)
        pk_val = request.query_params.get('id')
        if pk_val:
            positions = positions.filter(id=pk_val)

        # Filter: only return positions that have shifts mapped (for roster screen)
        has_shifts = request.query_params.get('has_shifts', 'false').lower() == 'true'
        if has_shifts:
            positions = positions.filter(shifts__isnull=False).distinct()

        # Support search parameter for server-side search
        search_query = request.query_params.get('search')
        if search_query:
            from django.db.models import Q as Qx
            positions = positions.filter(
                Qx(name__icontains=search_query) |
                Qx(code__icontains=search_query) |
                Qx(employees__name__icontains=search_query) |
                Qx(employees__employee_code__icontains=search_query) |
                Qx(office__name__icontains=search_query)
            ).distinct()

        # Filter by office if provided
        office = request.query_params.get('office')
        if office and office != 'all':
            positions = positions.filter(office_id=office)

        # Filter by project (via department or section)
        project = request.query_params.get('project')
        if project and project != 'all':
            from django.db.models import Q as Qx
            positions = positions.filter(
                Qx(department__project_id=project) | Qx(section__project_id=project)
            ).distinct()

        # For non-superusers: only show positions whose employees report to them
        reports_to_me = request.query_params.get('reports_to_me', 'false').lower() == 'true'
        if reports_to_me and not request.user.is_superuser:
            if hasattr(request.user, 'employee_profile'):
                emp = request.user.employee_profile
                sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
                positions = positions.filter(employees__id__in=sub_ids).distinct()
            else:
                positions = positions.none()

        # Enforce pagination unless pagination=false is explicitly requested
        pagination = request.query_params.get('pagination', 'true').lower() != 'false'
        if pagination:
            page = request.query_params.get('page', '1')
            try:
                page = int(page)
                page_size = int(request.query_params.get('page_size', 50))
                from django.core.paginator import Paginator, EmptyPage
                from .serializers import PositionDropdownSerializer
                paginator = Paginator(positions, page_size)
                try:
                    paginated_qs = paginator.page(page)
                except EmptyPage:
                    res_data = {
                        'count': paginator.count,
                        'num_pages': paginator.num_pages,
                        'results': []
                    }
                    cache.set(cache_key, res_data, 86400)
                    return Response(res_data)
                
                res_data = {
                    'count': paginator.count,
                    'num_pages': paginator.num_pages,
                    'results': PositionDropdownSerializer(paginated_qs, many=True).data
                }
                cache.set(cache_key, res_data, 86400)
                return Response(res_data)
            except ValueError:
                pass

        from .serializers import PositionDropdownSerializer
        res_data = PositionDropdownSerializer(positions, many=True).data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)


    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []

        # Recursive/Relationship Caches
        office_cache = {}
        dept_cache = {}
        section_cache = {}
        role_cache = {}
        role_subgroup_cache = {}
        pos_type_cache = {}
        job_cache = {}
        level_cache = {}
        created_positions = [] 

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    with transaction.atomic(): 
                        # 1. Identity
                        name = str(row.get('Position Title') or row.get('name') or '').strip()
                        code = str(row.get('Position Code') or row.get('code') or '').strip()
                        if not name: raise Exception("Position Title is required.")

                        # 2. Relationship Resolution: Role
                        role_val = str(row.get('Role Name') or row.get('role') or '').strip()
                        if not role_val:
                            raise Exception("Role Name is required.")
                        
                        if role_val not in role_cache:
                            role_obj = Role.objects.filter(Q(code__iexact=role_val) | Q(name__iexact=role_val)).first()
                            if not role_obj:
                                raise Exception(f"Role '{role_val}' not found.")
                            role_cache[role_val] = role_obj
                        role = role_cache[role_val]

                        # 2b. Role Sub Group / Role Group
                        rsg_val = str(row.get('Role Sub Group') or row.get('Role Group') or row.get('role_sub_group') or row.get('role_group') or '').strip()
                        role_sub_group = None
                        if rsg_val:
                            if rsg_val not in role_subgroup_cache:
                                from .models import RoleSubGroup
                                rsg_obj = RoleSubGroup.objects.filter(Q(code__iexact=rsg_val) | Q(name__iexact=rsg_val)).first()
                                role_subgroup_cache[rsg_val] = rsg_obj
                            role_sub_group = role_subgroup_cache[rsg_val]

                        # 2c. Position Type
                        pt_val = str(row.get('Position Type') or row.get('position_type') or '').strip()
                        position_type = None
                        if pt_val:
                            if pt_val not in pos_type_cache:
                                from .models import PositionType
                                pt_obj = PositionType.objects.filter(name__iexact=pt_val).first()
                                pos_type_cache[pt_val] = pt_obj
                            position_type = pos_type_cache[pt_val]

                        # 3. Relationship Resolution: Office
                        office_val = str(row.get('Assign to Office / Unit') or row.get('office') or '').strip()
                        office = None
                        if office_val:
                            if office_val not in office_cache:
                                off_obj = Office.objects.filter(Q(sac=office_val) | Q(name=office_val)).first()
                                if not off_obj:
                                    off_obj = Office.objects.filter(name=office_val).first()
                                    if not off_obj:
                                        raise Exception(f"Office '{office_val}' not found.")
                                office_cache[office_val] = off_obj
                            office = office_cache[office_val]

                        # 4. Relationship Resolution: Department
                        dept_val = str(row.get('department') or row.get('Department') or '').strip()
                        dept = None
                        if dept_val:
                            dept_key = f"{office.id if office else 'global'}|{dept_val}"
                            if dept_key not in dept_cache:
                                qs = Department.objects.filter(name=dept_val)
                                if office: qs = qs.filter(office=office)
                                dept_obj = qs.first()
                                if not dept_obj:
                                    raise Exception(f"Department '{dept_val}' not found.")
                                dept_cache[dept_key] = dept_obj
                            dept = dept_cache[dept_key]

                        # 5. Section (by name)
                        sec_val = str(row.get('Section / Team') or row.get('section') or '').strip()
                        sec = None
                        if sec_val:
                            key = f"{sec_val}_{dept.id if dept else 'none'}"
                            if key not in section_cache:
                                sec_obj = Section.objects.filter(name=sec_val, department=dept).first()
                                section_cache[key] = sec_obj
                            sec = section_cache[key]

                        # 6. Job (by name)
                        job_val = str(row.get('Job Profile (Specific Role)') or row.get('job') or '').strip()
                        job = None
                        if job_val:
                            if job_val not in job_cache:
                                job_obj = Job.objects.filter(name=job_val, role=role).first()
                                job_cache[job_val] = job_obj
                            job = job_cache[job_val]

                        # 7. Level
                        level_val = str(row.get('Designation Rank / Level') or row.get('level') or '').strip()
                        level = None
                        if level_val:
                            if level_val not in level_cache:
                                level_obj = PositionLevel.objects.filter(name=level_val).first()
                                level_cache[level_val] = level_obj
                            level = level_cache[level_val]

                        # 8. Atomic Write (Upsert)
                        defaults = {
                            'name': name,
                            'office': office,
                            'department': dept,
                            'section': sec,
                            'role': role,
                            'role_sub_group': role_sub_group,
                            'position_type': position_type,
                            'job': job,
                            'level': level,
                            'status': str(row.get('status') or row.get('Status') or 'Active')
                        }
                        start_date = str(row.get('Activation Date') or row.get('start_date') or '').strip()
                        if start_date and start_date != '-':
                            defaults['start_date'] = start_date

                        # 9. Unique Identification & Resolution
                        row_id = row.get('id') or row.get('ID')
                        
                        if row_id and str(row_id).isdigit():
                            obj, created = Position.objects.update_or_create(id=int(row_id), defaults=defaults)
                            if code:
                                project_code = None
                                if dept and dept.project: project_code = dept.project.code
                                elif sec and sec.project: project_code = sec.project.code
                                elif office:
                                    proj = office.projects.first()
                                    if proj: project_code = proj.code
                                
                                final_code = code
                                if project_code and project_code not in code:
                                    final_code = f"{code}-{project_code}"
                                
                                obj.code = final_code
                                obj.save()
                        else:
                            project_code = None
                            if dept and dept.project:
                                project_code = dept.project.code
                            elif sec and sec.project:
                                project_code = sec.project.code
                            elif office:
                                project = office.projects.first()
                                if project: project_code = project.code
                                
                            search_code = code
                            if code and project_code and project_code not in code:
                                search_code = f"{code}-{project_code}"

                            if search_code:
                                obj, created = Position.objects.update_or_create(code=search_code, defaults=defaults)
                            else:
                                obj, created = Position.objects.update_or_create(name=name, department=dept, defaults=defaults)

                        # 10. M2M Relationships: Shifts & Additional Roles/SubGroups/Jobs
                        shift_val = str(row.get('Shift Names') or row.get('Shifts') or row.get('Shift') or '').strip()
                        if shift_val:
                            from .models import Shift
                            shift_names = [s.strip() for s in shift_val.replace(';', ',').split(',') if s.strip()]
                            shift_objs = Shift.objects.filter(name__in=shift_names)
                            obj.shifts.set(shift_objs)

                        add_roles_val = str(row.get('Additional Roles') or row.get('additional_roles') or '').strip()
                        if add_roles_val:
                            role_names = [r.strip() for r in add_roles_val.replace(';', ',').split(',') if r.strip()]
                            add_role_objs = Role.objects.filter(Q(code__in=role_names) | Q(name__in=role_names))
                            obj.additional_roles.set(add_role_objs)

                        add_sg_val = str(row.get('Additional Sub Groups') or row.get('additional_sub_groups') or '').strip()
                        if add_sg_val:
                            from .models import RoleSubGroup
                            sg_names = [s.strip() for s in add_sg_val.replace(';', ',').split(',') if s.strip()]
                            add_sg_objs = RoleSubGroup.objects.filter(Q(code__in=sg_names) | Q(name__in=sg_names))
                            obj.additional_sub_groups.set(add_sg_objs)

                        add_jobs_val = str(row.get('Additional Jobs') or row.get('additional_jobs') or '').strip()
                        if add_jobs_val:
                            job_names = [j.strip() for j in add_jobs_val.replace(';', ',').split(',') if j.strip()]
                            add_job_objs = Job.objects.filter(Q(code__in=job_names) | Q(name__in=job_names))
                            obj.additional_jobs.set(add_job_objs)
                        
                        if created: created_count += 1
                        else: updated_count += 1
                        created_positions.append((obj, row, index))
                        
                except Exception as e:
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

            # Pass 2: Hierarchy Linking
            for obj, row, index in created_positions:
                try:
                    reporting_vals = str(row.get('Reporting To (Codes)') or row.get('reporting_to') or '').strip()
                    if reporting_vals:
                        reporting_objs = []
                        codes = [c.strip() for c in reporting_vals.replace(';', ',').split(',') if c.strip()]
                        for c in codes:
                            boss = Position.objects.filter(Q(code__iexact=c) | Q(code__startswith=f"{c}-") | Q(name__iexact=c)).first()
                            if boss:
                                reporting_objs.append(boss)
                            else:
                                raise Exception(f"Reporting head position '{c}' not found.")
                        if reporting_objs:
                            obj.reporting_to.set(reporting_objs)
                except Exception as e:
                    errors.append({'row': index + 2, 'reason': f"Hierarchy error: {str(e)}", 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="positions_export.csv"'
        
        writer = csv.writer(response)
        # Headers matching the Bulk Upload expectation
        writer.writerow([
            'id', 'Position Title', 'Position Code', 'Designation Rank / Level', 'Activation Date', 
            'Role Name', 'Role Sub Group', 'Position Type', 'Shift Names', 'Assign to Office / Unit', 
            'Department', 'Section / Team', 'Job Profile (Specific Role)', 'Reporting To (Codes)', 
            'Additional Roles', 'Additional Sub Groups', 'Additional Jobs', 'Status'
        ])
        
        for pos in queryset:
            reporting_codes = ",".join([p.code for p in pos.reporting_to.all() if p.code])
            shift_names = ",".join([s.name for s in pos.shifts.all() if s.name])
            add_roles = ",".join([r.name for r in pos.additional_roles.all() if r.name])
            add_sub_groups = ",".join([sg.name for sg in pos.additional_sub_groups.all() if sg.name])
            add_jobs = ",".join([j.name for j in pos.additional_jobs.all() if j.name])

            writer.writerow([
                pos.id,
                pos.name,
                pos.code or '',
                pos.level.name if pos.level else '',
                pos.start_date or '',
                pos.role.name if pos.role else '',
                pos.role_sub_group.name if pos.role_sub_group else '',
                pos.position_type.name if pos.position_type else '',
                shift_names,
                pos.office.name if pos.office else '',
                pos.department.name if pos.department else '',
                pos.section.name if pos.section else '',
                pos.job.name if pos.job else '',
                reporting_codes,
                add_roles,
                add_sub_groups,
                add_jobs,
                pos.status
            ])
            
        return response

    @action(detail=True, methods=['get'])
    def screen_permissions(self, request, pk=None):
        position = self.get_object()
        
        target_screens = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'api-keys': 'API Key Management',
            'reactivations': 'Reactivations',
            'audit-logs': 'Audit Logs',
            'login-history': 'Login History',
            'organization': 'Structure',
            'organization-levels': 'Levels',
            'offices': 'Offices',
            'departments': 'Departments',
            'sections': 'Sections',
            'facility-masters': 'Facility Master',
            'job-families': 'Job Families',
            'role-types': 'Role Types',
            'roles': 'Role Names',
            'jobs': 'Jobs',
            'tasks': 'Tasks',
            'task-urls': 'Task URL Mapping',
            'employees': 'Employees',
            'positions': 'Positions',
            'position-assignments': 'Position Assignments',
            'position-levels': 'Position Levels',
            'position-types': 'Position Types',
            'shifts': 'Shifts',
            'position-shift-rosters': 'Shift Roster',
            'projects': 'Projects',
            'position-activity-logs': 'Delegate Activity',
            'vehicle-swaps': 'Vehicle Swaps',
            'geo-continents': 'Geo Territory',
            'geo-countries': 'Countries',
            'geo-states': 'States',
            'geo-districts': 'Districts',
            'geo-mandals': 'Mandals',
            'geo-clusters': 'Clusters',
            'visiting-locations': 'Hotspots',
            'landmarks': 'Landmarks',
        }
        
        # Ensure task urls exist for all target patterns
        for pattern, name in target_screens.items():
            ensure_task_url_exists(pattern, name)
            
        perms = {}
        for pattern, name in target_screens.items():
            turl = TaskUrl.objects.filter(url_pattern=pattern).first()
            if turl:
                perm_obj = PositionScreenPermission.objects.filter(
                    position=position,
                    task_url=turl
                ).first()
                perms[pattern] = {
                    'view': perm_obj.can_view if perm_obj else False,
                    'create': perm_obj.can_create if perm_obj else False,
                    'edit': perm_obj.can_edit if perm_obj else False,
                    'delete': perm_obj.can_delete if perm_obj else False,
                    'is_enabled': perm_obj.is_enabled if perm_obj else False
                }
            else:
                perms[pattern] = {
                    'view': False, 'create': False, 'edit': False, 'delete': False, 'is_enabled': False
                }
                
        return Response(perms)

    @action(detail=True, methods=['post'])
    def toggle_screen_permission(self, request, pk=None):
        position = self.get_object()
        pattern = request.data.get('pattern')
        enabled = request.data.get('enabled', False)
        permission_type = request.data.get('permission_type', 'view') # view, create, edit, delete

        if not pattern:
            return Response({'error': 'Pattern is required'}, status=400)

        target_screens = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'api-keys': 'API Key Management',
            'reactivations': 'Reactivations',
            'audit-logs': 'Audit Logs',
            'login-history': 'Login History',
            'organization': 'Structure',
            'organization-levels': 'Levels',
            'offices': 'Offices',
            'departments': 'Departments',
            'sections': 'Sections',
            'facility-masters': 'Facility Master',
            'job-families': 'Job Families',
            'role-types': 'Role Types',
            'roles': 'Role Names',
            'jobs': 'Jobs',
            'tasks': 'Tasks',
            'task-urls': 'Task URL Mapping',
            'employees': 'Employees',
            'positions': 'Positions',
            'position-assignments': 'Position Assignments',
            'position-levels': 'Position Levels',
            'position-types': 'Position Types',
            'shifts': 'Shifts',
            'position-shift-rosters': 'Shift Roster',
            'projects': 'Projects',
            'position-activity-logs': 'Delegate Activity',
            'vehicle-swaps': 'Vehicle Swaps',
            'geo-continents': 'Geo Territory',
            'geo-countries': 'Countries',
            'geo-states': 'States',
            'geo-districts': 'Districts',
            'geo-mandals': 'Mandals',
            'geo-clusters': 'Clusters',
            'visiting-locations': 'Hotspots',
            'landmarks': 'Landmarks',
        }

        if pattern not in target_screens:
            return Response({'error': 'Invalid pattern'}, status=400)

        turl = ensure_task_url_exists(pattern, target_screens[pattern])

        # Find existing or create
        perm_obj, created = PositionScreenPermission.objects.get_or_create(
            position=position,
            task_url=turl,
            defaults={
                'can_view': enabled if permission_type == 'view' else False,
                'can_create': enabled if permission_type == 'create' else False,
                'can_edit': enabled if permission_type == 'edit' else False,
                'can_delete': enabled if permission_type == 'delete' else False,
                'is_enabled': True
            }
        )
        
        if not created:
            if permission_type == 'view':
                perm_obj.can_view = enabled
            elif permission_type == 'create':
                perm_obj.can_create = enabled
            elif permission_type == 'edit':
                perm_obj.can_edit = enabled
            elif permission_type == 'delete':
                perm_obj.can_delete = enabled
            
            any_enabled = perm_obj.can_view or perm_obj.can_create or perm_obj.can_edit or perm_obj.can_delete
            perm_obj.is_enabled = any_enabled
            perm_obj.save()

        return Response({
            'success': True,
            'pattern': pattern,
            'permission_type': permission_type,
            'enabled': enabled
        })


class EmployeeViewSet(CachedListMixin, PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'employee_code', 'positions__name', 'positions__role__name', 'positions__office__name', 'positions__office__country_name', 'positions__office__state_name', 'positions__office__district_name', 'positions__office__mandal_name']
    ordering_fields = ['name', 'created_at', 'employee_code']
    ordering = ['-id']

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('pagination') == 'false':
            return None
        return super().paginate_queryset(queryset)



    def get_serializer_class(self):
        from core.models import APIKey
        auth = getattr(self.request, 'auth', None)
        if self.request.query_params.get('integration') == 'true' or (auth and isinstance(auth, APIKey)):
            return IntegrationEmployeeSerializer
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeSerializer

    def filter_queryset(self, queryset):
        # 1. Custom Fast-Path Search to avoid heavy joins if searching by Name or Code
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q
            # Fast-path: check if we match name or employee code directly
            fast_queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(employee_code__icontains=search_query)
            )
            # If we found matches, use them and bypass the heavy SearchFilter joins
            if fast_queryset.exists():
                # Apply ordering filter still
                for backend in list(self.filter_backends):
                    if backend != filters.SearchFilter:
                        fast_queryset = backend().filter_queryset(self.request, fast_queryset, self)
                return fast_queryset.distinct()

        # 2. Fallback to default SearchFilter
        return super().filter_queryset(queryset)

    def get_queryset(self):
        """Override to exclude deleted employees by default and apply filters"""
        queryset = super().get_queryset().filter(is_deleted=False)
        
        reports_to_me = self.request.query_params.get('reports_to_me', 'false').lower() == 'true'
        if reports_to_me and hasattr(self.request.user, 'employee_profile'):
            emp = self.request.user.employee_profile
            sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
            queryset = queryset.filter(id__in=sub_ids)

        # Optimize with select_related/prefetch_related for common fields
        from django.db.models import Prefetch
        from .models import Position
        queryset = queryset.select_related('bank_details')
        if self.action == 'list':
            positions_qs = Position.objects.select_related(
                'office',
                'office__parent',
                'office__level',
                'office__cluster',
                'department__project',
                'section__project',
                'role',
                'role_sub_group',
                'position_type',
                'level'
            ).prefetch_related(
                'shifts',
                Prefetch(
                    'reporting_to',
                    queryset=Position.objects.select_related('role').prefetch_related(
                        Prefetch('employees', queryset=Employee.objects.filter(status='Active'))
                    )
                )
            )
            queryset = queryset.prefetch_related(
                Prefetch('positions', queryset=positions_qs)
            )
        else:
            queryset = queryset.prefetch_related(
                'positions__office__cluster', 
                'positions__department__project', 
                'positions__section__project', 
                'positions__role', 
                'positions__job'
            )

        # Filter out soft-deleted employees
        include_deleted = self.request.query_params.get('include_deleted', 'false').lower() == 'true'
        if not include_deleted:
            queryset = queryset.filter(is_deleted=False)

        # Apply specific filters from context
        # Note: ScopedViewSetMixin already applied base security boundaries
        office = self.request.query_params.get('office')
        department = self.request.query_params.get('department')
        section = self.request.query_params.get('section')
        status = self.request.query_params.get('status')
        level = self.request.query_params.get('level') or self.request.query_params.get('office_level')
        job_family = self.request.query_params.get('job_family')
        role_type = self.request.query_params.get('role_type')
        role = self.request.query_params.get('role') or self.request.query_params.get('role_id')
        job = self.request.query_params.get('job') or self.request.query_params.get('job_id')
        position_level = self.request.query_params.get('position_level')

        if status == 'Unassigned':
            # If specifically looking for unassigned, skip other position-based filters
            queryset = queryset.filter(positions__isnull=True)
        else:
            # Apply specific filters from context
            if level and level != 'all':
                if str(level).isdigit():
                    queryset = queryset.filter(positions__office__level_id=level)
                else:
                    queryset = queryset.filter(positions__office__level__name=level)
            if office and office != 'all':
                if str(office).isdigit():
                    queryset = queryset.filter(positions__office_id=office)
                else:
                    queryset = queryset.filter(positions__office__name=office)
            if department and department != 'all':
                if str(department).isdigit():
                    queryset = queryset.filter(positions__department_id=department)
                else:
                    queryset = queryset.filter(positions__department__name=department)
            if section and section != 'all':
                if str(section).isdigit():
                    queryset = queryset.filter(positions__section_id=section)
                else:
                    queryset = queryset.filter(positions__section__name=section)
            if job_family and job_family != 'all':
                queryset = queryset.filter(positions__role__role_type__job_family_id=job_family)
            if role_type and role_type != 'all':
                queryset = queryset.filter(positions__role__role_type_id=role_type)
            if role and role != 'all':
                queryset = queryset.filter(positions__role_id=role)
            if job and job != 'all':
                queryset = queryset.filter(positions__job_id=job)
            if position_level and position_level != 'all':
                if str(position_level).isdigit():
                    queryset = queryset.filter(positions__level_id=position_level)
                else:
                    queryset = queryset.filter(positions__level__name__iexact=position_level)

        if status and status != 'all' and status != 'Unassigned':
            queryset = queryset.filter(status=status)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(positions__office__cluster__mandal__district__state__country_id=country_id)
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(positions__office__cluster__mandal__district__state__country__continent_ref_id=continent_id)

        # Geographic Name Filtering (Universal Search Support)
        country_name = self.request.query_params.get('country_name')
        if country_name:
            queryset = queryset.filter(positions__office__country_name__icontains=country_name)
        state_name = self.request.query_params.get('state_name')
        if state_name:
            queryset = queryset.filter(positions__office__state_name__icontains=state_name)
        district_name = self.request.query_params.get('district_name')
        if district_name:
            queryset = queryset.filter(positions__office__district_name__icontains=district_name)
        mandal_name = self.request.query_params.get('mandal_name')
        if mandal_name:
            queryset = queryset.filter(positions__office__mandal_name__icontains=mandal_name)
            
        return queryset.distinct()

    def destroy(self, request, *args, **kwargs):
        """
        Override delete to perform soft delete with complete data archiving.
        Requires 'reason' in request data.
        """
        employee = self.get_object()
        deletion_reason = request.data.get('reason', '')
        
        if not deletion_reason:
            return Response(
                {'error': 'Deletion reason is required. Please provide a reason for deleting this employee.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already deleted
        if employee.is_deleted:
            return Response(
                {'error': 'This employee has already been deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import the archiving utility
            from .employee_archive_utils import soft_delete_employee
            
            # Perform soft delete with archiving
            archive, updated_employee = soft_delete_employee(
                employee=employee,
                deleted_by=request.user,
                deletion_reason=deletion_reason
            )
            
            return Response({
                'message': f'Employee {employee.name} has been successfully deleted and archived.',
                'archive_id': archive.id,
                'employee_id': employee.id,
                'deleted_at': archive.deleted_at.isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete employee: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def create_user(self, request, pk=None):
        employee = self.get_object()
        if employee.user:
            return Response({'error': 'User already exists for this employee'}, status=status.HTTP_400_BAD_REQUEST)
        
        username = employee.employee_code
        if not username:
            return Response({'error': 'Employee must have an employee code to create a user account'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({'error': f'A system user with username {username} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Generate unique random password (8-12 chars, 1 Upper, 1 Special, 1 Numeric)
        import secrets
        import string
        
        uppercase = string.ascii_uppercase
        numbers = string.digits
        special = "!@#$%^&*"
        alphabet = string.ascii_lowercase + uppercase + numbers + special
        
        # Ensure at least one of each required type
        pwd_chars = [
            secrets.choice(uppercase),
            secrets.choice(numbers),
            secrets.choice(special),
            secrets.choice(string.ascii_lowercase)
        ]
        
        # Fill remaining up to 10 characters (range 8-12)
        for _ in range(6):
            pwd_chars.append(secrets.choice(alphabet))
            
        secrets.SystemRandom().shuffle(pwd_chars)
        generated_password = ''.join(pwd_chars)

        try:
            user = User.objects.create_user(
                username=username,
                email=employee.email,
                password=generated_password
            )
            employee.user = user
            # Preserve existing status - don't force to 'Active'
            # If employee is 'Suspicious', they should remain 'Suspicious'
            employee.is_password_reset_required = True
            employee.save()

            # 2. Send Email (Async)
            from .email_utils import send_email_async
            
            target_email = employee.personal_email or employee.email
            subject = 'BAVYA ERP - System Access Credentials'
            message = f"Hello {employee.name},\n\nYour access to the BAVYA ERP system has been provisioned.\n\nLogin Username: {username}\nTemporary Password: {generated_password}\n\nPlease login at: http://localhost:5173\n\nSecurity Note: You will be required to reset this temporary password immediately after your first login.\n\nPassword Requirements:\n- Length: 8-12 characters\n- At least 1 Uppercase letter\n- At least 1 Numeric digit\n- At least 1 Special character (!@#$%^&*)\n\nBest Regards,\nHR Administration"
            
            send_email_async(subject, message, [target_email])

            return Response({
                'message': f'Credentials generated and email queued for {target_email}.',
                'username': username,
                'password': generated_password,
                'email_sent': True # Assume queued successfully
            })
        except Exception as e:
            return Response({'error': f'Database error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def all_data(self, request):
        """
        Get all employees with full position context for WorkforceTracker.
        Prefetches all relations needed for project/segment/role filtering.
        """
        from django.core.cache import cache
        import hashlib

        user_id = getattr(request.user, 'id', None)
        user_identifier = f"user_{user_id}" if user_id else "anon"
        query_hash = hashlib.md5(request.GET.urlencode().encode()).hexdigest()
        cache_key = f"hcm_emp_all_data_{user_identifier}_{query_hash}"

        cached_res = cache.get(cache_key)
        if cached_res is not None:
            return Response(cached_res)

        from django.db.models import Prefetch
        from .models import Position
        position_qs = Position.objects.select_related(
            'office', 'office__level', 'department', 'department__project',
            'section', 'section__project',
            'role', 'role__segment',
            'role_sub_group', 'position_type',
        )

        queryset = self.filter_queryset(
            self.get_queryset()
            .prefetch_related(None)
            .prefetch_related(
                Prefetch('positions', queryset=position_qs)
            )
        )

        # ID filter (for hydration in dropdown/select components)
        pk_val = request.query_params.get('id')
        if pk_val:
            queryset = queryset.filter(id=pk_val)

        # Apply standard pagination unless pagination=false
        pagination = request.query_params.get('pagination', 'true').lower() != 'false'
        page = self.paginate_queryset(queryset) if pagination else None
        from .serializers import EmployeeDropdownSerializer
        if page is not None:
            serializer = EmployeeDropdownSerializer(page, many=True, context={'request': request})
            res_data = self.get_paginated_response(serializer.data).data
            cache.set(cache_key, res_data, 86400)
            return Response(res_data)

        serializer = EmployeeDropdownSerializer(queryset, many=True, context={'request': request})
        res_data = serializer.data
        cache.set(cache_key, res_data, 86400)
        return Response(res_data)


    @action(detail=True, methods=['post'])
    def resend_credentials(self, request, pk=None):
        employee = self.get_object()
        if not employee.user:
            return Response({'error': 'No user account found for this employee.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate new password
        import secrets
        import string
        uppercase = string.ascii_uppercase
        numbers = string.digits
        special = "!@#$%^&*"
        alphabet = string.ascii_lowercase + uppercase + numbers + special
        pwd_chars = [secrets.choice(uppercase), secrets.choice(numbers), secrets.choice(special), secrets.choice(string.ascii_lowercase)]
        for _ in range(6):
            pwd_chars.append(secrets.choice(alphabet))
        secrets.SystemRandom().shuffle(pwd_chars)
        new_password = ''.join(pwd_chars)

        # Update user password
        employee.user.set_password(new_password)
        employee.user.save()
        employee.is_password_reset_required = True
        employee.save()

        # Send Email (Async)
        from .email_utils import send_email_async
        target_email = employee.personal_email or employee.email
        subject = 'BAVYA ERP - System Access Credentials (Resent)'
        message = f"Hello {employee.name},\n\nYour access to the BAVYA ERP system has been reset/resent.\n\nLogin Username: {employee.user.username}\nTemporary Password: {new_password}\n\nSecurity Note: You will be required to reset this temporary password immediately after login."
        
        send_email_async(subject, message, [target_email])

        return Response({
            'message': f"Credentials reset and email queued for {target_email}.",
            'email_sent': True,
            'username': employee.user.username,
            'password': new_password
        })

    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    with transaction.atomic():
                        # 1. Identity & Core Fields
                        code = str(row.get('employee_code') or row.get('Employee Code *') or '').strip()
                        name = str(row.get('name') or row.get('Name *') or '').strip()
                        
                        if not code or not name:
                            raise Exception("Employee Code and Name are mandatory.")

                        # Strengthened helper for unique fields
                        def clean_unique(val, field_name="unknown"):
                            if val is None: return None
                            s = str(val).strip()
                            # If it's a blank string or the literal string "None", return None
                            if not s or s.lower() == 'none' or s == 'nan':
                                return None
                            return s

                        emp_email = clean_unique(row.get('email') or row.get('Email *'), "Email")
                        emp_phone = clean_unique(row.get('phone') or row.get('Phone *'), "Phone")

                        defaults = {
                            'name': name,
                            'email': emp_email,
                            'phone': emp_phone,
                            'gender': str(row.get('gender') or row.get('Gender *') or '').strip(),
                            'father_name': str(row.get('father_name') or row.get('Father Name') or '').strip(),
                            'mother_name': str(row.get('mother_name') or row.get('Mother Name') or '').strip(),
                            'personal_email': clean_unique(row.get('personal_email')), # Treat similar to unique for safety
                            'address': str(row.get('address') or row.get('Address') or '').strip(),
                            'employment_type': str(row.get('employment_type') or row.get('Employment Type *') or 'Permanent').strip(),
                            'status': str(row.get('status') or 'Active').strip(),
                        }

                        # Dates
                        hire_date = row.get('hire_date') or row.get('Joining Date *')
                        dob = row.get('date_of_birth') or row.get('Date of Birth *')
                        if hire_date: defaults['hire_date'] = hire_date
                        if dob: defaults['date_of_birth'] = dob

                        # Diagnostic Print before write
                        print(f"DEBUG SYNC: Row {index+2} | Code: {code} | Email: '{emp_email}' | Phone: '{emp_phone}'")

                        # 2. Upsert Employee
                        row_id = row.get('id') or row.get('ID')
                        if row_id and str(row_id).isdigit():
                            # Update by system ID - allows changing employee_code itself
                            obj, created = Employee.objects.update_or_create(
                                id=int(row_id),
                                defaults=defaults
                            )
                            # If code was also provided, update it explicitly
                            if code:
                                obj.employee_code = code
                                obj.save()
                        else:
                            # Standard update by employee_code
                            obj, created = Employee.objects.update_or_create(
                                employee_code=code,
                                defaults=defaults
                            )

                        # 3. Position Tagging (M2M)
                        pos_codes_str = str(row.get('Position Codes') or row.get('positions') or '').strip()
                        if pos_codes_str:
                            pos_objs = []
                            pos_codes = [c.strip() for c in pos_codes_str.replace(';', ',').split(',') if c.strip()]
                            for pc in pos_codes:
                                pos = Position.objects.filter(Q(code__iexact=pc) | Q(code__startswith=f"{pc}-")).first()
                                if pos:
                                    pos_objs.append(pos)
                                else:
                                    pos_by_name = Position.objects.filter(name__iexact=pc).first()
                                    if pos_by_name: 
                                        pos_objs.append(pos_by_name)
                                    else:
                                        raise Exception(f"Position '{pc}' not found.")
                            
                            if pos_objs:
                                obj.positions.set(pos_objs)

                        if created: created_count += 1
                        else: updated_count += 1

                except Exception as e:
                    import traceback
                    # Detailed logging for production debugging
                    print(f"FAILED SYNC ROW {index+2}: {str(e)}")
                    # print(traceback.format_exc())
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employees_export.csv"'
        
        writer = csv.writer(response)
        # Headers matching the Bulk Upload expectation
        writer.writerow(['id', 'Name *', 'Email *', 'Phone *', 'Employee Code *', 'Joining Date *', 'Date of Birth *', 'Gender *', 'Employment Type *', 'Status', 'Position Codes', 'Address', 'Father Name', 'Mother Name'])
        
        for emp in queryset:
            pos_codes = ",".join([p.code for p in emp.positions.all()])
            writer.writerow([
                emp.id,
                emp.name,
                emp.email,
                emp.phone,
                emp.employee_code,
                emp.hire_date or '',
                emp.date_of_birth or '',
                emp.gender or '',
                emp.employment_type or 'Permanent',
                emp.status,
                pos_codes,
                emp.address or '',
                emp.father_name or '',
                emp.mother_name or ''
            ])
            
        return response


class EmployeeTaskUrlPermissionViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeTaskUrlPermission.objects.all()
    serializer_class = EmployeeTaskUrlPermissionSerializer
    filterset_fields = ['employee']

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        employee_id = request.query_params.get('employee')
        if not employee_id:
            return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        self.get_queryset().filter(employee_id=employee_id).delete()
        return Response({'message': 'All overrides cleared'}, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        data = request.data
        if isinstance(data, list):
            results = []
            for item in data:
                employee_id = item.get('employee')
                task_url_id = item.get('task_url')
                if not employee_id or not task_url_id:
                    continue
                
                obj, created = EmployeeTaskUrlPermission.objects.update_or_create(
                    employee_id=employee_id,
                    task_url_id=task_url_id,
                    defaults={
                        'can_view': item.get('can_view', False),
                        'can_create': item.get('can_create', False),
                        'can_edit': item.get('can_edit', False),
                        'can_delete': item.get('can_delete', False),
                        'is_enabled': item.get('is_enabled', True),
                        'is_overridden': item.get('is_overridden', True),
                    }
                )
                results.append(self.get_serializer(obj).data)
            return Response(results, status=status.HTTP_201_CREATED)
        return super().create(request, *args, **kwargs)

class ProjectViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    upsert_lookup_fields = ['code']
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', '^code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        level = self.request.query_params.get('office_level') or self.request.query_params.get('level')
        office = self.request.query_params.get('office')
        status = self.request.query_params.get('status')

        if level and level != 'all':
            if str(level).isdigit():
                queryset = queryset.filter(assigned_level_id=level)
            else:
                queryset = queryset.filter(assigned_level__name=level)
        if office and office != 'all':
            queryset = queryset.filter(assigned_offices__id=office)
        if status and status != 'all':
            queryset = queryset.filter(status=status)
            
        country_id = self.request.query_params.get('country')
        if country_id and country_id != 'all':
            queryset = queryset.filter(assigned_offices__cluster__mandal__district__state__country_id=country_id).distinct()
            
        continent_id = self.request.query_params.get('continent')
        if continent_id and continent_id != 'all':
            queryset = queryset.filter(assigned_offices__cluster__mandal__district__state__country__continent_ref_id=continent_id).distinct()
            
        return queryset

    @action(detail=False, methods=['post'], url_path='bulk-upload')

    def bulk_upload(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=400)

        created_count = 0
        updated_count = 0
        errors = []
        level_cache = {}

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    with transaction.atomic():
                        name = str(row.get('Project Name') or row.get('name') or '').strip()
                        code = str(row.get('Project Code') or row.get('code') or '').strip()
                        if not name: raise Exception("Project Name is required.")

                        # Level resolution if provided
                        level_val = str(row.get('Assigned Level') or row.get('level') or '').strip()
                        assigned_level = None
                        if level_val:
                            if level_val not in level_cache:
                                lvl_obj = OrganizationLevel.objects.filter(Q(name__iexact=level_val) | Q(level_code__iexact=level_val)).first()
                                level_cache[level_val] = lvl_obj
                            assigned_level = level_cache[level_val]

                        has_seg_val = str(row.get('Has Segments') or row.get('has_segments') or 'No').strip().lower()
                        has_segments = has_seg_val in ['yes', 'true', '1']

                        defaults = {
                            'name': name,
                            'description': str(row.get('Description') or row.get('description') or '').strip(),
                            'client_type': str(row.get('Client Type') or row.get('client_type') or '').strip(),
                            'project_type': str(row.get('Project Type') or row.get('project_type') or '').strip(),
                            'location': str(row.get('Location') or row.get('location') or '').strip(),
                            'has_segments': has_segments,
                            'status': str(row.get('Status') or row.get('status') or 'Active').strip(),
                            'assigned_level': assigned_level
                        }

                        start_date = str(row.get('Start Date') or row.get('start_date') or '').strip()
                        if start_date and start_date != '-':
                            defaults['start_date'] = start_date

                        end_date = str(row.get('End Date') or row.get('end_date') or '').strip()
                        if end_date and end_date != '-':
                            defaults['end_date'] = end_date

                        if code:
                            obj, created = Project.objects.update_or_create(code=code, defaults=defaults)
                        else:
                            obj, created = Project.objects.update_or_create(name=name, defaults=defaults)

                        if created: created_count += 1
                        else: updated_count += 1

                except Exception as e:
                    errors.append({'row': index + 2, 'reason': str(e), 'data': row})

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })


class IndianVillageViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = IndianVillage.objects.all()
    serializer_class = IndianVillageSerializer
    
    def get_queryset(self):
        queryset = IndianVillage.objects.all()
        state = self.request.query_params.get('state')
        district = self.request.query_params.get('district')
        mandal = self.request.query_params.get('mandal')
        
        if state:
            queryset = queryset.filter(state=state)
        if district:
            queryset = queryset.filter(district=district)
        if mandal:
            queryset = queryset.filter(mandal=mandal)
            
        return queryset

    @action(detail=False, methods=['get'])
    def states(self, request):
        states = IndianVillage.objects.values_list('state', flat=True).distinct().order_by('state')
        return Response(list(states))

    @action(detail=False, methods=['get'])
    def districts(self, request):
        state = request.query_params.get('state')
        if not state:
            return Response([])
        districts = IndianVillage.objects.filter(state=state).values_list('district', flat=True).distinct().order_by('district')
        return Response(list(districts))

    @action(detail=False, methods=['get'])
    def mandals(self, request):
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        if not state or not district:
            return Response([])
        mandals = IndianVillage.objects.filter(state=state, district=district).values_list('mandal', flat=True).distinct().order_by('mandal')
        return Response(list(mandals))











class DocumentTypeViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer

class EmployeeDocumentViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeDocumentListSerializer
        return EmployeeDocumentSerializer

class EmployeeEducationViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeEducation.objects.all()
    serializer_class = EmployeeEducationSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeEducationListSerializer
        return EmployeeEducationSerializer

class EmployeeExperienceViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeExperience.objects.all()
    serializer_class = EmployeeExperienceSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeExperienceListSerializer
        return EmployeeExperienceSerializer

class EmployeeEmploymentHistoryViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeEmploymentHistory.objects.all()
    serializer_class = EmployeeEmploymentHistorySerializer

class EmployeeBankDetailsViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeBankDetails.objects.all()
    serializer_class = EmployeeBankDetailsSerializer

class EmployeeEPFODetailsViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeEPFODetails.objects.all()
    serializer_class = EmployeeEPFODetailsSerializer

class EmployeeHealthDetailsViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeHealthDetails.objects.all()
    serializer_class = EmployeeHealthDetailsSerializer

class EmployeeSalaryDetailsViewSet(ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = EmployeeSalaryDetails.objects.all()
class EmployeeDetailsAPIView(APIView):
    """
    API to fetch full employee details including hierarchy (Office, Dept, Section)
    by providing valid credentials (username/password).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Allow browser testing for logged-in superusers/staff.
        """
        if request.user.is_authenticated and (request.user.is_staff or hasattr(request.user, 'employee_profile')):
             # Auto-fetch for logged in user
             active_employees = Employee.objects.filter(status='Active')
             results = []
             for emp in active_employees:
                pos = emp.positions.first()
                results.append({
                    'id': emp.id,
                    'name': emp.name,
                    'email': emp.email,
                    'employee_code': emp.employee_code,
                    'status': emp.status,
                    'designation': pos.name if pos else None,
                    'role': pos.role.name if pos and pos.role else None,
                    'office': pos.office.name if pos and pos.office else None,
                })
             return Response(results, status=status.HTTP_200_OK)
        
        return Response({
            "message": "This is a POST-only endpoint for external systems.",
            "usage": "Send a POST request with {'username': '...', 'password': '...', 'fetch_all': true}",
            "note": "If you are an Admin, log in to the Django Admin panel first to view data here via GET."
        }, status=status.HTTP_200_OK)

    def post(self, request):
        username = request.data.get('username') or request.data.get('employee_code')
        password = request.data.get('password')
        fetch_all = request.data.get('fetch_all', False)
        
        if not username or not password:
            return Response({'error': 'Username/Employee Code and Password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        
        if not user:
             return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)
             
        # If fetch_all is requested, verify permissions (Subject to requirements, e.g., is_staff or specific role)
        if fetch_all:
            # Simple permission check: Allow if user is staff or has a profile
            # You might want to restrict this to specific roles in future
            active_employees = Employee.objects.filter(status='Active').select_related('reporting_to').prefetch_related(
                'positions__level', 'positions__role', 'positions__office', 
                'positions__department', 'positions__section', 'reporting_to__positions__level'
            )
            results = []
            for emp in active_employees:
                pos = emp.positions.first()
                results.append({
                    'id': emp.id,
                    'name': emp.name,
                    'email': emp.email,
                    'employee_code': emp.employee_code,
                    'phone': emp.phone,
                    'status': emp.status,
                    'designation': pos.name if pos else None,
                    'role': pos.role.name if pos and pos.role else None,
                    'office': pos.office.name if pos and pos.office else None,
                    'office_code': pos.office.sac if pos and pos.office else None,
                    'office_sac': pos.office.sac if pos and pos.office else None,
                    'office_vehicle_code': pos.office.vehicle_code if pos and pos.office else None,
                    'department': pos.department.name if pos and pos.department else None,
                    'section': pos.section.name if pos and pos.section else None,
                    'level': pos.level.name if pos and pos.level else None,
                    'reporting_level': (emp.reporting_to.positions.first().level.name 
                                     if emp.reporting_to and emp.reporting_to.positions.first() and emp.reporting_to.positions.first().level 
                                     else None),
                })
            return Response(results, status=status.HTTP_200_OK)

        # Single User Fetch (Default)
        if not hasattr(user, 'employee_profile'):
            return Response({'error': 'User is not linked to an employee profile'}, status=status.HTTP_404_NOT_FOUND)
            
        employee = user.employee_profile
        position = employee.positions.first()
        
        data = {
            'id': employee.id,
            'name': employee.name,
            'email': employee.email,
            'employee_code': employee.employee_code,
            'phone': employee.phone,
            'status': employee.status,
            'designation': position.name if position else None,
            'role': position.role.name if position and position.role else None,
            'office': position.office.name if position and position.office else None,
            'office_code': position.office.sac if position and position.office else None,
            'office_sac': position.office.sac if position and position.office else None,
            'office_vehicle_code': position.office.vehicle_code if position and position.office else None,
            'department': position.department.name if position and position.department else None,
            'section': position.section.name if position and position.section else None,
            'level': position.level.name if position and position.level else None,
            'reporting_level': (employee.reporting_to.positions.first().level.name 
                             if employee.reporting_to and employee.reporting_to.positions.first() and employee.reporting_to.positions.first().level 
                             else None),
        }
        
        return Response(data, status=status.HTTP_200_OK)

class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return APIKey.objects.none()
            
        if user.is_superuser:
            queryset = APIKey.objects.all()
        else:
            queryset = APIKey.objects.filter(user=user)
            
        # Support filtering by status (Active/Inactive)
        status = self.request.query_params.get('status')
        if status == 'Active':
            queryset = queryset.filter(is_active=True)
        elif status == 'Inactive':
            queryset = queryset.filter(is_active=False)
            
        return queryset.order_by('name')
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        key = self.get_object()
        key.is_active = False
        key.save()
        return Response({'status': 'Key revoked'})

    @action(detail=False, methods=['get'])
    def global_usage_history(self, request):
        """Get usage logs for ALL keys"""
        from .models import APIKeyUsageLog
        from .serializers import APIKeyUsageLogSerializer
        
        logs = APIKeyUsageLog.objects.select_related('api_key').order_by('-id')[:50]
        serializer = APIKeyUsageLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def usage_history(self, request, pk=None):
        """Get usage logs for a SPECIFIC key"""
        from .models import APIKeyUsageLog
        from .serializers import APIKeyUsageLogSerializer
        
        key = self.get_object()
        logs = APIKeyUsageLog.objects.filter(api_key=key).select_related('api_key').order_by('-id')[:50]
        serializer = APIKeyUsageLogSerializer(logs, many=True)
        return Response(serializer.data)



class LoginHitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LoginHit.objects.all()
    serializer_class = LoginHitSerializer
    permission_classes = [permissions.IsAdminUser] # Restricted to staff/superusers

class BlockedEmployeeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing blocked employee accounts.
    Provides read-only access to blocked employees and a reactivate action.
    """
    serializer_class = EmployeeListSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Return only employees who are currently blocked"""
        return Employee.objects.filter(is_blocked=True).select_related('user').prefetch_related('positions')
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """
        Reactivate a blocked employee account.
        Requires a 'reason' in the request data for audit purposes.
        """
        employee = self.get_object()
        reason = request.data.get('reason', '').strip()
        
        if not reason:
            return Response(
                {'error': 'Reactivation reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store failed count for history
        failed_count = employee.failed_login_attempts

        # Reset block status
        employee.is_blocked = False
        employee.failed_login_attempts = 0
        employee.reactivation_reason = reason
        employee.save()
        
        # Log the reactivation
        AccountBlockHistory.objects.create(
            employee=employee,
            action='REACTIVATED',
            failed_attempts=failed_count,
            reactivation_reason=reason,
            reactivated_by=request.user
        )
        
        return Response({
            'message': f'Account for {employee.name} has been successfully reactivated',
            'employee_id': employee.id,
            'employee_name': employee.name
        }, status=status.HTTP_200_OK)

class AccountBlockHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing account block and reactivation history.
    Read-only - records are created automatically by the system.
    """
    queryset = AccountBlockHistory.objects.all()
    serializer_class = AccountBlockHistorySerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['employee', 'action']
    
    def get_queryset(self):
        """Allow filtering by employee ID via query params"""
        queryset = AccountBlockHistory.objects.all()
        employee_id = self.request.query_params.get('employee', None)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset.order_by('-timestamp')

class EmployeeArchiveViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing archived employee data.
    Read-only - archives are created automatically when employees are deleted.
    Provides complete historical record of deleted employees.
    """
    queryset = EmployeeArchive.objects.all()
    serializer_class = EmployeeArchiveSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['original_employee_id', 'deleted_by']
    
    def get_queryset(self):
        """Allow filtering by original employee ID or deleted_by user"""
        queryset = EmployeeArchive.objects.all()
        
        # Filter by original employee ID
        employee_id = self.request.query_params.get('employee_id', None)
        if employee_id:
            queryset = queryset.filter(original_employee_id=employee_id)
        
        # Filter by who deleted
        deleted_by = self.request.query_params.get('deleted_by', None)
        if deleted_by:
            queryset = queryset.filter(deleted_by_id=deleted_by)
        
        # Search by employee name
        search = self.request.query_params.get('search', None)
        if search:
            # Search in the JSON employee_data field
            queryset = queryset.filter(employee_data__name__istartswith=search)
        
        return queryset.order_by('-deleted_at')
    
    @action(detail=True, methods=['get'])
    def full_data(self, request, pk=None):
        """
        Get complete archived data for a specific employee archive.
        Returns all related data including positions, documents, etc.
        """
        archive = self.get_object()
        serializer = self.get_serializer(archive)
        return Response(serializer.data)

class PositionAssignmentViewSet(ActivityLoggingMixin, viewsets.ModelViewSet):
    queryset = PositionAssignment.objects.all()
    serializer_class = PositionAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return PositionAssignment.objects.all()
        
        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            # We want assignments where the user is:
            # 1. The one who made it (Assignor)
            # 2. The one who received it (Assignee)
            # 3. The administrative boss (Assignor's reporting_to)
            # 4. The functional boss (Assignor's positions report to the user's positions)
            return PositionAssignment.objects.filter(
                Q(assignor=employee) | 
                Q(assignee=employee) |
                Q(assignor__reporting_to=employee) |
                Q(assignor__positions__reporting_to__employees=employee)
            ).distinct().prefetch_related('assignor', 'assignee', 'position')
        return PositionAssignment.objects.none()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'employee_profile'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'You must have an employee profile to assign positions.'})
        instance = serializer.save(assignor=self.request.user.employee_profile)
        self._log_activity('CREATE', instance)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        assignment = self.get_object()
        if not hasattr(request.user, 'employee_profile') or request.user.employee_profile != assignment.assignee:
            return Response({'error': 'Only the assignee can accept this assignment'}, status=status.HTTP_403_FORBIDDEN)
        
        assignment.assignee_accepted = True
        if assignment.reporting_head_approved:
            assignment.status = 'APPROVED'
        else:
            assignment.status = 'ACCEPTED'
        assignment.save()
        self._log_activity('ACCEPT', assignment)
        return Response({'status': 'Assignment accepted by assignee'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        assignment = self.get_object()
        if not hasattr(request.user, 'employee_profile'):
             return Response({'error': 'You must have an employee profile to approve assignments'}, status=status.HTTP_403_FORBIDDEN)
        
        employee = request.user.employee_profile
        # Check Administrative Boss
        is_admin_boss = (assignment.assignor.reporting_to == employee)
        
        # Check Functional Boss (Position-based)
        is_functional_boss = assignment.assignor.positions.filter(reporting_to__employees=employee).exists()
        
        if not (is_admin_boss or is_functional_boss):
             return Response({'error': 'Only the reporting head (Administrative or Functional) of the assignor can approve this assignment'}, status=status.HTTP_403_FORBIDDEN)
        
        assignment.reporting_head_approved = True
        if assignment.assignee_accepted:
            assignment.status = 'APPROVED'
        assignment.save()
        self._log_activity('APPROVE', assignment)
        return Response({'status': 'Assignment approved by reporting head'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        assignment = self.get_object()
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Employee profile required'}, status=status.HTTP_403_FORBIDDEN)
            
        employee = request.user.employee_profile
        is_assignee = (employee == assignment.assignee)
        is_admin_boss = (assignment.assignor.reporting_to == employee)
        is_functional_boss = assignment.assignor.positions.filter(reporting_to__employees=employee).exists()
        
        if not (is_assignee or is_admin_boss or is_functional_boss):
             return Response({'error': 'Not authorized to reject. Only the assignee or the assignor\'s reporting heads (Admin/Functional) can reject.'}, status=status.HTTP_403_FORBIDDEN)
        
        assignment.status = 'REJECTED'
        assignment.save()
        self._log_activity('REJECT', assignment)
        return Response({'status': 'Assignment rejected'})

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        assignment = self.get_object()
        new_expiry = request.data.get('expires_at')
        
        if not new_expiry:
            return Response({'error': 'New expiry date is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        employee = getattr(request.user, 'employee_profile', None)
        if not employee and not request.user.is_superuser:
            return Response({'error': 'Employee profile required'}, status=status.HTTP_403_FORBIDDEN)
            
        is_authorized = request.user.is_superuser
        if employee:
            is_assignor = (employee == assignment.assignor)
            is_admin_boss = (assignment.assignor.reporting_to == employee)
            is_functional_boss = assignment.assignor.positions.filter(reporting_to__employees=employee).exists()
            is_authorized = is_authorized or is_assignor or is_admin_boss or is_functional_boss

        if not is_authorized:
            return Response({'error': 'Not authorized to extend this assignment'}, status=status.HTTP_403_FORBIDDEN)
            
        assignment.expires_at = new_expiry
        assignment.save()
        self._log_activity('EXTEND', assignment)
        return Response({'status': 'Assignment expiry extended', 'new_expiry': assignment.expires_at})

class GeoBulkUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of data rows.'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        updated_count = 0
        errors = []

        target_section = request.query_params.get('section')

        # ── In-memory cache: avoids redundant DB lookups for the same name ──
        continent_cache = {}
        country_cache = {}
        state_cache = {}
        district_cache = {}
        mandal_cache = {}

        def get_best(row, category):
            cat = category.lower().strip()
            if row.get(category):
                return row.get(category)
            keys = [k for k in row.keys() if cat in k.lower()]
            name_key = next((k for k in keys if 'name' in k.lower()), None)
            if name_key and row.get(name_key): return row.get(name_key)
            exact_key = next((k for k in keys if k.lower() == cat), None)
            val = row.get(exact_key)
            if val and not str(val).isdigit(): return val
            fallback = next((k for k in keys if 'id' not in k.lower() and 'code' not in k.lower()), None)
            return row.get(fallback)

        def make_error_record(index, row, reason):
            return {
                'row': index + 1,
                'reason': reason,
                'data': {
                    'Continent': get_best(row, 'Continent') or row.get('territory') or '',
                    'Country': get_best(row, 'Country') or '',
                    'State': get_best(row, 'State') or '',
                    'District': get_best(row, 'District') or '',
                    'Mandal': get_best(row, 'Mandal') or '',
                    'Cluster': get_best(row, 'Cluster') or '',
                    'Cluster Type': row.get('Cluster Type') or row.get('Category') or ''
                }
            }

        with transaction.atomic():
            for index, row in enumerate(data):
                try:
                    continent_name = (get_best(row, 'Continent') or row.get('territory') or '').strip().upper()
                    continent_code = (row.get('Continent Code') or row.get('CONTINENT_CODE') or '').strip().upper()
                    country_name   = (get_best(row, 'Country') or '').strip().upper()
                    country_code   = (row.get('Country Code') or row.get('COUNTRY_CODE') or '').strip().upper()
                    state_name     = (get_best(row, 'State') or '').strip().upper()
                    state_code     = (row.get('State Code') or row.get('STATE_CODE') or '').strip().upper()
                    district_name  = (get_best(row, 'District') or '').strip().upper()
                    dist_code      = (row.get('District Code') or row.get('DISTRICT_CODE') or '').strip().upper()
                    mandal_name    = (get_best(row, 'Mandal') or '').strip().upper()
                    mandal_code    = (row.get('Mandal Code') or row.get('MANDAL_CODE') or '').strip().upper()
                    cluster_name   = (get_best(row, 'Cluster') or '').strip().upper()
                    cluster_code   = (row.get('Cluster Code') or row.get('CLUSTER_CODE') or '').strip().upper()

                    # Identify required fields based on the target section scale
                    hierarchy_levels = [
                        ('geo-continents', 'Continent', continent_name),
                        ('geo-countries', 'Country', country_name),
                        ('geo-states', 'State', state_name),
                        ('geo-districts', 'District', district_name),
                        ('geo-mandals', 'Mandal', mandal_name),
                        ('geo-clusters', 'Cluster', cluster_name),
                    ]

                    # Determine what is required to reach the target section
                    target_index = next((i for i, (sec, _, _) in enumerate(hierarchy_levels) if sec == target_section), len(hierarchy_levels) - 1)
                    
                    validation_error = None
                    for i in range(target_index + 1):
                        _, label, val = hierarchy_levels[i]
                        if not val or val.strip() == '-':
                            validation_error = f"{label} name is required."
                            break
                    
                    # Also require code for the target section
                    if not validation_error:
                        target_label = hierarchy_levels[target_index][1]
                        target_code = None
                        if target_section == 'geo-continents': target_code = continent_code
                        elif target_section == 'geo-countries': target_code = country_code
                        elif target_section == 'geo-states': target_code = state_code
                        elif target_section == 'geo-districts': target_code = dist_code
                        elif target_section == 'geo-mandals': target_code = mandal_code
                        elif target_section == 'geo-clusters': target_code = cluster_code
                        
                        # Also require code for the target section (Exception: Clusters are optional)
                        if not validation_error and target_section != 'geo-clusters':
                            validation_error = f"{target_label} Code is required."
                    
                    if validation_error:
                        errors.append(make_error_record(index, row, validation_error))
                        continue

                    # 1. Continent
                    is_target = target_section == 'geo-continents'
                    if continent_name not in continent_cache:
                        if is_target:
                            if continent_code:
                                dup = GeoContinent.objects.filter(code=continent_code).exclude(name=continent_name).first()
                                if dup: raise Exception(f"Continent Code '{continent_code}' is already used by '{dup.name}'")
                            obj, created = GeoContinent.objects.update_or_create(
                                name=continent_name, defaults={'code': continent_code or ''}
                            )
                            if created: created_count += 1
                            else: updated_count += 1
                        else:
                            obj = GeoContinent.objects.filter(name=continent_name).first()
                            if not obj: raise Exception(f"Continent '{continent_name}' not found.")
                        continent_cache[continent_name] = obj
                    continent = continent_cache[continent_name]

                    if target_section == 'geo-continents': continue

                    # 2. Country
                    is_target = target_section == 'geo-countries'
                    country_key = f"{continent_name}|{country_name}"
                    if country_key not in country_cache:
                        if is_target:
                            if country_code:
                                dup = GeoCountry.objects.filter(code=country_code).exclude(name=country_name).first()
                                if dup: raise Exception(f"Country Code '{country_code}' is already used by '{dup.name}'")
                            obj, created = GeoCountry.objects.update_or_create(
                                name=country_name, defaults={'continent_ref': continent, 'code': country_code or ''}
                            )
                            if created: created_count += 1
                            else: updated_count += 1
                        else:
                            obj = GeoCountry.objects.filter(name=country_name, continent_ref=continent).first()
                            if not obj: raise Exception(f"Country '{country_name}' not found in {continent_name}.")
                        country_cache[country_key] = obj
                    country = country_cache[country_key]

                    if target_section == 'geo-countries': continue

                    # 3. State
                    is_target = target_section == 'geo-states'
                    state_key = f"{country_key}|{state_name}"
                    state_code = (row.get('State Code') or '').strip().upper()
                    if state_key not in state_cache:
                        if is_target:
                            if state_code:
                                dup = GeoState.objects.filter(code=state_code).exclude(name=state_name).first()
                                if dup: raise Exception(f"State Code '{state_code}' is already used by '{dup.name}'")
                            obj, created = GeoState.objects.update_or_create(
                                name=state_name, country=country, defaults={'code': state_code}
                            )
                            if created: created_count += 1
                            else: updated_count += 1
                        else:
                            obj = GeoState.objects.filter(name=state_name, country=country).first()
                            if not obj: raise Exception(f"State '{state_name}' not found in {country_name}.")
                        state_cache[state_key] = obj
                    state = state_cache[state_key]

                    if target_section == 'geo-states': continue

                    # 4. District
                    is_target = target_section == 'geo-districts'
                    dist_key = f"{state_key}|{district_name}"
                    dist_code = (row.get('District Code') or '').strip().upper()
                    if dist_key not in district_cache:
                        if is_target:
                            if dist_code:
                                dup = GeoDistrict.objects.filter(code=dist_code).exclude(name=district_name).first()
                                if dup: raise Exception(f"District Code '{dist_code}' is already used by '{dup.name}'")
                            obj, created = GeoDistrict.objects.update_or_create(
                                name=district_name, state=state, defaults={'code': dist_code}
                            )
                            if created: created_count += 1
                            else: updated_count += 1
                        else:
                            obj = GeoDistrict.objects.filter(name=district_name, state=state).first()
                            if not obj: raise Exception(f"District '{district_name}' not found in {state_name}.")
                        district_cache[dist_key] = obj
                    district = district_cache[dist_key]

                    if target_section == 'geo-districts': continue

                    # 5. Mandal
                    is_target = target_section == 'geo-mandals'
                    mandal_key = f"{dist_key}|{mandal_name}"
                    mandal_code = (row.get('Mandal Code') or '').strip().upper()
                    if mandal_key not in mandal_cache:
                        if is_target:
                            if mandal_code:
                                dup = GeoMandal.objects.filter(code=mandal_code).exclude(name=mandal_name).first()
                                if dup: raise Exception(f"Mandal Code '{mandal_code}' is already used by '{dup.name}'")
                            obj, created = GeoMandal.objects.update_or_create(
                                name=mandal_name, district=district, defaults={'code': mandal_code}
                            )
                            if created: created_count += 1
                            else: updated_count += 1
                        else:
                            obj = GeoMandal.objects.filter(name=mandal_name, district=district).first()
                            if not obj: raise Exception(f"Mandal '{mandal_name}' not found in {district_name}.")
                        mandal_cache[mandal_key] = obj
                    mandal = mandal_cache[mandal_key]

                    if target_section == 'geo-mandals': continue

                    # 6. Cluster (always target if reaching here)
                    cluster_code = (get_best(row, 'Cluster Code') or row.get('Cluster Code') or '').strip().upper()
                    if cluster_name:
                        cluster_type = (row.get('Cluster Type') or row.get('Category') or 'VILLAGE').upper().strip()
                        
                        if cluster_code and cluster_code.strip() != '-':
                            if len(cluster_code) > 4:
                                raise Exception(f"Cluster Code '{cluster_code}' cannot exceed 4 characters.")
                            dup = GeoCluster.objects.filter(code=cluster_code).exclude(name=cluster_name).first()
                            if dup: raise Exception(f"Cluster Code '{cluster_code}' is already used by '{dup.name}'")
                        else:
                            cluster_code = ''
                            
                        cluster, cl_created = GeoCluster.objects.update_or_create(
                            name=cluster_name,
                            mandal=mandal,
                            defaults={'cluster_type': cluster_type, 'code': cluster_code}
                        )
                        if cl_created: created_count += 1
                        else: updated_count += 1

                except Exception as e:
                    errors.append(make_error_record(index, row, str(e)))

        return Response({
            'success': len(errors) == 0,
            'created': created_count,
            'updated': updated_count,
            'errors': errors,
            'total_processed': len(data)
        })

class GeoFullHierarchyView(APIView):
    """
    Returns the complete geographical hierarchy from Continents down to 
    Clusters (Metropolitan/City/Town/Village) in a single nested payload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        continents = GeoContinent.objects.all().prefetch_related(
            'countries__states__districts__mandals__clusters__visiting_locations',
            'countries__states__districts__mandals__clusters__landmarks'
        )
        serializer = GeoContinentNestedSerializer(continents, many=True)
        return Response(serializer.data)

from .models import AuditLog
from core.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['model_name', 'action', 'ip_address', 'user__username', 'record_id']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return AuditLog.objects.none()
            
        if user.is_superuser:
            return super().get_queryset()
            
        # For security, you can customize this to allow specific Employee roles
        # For now, locking it entirely to superusers.
        return AuditLog.objects.none()

from core.models import VehicleSwapLog
from core.serializers import VehicleSwapLogSerializer

class VehicleSwapLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VehicleSwapLog.objects.all().select_related('office_a', 'office_b')
    serializer_class = VehicleSwapLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['sac_a', 'sac_b', 'old_vehicle_code_a', 'old_vehicle_code_b', 'new_vehicle_code_a', 'new_vehicle_code_b', 'triggered_by', 'status']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

class PositionShiftRosterViewSet(viewsets.ModelViewSet):
    queryset = PositionShiftRoster.objects.all()
    serializer_class = PositionShiftRosterSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__name', 'position__name', 'shift__name']
    ordering_fields = ['date', 'position__name', 'shift__name']
    ordering = ['date', 'position__name', 'shift__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_superuser:
            if hasattr(user, 'employee_profile'):
                emp = user.employee_profile
                sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
                # Filter roster entries to subordinates + self
                queryset = queryset.filter(employee_id__in=sub_ids + [emp.id])
            else:
                return PositionShiftRoster.objects.none()

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        office = self.request.query_params.get('office')
        if office and office != 'all':
            queryset = queryset.filter(position__office_id=office)
            
        project = self.request.query_params.get('project')
        if project and project != 'all':
            queryset = queryset.filter(
                Q(position__section__project_id=project) | 
                Q(position__department__project_id=project)
            )

        position_ids = self.request.query_params.get('position_ids')
        if position_ids:
            try:
                id_list = [int(x) for x in position_ids.split(',') if x.strip()]
                if id_list:
                    queryset = queryset.filter(position_id__in=id_list)
            except ValueError:
                pass
            
        return queryset.select_related('employee', 'position', 'shift')

    def _roster_payload(self, roster):
        """Build the complete rich JSON payload for a single roster entry."""
        emp = roster.employee
        pos = roster.position
        shift = roster.shift

        # Office & location details
        office_id = pos.office_id if pos else None
        office_name = pos.office.name if (pos and pos.office) else None
        office_location = {
            'district': pos.office.district_name if (pos and pos.office) else None,
            'state': pos.office.state_name if (pos and pos.office) else None,
            'mandal': pos.office.mandal_name if (pos and pos.office) else None,
        } if (pos and pos.office) else None

        # Project details
        project_id = None
        project_name = None
        if pos:
            if pos.section and pos.section.project:
                project_id = pos.section.project.id
                project_name = pos.section.project.name
            elif pos.department and pos.department.project:
                project_id = pos.department.project.id
                project_name = pos.department.project.name

        # Reporting Manager details
        reporting_manager_id = None
        reporting_manager_name = None
        reporting_manager_code = None
        reporting_position_id = None
        reporting_position_name = None
        reporting_office_id = None
        reporting_office_name = None

        if pos and pos.reporting_to.exists():
            parent_pos = pos.reporting_to.first()
            if parent_pos:
                reporting_position_id = parent_pos.id
                reporting_position_name = parent_pos.name
                if parent_pos.office:
                    reporting_office_id = parent_pos.office.id
                    reporting_office_name = parent_pos.office.name
                
                mgr_emp = parent_pos.employees.filter(is_deleted=False).first()
                if mgr_emp:
                    reporting_manager_id = mgr_emp.id
                    reporting_manager_name = mgr_emp.name
                    reporting_manager_code = mgr_emp.employee_code

        return {
            'id': roster.id,
            'date': str(roster.date),
            'employee': {
                'id': emp.id if emp else None,
                'name': emp.name if emp else None,
                'code': emp.employee_code if emp else None,
            },
            'position': {
                'id': pos.id if pos else None,
                'name': pos.name if pos else None,
                'code': pos.code if pos else None,
            },
            'office': {
                'id': office_id,
                'name': office_name,
                'location': office_location
            },
            'project': {
                'id': project_id,
                'name': project_name
            },
            'reporting_manager': {
                'id': reporting_manager_id,
                'name': reporting_manager_name,
                'code': reporting_manager_code,
                'position_id': reporting_position_id,
                'position_name': reporting_position_name,
                'office_id': reporting_office_id,
                'office_name': reporting_office_name
            },
            'shift': {
                'id': shift.id if shift else None,
                'name': shift.name if shift else None,
                'start_time': str(shift.start_time) if (shift and shift.start_time) else None,
                'end_time': str(shift.end_time) if (shift and shift.end_time) else None,
            }
        }

    def perform_create(self, serializer):
        instance = serializer.save()
        from .webhook_utils import fire_shift_webhook
        fire_shift_webhook('shift.assigned', self._roster_payload(instance))

    def perform_update(self, serializer):
        instance = serializer.save()
        from .webhook_utils import fire_shift_webhook
        fire_shift_webhook('shift.assigned', self._roster_payload(instance))

    def perform_destroy(self, instance):
        payload = self._roster_payload(instance)
        instance.delete()
        from .webhook_utils import fire_shift_webhook
        fire_shift_webhook('shift.unassigned', payload)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        employee_id = request.data.get('employee')
        position_id = request.data.get('position')
        shift_id = request.data.get('shift')
        dates = request.data.get('dates', [])
        overwrite = request.data.get('overwrite', False)

        if not all([employee_id, position_id, shift_id, dates]):
            return Response({'error': 'Employee, position, shift, and dates are required.'}, status=400)

        try:
            employee = Employee.objects.get(id=employee_id)
            position = Position.objects.get(id=position_id)
            shift = Shift.objects.get(id=shift_id)
        except (Employee.DoesNotExist, Position.DoesNotExist, Shift.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)

        success_dates = []
        skipped_dates = []
        error_dates = []

        from datetime import datetime
        from django.db import transaction

        with transaction.atomic():
            for date_str in dates:
                try:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    
                    # 1. Exclusivity check: is this position/shift already assigned on this date?
                    existing = PositionShiftRoster.objects.filter(
                        position=position,
                        shift=shift,
                        date=date_obj
                    )
                    
                    if existing.exists():
                        if overwrite:
                            existing.delete()
                        else:
                            skipped_dates.append({
                                'date': date_str,
                                'reason': f"Shift '{shift.name}' is already assigned to another employee on this date."
                            })
                            continue

                    # 2. Time overlap check for this employee on this date
                    same_day_rosters = PositionShiftRoster.objects.filter(
                        employee=employee,
                        date=date_obj
                    )
                    
                    overlap_conflict = False
                    for roster in same_day_rosters:
                        other_shift = roster.shift
                        if other_shift.start_time and other_shift.end_time and shift.start_time and shift.end_time:
                            if (shift.start_time < other_shift.end_time) and (shift.end_time > other_shift.start_time):
                                overlap_conflict = True
                                skipped_dates.append({
                                    'date': date_str,
                                    'reason': f"Employee '{employee.name}' has overlap with shift '{other_shift.name}'."
                                })
                                break
                    
                    if overlap_conflict:
                        continue

                    # Create assignment
                    PositionShiftRoster.objects.create(
                        employee=employee,
                        position=position,
                        shift=shift,
                        date=date_obj
                    )
                    success_dates.append(date_str)
                    
                except Exception as ex:
                    error_dates.append({
                        'date': date_str,
                        'reason': str(ex)
                    })

        # Fire webhook for bulk assignment
        if success_dates:
            from .webhook_utils import fire_shift_webhook
            fire_shift_webhook('shift.bulk_assigned', {
                'employee_id': employee.id,
                'employee_name': employee.name,
                'employee_code': employee.employee_code,
                'position_id': position.id,
                'position_name': position.name,
                'shift_id': shift.id,
                'shift_name': shift.name,
                'shift_start': str(shift.start_time) if shift.start_time else None,
                'shift_end': str(shift.end_time) if shift.end_time else None,
                'success_dates': success_dates,
                'skipped_dates': [s['date'] for s in skipped_dates],
                'overwrite': overwrite,
            })

        return Response({
            'success': True,
            'success_dates': success_dates,
            'skipped_dates': skipped_dates,
            'error_dates': error_dates
        })

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        position_id = request.data.get('position')
        shift_id = request.data.get('shift')
        dates = request.data.get('dates', [])

        if not all([position_id, shift_id, dates]):
            return Response({'error': 'Position, shift, and dates are required.'}, status=400)

        try:
            position = Position.objects.get(id=position_id)
            shift = Shift.objects.get(id=shift_id)
        except (Position.DoesNotExist, Shift.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)

        from django.db import transaction

        with transaction.atomic():
            deleted_count, _ = PositionShiftRoster.objects.filter(
                position=position,
                shift=shift,
                date__in=dates
            ).delete()

        # Fire webhook for bulk deletion
        if deleted_count > 0:
            from .webhook_utils import fire_shift_webhook
            fire_shift_webhook('shift.bulk_deleted', {
                'position_id': position.id,
                'position_name': position.name,
                'shift_id': shift.id,
                'shift_name': shift.name,
                'deleted_dates': dates,
                'deleted_count': deleted_count,
            })

        return Response({
            'success': True,
            'deleted_count': deleted_count
        })


def ensure_task_url_exists(pattern, name):
    from core.models import TaskUrl, Task, Job, JobFamily
    turl = TaskUrl.objects.filter(url_pattern=pattern).first()
    if turl:
        return turl
    
    # Need to find or create a task
    # First, get a Job to attach the task to
    job = Job.objects.first()
    if not job:
        # Create a system job
        jf = JobFamily.objects.first()
        if not jf:
            jf = JobFamily.objects.create(name="System Administration")
        job = Job.objects.create(
            name="System Manager Job",
            job_family=jf,
            code="SYS_MGR"
        )
        
    task = Task.objects.filter(code=f"SYS_{pattern.upper().replace('-', '_')}"[:50]).first()
    if not task:
        task = Task.objects.create(
            name=name,
            code=f"SYS_{pattern.upper().replace('-', '_')}"[:50],
            job=job,
            description=f"System Task for {name}"
        )
        
    turl = TaskUrl.objects.create(
        task=task,
        url_pattern=pattern,
        can_view=True,
        can_create=True,
        can_edit=True,
        can_delete=True
    )
    return turl


class ManagerScreenMappingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        managers = Employee.objects.filter(is_deleted=False, subordinates__isnull=False)
        
        # Let's also include any employee that has an active user account just in case
        user_employees = Employee.objects.filter(is_deleted=False, user__isnull=False)
        managers = (managers | user_employees).distinct()

        # Target screen patterns
        target_screens = [
            {'pattern': 'position-shift-rosters', 'name': 'Shift Roster'},
            {'pattern': 'position-assignments', 'name': 'Position Assignments'},
            {'pattern': 'employees', 'name': 'Employees Registry'},
            {'pattern': 'positions', 'name': 'Positions Registry'},
        ]

        # Ensure task urls exist for all target patterns
        for screen in target_screens:
            ensure_task_url_exists(screen['pattern'], screen['name'])

        results = []
        for mgr in managers:
            sub_ids_count = len(get_recursive_subordinate_ids(mgr, exclude_self=True))
            
            # Fetch overrides for this manager
            perms = {}
            for screen in target_screens:
                turl = ensure_task_url_exists(screen['pattern'], screen['name'])
                perm_obj = EmployeeTaskUrlPermission.objects.filter(
                    employee=mgr,
                    task_url=turl
                ).first()
                perms[screen['pattern']] = perm_obj.can_view if (perm_obj and perm_obj.is_enabled) else False

            results.append({
                'id': mgr.id,
                'name': mgr.name,
                'employee_code': mgr.employee_code,
                'subordinates_count': sub_ids_count,
                'permissions': perms
            })

        return Response(results)

    @action(detail=True, methods=['post'])
    def toggle_permission(self, request, pk=None):
        employee = Employee.objects.get(id=pk)
        pattern = request.data.get('pattern')
        enabled = request.data.get('enabled', False)

        if not pattern:
            return Response({'error': 'Pattern is required'}, status=400)

        target_screens = {
            'position-shift-rosters': 'Shift Roster',
            'position-assignments': 'Position Assignments',
            'employees': 'Employees Registry',
            'positions': 'Positions Registry',
        }

        if pattern not in target_screens:
            return Response({'error': 'Invalid pattern'}, status=400)

        turl = ensure_task_url_exists(pattern, target_screens[pattern])

        if enabled:
            # Enable permission
            EmployeeTaskUrlPermission.objects.update_or_create(
                employee=employee,
                task_url=turl,
                defaults={
                    'can_view': True,
                    'can_create': True,
                    'can_edit': True,
                    'can_delete': True,
                    'is_enabled': True,
                    'is_overridden': True
                }
            )
        else:
            # Disable permission
            EmployeeTaskUrlPermission.objects.update_or_create(
                employee=employee,
                task_url=turl,
                defaults={
                    'can_view': False,
                    'can_create': False,
                    'can_edit': False,
                    'can_delete': False,
                    'is_enabled': False,
                    'is_overridden': True
                }
            )

        return Response({'success': True, 'pattern': pattern, 'enabled': enabled})

    @action(detail=True, methods=['get'])
    def subordinates(self, request, pk=None):
        employee = Employee.objects.get(id=pk)
        subs = get_subordinates_recursive(employee)
        data = [{
            'id': s.id,
            'name': s.name,
            'employee_code': s.employee_code,
            'status': s.status
        } for s in subs]
        return Response(data)


from core.models import VehicleSwapRequest
from core.serializers import VehicleSwapRequestSerializer

class VehicleSwapRequestViewSet(viewsets.ModelViewSet):
    queryset = VehicleSwapRequest.objects.all().select_related('requester', 'from_office', 'to_office')
    serializer_class = VehicleSwapRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_superuser:
            if hasattr(user, 'employee_profile'):
                emp = user.employee_profile
                sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
                # User can see requests made by themselves or their subordinates
                queryset = queryset.filter(requester_id__in=sub_ids + [emp.id])
            else:
                return VehicleSwapRequest.objects.none()
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'employee_profile'):
            raise ValidationError("You must have an employee profile to create swap requests.")
        
        emp = user.employee_profile
        from_office = serializer.validated_data.get('from_office')
        to_office = serializer.validated_data.get('to_office')

        # Pre-fill vehicle details at the time of request
        serializer.save(
            requester=emp,
            from_vehicle_code=from_office.vehicle_code,
            from_vehicle_no=from_office.vehicle_no,
            to_vehicle_code=to_office.vehicle_code,
            to_vehicle_no=to_office.vehicle_no,
            status='PENDING'
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        swap_req = self.get_object()
        if swap_req.status != 'PENDING':
            return Response({'error': 'Only pending requests can be approved.'}, status=400)

        office_a = swap_req.from_office
        office_b = swap_req.to_office
        swap_crew = swap_req.swap_crew

        # Swap vehicle codes and numbers
        old_v_a = office_a.vehicle_code
        old_v_b = office_b.vehicle_code
        old_no_a = office_a.vehicle_no
        old_no_b = office_b.vehicle_no

        try:
            with transaction.atomic():
                office_a.vehicle_code = old_v_b
                office_a.vehicle_no = old_no_b
                office_b.vehicle_code = old_v_a
                office_b.vehicle_no = old_no_a
                office_a.save()
                office_b.save()

                if swap_crew:
                    pos_a = list(Position.objects.filter(office=office_a))
                    pos_b = list(Position.objects.filter(office=office_b))
                    for p in pos_a:
                        p.office = office_b
                        p.save()
                    for p in pos_b:
                        p.office = office_a
                        p.save()

                # Update swap request status
                swap_req.status = 'APPROVED'
                swap_req.actioned_by = request.user
                swap_req.actioned_at = timezone.now()
                swap_req.save()

                # Log transaction
                from core.models import VehicleSwapLog
                VehicleSwapLog.objects.create(
                    office_a=office_a,
                    office_b=office_b,
                    sac_a=office_a.sac,
                    sac_b=office_b.sac,
                    old_vehicle_code_a=old_v_a,
                    old_vehicle_code_b=old_v_b,
                    new_vehicle_code_a=old_v_b,
                    new_vehicle_code_b=old_v_a,
                    old_vehicle_no_a=old_no_a,
                    old_vehicle_no_b=old_no_b,
                    new_vehicle_no_a=old_no_b,
                    new_vehicle_no_b=old_no_a,
                    crew_swapped=swap_crew,
                    triggered_by=request.user.username,
                    status='SUCCESS'
                )

            return Response({'success': True, 'message': 'Request approved and swap completed.'})
        except Exception as e:
            # Log failure
            try:
                from core.models import VehicleSwapLog
                VehicleSwapLog.objects.create(
                    office_a=office_a,
                    office_b=office_b,
                    sac_a=office_a.sac,
                    sac_b=office_b.sac,
                    old_vehicle_code_a=old_v_a,
                    old_vehicle_code_b=old_v_b,
                    new_vehicle_code_a=old_v_a,
                    new_vehicle_code_b=old_v_b,
                    old_vehicle_no_a=old_no_a,
                    old_vehicle_no_b=old_no_b,
                    new_vehicle_no_a=old_no_a,
                    new_vehicle_no_b=old_no_b,
                    crew_swapped=swap_crew,
                    triggered_by=request.user.username,
                    status='FAILED',
                    error_message=str(e)
                )
            except Exception:
                pass
            return Response({'error': f'Failed to execute swap: {str(e)}'}, status=500)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        swap_req = self.get_object()
        if swap_req.status != 'PENDING':
            return Response({'error': 'Only pending requests can be rejected.'}, status=400)

        swap_req.status = 'REJECTED'
        swap_req.actioned_by = request.user
        swap_req.actioned_at = timezone.now()
        swap_req.comments = request.data.get('comments', '')
        swap_req.save()

        return Response({'success': True, 'message': 'Request rejected.'})


from core.models import ShiftChangeRequest
from core.serializers import ShiftChangeRequestSerializer

class ShiftChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = ShiftChangeRequest.objects.all().select_related('requested_by', 'employee', 'position', 'from_shift', 'to_shift')
    serializer_class = ShiftChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_superuser:
            if hasattr(user, 'employee_profile'):
                emp = user.employee_profile
                sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(requested_by=emp) | 
                    Q(employee=emp) | 
                    Q(employee_id__in=sub_ids) | 
                    Q(requested_by_id__in=sub_ids)
                )
            else:
                return ShiftChangeRequest.objects.none()
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'employee_profile'):
            raise ValidationError("You must have an employee profile to create shift requests.")
        
        emp = user.employee_profile
        employee = serializer.validated_data.get('employee')
        position = serializer.validated_data.get('position')
        date = serializer.validated_data.get('date')
        to_shift = serializer.validated_data.get('to_shift')
        
        from_shift = None
        existing_roster = PositionShiftRoster.objects.filter(
            employee=employee,
            position=position,
            date=date
        ).first()
        if existing_roster:
            from_shift = existing_roster.shift

        if user.is_superuser:
            instance = serializer.save(
                requested_by=emp,
                from_shift=from_shift,
                status='APPROVED',
                employee_consent='ACCEPTED'
            )
            self._apply_roster_update(instance)
        elif emp == employee:
            serializer.save(
                requested_by=emp,
                from_shift=from_shift,
                status='PENDING_APPROVAL',
                employee_consent='ACCEPTED'
            )
        else:
            serializer.save(
                requested_by=emp,
                from_shift=from_shift,
                status='PENDING_CONSENT',
                employee_consent='PENDING'
            )

    def _apply_roster_update(self, request_obj):
        with transaction.atomic():
            roster, created = PositionShiftRoster.objects.update_or_create(
                employee=request_obj.employee,
                position=request_obj.position,
                date=request_obj.date,
                defaults={
                    'shift': request_obj.to_shift,
                    'actual_start_time': None,
                    'actual_end_time': None,
                    'attendance_status': 'PENDING'
                }
            )
            try:
                from .webhook_utils import fire_shift_webhook
                payload = {
                    'id': roster.id,
                    'employee_id': roster.employee_id,
                    'employee_name': roster.employee.name,
                    'employee_code': roster.employee.employee_code,
                    'position_id': roster.position_id,
                    'position_name': roster.position.name,
                    'shift_id': roster.shift_id,
                    'shift_name': roster.shift.name,
                    'shift_start': str(roster.shift.start_time) if roster.shift.start_time else None,
                    'shift_end': str(roster.shift.end_time) if roster.shift.end_time else None,
                    'date': str(roster.date),
                }
                fire_shift_webhook('shift.assigned', payload)
            except Exception:
                pass

    @action(detail=True, methods=['post'])
    def consent(self, request, pk=None):
        request_obj = self.get_object()
        user = request.user
        if not hasattr(user, 'employee_profile') or request_obj.employee != user.employee_profile:
            return Response({'error': 'Only the target employee can give consent.'}, status=403)
        
        if request_obj.status != 'PENDING_CONSENT':
            return Response({'error': 'Request is not awaiting consent.'}, status=400)
            
        action_val = request.data.get('action')
        reason = request.data.get('reason', '')
        
        if action_val == 'accept':
            request_obj.employee_consent = 'ACCEPTED'
            is_manager_initiated = (request_obj.requested_by == request_obj.employee.reporting_to)
            
            if is_manager_initiated or request.user.is_superuser:
                request_obj.status = 'APPROVED'
                request_obj.save()
                self._apply_roster_update(request_obj)
                return Response({'success': True, 'message': 'Consent accepted. Shift updated successfully.', 'status': 'APPROVED'})
            else:
                request_obj.status = 'PENDING_APPROVAL'
                request_obj.save()
                return Response({'success': True, 'message': 'Consent accepted. Awaiting manager approval.', 'status': 'PENDING_APPROVAL'})
        elif action_val == 'decline':
            request_obj.employee_consent = 'DECLINED'
            request_obj.status = 'REJECTED'
            request_obj.admin_notes = reason
            request_obj.save()
            return Response({'success': True, 'message': 'Consent declined. Request rejected.', 'status': 'REJECTED'})
        else:
            return Response({'error': 'Invalid action. Must be accept or decline.'}, status=400)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        request_obj = self.get_object()
        user = request.user
        if not user.is_superuser:
            if not hasattr(user, 'employee_profile'):
                return Response({'error': 'Access denied.'}, status=403)
            emp = user.employee_profile
            sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
            if request_obj.employee_id not in sub_ids and request_obj.requested_by_id not in sub_ids:
                return Response({'error': 'You do not have permission to approve this request.'}, status=403)

        if request_obj.status not in ['PENDING_APPROVAL', 'PENDING_CONSENT']:
            return Response({'error': 'Request is not in a pending state.'}, status=400)

        request_obj.status = 'APPROVED'
        request_obj.admin_notes = request.data.get('admin_notes', '')
        request_obj.save()
        
        self._apply_roster_update(request_obj)
        return Response({'success': True, 'message': 'Request approved and roster updated.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        request_obj = self.get_object()
        user = request.user
        if not user.is_superuser:
            if not hasattr(user, 'employee_profile'):
                return Response({'error': 'Access denied.'}, status=403)
            emp = user.employee_profile
            sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
            if request_obj.employee_id not in sub_ids and request_obj.requested_by_id not in sub_ids:
                return Response({'error': 'You do not have permission to reject this request.'}, status=403)

        if request_obj.status not in ['PENDING_APPROVAL', 'PENDING_CONSENT']:
            return Response({'error': 'Request is not in a pending state.'}, status=400)

        request_obj.status = 'REJECTED'
        request_obj.admin_notes = request.data.get('admin_notes', '')
        request_obj.save()
        return Response({'success': True, 'message': 'Request rejected.'})

    @action(detail=True, methods=['post'])
    def override(self, request, pk=None):
        request_obj = self.get_object()
        user = request.user
        if not user.is_superuser:
            if not hasattr(user, 'employee_profile'):
                return Response({'error': 'Access denied.'}, status=403)
            emp = user.employee_profile
            sub_ids = get_recursive_subordinate_ids(emp, exclude_self=True)
            if request_obj.employee_id not in sub_ids:
                return Response({'error': 'You do not have permission to override this request.'}, status=403)

        request_obj.status = 'APPROVED'
        request_obj.employee_consent = 'ACCEPTED'
        request_obj.admin_notes = f"Overridden by {user.username}"
        request_obj.save()
        
        self._apply_roster_update(request_obj)
        return Response({'success': True, 'message': 'Request overridden and roster updated directly.'})

class OfficeTypeViewSet(PerfectUpsertMixin, ScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = OfficeType.objects.all()
    serializer_class = OfficeTypeSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']



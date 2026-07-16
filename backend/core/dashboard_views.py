from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from .models import Employee, Office, Department, Project, Position
from .views import get_recursive_subordinate_ids, get_accessible_office_ids

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Superusers see everything
        if user.is_superuser:
            employee_count = Employee.objects.count()
            offices_count = Office.objects.count()
            departments_count = Department.objects.count()
            projects_count = Project.objects.count()
            open_positions_count = Position.objects.filter(employees__isnull=True).count()
        
        # Regular users see data for their office and sub-offices
        elif hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            
            # 1. Accessible Offices (Jurisdiction Hierarchy)
            # This includes their own office + all recursive child offices
            accessible_office_ids = get_accessible_office_ids(employee)
            offices_count = len(accessible_office_ids)
            
            # 2. Employees in those offices
            # Instead of just reporting subordinates, we count everyone in the authorized offices
            employees_in_hierarchy = Employee.objects.filter(
                positions__office_id__in=accessible_office_ids
            ).distinct().exclude(id=employee.id) # Exclude self from count
            employee_count = employees_in_hierarchy.count()
            
            # 3. Departments in those offices
            departments_in_hierarchy = Department.objects.filter(
                office_id__in=accessible_office_ids
            ).distinct()
            departments_count = departments_in_hierarchy.count()
            
            # 4. Projects linked to those offices or departments
            proj_ids_1 = set(Project.objects.filter(assigned_offices__id__in=accessible_office_ids).values_list('id', flat=True))
            proj_ids_2 = set(Project.objects.filter(departments__office_id__in=accessible_office_ids).values_list('id', flat=True))
            projects_count = len(proj_ids_1 | proj_ids_2)

            
            # 5. Open positions within the accessible offices
            open_positions_count = Position.objects.filter(
                office_id__in=accessible_office_ids,
                employees__isnull=True
            ).distinct().count()
        
        # Staff without employee profile see nothing
        else:
            employee_count = 0
            offices_count = 0
            departments_count = 0
            projects_count = 0
            open_positions_count = 0

        from .models import APIKey
        return Response({
            'employees': employee_count,
            'offices': offices_count,
            'departments': departments_count,
            'active_units': offices_count + departments_count,
            'projects': projects_count,
            'open_positions': open_positions_count,
            'api_keys_active': APIKey.objects.filter(is_active=True).count() if user.is_superuser else 0
        })

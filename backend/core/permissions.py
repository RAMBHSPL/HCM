from rest_framework import permissions

class DynamicSecurityPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            if not request.user or not request.user.is_authenticated:
                return False

            # Allow self-profile and logout always
            path = request.path.lower()

            # Allow self-profile, logout, and foundational structural lookups always
            if any(pattern in path for pattern in [
                'users/me', 'auth/login', 'auth/logout', 'auth/employee-details',
                'organization-levels', 'job-families', 'role-types',
                'facility-masters', 'projects', 'position-levels', 'geo-'
            ]):
                return True

            # Allow individual users to view/edit their own employee profile
            if 'employees' in path and request.method in ['GET', 'PUT', 'PATCH'] and hasattr(request.user, 'employee_profile'):
                import re
                match = re.search(r'employees/(\d+)/?', path)
                if match and int(match.group(1)) == request.user.employee_profile.id:
                    return True

            # 0. Check API Key Permissions
            if request.auth and hasattr(request.auth, 'actions'):
                key = request.auth
                # Check Method vs Actions
                if request.method in permissions.SAFE_METHODS and not key.actions.get('read', False):
                    return False
                if request.method == 'POST' and not key.actions.get('create', False):
                    return False
                if request.method in ['PUT', 'PATCH'] and not key.actions.get('update', False):
                    return False
                if request.method == 'DELETE' and not key.actions.get('delete', False):
                    return False
                # If Action matches, we allow standard access (scoping logic applies in Views via mixins, but basic perms pass)
                return True

            # 1. Superusers & Staff have full access
            if getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_staff', False):
                return True
            
            # 2. Get Employee Profile (with auto-sync fallback)
            employee = getattr(request.user, 'employee_profile', None)
            if not employee and request.user.username:
                from .models import Employee
                employee = Employee.objects.filter(employee_code=request.user.username).first()
                if employee:
                    try:
                        request.user.employee_profile = employee
                        request.user.save(update_fields=['employee_profile'])
                    except Exception:
                        pass
            
            if not employee:
                print(f"PERMISSION DENIED: User {request.user} has no employee profile and is not superuser/staff")
                return False
            
            # 3. Determine required action
            if request.method in permissions.SAFE_METHODS:
                action_req = 'view'
            elif request.method == 'POST':
                action_req = 'create'
            elif request.method in ['PUT', 'PATCH']:
                action_req = 'edit'
            elif request.method == 'DELETE':
                action_req = 'delete'
            else:
                return False

            # 4. Get Permissions Map
            from .views import get_employee_permissions
            perms = get_employee_permissions(employee)
            
            # 5. Check against the request path
            path = request.path.lower()

            # Allow read-only access to roster, shift request, shift, and all_data endpoints for authenticated users
            if request.method in permissions.SAFE_METHODS:
                if any(k in path for k in ['/all_data', 'position-shift-rosters', 'shift-change-requests', 'shifts']):
                    return True
            
            # Check wildcard first
            if '*' in perms:
                if perms['*'].get(action_req) and perms['*'].get('enabled', True):
                    return True
            
            for pattern, config in perms.items():
                if pattern == '*': continue
                if pattern in path:
                    if config.get(action_req) and config.get('enabled', True):
                        return True
                        
            return False
        except Exception as e:
            print(f"ERROR in DynamicSecurityPermission: {str(e)}")
            return False

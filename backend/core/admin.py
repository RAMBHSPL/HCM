from django.contrib import admin
from .models import (
    OrganizationLevel, Office, Facility, Department, Section, 
    JobFamily, RoleType, Role, Job, Task, TaskUrl, Position, 
    Employee, Project, EmployeeTaskUrlPermission, LoginHit,
    ShiftChangeRequest, Segment, RoleSubGroup
)

@admin.register(OrganizationLevel)
class OrganizationLevelAdmin(admin.ModelAdmin):
    list_display = ('level_code', 'name', 'rank', 'parent')
    ordering = ('rank',)

@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('name', 'sac', 'vehicle_code', 'level', 'state_name', 'status')
    list_filter = ('level', 'status', 'state_name')
    search_fields = ('name', 'sac', 'vehicle_code')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'office', 'status')
    list_filter = ('office', 'status')

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'department', 'status')
    list_filter = ('department', 'status')

@admin.register(TaskUrl)
class TaskUrlAdmin(admin.ModelAdmin):
    list_display = ('task', 'url_pattern', 'can_view', 'can_create', 'can_edit', 'can_delete')
    list_filter = ('can_view', 'can_create', 'can_edit', 'can_delete')
    search_fields = ('url_pattern', 'task__name')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'job', 'priority', 'status')
    list_filter = ('priority', 'status')

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'role', 'status')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'role_type', 'status')

@admin.register(RoleSubGroup)
class RoleSubGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'role_group', 'status')

@admin.register(RoleType)
class RoleTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'job_family', 'status')

@admin.register(JobFamily)
class JobFamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'prefix', 'code', 'status')

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'office', 'department', 'role')
    search_fields = ('name', 'code')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_code', 'email', 'status')
    search_fields = ('name', 'employee_code', 'email')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'start_date', 'status')

@admin.register(EmployeeTaskUrlPermission)
class EmployeeTaskUrlPermissionAdmin(admin.ModelAdmin):
    list_display = ('employee', 'task_url', 'is_enabled', 'can_view')
    list_filter = ('is_enabled', 'can_view')

@admin.register(LoginHit)
class LoginHitAdmin(admin.ModelAdmin):
    list_display = ('username', 'status', 'ip_address', 'timestamp', 'logout_timestamp')
    list_filter = ('status', 'timestamp', 'logout_timestamp')
    search_fields = ('username', 'ip_address')
    readonly_fields = ('user', 'username', 'ip_address', 'user_agent', 'status', 'timestamp', 'logout_timestamp')

@admin.register(ShiftChangeRequest)
class ShiftChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'position', 'date', 'to_shift', 'request_type', 'status', 'employee_consent')
    list_filter = ('request_type', 'status', 'employee_consent', 'date')
    search_fields = ('employee__name', 'requested_by__name')

@admin.register(Segment)
class SegmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'project', 'created_at')
    list_filter = ('project',)
    search_fields = ('name', 'code')


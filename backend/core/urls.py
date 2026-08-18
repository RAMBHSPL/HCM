from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PositionViewSet, EmployeeViewSet, ProjectViewSet, IndianVillageViewSet,
    OfficeViewSet, FacilityViewSet, FacilityMasterViewSet, FacilityDeploymentModeViewSet, FacilityClassViewSet, FacilitySubClassViewSet, DepartmentViewSet, SectionViewSet, JobFamilyViewSet,
    RoleTypeViewSet, RoleViewSet, JobViewSet, TaskViewSet, TaskUrlViewSet,
    OrganizationLevelViewSet, DocumentTypeViewSet, EmployeeDocumentViewSet,
    PositionLevelViewSet, PositionTypeViewSet, ShiftViewSet,
    EmployeeEducationViewSet, EmployeeExperienceViewSet, EmployeeEmploymentHistoryViewSet,
    EmployeeBankDetailsViewSet, EmployeeEPFODetailsViewSet, EmployeeHealthDetailsViewSet, EmployeeSalaryDetailsViewSet,
    GeoContinentViewSet, GeoCountryViewSet, GeoStateViewSet, GeoDistrictViewSet,
    GeoMandalViewSet, GeoClusterViewSet, VisitingLocationViewSet, LandmarkViewSet,
    PositionLevelViewSet, UserViewSet, LoginAPIView, LogoutAPIView, ChangePasswordView, RequestResetOTPView, ResetPasswordWithOTPView, EmployeeTaskUrlPermissionViewSet, EmployeeDetailsAPIView, APIKeyViewSet, LoginHitViewSet, BlockedEmployeeViewSet, AccountBlockHistoryViewSet, EmployeeArchiveViewSet, PositionAssignmentViewSet, PositionActivityLogViewSet, PositionShiftRosterViewSet, ManagerScreenMappingViewSet,
    GeoBulkUploadView, GeoFullHierarchyView, AuditLogViewSet, VehicleSwapLogViewSet, VehicleSwapRequestViewSet, ShiftChangeRequestViewSet,
    SegmentViewSet, RoleSubGroupViewSet, OfficeTypeViewSet
)
from .dashboard_views import DashboardStatsView

class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = '/?'

router = OptionalSlashRouter()

router.register(r'reactivations', BlockedEmployeeViewSet, basename='blocked-employee')
router.register(r'login-hits', LoginHitViewSet)
router.register(r'account-block-history', AccountBlockHistoryViewSet)
router.register(r'employee-archives', EmployeeArchiveViewSet)
router.register(r'users', UserViewSet)
router.register(r'offices', OfficeViewSet)
router.register(r'facilities', FacilityViewSet)
router.register(r'facility-masters', FacilityMasterViewSet)
router.register(r'facility-deployment-modes', FacilityDeploymentModeViewSet)
router.register(r'facility-classes', FacilityClassViewSet)
router.register(r'facility-sub-classes', FacilitySubClassViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'job-families', JobFamilyViewSet)
router.register(r'role-types', RoleTypeViewSet)
router.register(r'roles', RoleViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'task-urls', TaskUrlViewSet)
router.register(r'positions', PositionViewSet)
router.register(r'position-levels', PositionLevelViewSet)
router.register(r'position-types', PositionTypeViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'position-assignments', PositionAssignmentViewSet)
router.register(r'position-shift-rosters', PositionShiftRosterViewSet)
router.register(r'position-activity-logs', PositionActivityLogViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'segments', SegmentViewSet)
router.register(r'role-sub-groups', RoleSubGroupViewSet)
router.register(r'office-types', OfficeTypeViewSet)
router.register(r'locations', IndianVillageViewSet)
router.register(r'employee-permissions', EmployeeTaskUrlPermissionViewSet)
router.register(r'api-keys', APIKeyViewSet)
router.register(r'manager-screen-mappings', ManagerScreenMappingViewSet, basename='manager-screen-mapping')




router.register(r'organization-levels', OrganizationLevelViewSet)
router.register(r'document-types', DocumentTypeViewSet)
router.register(r'employee-documents', EmployeeDocumentViewSet)
router.register(r'employee-education', EmployeeEducationViewSet)
router.register(r'employee-experience', EmployeeExperienceViewSet)
router.register(r'employee-employment-history', EmployeeEmploymentHistoryViewSet)
router.register(r'employee-bank-details', EmployeeBankDetailsViewSet)
router.register(r'employee-epfo-details', EmployeeEPFODetailsViewSet)
router.register(r'employee-health-details', EmployeeHealthDetailsViewSet)
router.register(r'employee-salary-details', EmployeeSalaryDetailsViewSet)
router.register(r'geo-continents', GeoContinentViewSet)
router.register(r'geo-countries', GeoCountryViewSet)
router.register(r'geo-states', GeoStateViewSet)
router.register(r'geo-districts', GeoDistrictViewSet)
router.register(r'geo-mandals', GeoMandalViewSet)
router.register(r'geo-clusters', GeoClusterViewSet)

router.register(r'visiting-locations', VisitingLocationViewSet)
router.register(r'landmarks', LandmarkViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'vehicle-swaps', VehicleSwapLogViewSet)
router.register(r'vehicle-swap-requests', VehicleSwapRequestViewSet)
router.register(r'shift-change-requests', ShiftChangeRequestViewSet)

urlpatterns = [
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/employee-details/', EmployeeDetailsAPIView.as_view(), name='employee-details-by-auth'),
    path('auth/request-reset-otp/', RequestResetOTPView.as_view(), name='request-reset-otp'),
    path('auth/reset-password-otp/', ResetPasswordWithOTPView.as_view(), name='reset-password-otp'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('geo/bulk-upload/', GeoBulkUploadView.as_view(), name='geo-bulk-upload'),
    path('geo/full-hierarchy/', GeoFullHierarchyView.as_view(), name='geo-full-hierarchy'),
    path('', include(router.urls)),
]

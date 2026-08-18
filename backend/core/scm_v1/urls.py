from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.scm_v1.views import (
    SCMEmployeeViewSet, SCMPositionViewSet, SCMRoleViewSet,
    SCMProjectViewSet, SCMOfficeViewSet, SCMDepartmentViewSet,
    SCMSectionViewSet, SCMPositionLevelViewSet, SCMFacilityViewSet,
    SCMHealthView
)

router = DefaultRouter(trailing_slash=False)
router.register(r'employees', SCMEmployeeViewSet, basename='scm-employee')
router.register(r'positions', SCMPositionViewSet, basename='scm-position')
router.register(r'roles', SCMRoleViewSet, basename='scm-role')
router.register(r'projects', SCMProjectViewSet, basename='scm-project')
router.register(r'offices', SCMOfficeViewSet, basename='scm-office')
router.register(r'departments', SCMDepartmentViewSet, basename='scm-department')
router.register(r'sections', SCMSectionViewSet, basename='scm-section')
router.register(r'position-levels', SCMPositionLevelViewSet, basename='scm-position-level')
router.register(r'facilities', SCMFacilityViewSet, basename='scm-facility')

urlpatterns = [
    path('health', SCMHealthView.as_view(), name='scm-health-no-slash'),
    path('health/', SCMHealthView.as_view(), name='scm-health'),
    path('', include(router.urls)),
]

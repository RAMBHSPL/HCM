from rest_framework import serializers
from core.models import (
    Office, Facility, FacilityMaster, Department, Section, JobFamily, Role, RoleType, Job, Task, TaskUrl, Position, PositionLevel,
    Employee, Project, IndianVillage, OrganizationLevel, EmployeeTaskUrlPermission,
    DocumentType, EmployeeDocument,
    EmployeeEducation, EmployeeExperience, EmployeeEmploymentHistory,
    EmployeeBankDetails, EmployeeEPFODetails, EmployeeHealthDetails, EmployeeSalaryDetails,
    GeoContinent, GeoCountry, GeoState, GeoDistrict, GeoMandal, GeoCluster, VisitingLocation, Landmark, APIKey, APIKeyUsageLog, LoginHit, AccountBlockHistory, EmployeeArchive, PositionAssignment, PositionActivityLog, PositionShiftRoster,
    Segment, RoleSubGroup
)
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    employee_id = serializers.IntegerField(write_only=True, required=False)
    employee_name = serializers.SerializerMethodField()
    employee_profile_id = serializers.SerializerMethodField()
    employee_photo = serializers.SerializerMethodField()
    employee_status = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()
    positions_details = serializers.SerializerMethodField()

    def get_employee_name(self, obj):
        return obj.employee_profile.name if hasattr(obj, 'employee_profile') else None

    def get_employee_profile_id(self, obj):
        return obj.employee_profile.id if hasattr(obj, 'employee_profile') else None

    def get_employee_photo(self, obj):
        if hasattr(obj, 'employee_profile') and obj.employee_profile.photo:
            return obj.employee_profile.photo
        return None
    
    def get_employee_status(self, obj):
        return obj.employee_profile.status if hasattr(obj, 'employee_profile') else None

    def get_is_blocked(self, obj):
        return obj.employee_profile.is_blocked if hasattr(obj, 'employee_profile') else False
    
    def get_positions_details(self, obj):
        try:
            if hasattr(obj, 'employee_profile') and obj.employee_profile:
                positions = obj.employee_profile.positions.all()
                result = []
                for pos in positions:
                    result.append({
                        'id': pos.id,
                        'name': pos.name if pos.name else '',
                        'level': pos.level.id if pos.level else None,
                        'level_name': pos.level.name if pos.level else '',
                        'office_id': pos.office.id if pos.office else None,
                        'office_name': pos.office.name if pos.office else '',
                        'department_id': pos.department.id if pos.department else None,
                        'department_name': pos.department.name if pos.department else '',
                        'rank': pos.level.rank if pos.level else None
                    })
                return result
        except Exception as e:
            print(f"Error serializing positions: {e}")
        return []


    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 
            'password', 'employee_id', 'employee_name', 'employee_profile_id', 
            'employee_photo', 'employee_status', 'is_blocked', 'positions_details'
        ]

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_staff=validated_data.get('is_staff', False),
            is_superuser=validated_data.get('is_superuser', False)
        )
        if employee_id:
            try:
                employee = Employee.objects.get(id=employee_id)
                employee.user = user
                employee.save()
            except Employee.DoesNotExist:
                pass 
        return user

class PositionLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PositionLevel
        fields = '__all__'

    def validate_rank(self, value):
        if value < 0:
            raise serializers.ValidationError("Rank cannot be negative.")
        if value > 15:
            raise serializers.ValidationError("Rank cannot exceed 15.")
        return value

class GeoContinentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoContinent
        fields = '__all__'

class GeoCountrySerializer(serializers.ModelSerializer):
    continent_name = serializers.ReadOnlyField(source='continent_ref.name')
    class Meta:
        model = GeoCountry
        fields = '__all__'


class GeoStateSerializer(serializers.ModelSerializer):
    country_name = serializers.ReadOnlyField(source='country.name', default='No Country')
    continent_id = serializers.ReadOnlyField(source='country.continent_ref.id')
    
    class Meta:
        model = GeoState
        fields = '__all__'


class GeoDistrictSerializer(serializers.ModelSerializer):
    state_name = serializers.ReadOnlyField(source='state.name')
    country_id = serializers.ReadOnlyField(source='state.country.id')
    continent_id = serializers.ReadOnlyField(source='state.country.continent_ref.id')
    
    class Meta:
        model = GeoDistrict
        fields = '__all__'

class GeoMandalSerializer(serializers.ModelSerializer):
    district_name = serializers.ReadOnlyField(source='district.name')
    state_name = serializers.ReadOnlyField(source='district.state.name')
    state_id = serializers.ReadOnlyField(source='district.state.id')
    country_id = serializers.ReadOnlyField(source='district.state.country.id')
    continent_id = serializers.ReadOnlyField(source='district.state.country.continent_ref.id')
    
    class Meta:
        model = GeoMandal
        fields = [
            'id', 'name', 'code', 'district', 'district_name', 'state_name', 
            'state_id', 'country_id', 'continent_id', 'created_at'
        ]



class GeoClusterSerializer(serializers.ModelSerializer):
    mandal_name = serializers.ReadOnlyField(source='mandal.name')
    cluster_type_display = serializers.CharField(source='get_cluster_type_display', read_only=True)
    district_id = serializers.ReadOnlyField(source='mandal.district.id')
    state_id = serializers.ReadOnlyField(source='mandal.district.state.id')
    
    district_name = serializers.ReadOnlyField(source='mandal.district.name')
    state_name = serializers.ReadOnlyField(source='mandal.district.state.name')
    country_id = serializers.ReadOnlyField(source='mandal.district.state.country.id')
    continent_id = serializers.ReadOnlyField(source='mandal.district.state.country.continent_ref.id')

    code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = GeoCluster
        fields = [
            'id', 'name', 'code', 'cluster_type', 'mandal', 'mandal_name', 
            'cluster_type_display', 'district_id', 'state_id', 'level',
            'district_name', 'state_name', 'country_id', 'continent_id'
        ]

    def validate(self, data):
        mandal = data.get('mandal')
        name = data.get('name')
        code = data.get('code')
        
        # Check if name exists in same mandal
        qs = GeoCluster.objects.filter(mandal=mandal, name__iexact=name)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError({"name": f"A cluster with the name '{name}' already exists in this mandal."})
            
        # Validate code: must be exactly 4 alphabetic characters (letters only)
        if code:
            import re
            if code and (len(code) < 3 or len(code) > 5):
                raise serializers.ValidationError({"code": "Cluster code must be between 3 and 5 characters long."})
            
            if code and not code.isalpha():
                raise serializers.ValidationError({"code": "Cluster code must contain letters only."})
            
            qs_code = GeoCluster.objects.filter(code__iexact=code)
            if self.instance:
                qs_code = qs_code.exclude(id=self.instance.id)
            if qs_code.exists():
                raise serializers.ValidationError({"code": f"A cluster with the code '{code}' already exists."})
                
        return data
 
    def create(self, validated_data):
        return GeoCluster.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance



class VisitingLocationSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    cluster = serializers.PrimaryKeyRelatedField(queryset=GeoCluster.objects.all(), required=True)
    mandal_id = serializers.ReadOnlyField(source='cluster.mandal.id')
    district_id = serializers.ReadOnlyField(source='cluster.mandal.district.id')
    state_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.id')
    country_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.country.id')
    continent_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.country.continent_ref.id')
    
    district_name = serializers.ReadOnlyField(source='cluster.mandal.district.name')
    state_name = serializers.ReadOnlyField(source='cluster.mandal.district.state.name')
    mandal_name = serializers.ReadOnlyField(source='cluster.mandal.name')
    cluster_name = serializers.ReadOnlyField(source='cluster.name')
    is_office = serializers.SerializerMethodField()
    office_type = serializers.SerializerMethodField()

    def get_is_office(self, obj):
        return obj.office_ref is not None

    def get_office_type(self, obj):
        if not obj.office_ref: return "OFFICE"
        # If it has a facility master link, it's definitely a facility
        if obj.office_ref.facility_master_id: return "FACILITY"
        if not obj.office_ref.level: return "OFFICE"
        
        level_name = obj.office_ref.level.name.upper()
        if "FACILITY" in level_name or "MOBILE" in level_name or "FACILITATE" in level_name:
            return "FACILITY"
        return "OFFICE"


    class Meta:
        model = VisitingLocation
        fields = [
            'id', 'name', 'cluster', 'cluster_name', 'mandal_name', 'district_name', 'state_name',
            'mandal_id', 'district_id', 'state_id', 'country_id', 'continent_id',
            'latitude', 'longitude', 'contact_person', 'contact_number', 'address', 'created_at',
            'office_ref', 'is_office', 'office_type'
        ]

class LandmarkSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    cluster = serializers.PrimaryKeyRelatedField(queryset=GeoCluster.objects.all(), required=True)
    mandal_id = serializers.ReadOnlyField(source='cluster.mandal.id')
    district_id = serializers.ReadOnlyField(source='cluster.mandal.district.id')
    state_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.id')
    country_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.country.id')
    continent_id = serializers.ReadOnlyField(source='cluster.mandal.district.state.country.continent_ref.id')
    
    district_name = serializers.ReadOnlyField(source='cluster.mandal.district.name')
    state_name = serializers.ReadOnlyField(source='cluster.mandal.district.state.name')
    mandal_name = serializers.ReadOnlyField(source='cluster.mandal.name')
    cluster_name = serializers.ReadOnlyField(source='cluster.name')
    class Meta:
        model = Landmark
        fields = [
            'id', 'name', 'cluster', 'cluster_name', 'mandal_name', 'district_name', 'state_name',
            'mandal_id', 'district_id', 'state_id', 'country_id', 'continent_id',
            'latitude', 'longitude', 'contact_person', 'contact_number', 'address', 'created_at'
        ]

class GeoHierarchySerializer(serializers.ModelSerializer):
    district_name = serializers.ReadOnlyField(source='district.name')
    district_id = serializers.ReadOnlyField(source='district.id')
    state_name = serializers.ReadOnlyField(source='district.state.name')
    state_id = serializers.ReadOnlyField(source='district.state.id')
    clusters = GeoClusterSerializer(many=True, read_only=True)

    class Meta:
        model = GeoMandal
        fields = [
            'id', 'name', 'district_name', 'district_id', 'state_name', 'state_id',
            'clusters'
        ]



# --- Full Hierarchy Serializers ---

class VisitingLocationNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitingLocation
        fields = ['id', 'name', 'latitude', 'longitude', 'address', 'contact_person', 'contact_number']

class LandmarkNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landmark
        fields = ['id', 'name', 'latitude', 'longitude', 'address', 'contact_person', 'contact_number']


class GeoClusterNestedSerializer(serializers.ModelSerializer):
    visiting_locations = VisitingLocationNestedSerializer(many=True, read_only=True)
    landmarks = LandmarkNestedSerializer(many=True, read_only=True)
    cluster_type_display = serializers.CharField(source='get_cluster_type_display', read_only=True)
    class Meta:
        model = GeoCluster
        fields = ['id', 'visiting_locations', 'landmarks', 'name', 'code', 'cluster_type', 'cluster_type_display', 'level']

class GeoMandalNestedSerializer(serializers.ModelSerializer):
    clusters = GeoClusterNestedSerializer(many=True, read_only=True)
    
    class Meta:
        model = GeoMandal
        fields = ['id', 'clusters', 'name', 'code', 'level']



class GeoDistrictNestedSerializer(serializers.ModelSerializer):
    mandals = GeoMandalNestedSerializer(many=True, read_only=True)
    class Meta:
        model = GeoDistrict
        fields = ['id', 'mandals', 'name', 'code', 'level']

class GeoStateNestedSerializer(serializers.ModelSerializer):
    districts = GeoDistrictNestedSerializer(many=True, read_only=True)
    class Meta:
        model = GeoState
        fields = ['id', 'districts', 'name', 'code', 'level']

class GeoCountryNestedSerializer(serializers.ModelSerializer):
    states = GeoStateNestedSerializer(many=True, read_only=True)
    class Meta:
        model = GeoCountry
        fields = ['id', 'states', 'name', 'level']

class GeoContinentNestedSerializer(serializers.ModelSerializer):
    countries = GeoCountryNestedSerializer(many=True, read_only=True)
    class Meta:
        model = GeoContinent
        fields = ['id', 'countries', 'name', 'level']

class OrganizationLevelSerializer(serializers.ModelSerializer):
    rank = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    parent_name = serializers.ReadOnlyField(source='parent.name')

    class Meta:
        model = OrganizationLevel
        fields = '__all__'

    def validate(self, data):
        name = data.get('name')
        level_code = data.get('level_code')
        
        qs = OrganizationLevel.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
            
        if name and qs.filter(name__iexact=name).exists():
            raise serializers.ValidationError({"name": "An Organization Level with this name already exists."})
            
        if level_code and qs.filter(level_code__iexact=level_code).exists():
            raise serializers.ValidationError({"level_code": f"Level code '{level_code}' is already in use by another level."})
            
        rank = data.get('rank')
        if rank is not None:
            if rank < 0:
                raise serializers.ValidationError({"rank": "Rank cannot be negative."})
            if rank > 15:
                raise serializers.ValidationError({"rank": "Rank cannot exceed 15."})
                
        return data

class TaskUrlSerializer(serializers.ModelSerializer):
    task_name = serializers.ReadOnlyField(source='task.name')
    job_name = serializers.ReadOnlyField(source='task.job.name')
    job_id = serializers.ReadOnlyField(source='task.job.id')
    job_family_name = serializers.ReadOnlyField(source='task.job.role.role_type.job_family.name')
    job_family_id = serializers.ReadOnlyField(source='task.job.role.role_type.job_family.id')
    role_type_name = serializers.ReadOnlyField(source='task.job.role.role_type.name')
    role_type_id = serializers.ReadOnlyField(source='task.job.role.role_type.id')
    role_name = serializers.ReadOnlyField(source='task.job.role.name')
    role_id = serializers.ReadOnlyField(source='task.job.role.id')
    
    class Meta:
        model = TaskUrl
        fields = '__all__'

class EmployeeTaskUrlPermissionSerializer(serializers.ModelSerializer):
    task_url_pattern = serializers.ReadOnlyField(source='task_url.url_pattern')
    task_name = serializers.ReadOnlyField(source='task_url.task.name')
    
    class Meta:
        model = EmployeeTaskUrlPermission
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    job_name = serializers.ReadOnlyField(source='job.name')
    job_family_name = serializers.ReadOnlyField(source='job.role.role_type.job_family.name')
    job_family_id = serializers.ReadOnlyField(source='job.role.role_type.job_family.id')
    role_type_name = serializers.ReadOnlyField(source='job.role.role_type.name')
    role_type_id = serializers.ReadOnlyField(source='job.role.role_type.id')
    role_name = serializers.ReadOnlyField(source='job.role.name')
    role_id = serializers.ReadOnlyField(source='job.role.id')
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    urls = TaskUrlSerializer(many=True, read_only=True)
    urls_list = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = Task
        fields = '__all__'

    def create(self, validated_data):
        urls_list = validated_data.pop('urls_list', [])
        task = Task.objects.create(**validated_data)
        self._handle_urls(task, urls_list)
        return task

    def update(self, instance, validated_data):
        urls_list = validated_data.pop('urls_list', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if urls_list is not None:
            instance.urls.all().delete()
            self._handle_urls(instance, urls_list)
        return instance

    def _handle_urls(self, task, urls_list):
        for item in urls_list:
            if isinstance(item, str):
                TaskUrl.objects.create(task=task, url_pattern=item.strip())
            elif isinstance(item, dict):
                pattern = item.get('url_pattern')
                if pattern:
                    TaskUrl.objects.create(
                        task=task,
                        url_pattern=pattern.strip(),
                        can_view=item.get('can_view', True),
                        can_create=item.get('can_create', False),
                        can_edit=item.get('can_edit', False),
                        can_delete=item.get('can_delete', False)
                    )

class JobSerializer(serializers.ModelSerializer):
    role_id = serializers.ReadOnlyField(source='role.id')
    role_name = serializers.ReadOnlyField(source='role.name')
    role_type_name = serializers.ReadOnlyField(source='role.role_type.name')
    role_type_id = serializers.ReadOnlyField(source='role.role_type.id')
    job_family_name = serializers.ReadOnlyField(source='role.role_type.job_family.name')
    job_family_id = serializers.ReadOnlyField(source='role.role_type.job_family.id')
    tasks = TaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = Job
        fields = '__all__'

class RoleTypeSerializer(serializers.ModelSerializer):
    job_family_name = serializers.ReadOnlyField(source='job_family.name')
    
    class Meta:
        model = RoleType
        fields = '__all__'

class SegmentSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.name')
    class Meta:
        model = Segment
        fields = '__all__'
        extra_kwargs = {
            'id': {'read_only': False, 'required': False},
            'project': {'required': False, 'allow_null': True}
        }

    def get_validators(self):
        # Suppress the auto-generated unique_together validator for (project, name).
        # The ProjectSerializer.update() handles segment lifecycle correctly:
        # it deletes stale segments first, then updates or creates the rest.
        # The DB constraint still enforces uniqueness; we just skip the pre-save check
        # which causes false positives when updating existing segments via nested writes.
        return []

class RoleSubGroupSerializer(serializers.ModelSerializer):
    role_group_name = serializers.ReadOnlyField(source='role_group.name')
    class Meta:
        model = RoleSubGroup
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    role_type_id = serializers.ReadOnlyField(source='role_type.id')
    role_type_name = serializers.ReadOnlyField(source='role_type.name')
    job_family_name = serializers.ReadOnlyField(source='role_type.job_family.name')
    job_family_id = serializers.ReadOnlyField(source='role_type.job_family.id')
    jobs = JobSerializer(many=True, read_only=True)
    project_name = serializers.ReadOnlyField(source='project.name')
    segment_name = serializers.ReadOnlyField(source='segment.name')
    sub_groups = RoleSubGroupSerializer(many=True, required=False)
    
    class Meta:
        model = Role
        fields = '__all__'

    def create(self, validated_data):
        sub_groups_data = validated_data.pop('sub_groups', [])
        role = Role.objects.create(**validated_data)
        for sg_data in sub_groups_data:
            RoleSubGroup.objects.create(role_group=role, **sg_data)
        return role

    def update(self, instance, validated_data):
        sub_groups_data = validated_data.pop('sub_groups', None)
        role = super().update(instance, validated_data)
        
        if sub_groups_data is not None:
            # Sync sub groups
            keep_ids = [sg.get('id') for sg in sub_groups_data if sg.get('id')]
            instance.sub_groups.exclude(id__in=keep_ids).delete()
            
            for sg_data in sub_groups_data:
                sg_id = sg_data.get('id')
                if sg_id:
                    sg_data.pop('role_group', None)
                    RoleSubGroup.objects.filter(id=sg_id).update(**sg_data)
                else:
                    RoleSubGroup.objects.create(role_group=role, **sg_data)
        return role

class JobFamilySerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = JobFamily
        fields = '__all__'

class FacilityMasterSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()
    project_code = serializers.SerializerMethodField()
    project_start_date = serializers.SerializerMethodField()
    project_end_date = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        if obj.project and obj.project.is_currently_active:
            return obj.project.name
        return None

    def get_project_code(self, obj):
        if obj.project and obj.project.is_currently_active:
            return obj.project.code
        return None

    def get_project_start_date(self, obj):
        return obj.project.start_date if obj.project else None

    def get_project_end_date(self, obj):
        return obj.project.end_date if obj.project else None
    life_display = serializers.CharField(source='get_life_display', read_only=True)
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    role_details = RoleSerializer(source='roles', many=True, read_only=True)

    class Meta:
        model = FacilityMaster
        fields = '__all__'

class OfficeSerializer(serializers.ModelSerializer):
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.level_code')
    level_display = serializers.ReadOnlyField(source='level.name')
    parent_name = serializers.ReadOnlyField(source='parent.name')
    is_facility = serializers.ReadOnlyField()
    hierarchy_path = serializers.ReadOnlyField()
    cluster_name = serializers.ReadOnlyField(source='cluster.name')
    cluster_type = serializers.ReadOnlyField(source='cluster.get_cluster_type_display')
    assigned_projects = serializers.SerializerMethodField()
    project_ids = serializers.PrimaryKeyRelatedField(source='projects', many=True, read_only=True)
    project_id = serializers.SerializerMethodField()
    project_code = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()

    def _get_projects_cached(self, obj):
        """Share prefetch cache so all 4 project fields use a single DB hit per object."""
        if not hasattr(obj, '_cached_projects'):
            obj._cached_projects = list(obj.projects.all())
        return obj._cached_projects

    def get_project_id(self, obj):
        # 1. Check Facility Master (Direct Template Mapping)
        if obj.facility_master and getattr(obj.facility_master, 'project_id', None):
            return obj.facility_master.project_id
        # 2. Use shared cache (single DB call for this row)
        proj = self._get_projects_cached(obj)
        active_proj = next((p for p in proj if p.is_currently_active), None)
        if active_proj: return active_proj.id
        return proj[0].id if proj else None

    def get_assigned_projects(self, obj):
        proj = self._get_projects_cached(obj)
        return [p.name for p in proj if p.is_currently_active]

    def get_project_code(self, obj):
        proj = self._get_projects_cached(obj)
        active_proj = next((p for p in proj if p.is_currently_active), None)
        return active_proj.code if active_proj else None

    def get_project_name(self, obj):
        proj = self._get_projects_cached(obj)
        active_proj = next((p for p in proj if p.is_currently_active), None)
        return active_proj.name if active_proj else None
    
    facility_master_details = FacilityMasterSerializer(source='facility_master', read_only=True)
    
    # Flattened Facility Fields (for when the Office is actually a Facility)
    facility_type = serializers.SerializerMethodField()
    camp_type = serializers.SerializerMethodField()
    mobile_type = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    has_sub_offices = serializers.SerializerMethodField()

    def get_has_sub_offices(self, obj):
        # Use annotated count if available (set via annotate() in queryset)
        if hasattr(obj, 'sub_offices_count'):
            return obj.sub_offices_count > 0
        return obj.sub_offices.exists()

    def get_facility_type(self, obj):
        return obj.facility.facility_type if hasattr(obj, 'facility') else None

    def get_camp_type(self, obj):
        return obj.facility.camp_type if hasattr(obj, 'facility') else None

    def get_mobile_type(self, obj):
        return obj.facility.mobile_type if hasattr(obj, 'facility') else None
        
    def get_end_date(self, obj):
        return obj.facility.end_date if hasattr(obj, 'facility') else None

    class Meta:
        model = Office
        fields = '__all__'
class LightOfficeSerializer(serializers.ModelSerializer):
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.level_code')
    level_display = serializers.ReadOnlyField(source='level.name')
    parent_id = serializers.PrimaryKeyRelatedField(source='parent', read_only=True)
    project_ids = serializers.PrimaryKeyRelatedField(source='projects', many=True, read_only=True)
    project_id = serializers.SerializerMethodField()
    project_code = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    code = serializers.CharField(source='sac', required=False, allow_null=True)

    def _get_projects_cached(self, obj):
        if not hasattr(obj, '_cached_projects'):
            obj._cached_projects = list(obj.projects.all())
        return obj._cached_projects

    def get_project_id(self, obj):
        if hasattr(obj, 'facility_master') and obj.facility_master and getattr(obj.facility_master, 'project_id', None):
            return obj.facility_master.project_id
        proj = self._get_projects_cached(obj)
        active_proj = next((p for p in proj if p.is_currently_active), None)
        if active_proj: return active_proj.id
        return proj[0].id if proj else None

    def get_project_code(self, obj):
        proj = self._get_projects_cached(obj)
        return proj[0].code if proj else None

    def get_project_name(self, obj):
        proj = self._get_projects_cached(obj)
        return proj[0].name if proj else None

    class Meta:
        model = Office
        fields = [
            'id', 'name', 'code', 'sac', 'vehicle_code', 'vehicle_no', 'parent', 'parent_id', 'level', 'level_name', 'level_code', 
            'level_display', 'status', 'country_name', 'state_name', 'district_name', 'mandal_name',
            'address', 'latitude', 'longitude', 'phone', 'email', 'location', 'facility_master', 'cluster',
            'registered_name', 'din_no', 'register_id', 'status_date', 'start_date', 'project_ids', 'project_id',
            'project_code', 'project_name'
        ]

class FacilitySerializer(serializers.ModelSerializer):
    level_name = serializers.ReadOnlyField(source='level.name')
    level_code = serializers.ReadOnlyField(source='level.level_code')
    level_display = serializers.ReadOnlyField(source='level.name')
    parent_name = serializers.ReadOnlyField(source='parent.name')
    facility_type_display = serializers.CharField(source='get_facility_type_display', read_only=True)
    camp_type_display = serializers.CharField(source='get_camp_type_display', read_only=True)
    mobile_type_display = serializers.CharField(source='get_mobile_type_display', read_only=True)
    location_type_display = serializers.CharField(source='get_location_type_display', read_only=True)
    is_facility = serializers.ReadOnlyField()
    is_temporary = serializers.ReadOnlyField()
    is_active_camp = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    hierarchy_path = serializers.ReadOnlyField()
    
    class Meta:
        model = Facility
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    office_name = serializers.ReadOnlyField(source='department.office.name')
    office_level = serializers.ReadOnlyField(source='department.office.level.name')
    office_level_id = serializers.ReadOnlyField(source='department.office.level.id')
    office_is_facility = serializers.ReadOnlyField(source='department.office.is_facility')
    office = serializers.ReadOnlyField(source='department.office.id')
    project_name = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        if obj.project and obj.project.is_currently_active:
            return obj.project.name
        return None
    
    class Meta:
        model = Section
        fields = [
            'id', 'name', 'code', 'department', 'department_name', 
            'office', 'office_name', 'office_level', 'office_level_id', 
            'office_is_facility', 'project', 'project_name', 
            'description', 'status', 'start_date', 'created_at'
        ]

class DepartmentSerializer(serializers.ModelSerializer):
    office_name = serializers.ReadOnlyField(source='office.name')
    office_level = serializers.ReadOnlyField(source='office.level.name')
    office_level_id = serializers.ReadOnlyField(source='office.level.id')
    office_is_facility = serializers.ReadOnlyField(source='office.is_facility')
    office_state = serializers.ReadOnlyField(source='office.state_name')
    office_district = serializers.ReadOnlyField(source='office.district_name')
    project_name = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        if obj.project and obj.project.is_currently_active:
            return obj.project.name
        return None

    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'

class PositionLevelSerializer(serializers.ModelSerializer):
    office_level_name = serializers.ReadOnlyField(source='office_level.name')
    class Meta:
        model = PositionLevel
        fields = '__all__'

class PositionDetailSerializer(serializers.ModelSerializer):
    """Detailed position serializer with full hierarchy"""
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    reporting_to_names = serializers.StringRelatedField(source='reporting_to', many=True, read_only=True)
    office_level = serializers.ReadOnlyField(source='office.level.name', allow_null=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)
    section_name = serializers.ReadOnlyField(source='section.name', allow_null=True)
    role_name = serializers.ReadOnlyField(source='role.name', allow_null=True)
    job_name = serializers.ReadOnlyField(source='job.name', allow_null=True)
    level_name = serializers.ReadOnlyField(source='level.name', allow_null=True)
    level_rank = serializers.ReadOnlyField(source='level.rank', allow_null=True)
    rank = serializers.ReadOnlyField(source='level.rank', allow_null=True)
    
    office_id = serializers.ReadOnlyField()
    department_id = serializers.ReadOnlyField()
    section_id = serializers.ReadOnlyField()
    role_id = serializers.ReadOnlyField()
    job_id = serializers.ReadOnlyField()

    # Nested lookups require MethodFields to be safe from AttributeErrors
    job_family_name = serializers.SerializerMethodField()
    job_family_id = serializers.SerializerMethodField()
    role_type_id = serializers.SerializerMethodField()
    office_level_id = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    project_id = serializers.SerializerMethodField()
    segment_id = serializers.SerializerMethodField()
    segment_name = serializers.SerializerMethodField()
    position_type_id = serializers.ReadOnlyField(source='position_type.id', allow_null=True)
    position_type_name = serializers.ReadOnlyField(source='position_type.name', allow_null=True)
    role_details = RoleSerializer(source='role', read_only=True)
    job_details = JobSerializer(source='job', read_only=True)

    def get_job_family_id(self, obj):
        try: return obj.role.role_type.job_family.id
        except AttributeError: return None

    def get_role_type_id(self, obj):
        try: return obj.role.role_type.id
        except AttributeError: return None

    def get_job_family_name(self, obj):
        try:
            return obj.role.role_type.job_family.name
        except AttributeError:
            return None

    def get_office_level_id(self, obj):
        if obj.office and obj.office.level:
            return obj.office.level.id
        return None

    def get_project_id(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        elif obj.office:
            project = obj.office.projects.first()
        return project.id if project else None

    def get_segment_id(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.id
        return None

    def get_segment_name(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.name
        return None

    def get_project_name(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        elif obj.office:
            project = obj.office.projects.first()
        
        if project and project.is_currently_active:
            return project.name
        return None
    
    class Meta:
        model = Position
        fields = [
            'id', 'name', 'office_id', 'department_id', 'section_id', 'role_id', 'job_id',
            'office_name', 'reporting_to_names', 'office_level', 'office_level_id',
            'department_name', 'section_name', 'role_name', 'job_name', 'job_family_name',
            'job_family_id', 'role_type_id',
            'role_details', 'job_details', 'project_name', 'reporting_to', 'start_date',
            'level', 'level_name', 'level_rank', 'rank',
            'project_id', 'segment_id', 'segment_name', 'position_type_id', 'position_type_name'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Prune heavy nested fields for API Key requests to prevent over-sharing
        # This ensures "Basic Profile" only includes names/ids, not full Task/URL hierarchies
        from .models import APIKey
        auth = getattr(request, 'auth', None)
        
        if request and isinstance(auth, APIKey):
            ret.pop('role_details', None)
            ret.pop('job_details', None)
            # We keep role_name, job_name, etc. as they are flat fields
            
        return ret


from .models import PositionType, Shift

class ShiftSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.name', allow_null=True)
    segment_name = serializers.ReadOnlyField(source='segment.name', allow_null=True)
    positions_count = serializers.SerializerMethodField()
    position_types_count = serializers.SerializerMethodField()
    assigned_projects = serializers.SerializerMethodField()

    def get_positions_count(self, obj):
        return obj.positions.count()

    def get_position_types_count(self, obj):
        return obj.position_types.count()

    def get_assigned_projects(self, obj):
        projects = set()
        if obj.project:
            projects.add(obj.project.name)
        
        # Get projects from position types using this shift
        pt_projects = obj.position_types.filter(project__isnull=False).values_list('project__name', flat=True)
        projects.update(pt_projects)
        
        # Get projects from positions using this shift (via section or department)
        sec_projects = obj.positions.filter(section__project__isnull=False).values_list('section__project__name', flat=True)
        projects.update(sec_projects)
        
        dep_projects = obj.positions.filter(department__project__isnull=False).values_list('department__project__name', flat=True)
        projects.update(dep_projects)
        
        return list(projects)

    class Meta:
        model = Shift
        fields = '__all__'

class PositionTypeSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.name', allow_null=True)
    segment_name = serializers.ReadOnlyField(source='segment.name', allow_null=True)
    shifts_details = ShiftSerializer(source='shifts', many=True, read_only=True)
    class Meta:
        model = PositionType
        fields = '__all__'

class LightPositionSerializer(serializers.ModelSerializer):
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    level_name = serializers.ReadOnlyField(source='level.name', allow_null=True)
    class Meta:
        model = Position
        fields = ['id', 'name', 'code', 'office_name', 'level_name', 'status']

class PositionSerializer(serializers.ModelSerializer):
    """Simple position serializer for listings"""
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    reporting_to_names = serializers.StringRelatedField(source='reporting_to', many=True, read_only=True)
    office_level = serializers.ReadOnlyField(source='office.level.name', allow_null=True)
    office_hierarchy = serializers.ReadOnlyField(source='office.hierarchy_path', allow_null=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)
    section_name = serializers.ReadOnlyField(source='section.name', allow_null=True)
    role_name = serializers.ReadOnlyField(source='role.name', allow_null=True)
    job_name = serializers.ReadOnlyField(source='job.name', allow_null=True)
    level_name = serializers.ReadOnlyField(source='level.name', allow_null=True)
    level_rank = serializers.ReadOnlyField(source='level.rank', allow_null=True)
    position_type_name = serializers.ReadOnlyField(source='position_type.name', allow_null=True)
    shifts_details = ShiftSerializer(source='shifts', many=True, read_only=True)
    
    # Safe lookups
    job_family_name = serializers.SerializerMethodField()
    job_family_id = serializers.SerializerMethodField()
    role_type_id = serializers.SerializerMethodField()
    office_level_id = serializers.SerializerMethodField()
    
    office_id = serializers.ReadOnlyField()
    department_id = serializers.ReadOnlyField()
    section_id = serializers.ReadOnlyField()
    role_id = serializers.ReadOnlyField()
    job_id = serializers.ReadOnlyField()

    role_sub_group_name = serializers.ReadOnlyField(source='role_sub_group.name', allow_null=True)
    role_sub_group_details = RoleSubGroupSerializer(source='role_sub_group', read_only=True)
    
    project_id = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    segment_id = serializers.SerializerMethodField()
    segment_name = serializers.SerializerMethodField()

    def get_project_id(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        elif obj.office:
            project = obj.office.projects.first()
        return project.id if project else None

    def get_segment_id(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.id
        return None

    def get_segment_name(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.name
        return None

    def get_job_family_name(self, obj):
        try: return obj.role.role_type.job_family.name
        except AttributeError: return None

    def get_job_family_id(self, obj):
        try: return obj.role.role_type.job_family.id
        except AttributeError: return None

    def get_role_type_id(self, obj):
        try: return obj.role.role_type.id
        except AttributeError: return None

    def get_office_level_id(self, obj):
        try: return obj.office.level.id
        except AttributeError: return None
    role_details = RoleSerializer(source='role', read_only=True)
    additional_roles = serializers.PrimaryKeyRelatedField(many=True, queryset=Role.objects.all(), required=False)
    additional_roles_details = RoleSerializer(source='additional_roles', many=True, read_only=True)
    is_vacant = serializers.ReadOnlyField()
    assigned_employee = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        elif obj.office:
            project = obj.office.projects.first()
        return project.name if project else None

    def get_assigned_employee(self, obj):
        emp = obj.employees.first()
        if emp:
            return {
                'id': emp.id,
                'name': emp.name,
                'hire_date': emp.hire_date,
                'status': emp.status
            }
        return None

    assigned_employees_details = serializers.SerializerMethodField()

    def get_assigned_employees_details(self, obj):
        return [
            {
                'id': emp.id,
                'name': emp.name,
                'code': emp.employee_code,
                'status': emp.status
            }
            for emp in obj.employees.all()
        ]

    reporting_to = serializers.PrimaryKeyRelatedField(many=True, queryset=Position.objects.all(), required=False)
    reporting_to_details = LightPositionSerializer(source='reporting_to', many=True, read_only=True)

    class Meta:
        model = Position
        fields = [
            'id', 'name', 'code', 'office', 'department', 'section', 'role', 'additional_roles', 'job',
            'office_id', 'department_id', 'section_id', 'role_id', 'job_id',
            'office_name', 'reporting_to_names', 'reporting_to', 'reporting_to_details', 'office_level', 'office_level_id',
            'office_hierarchy', 'department_name', 'section_name', 'role_name', 
            'job_name', 'job_family_name', 'job_family_id', 'role_type_id', 
            'project_name', 'status', 'created_at', 'start_date', 'role_details', 'additional_roles_details', 'is_vacant', 
            'assigned_employee', 'assigned_employees_details', 'level', 'level_name', 'level_rank',
            'position_type', 'position_type_name', 'shifts', 'shifts_details',
            'role_sub_group', 'role_sub_group_name', 'role_sub_group_details',
            'project_id', 'segment_id', 'segment_name'
        ]


class PositionDropdownSerializer(serializers.ModelSerializer):
    """Lighter version for dropdowns with filtering support"""
    office_level_id = serializers.SerializerMethodField()
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    section_name = serializers.ReadOnlyField(source='section.name', allow_null=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)
    level_id = serializers.IntegerField(source='level.id', allow_null=True, read_only=True)
    role_name = serializers.ReadOnlyField(source='role.name', allow_null=True)
    shifts_details = serializers.SerializerMethodField()
    assigned_employees_details = serializers.SerializerMethodField()

    def get_assigned_employees_details(self, obj):
        return [
            {
                'id': emp.id,
                'name': emp.name,
                'code': emp.employee_code,
                'status': emp.status
            }
            for emp in obj.employees.all()
        ]

    class Meta:
        model = Position
        fields = [
            'id', 'name', 'code', 'status',
            'office_id', 'department_id', 'section_id',
            'office_name', 'department_name', 'section_name', 'office_level_id',
            'level_id', 'role_name', 'shifts_details', 'assigned_employees_details'
        ]

    def get_office_level_id(self, obj):
        try: return obj.office.level.id
        except AttributeError: return None

    def get_shifts_details(self, obj):
        return [
            {
                'id': s.id,
                'name': s.name,
                'start_time': str(s.start_time) if s.start_time else None,
                'end_time': str(s.end_time) if s.end_time else None,
            }
            for s in obj.shifts.all()
        ]

class EmployeeEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEducation
        fields = '__all__'

class EmployeeExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeExperience
        fields = '__all__'

class EmployeeEducationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEducation
        exclude = ['certificate']

class EmployeeExperienceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeExperience
        exclude = ['experience_letter']

class EmployeeDocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        exclude = ['file']

class EmployeeEmploymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEmploymentHistory
        fields = '__all__'

class EmployeeBankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeBankDetails
        fields = '__all__'

class EmployeeEPFODetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEPFODetails
        fields = '__all__'

class EmployeeHealthDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeHealthDetails
        fields = '__all__'

class EmployeeSalaryDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSalaryDetails
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    positions = serializers.PrimaryKeyRelatedField(many=True, queryset=Position.objects.all(), required=False)
    positions_details = PositionDetailSerializer(source='positions', many=True, read_only=True)
    education_records = EmployeeEducationSerializer(many=True, read_only=True)
    experience_records = EmployeeExperienceSerializer(many=True, read_only=True)
    employment_history = EmployeeEmploymentHistorySerializer(many=True, read_only=True)
    bank_details = EmployeeBankDetailsSerializer(read_only=True)
    epfo_details = EmployeeEPFODetailsSerializer(read_only=True)
    health_details = EmployeeHealthDetailsSerializer(read_only=True)
    salary_details = EmployeeSalaryDetailsSerializer(read_only=True)
    url_permissions = EmployeeTaskUrlPermissionSerializer(many=True, read_only=True)
    reporting_to_name = serializers.SerializerMethodField()
    primary_position = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)
    
    pan_number = serializers.CharField(required=False, allow_blank=True)
    aadhaar_number = serializers.CharField(required=False, allow_blank=True)
    project_name = serializers.SerializerMethodField()
    location_details = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        # Get project name from the first position that has an ACTIVE project
        pos = obj.positions.first()
        if not pos: return None
        
        project = None
        if pos.section and pos.section.project:
            project = pos.section.project
        elif pos.department and pos.department.project:
            project = pos.department.project
            
        if project and project.is_currently_active:
            return project.name
        return None

    def get_location_details(self, obj):
        # Get location & vehicle data from the office associated with the first position
        pos = obj.positions.first()
        if not pos or not pos.office:
            return None
        
        office = pos.office
        return {
            "office_name": office.name,
            "country": office.country_name,
            "state": office.state_name,
            "district": office.district_name,
            "mandal": office.mandal_name,
            "cluster": office.cluster.name if office.cluster else None,
            "cluster_type": office.cluster.get_cluster_type_display() if office.cluster else None,
            "specific_location": office.location,
            "sac": office.sac,
            "vehicle_code": office.vehicle_code,
            "vehicle_no": office.vehicle_no
        }

    def get_primary_position(self, obj):
        pos = obj.positions.first()
        return pos.name if pos else None

    def get_reporting_to_name(self, obj):
        # 1. Check direct override
        if obj.reporting_to:
            return obj.reporting_to.name
            
        # 2. Check Hierarchy via Positions
        # Employee -> Position -> Reports To (Position) -> Employee(s)
        pos = obj.positions.first()
        if pos:
            # Check who this position reports to
            boss_pos = pos.reporting_to.first() # Get primary reporting line
            if boss_pos:
                # Find the employee holding that boss position
                # Using 'employees' reverse relation on Position
                boss = boss_pos.employees.filter(status='Active').first()
                if boss:
                    return boss.name
        return None

    reporting_to_details = serializers.SerializerMethodField()

    def get_reporting_to_details(self, obj):
        boss = None
        boss_pos = None
        if obj.reporting_to:
            boss = obj.reporting_to
            boss_pos = boss.positions.first()
        else:
            pos = obj.positions.first()
            if pos:
                boss_pos = pos.reporting_to.first()
                if boss_pos:
                    boss = boss_pos.employees.filter(status='Active').first()
        
        if boss or boss_pos:
            return {
                "id": boss.id if boss else None,
                "name": boss.name if boss else None,
                "employee_code": boss.employee_code if boss else None,
                "email": boss.email if boss else None,
                "position_id": boss_pos.id if boss_pos else None,
                "position_name": boss_pos.name if boss_pos else None,
                "position_code": boss_pos.code if boss_pos else None,
                "role_name": boss_pos.role.name if (boss_pos and boss_pos.role) else None
            }
        return None

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'name', 'employee_code', 'email', 'phone', 'positions', 'reporting_to',
            'hire_date', 'address', 'father_name', 'mother_name', 'personal_email', 'date_of_birth',
            'gender', 'blood_group', 'employment_start_date', 'employment_end_date', 'employment_type',
            'status', 'status_date', 'photo', 'created_at', 'is_blocked', 'primary_position', 'reporting_to_name', 'reporting_to_details',
            'project_name', 'location_details', 'positions_details', 'education_records',
            'experience_records', 'employment_history', 'bank_details', 'epfo_details',
            'health_details', 'salary_details', 'url_permissions', 'user_details',
            'pan_number', 'aadhaar_number'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        try:
            # Safely attempt to access bank_details
            if hasattr(instance, 'bank_details') and instance.bank_details:
                ret['pan_number'] = instance.bank_details.pan_number
                ret['aadhaar_number'] = instance.bank_details.aadhaar_number
            else:
                ret['pan_number'] = ""
                ret['aadhaar_number'] = ""
        except Exception:
            ret['pan_number'] = ""
            ret['aadhaar_number'] = ""
        return ret

    def validate(self, data):
        pan_number = data.get('pan_number')
        aadhaar_number = data.get('aadhaar_number')
        official_email = data.get('email')
        personal_email = data.get('personal_email')
        phone = data.get('phone')
        employee_code = data.get('employee_code')

        # Check for duplicate Employee Code
        if employee_code:
            qs = Employee.objects.filter(employee_code=employee_code)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"employee_code": "This employee code is already in use."})
        
        # Check for duplicate Official Email
        if official_email:
            qs = Employee.objects.filter(email=official_email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"email": "This official email is already assigned to another employee."})

        # Check for duplicate Personal Email
        if personal_email:
            qs = Employee.objects.filter(personal_email=personal_email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"personal_email": "This personal email already exists in our records."})

        # Check for duplicate Phone
        if phone:
            qs = Employee.objects.filter(phone=phone)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"phone": "This phone number already exists."})
        
        # Check for duplicate PAN
        if pan_number:
            qs = EmployeeBankDetails.objects.filter(pan_number=pan_number)
            if self.instance:
                qs = qs.exclude(employee=self.instance)
            if qs.exists():
                raise serializers.ValidationError({"pan_number": "An employee with this PAN number already exists."})
        
        # Check for duplicate Aadhaar
        if aadhaar_number:
            qs = EmployeeBankDetails.objects.filter(aadhaar_number=aadhaar_number)
            if self.instance:
                qs = qs.exclude(employee=self.instance)
            if qs.exists():
                raise serializers.ValidationError({"aadhaar_number": "An employee with this Aadhaar number already exists."})
                
        return data

    def create(self, validated_data):
        pan_number = validated_data.pop('pan_number', None) or None  # Convert '' to None
        aadhaar_number = validated_data.pop('aadhaar_number', None) or None  # Convert '' to None
        
        # Use default create
        employee = super().create(validated_data)
        
        # Create or update Bank Details (only if at least one field has a real value)
        if pan_number or aadhaar_number:
            EmployeeBankDetails.objects.update_or_create(
                employee=employee,
                defaults={
                    'pan_number': pan_number,
                    'aadhaar_number': aadhaar_number,
                }
            )
        return employee

    def update(self, instance, validated_data):
        pan_number = validated_data.pop('pan_number', None)
        if pan_number == '': pan_number = None  # Convert '' to None
        aadhaar_number = validated_data.pop('aadhaar_number', None)
        if aadhaar_number == '': aadhaar_number = None  # Convert '' to None
        
        instance = super().update(instance, validated_data)
        
        if pan_number is not None or aadhaar_number is not None:
             defaults = {}
             if pan_number is not None: defaults['pan_number'] = pan_number
             if aadhaar_number is not None: defaults['aadhaar_number'] = aadhaar_number
             
             EmployeeBankDetails.objects.update_or_create(
                 employee=instance,
                 defaults=defaults
             )
        return instance

class LightEmployeePositionListSerializer(serializers.ModelSerializer):
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)
    level_id = serializers.IntegerField(source='level.id', allow_null=True, read_only=True)
    office_level_id = serializers.IntegerField(source='office.level.id', allow_null=True, read_only=True)
    project_id = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    segment_id = serializers.SerializerMethodField()
    segment_name = serializers.SerializerMethodField()
    position_type_id = serializers.SerializerMethodField()
    position_type_name = serializers.SerializerMethodField()

    def get_position_type_id(self, obj):
        if obj.position_type:
            return obj.position_type.id
        if obj.role and obj.role.role_type:
            return obj.role.role_type.id
        return None

    def get_position_type_name(self, obj):
        if obj.position_type:
            return obj.position_type.name
        if obj.role and obj.role.role_type:
            return obj.role.role_type.name
        return None
    role_id = serializers.IntegerField(source='role.id', allow_null=True, read_only=True)
    role_name = serializers.ReadOnlyField(source='role.name', allow_null=True)
    role_sub_group_id = serializers.IntegerField(source='role_sub_group.id', allow_null=True, read_only=True)
    role_sub_group_name = serializers.ReadOnlyField(source='role_sub_group.name', allow_null=True)

    def get_project_id(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        return project.id if project else None

    def get_project_name(self, obj):
        project = None
        if obj.section and obj.section.project:
            project = obj.section.project
        elif obj.department and obj.department.project:
            project = obj.department.project
        return project.name if project else None

    def get_segment_id(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.id
        return None

    def get_segment_name(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.name
        return None

    class Meta:
        model = Position
        fields = [
            'id', 'name', 'office_id', 'office_name', 'department_id', 'department_name', 
            'section_id', 'level_id', 'office_level_id',
            'project_id', 'project_name', 'segment_id', 'segment_name',
            'position_type_id', 'position_type_name', 'role_id', 'role_name',
            'role_sub_group_id', 'role_sub_group_name'
        ]

class EmployeeListSerializer(EmployeeSerializer):
    """Lighter version of EmployeeSerializer for list views to avoid sending large Base64 photo data"""
    positions_details = LightEmployeePositionListSerializer(source='positions', many=True, read_only=True)
    primary_position = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    location_details = serializers.SerializerMethodField()
    
    def get_primary_position(self, obj):
        pos = obj.positions.first()
        return pos.name if pos else None
        
    def get_project_name(self, obj):
        pos = obj.positions.first()
        if not pos: return None
        if pos.section and pos.section.project: return pos.section.project.name
        if pos.department and pos.department.project: return pos.department.project.name
        return None

    def get_location_details(self, obj):
        pos = obj.positions.first()
        if not pos or not pos.office: return None
        off = pos.office
        return {
            "office_name": off.name,
            "country": off.country_name,
            "state": off.state_name,
            "district": off.district_name,
            "mandal": off.mandal_name,
            "cluster": off.cluster.name if off.cluster else None,
            "cluster_type": off.cluster.get_cluster_type_display() if off.cluster else None,
            "sac": off.sac,
            "vehicle_code": off.vehicle_code,
            "vehicle_no": off.vehicle_no
        }

    class Meta:
        model = Employee
        fields = [
            'id', 'name', 'employee_code', 'email', 'phone', 'personal_email', 'date_of_birth',
            'gender', 'blood_group', 'employment_type', 'status', 'created_at',
            'primary_position', 'reporting_to', 'reporting_to_name', 'reporting_to_details',
            'project_name', 'location_details', 'positions_details'
        ]

    def to_representation(self, instance):
        # Optimized lightweight representation
        request = self.context.get('request')
        from .models import APIKey
        auth = getattr(request, 'auth', None)
        
        if request and auth and isinstance(auth, APIKey):
            perms = getattr(auth, 'data_permissions', {}) or {}
            ret = super().to_representation(instance)
            
            # 1. Identity & Profile
            employee_data = {
                'id': ret.get('id'),
                'name': ret.get('name'),
                'employee_code': ret.get('employee_code'),
                'status': ret.get('status'),
            }
            if perms.get('personal', False):
                bank = getattr(instance, 'bank_details', None)
                employee_data.update({
                    'dob': ret.get('date_of_birth'),
                    'gender': ret.get('gender'),
                    'pan_number': bank.pan_number if bank else '',
                    'aadhaar_number': bank.aadhaar_number if bank else '',
                })
            if perms.get('contact', False):
                employee_data.update({
                    'email': ret.get('email'),
                    'phone': ret.get('phone'),
                    'personal_email': ret.get('personal_email'),
                })
            if perms.get('assignment', True):
                employee_data.update({
                    'primary_position': ret.get('primary_position'),
                    'reporting_to': ret.get('reporting_to'),
                    'reporting_to_name': ret.get('reporting_to_name'),
                    'reporting_to_details': ret.get('reporting_to_details'),
                    'project_name': ret.get('project_name'),
                    'location_details': ret.get('location_details'),
                    'positions_details': ret.get('positions_details'),
                })
            return employee_data

        return super().to_representation(instance)

        request = self.context.get('request')
        
        # Check if authenticated via API Key
        # Handled by custom representation for clear structured output.

        # Use getattr because not all request objects have an 'auth' attribute
        from .models import APIKey
        auth = getattr(request, 'auth', None)
        
        if request and auth and isinstance(auth, APIKey):
            perms = getattr(auth, 'data_permissions', {}) or {}
            
            # 1. Identity & Profile
            employee_data = {
                'id': ret.get('id'),
                'name': ret.get('name'),
                'employee_code': ret.get('employee_code'),
                'photo': ret.get('photo'),
                'status': ret.get('status'),
            }
            if perms.get('personal', False):
                employee_data.update({
                    'dob': ret.get('date_of_birth'),
                    'gender': ret.get('gender'),
                    'pan_number': ret.get('pan_number'),
                    'aadhaar_number': ret.get('aadhaar_number'),
                })
            if perms.get('contact', False):
                employee_data.update({
                    'email': ret.get('email'),
                    'phone': ret.get('phone'),
                })

            # 2. Position & Reporting Structure
            pos = instance.positions.first()
            position_data = None
            if pos:
                # Get reporting positions with employee names
                reporting_to_list = []
                for boss_pos in pos.reporting_to.all():
                    boss_employee = boss_pos.employees.first()  # Get employee in this position
                    reporting_to_list.append({
                        'id': boss_pos.id,
                        'position_name': boss_pos.name,
                        'role_name': boss_pos.role.name if boss_pos.role else None,
                        'level_name': boss_pos.level.name if boss_pos.level else None,
                        'level_rank': boss_pos.level.rank if boss_pos.level else None,
                        'employee_name': boss_employee.name if boss_employee else None,
                        'employee_id': boss_employee.id if boss_employee else None,
                        'employee_status': boss_employee.status if boss_employee else None
                    })
                
                position_data = {
                    'id': pos.id,
                    'name': pos.name,
                    'code': pos.code,
                    'role_name': pos.role.name if pos.role else None,
                    'level_name': pos.level.name if pos.level else None,
                    'level_rank': pos.level.rank if pos.level else None,
                    'department': pos.department.name if pos.department else None,
                    'section': pos.section.name if pos.section else None,
                    'reporting_to': reporting_to_list
                }

            # 3. Project Assignment
            project_data = None
            project = None
            if pos:
                if pos.section and pos.section.project: project = pos.section.project
                elif pos.department and pos.department.project: project = pos.department.project
                elif pos.office and pos.office.facility_master: project = pos.office.facility_master.project
            
            if project:
                project_data = {
                    'id': project.id,
                    'name': project.name,
                    'code': project.code
                }

            # 4. Office & Geo-Location
            office_data = None
            if pos and pos.office:
                off = pos.office
                office_data = {
                    'id': off.id,
                    'name': off.name,
                    'sac': off.sac,
                    'vehicle_code': off.vehicle_code,
                    'level': off.level.name if off.level else None,
                    'parent': off.parent_id,
                    'parent_name': off.parent.name if off.parent else None,
                    'geo_location': {
                        'country': off.country_name,
                        'state': off.state_name,
                        'district': off.district_name,
                        'mandal': off.mandal_name,
                        'cluster': off.cluster.name if off.cluster else None,
                        'cluster_type': off.cluster.get_cluster_type_display() if off.cluster else None,
                        'specific_location': off.location,
                        'address': off.address
                    }
                }
                if hasattr(off, 'facility') and off.facility:
                    geo_loc = office_data.get('geo_location', {}) or {}
                    office_data['geo_location'] = {
                        **geo_loc,
                        'coordinates': {
                            'lat': float(off.facility.latitude) if off.facility.latitude else None,
                            'lng': float(off.facility.longitude) if off.facility.longitude else None
                        }
                    }

            # 4.5. Current Shift Details (for today or requested date)
            from django.utils import timezone
            from core.models import PositionShiftRoster
            import datetime

            target_date = timezone.localdate()
            if request and hasattr(request, 'query_params'):
                date_param = request.query_params.get('date')
                if date_param:
                    try:
                        target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
                    except ValueError:
                        pass

            current_shift_data = None
            if pos:
                try:
                    roster = PositionShiftRoster.objects.filter(
                        position=pos,
                        employee=instance,
                        date=target_date
                    ).select_related('shift').first()
                    if roster and roster.shift:
                        current_shift_data = {
                            'id': roster.shift.id,
                            'name': roster.shift.name,
                            'start_time': str(roster.shift.start_time) if roster.shift.start_time else None,
                            'end_time': str(roster.shift.end_time) if roster.shift.end_time else None,
                            'date': str(roster.date)
                        }
                except Exception as e:
                    print("Error getting current shift in serializer:", e)

            # 5. Final Assembly of "Neat" Response
            neat_ret = {
                'employee': employee_data,
                'position': position_data,
                'project': project_data,
                'office': office_data,
                'bank_details': None,  # Always present; populated below if permitted
                'current_shift': current_shift_data
            }

            # 6. Specialized Data Scopes (Split Financials)
            if perms.get('bank', False):
                # Read directly from the instance to avoid stale serialized data
                try:
                    bd = instance.bank_details  # OneToOne reverse relation
                    bank_data = EmployeeBankDetailsSerializer(instance=bd).data
                    bank_data.pop('pan_number', None)   # PAN is in personal scope, not bank
                    bank_data.pop('aadhaar_number', None)  # Aadhaar is in personal scope
                    neat_ret['bank_details'] = bank_data
                except Exception:
                    neat_ret['bank_details'] = None

            if perms.get('financial', False):
                neat_ret['salary_details'] = ret.get('salary_details')

            if perms.get('epfo', False):
                neat_ret['epfo_details'] = ret.get('epfo_details')
            
            if perms.get('history', False):
                neat_ret['professional_history'] = {
                    'education': ret.get('education_records'),
                    'experience': ret.get('experience_records'),
                    'history': ret.get('employment_history'),
                    'health': ret.get('health_details')
                }

            return neat_ret
            
        return ret


class LightEmployeePositionSerializer(serializers.ModelSerializer):
    """Position serializer with all fields required for WorkforceTracker filtering & grouping."""
    office_name = serializers.ReadOnlyField(source='office.name', allow_null=True)
    office_level_id = serializers.IntegerField(source='office.level.id', allow_null=True, read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name', allow_null=True)
    department_id = serializers.ReadOnlyField()
    section_id = serializers.ReadOnlyField()
    role_id = serializers.ReadOnlyField()
    role_name = serializers.ReadOnlyField(source='role.name', allow_null=True)
    role_sub_group_id = serializers.ReadOnlyField()
    role_sub_group_name = serializers.ReadOnlyField(source='role_sub_group.name', allow_null=True)
    position_type_id = serializers.ReadOnlyField()
    position_type_name = serializers.ReadOnlyField(source='position_type.name', allow_null=True)

    project_id = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    segment_id = serializers.SerializerMethodField()
    segment_name = serializers.SerializerMethodField()

    def get_project_id(self, obj):
        # section.project → department.project (office.projects avoided — N+1 on M2M)
        if obj.section_id and obj.section and obj.section.project_id:
            return obj.section.project_id
        if obj.department_id and obj.department and obj.department.project_id:
            return obj.department.project_id
        return None

    def get_project_name(self, obj):
        if obj.section_id and obj.section and obj.section.project:
            return obj.section.project.name
        if obj.department_id and obj.department and obj.department.project:
            return obj.department.project.name
        return None

    def get_segment_id(self, obj):
        if obj.role and obj.role.segment_id:
            return obj.role.segment_id
        return None

    def get_segment_name(self, obj):
        if obj.role and obj.role.segment:
            return obj.role.segment.name
        return None

    class Meta:
        model = Position
        fields = [
            'id', 'name', 'office_id', 'office_name', 'office_level_id',
            'department_id', 'department_name', 'section_id',
            'level', 'position_type_id', 'position_type_name',
            'role_id', 'role_name',
            'role_sub_group_id', 'role_sub_group_name',
            'project_id', 'project_name',
            'segment_id', 'segment_name',
        ]


class EmployeeDropdownSerializer(serializers.ModelSerializer):
    """Serializer for WorkforceTracker — includes full position context for filtering."""
    positions_details = LightEmployeePositionSerializer(source='positions', many=True, read_only=True)
    photo = serializers.ImageField(use_url=True, read_only=True, allow_null=True)

    class Meta:
        model = Employee
        fields = ['id', 'name', 'employee_code', 'email', 'phone', 'status', 'photo', 'positions_details']






class CompactOfficeSerializer(serializers.ModelSerializer):
    """Lighter office serializer for list/summary views (Projects, Org Chart)"""
    code = serializers.CharField(source='sac', required=False, allow_null=True)
    class Meta:
        model = Office
        fields = ['id', 'name', 'code', 'sac', 'vehicle_code', 'status']

class ProjectSerializer(serializers.ModelSerializer):
    assigned_offices_details = CompactOfficeSerializer(source='assigned_offices', many=True, read_only=True)
    assigned_level_name = serializers.ReadOnlyField(source='assigned_level.name')
    cluster_name = serializers.ReadOnlyField(source='cluster.name')
    cluster_type = serializers.ReadOnlyField(source='cluster.get_cluster_type_display')
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    segments = SegmentSerializer(many=True, required=False)
    
    class Meta:
        model = Project
        fields = '__all__'

    def create(self, validated_data):
        segments_data = validated_data.pop('segments', [])
        assigned_offices_data = validated_data.pop('assigned_offices', [])
        
        project = Project.objects.create(**validated_data)
        
        if assigned_offices_data:
            project.assigned_offices.set(assigned_offices_data)
            
        for segment_data in segments_data:
            Segment.objects.create(project=project, **segment_data)
        return project

    def update(self, instance, validated_data):
        segments_data = validated_data.pop('segments', None)
        assigned_offices_data = validated_data.pop('assigned_offices', None)
        
        # Standard update (ignoring m2m fields like assigned_offices if overridden)
        project = super().update(instance, validated_data)
        
        if assigned_offices_data is not None:
            project.assigned_offices.set(assigned_offices_data)
            
        if segments_data is not None:
            # Sync segments
            keep_segment_ids = [s.get('id') for s in segments_data if s.get('id')]
            instance.segments.exclude(id__in=keep_segment_ids).delete()
            
            for segment_data in segments_data:
                segment_id = segment_data.get('id')
                if segment_id:
                    # Update segment, excluding project since it's already linked
                    segment_data.pop('project', None)
                    Segment.objects.filter(id=segment_id).update(**segment_data)
                else:
                    # Create
                    Segment.objects.create(project=project, **segment_data)
                    
        return project

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # 1. Handle implicitly linked offices via Facility Master
        from core.models import Office
        # Use a more efficient query to get both IDs AND basic info to avoid double serialization
        implicit_offices = Office.objects.filter(facility_master__project=instance).only('id', 'name', 'sac', 'vehicle_code', 'status')
        
        # 2. Get existing (explicit) ids
        current_ids = set(ret.get('assigned_offices', []))
        current_details = ret.get('assigned_offices_details', [])
        
        # Track which IDs we already have in the list to avoid duplicates
        existing_detail_ids = {d['id'] for d in current_details}
        
        # 3. Add implicit ones to both IDs list and Details list
        for office in implicit_offices:
            current_ids.add(office.id)
            if office.id not in existing_detail_ids:
                current_details.append({
                    'id': office.id,
                    'name': office.name,
                    'code': office.sac,
                    'sac': office.sac,
                    'vehicle_code': office.vehicle_code,
                    'status': office.status
                })
            
        ret['assigned_offices'] = list(current_ids)
        ret['assigned_offices_details'] = current_details
        return ret

class IndianVillageSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndianVillage
        fields = '__all__'











class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = '__all__'

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    document_type_name = serializers.ReadOnlyField(source='document_type.name')
    employee_name = serializers.ReadOnlyField(source='employee.name')
    
    class Meta:
        model = EmployeeDocument
        fields = '__all__'

class APIKeySerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    key_preview = serializers.SerializerMethodField()
    valid_until = serializers.DateField(allow_null=True, required=False)
    
    class Meta:
        model = APIKey
        fields = '__all__'
        read_only_fields = ('key', 'user', 'created_at', 'last_used', 'usage_count')
    
    def to_internal_value(self, data):
        # Strip time from valid_until if present
        valid_until = data.get('valid_until')
        if valid_until and isinstance(valid_until, str) and ' ' in valid_until:
             data['valid_until'] = valid_until.split(' ')[0]
        elif valid_until and isinstance(valid_until, str) and 'T' in valid_until:
             data['valid_until'] = valid_until.split('T')[0]
             
        # Use None for empty strings to satisfy DateField
        if valid_until == '':
            data['valid_until'] = None
            
        return super().to_internal_value(data)
    
    def get_key_preview(self, obj):
        if obj.key and len(obj.key) > 4:
            return f"***{obj.key[-4:]}"
        return "****"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        # Hide key in list view (no PK in kwargs) for GET requests
        if request and request.method == 'GET' and not (request.parser_context and request.parser_context.get('kwargs', {}).get('pk')):
            ret['key'] = None 
        return ret

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)

class LoginHitSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHit
        fields = '__all__'

class AccountBlockHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_code')
    performed_by_username = serializers.ReadOnlyField(source='reactivated_by.username')
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AccountBlockHistory
        fields = '__all__'

class EmployeeArchiveSerializer(serializers.ModelSerializer):
    deleted_by_username = serializers.ReadOnlyField(source='deleted_by.username')
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()
    
    def get_employee_name(self, obj):
        if isinstance(obj.employee_data, dict):
            return obj.employee_data.get('name', 'Unknown')
        return 'Unknown'
    
    def get_employee_code(self, obj):
        if isinstance(obj.employee_data, dict):
            return obj.employee_data.get('employee_code', 'N/A')
        return 'N/A'
    
    class Meta:
        model = EmployeeArchive
        fields = '__all__'

class PositionAssignmentSerializer(serializers.ModelSerializer):
    assignor_name = serializers.ReadOnlyField(source='assignor.name')
    assignee_name = serializers.ReadOnlyField(source='assignee.name')
    position_name = serializers.ReadOnlyField(source='position.name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignment_type_display = serializers.CharField(source='get_assignment_type_display', read_only=True)
    
    assignor_reporting_head_id = serializers.ReadOnlyField(source='assignor.reporting_to.id')
    approver_ids = serializers.SerializerMethodField()

    def get_approver_ids(self, obj):
        approvers = set()
        # 1. Administrative Boss (Direct reporting on Employee profile)
        if obj.assignor.reporting_to_id:
            approvers.add(obj.assignor.reporting_to_id)
        
        # 2. Functional Bosses (Reporting based on Positions)
        # Check all positions held by the assignor
        for pos in obj.assignor.positions.all():
            # Get the parent positions for each position
            for parent_pos in pos.reporting_to.all():
                # Get all employees currently holding those parent positions
                for boss in parent_pos.employees.all():
                    approvers.add(boss.id)
        
        return list(approvers)
    
    def to_representation(self, instance):
        """Override to include employee status in nested employee data"""
        representation = super().to_representation(instance)
        
        # Add status to employee data if it exists
        if 'employee' in representation and instance.assignee:
            if isinstance(representation['employee'], dict):
                representation['employee']['status'] = instance.assignee.status
        
        return representation
    
    class Meta:
        model = PositionAssignment
        fields = '__all__'
        read_only_fields = ['assignor']

class PositionShiftRosterSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_code')
    position_name = serializers.ReadOnlyField(source='position.name')
    position_code = serializers.ReadOnlyField(source='position.code')
    shift_name = serializers.ReadOnlyField(source='shift.name')
    shift_start_time = serializers.ReadOnlyField(source='shift.start_time')
    shift_end_time = serializers.ReadOnlyField(source='shift.end_time')

    class Meta:
        model = PositionShiftRoster
        fields = '__all__'

    def validate(self, data):
        employee = data.get('employee')
        position = data.get('position')
        shift = data.get('shift')
        date = data.get('date')

        # 1. Exclusivity check (check if the same employee is already assigned to this position, shift, and date)
        existing = PositionShiftRoster.objects.filter(
            position=position,
            shift=shift,
            date=date,
            employee=employee
        )
        if self.instance:
            existing = existing.exclude(id=self.instance.id)
        if existing.exists():
            raise serializers.ValidationError({
                "shift": f"The employee '{employee.name}' is already assigned to this shift for this position on {date}."
            })

        # 2. Time overlap check for this employee on this date
        same_day_rosters = PositionShiftRoster.objects.filter(
            employee=employee,
            date=date
        )
        if self.instance:
            same_day_rosters = same_day_rosters.exclude(id=self.instance.id)

        for roster in same_day_rosters:
            other_shift = roster.shift
            if other_shift.start_time and other_shift.end_time and shift.start_time and shift.end_time:
                if (shift.start_time < other_shift.end_time) and (shift.end_time > other_shift.start_time):
                    raise serializers.ValidationError({
                        "non_field_errors": f"Time conflict: Employee '{employee.name}' is already assigned to shift '{other_shift.name}' ({other_shift.start_time}-{other_shift.end_time}) which overlaps with '{shift.name}' on {date}."
                    })

        return data

class PositionActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    assignment_details = serializers.CharField(source='assignment.__str__', read_only=True)
    
    class Meta:
        model = PositionActivityLog
        fields = '__all__'

class APIKeyUsageLogSerializer(serializers.ModelSerializer):
    api_key_name = serializers.ReadOnlyField(source='api_key.name')
    
    class Meta:
        model = APIKeyUsageLog
        fields = '__all__'

from core.models import AuditLog
class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        
    def get_username(self, obj):
        if obj.user:
            return obj.user.username
        return 'System'

from core.models import VehicleSwapLog, VehicleSwapRequest, ShiftChangeRequest
class VehicleSwapLogSerializer(serializers.ModelSerializer):
    office_a_name = serializers.ReadOnlyField(source='office_a.name')
    office_b_name = serializers.ReadOnlyField(source='office_b.name')

    class Meta:
        model = VehicleSwapLog
        fields = '__all__'


class VehicleSwapRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.ReadOnlyField(source='requester.name')
    from_office_name = serializers.ReadOnlyField(source='from_office.name')
    from_office_sac = serializers.ReadOnlyField(source='from_office.sac')
    to_office_name = serializers.ReadOnlyField(source='to_office.name')
    to_office_sac = serializers.ReadOnlyField(source='to_office.sac')
    actioned_by_username = serializers.ReadOnlyField(source='actioned_by.username')

    class Meta:
        model = VehicleSwapRequest
        fields = '__all__'
        read_only_fields = ['requester', 'from_vehicle_code', 'from_vehicle_no', 'to_vehicle_code', 'to_vehicle_no', 'status', 'actioned_by', 'actioned_at']


class ShiftChangeRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.ReadOnlyField(source='requested_by.name')
    employee_name = serializers.ReadOnlyField(source='employee.name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_code')
    position_name = serializers.ReadOnlyField(source='position.name')
    from_shift_name = serializers.ReadOnlyField(source='from_shift.name')
    to_shift_name = serializers.ReadOnlyField(source='to_shift.name')

    class Meta:
        model = ShiftChangeRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'status', 'employee_consent', 'created_at', 'updated_at']


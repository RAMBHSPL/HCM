from django.db import models
from django.utils import timezone
import uuid
import re
from decimal import Decimal
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

def generate_short_code(name, model_class, length=4):
    if not name:
        return ""
    # Process name: keep only letters (no digits for alpha-only codes)
    clean_name = re.sub(r'[^a-zA-Z]', '', name).upper()
    
    # Take first `length` letters as base
    base_code = clean_name[:length]
    if len(base_code) < length:
        base_code = base_code.ljust(length, 'A')  # Pad with 'A' if too short

    # Check for uniqueness using letter suffixes
    code = base_code
    counter = 0
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    
    while model_class.objects.filter(code=code).exists() and counter < 100:
        # Replace last char with a letter suffix (A, B, C...)
        suffix = alphabet[counter % 26]
        code = base_code[:length-1] + suffix
        counter += 1
        
    return code

class OrganizationLevel(models.Model):
    name = models.CharField(max_length=100, unique=True)
    level_code = models.CharField(max_length=10, blank=True, help_text="e.g., L1, L2")
    rank = models.DecimalField(max_digits=5, decimal_places=2, help_text="Order of importance (e.g., 1.0, 3.1)")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_levels')
    description = models.TextField(blank=True)
    code_suffix_length = models.IntegerField(default=2, help_text="Length of the code suffix for this level (e.g., 2 for 01, 3 for 001)")
    created_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(default=timezone.now, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.pk and not self.parent: 
            existing_at_rank = OrganizationLevel.objects.filter(rank__gte=self.rank).order_by('-rank')
            for level in existing_at_rank:
                if int(level.rank) == int(self.rank):
                    level.rank += Decimal('1.00')
                    level.save(update_fields=['rank'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.level_code} - {self.name}"

    class Meta:
        ordering = ['rank']

FACILITY_TYPE_CHOICES = [
    ('PERMANENT', 'Permanent'),
    ('MOBILE', 'Mobile'),
    ('CAMP', 'Camp'),
]

CAMP_TYPE_CHOICES = [
    ('MOBILE', 'Mobile Camp (Movable)'),
    ('NON_MOBILE', 'Non-Mobile Camp (Fixed Location)'),
]

MOBILE_TYPE_CHOICES = [
    ('EMERGENCY', 'Emergency'),
    ('NON_EMERGENCY', 'Non-Emergency'),
]

class FacilityMaster(models.Model):
    LIFE_CHOICES = [('PERMANENT', 'Permanent'), ('TEMPORARY', 'Temporary')]
    MODE_CHOICES = [('FIXED', 'Fixed'), ('MOBILE', 'Mobile')]
    TYPE_CHOICES = [('SINGLE', 'Single Location'), ('MULTIPLE', 'Multiple Location')]
    name = models.CharField(max_length=100, unique=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='facility_masters')
    project_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SINGLE')
    location_code = models.CharField(max_length=255, blank=True)
    life = models.CharField(max_length=20, choices=LIFE_CHOICES, default='PERMANENT')
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='FIXED')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    roles = models.ManyToManyField('Role', blank=True, related_name='facility_masters')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Sync project type from parent project
        if self.project:
            self.project_type = self.project.project_type

        if not self.location_code:
            # Find the highest existing numeric location code with LOC- prefix
            last_fm = FacilityMaster.objects.filter(location_code__regex=r'^LOC-\d+$').order_by('-location_code').first()
            if last_fm:
                number_match = re.search(r'\d+', last_fm.location_code)
                new_number = int(number_match.group()) + 1 if number_match else 1
            else:
                new_number = 1
            self.location_code = f"LOC-{new_number:05d}"
        super().save(*args, **kwargs)
    def __str__(self): return self.name

class Office(models.Model):
    registered_name = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, unique=True)
    sac = models.CharField(max_length=50, unique=True, blank=True, null=True)
    vehicle_code = models.CharField(max_length=50, blank=True, null=True)
    vehicle_no = models.CharField(max_length=50, blank=True, null=True)
    level = models.ForeignKey(OrganizationLevel, on_delete=models.SET_NULL, related_name='offices', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_offices')
    facility_master = models.ForeignKey(FacilityMaster, on_delete=models.SET_NULL, null=True, blank=True, related_name='offices')
    register_id = models.CharField(max_length=100, blank=True, null=True)
    din_no = models.CharField(max_length=100, blank=True, null=True)
    country_name = models.CharField(max_length=100, default='India')
    state_name = models.CharField(max_length=100, blank=True)
    district_name = models.CharField(max_length=100, blank=True)
    mandal_name = models.CharField(max_length=100, blank=True)
    cluster = models.ForeignKey('GeoCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='offices')
    location = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    status = models.CharField(max_length=20, default='Active')
    status_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=9, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, blank=True, null=True)
    class Meta:
        ordering = ['name']

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.name} ({self.level.name if self.level else 'N/A'})"
    def save(self, *args, **kwargs):
        # Sync geo names from cluster if available
        if self.cluster:
            cluster = self.cluster
            if cluster.mandal:
                if not self.mandal_name:
                    self.mandal_name = cluster.mandal.name
                if cluster.mandal.district:
                    if not self.district_name:
                        self.district_name = cluster.mandal.district.name
                    if cluster.mandal.district.state:
                        if not self.state_name:
                            self.state_name = cluster.mandal.district.state.name
                            
        super().save(*args, **kwargs)
        if hasattr(Office, '_hierarchy_cache'):
            delattr(Office, '_hierarchy_cache')
        if self.facility_master and self.facility_master.project:
            self.facility_master.project.assigned_offices.add(self)
    @property
    def hierarchy_path(self):
        if not hasattr(Office, '_hierarchy_cache'):
            # Fetch all offices in a single query to build parent-child map in-memory
            all_offices = {o.id: o for o in Office.objects.select_related('level').all()}
            Office._hierarchy_cache = all_offices
        
        cached_offices = getattr(Office, '_hierarchy_cache', {})
        level_name = self.level.name if self.level else "N/A"
        path = [f"{self.name} ({level_name})"]
        
        curr_id = self.parent_id
        while curr_id:
            cached_curr = cached_offices.get(curr_id)
            if cached_curr:
                curr_level = cached_curr.level.name if cached_curr.level else "N/A"
                path.insert(0, f"{cached_curr.name} ({curr_level})")
                curr_id = cached_curr.parent_id
            else:
                # Fallback to DB if not found in cache (should not happen since we load all)
                try:
                    curr = Office.objects.get(id=curr_id)
                    curr_level = curr.level.name if curr.level else "N/A"
                    path.insert(0, f"{curr.name} ({curr_level})")
                    curr_id = curr.parent_id
                except Office.DoesNotExist:
                    break
        return " > ".join(path)
    @property
    def is_facility(self): return self.level.name.upper() == 'FACILITY' if self.level else False

class Facility(Office):
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPE_CHOICES, blank=True, null=True)
    camp_type = models.CharField(max_length=20, choices=CAMP_TYPE_CHOICES, blank=True, null=True)
    mobile_type = models.CharField(max_length=20, choices=MOBILE_TYPE_CHOICES, blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    class Meta:
        verbose_name = "Facility"
        verbose_name_plural = "Facilities"
        ordering = ['name']

    @property
    def is_temporary(self): return self.facility_type in ['MOBILE', 'CAMP']
    @property
    def is_active_camp(self):
        if not self.is_temporary or not self.start_date or not self.end_date: return False
        return self.start_date <= timezone.now().date() <= self.end_date
    @property
    def days_remaining(self):
        if not self.is_temporary or not self.end_date: return None
        delta = self.end_date - timezone.now().date()
        return max(0, delta.days) if delta.days >= 0 else 0

class IndianVillage(models.Model):
    state = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, db_index=True)
    mandal = models.CharField(max_length=100, db_index=True)
    village = models.CharField(max_length=100, db_index=True)
    class Meta:
        unique_together = ('state', 'district', 'mandal', 'village')
        ordering = ['state', 'district', 'mandal', 'village']

class GeoContinent(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, blank=True)
    level = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        super().save(*args, **kwargs)
    class Meta: verbose_name_plural = "Geo Continents"

class GeoCountry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, blank=True)
    continent_ref = models.ForeignKey(GeoContinent, on_delete=models.SET_NULL, null=True, blank=True, related_name='countries')
    continent = models.CharField(max_length=50, blank=True)
    level = models.IntegerField(default=2)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        if self.continent_ref: self.continent = self.continent_ref.name
        super().save(*args, **kwargs)

class GeoState(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, blank=True)
    country = models.ForeignKey(GeoCountry, on_delete=models.CASCADE, related_name='states', null=True)
    country_name = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(default=3)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        if self.country: self.country_name = self.country.name
        super().save(*args, **kwargs)

class GeoDistrict(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, blank=True)
    state = models.ForeignKey(GeoState, on_delete=models.CASCADE, related_name='districts')
    state_name = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(default=4)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        if self.state: self.state_name = self.state.name
        super().save(*args, **kwargs)

class GeoMandal(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, blank=True)
    district = models.ForeignKey(GeoDistrict, on_delete=models.CASCADE, related_name='mandals', null=True)
    district_name = models.CharField(max_length=100, blank=True)
    state_name = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(default=5)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        if self.district:
            self.district_name = self.district.name
            if self.district.state: self.state_name = self.district.state.name
        super().save(*args, **kwargs)

    class Meta:
        unique_together = [('name', 'district')]

class GeoCluster(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, blank=True)
    mandal = models.ForeignKey(GeoMandal, on_delete=models.CASCADE, related_name='clusters')
    cluster_type = models.CharField(max_length=20, choices=[
        ('METROPOLITAN', 'Metropolitan'),
        ('CITY', 'City'),
        ('TOWN', 'Town'),
        ('VILLAGE', 'Village')
    ], default='VILLAGE')
    level = models.IntegerField(default=6)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        if self.code: self.code = self.code.upper()
        super().save(*args, **kwargs)

    # Meta constraints moved to serializer validation for better error messages



class VisitingLocation(models.Model):
    name = models.CharField(max_length=255)
    cluster = models.ForeignKey(GeoCluster, on_delete=models.SET_NULL, null=True, blank=True, related_name='visiting_locations')
    latitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    office_ref = models.ForeignKey('Office', on_delete=models.CASCADE, null=True, blank=True, related_name='visiting_locations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        super().save(*args, **kwargs)

class Landmark(models.Model):
    name = models.CharField(max_length=255)
    cluster = models.ForeignKey(GeoCluster, on_delete=models.SET_NULL, null=True, blank=True, related_name='landmarks')
    latitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.name: self.name = self.name.upper()
        super().save(*args, **kwargs)

class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE, related_name='departments')
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='departments')
    description = models.TextField(blank=True)
    applicable_at_level = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['office__level', 'name']
        unique_together = ('office', 'name')
    def __str__(self): return self.name

class Section(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='sections')
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='sections')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['department', 'name']
        unique_together = ('department', 'name')
    def __str__(self): return self.name

class JobFamily(models.Model):
    name = models.CharField(max_length=255)
    prefix = models.CharField(max_length=10, unique=True, blank=True, null=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: verbose_name_plural = "Job Families"
    def __str__(self): return self.name

class RoleType(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    job_family = models.ForeignKey(JobFamily, on_delete=models.CASCADE, related_name='role_types')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    class Meta:
        ordering = ['name']
        unique_together = ('job_family', 'code')

    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Role(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    role_type = models.ForeignKey(RoleType, on_delete=models.CASCADE, related_name='roles', null=True, blank=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='role_groups', null=True, blank=True)
    segment = models.ForeignKey('Segment', on_delete=models.CASCADE, null=True, blank=True, related_name='role_groups')
    facility_type = models.CharField(max_length=50, choices=FACILITY_TYPE_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('project', 'segment', 'name')
        ordering = ['name']

    def __str__(self): return self.name

class RoleSubGroup(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    role_group = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='sub_groups')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('role_group', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.role_group.name} - {self.name}"

class Job(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='jobs')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('role', 'code')
        ordering = ['name']

    def __str__(self): return self.name

class Task(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='tasks')
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=[('HIGH', 'High'), ('MEDIUM', 'Medium'), ('LOW', 'Low')], default='MEDIUM')
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
            unique_together = ('job', 'code')
            ordering = ['name']

    def __str__(self): return self.name

class TaskUrl(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='urls')
    url_pattern = models.CharField(max_length=255)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: unique_together = ['task', 'url_pattern']

class PositionLevel(models.Model):
    name = models.CharField(max_length=100, unique=True)
    rank = models.IntegerField(default=1, help_text="Position rank (e.g., 1 for Senior-most)")
    office_level = models.ForeignKey(OrganizationLevel, on_delete=models.SET_NULL, null=True, blank=True, related_name='position_ranks')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['rank']

    def __str__(self):
        return f"{self.name} (Rank: {self.rank})"

class PositionType(models.Model):
    name = models.CharField(max_length=100)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='position_types', null=True, blank=True)
    segment = models.ForeignKey('Segment', on_delete=models.CASCADE, null=True, blank=True, related_name='position_types')
    shifts = models.ManyToManyField('Shift', blank=True, related_name='position_types')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'segment', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name

class Shift(models.Model):
    name = models.CharField(max_length=50)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='shifts')
    segment = models.ForeignKey('Segment', on_delete=models.SET_NULL, null=True, blank=True, related_name='shifts')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Position(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE, related_name='positions', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='positions', null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='positions', null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='positions')
    role_sub_group = models.ForeignKey(RoleSubGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='positions')
    additional_roles = models.ManyToManyField(Role, blank=True, related_name='additional_positions')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='positions', null=True, blank=True)
    level = models.ForeignKey(PositionLevel, on_delete=models.SET_NULL, null=True, blank=True, related_name='positions')
    position_type = models.ForeignKey(PositionType, on_delete=models.SET_NULL, null=True, blank=True, related_name='positions')
    shifts = models.ManyToManyField(Shift, related_name='positions', blank=True)
    reporting_to = models.ManyToManyField('self', symmetrical=False, related_name='subordinates', blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['name']
        unique_together = ('department', 'name')

    def __str__(self): return self.name
    
    def save(self, *args, **kwargs):
        # 1. Get project code
        project_code = None
        if self.department and self.department.project:
            project_code = self.department.project.code
        elif self.section and self.section.project:
            project_code = self.section.project.code
        elif self.office:
            project = self.office.projects.first()
            if project:
                project_code = project.code

        # 2. Handle code generation
        if not self.code:
            import re
            # Find the highest existing numeric position code base
            last_pos = Position.objects.filter(code__regex=r'^POS-\d+').order_by('-code').first()
            
            if last_pos:
                match = re.search(r'POS-(\d+)', last_pos.code)
                if match:
                    new_number = int(match.group(1)) + 1
                else:
                    new_number = 1
            else:
                new_number = 1
                
            self.code = f"POS-{new_number:05d}"
            
        # 3. Always append/ensure project suffix if we have a project
        if project_code:
            # If code already has a suffix (handling hyphen or slash if it was there before)
            if project_code in self.code:
                # Suffix already present, do nothing or just ensure it's at the end
                pass
            else:
                self.code = f"{self.code}-{project_code}"
                
        super().save(*args, **kwargs)

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')
    name = models.CharField(max_length=255)
    employee_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)
    positions = models.ManyToManyField(Position, blank=True, related_name='employees')
    reporting_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    hire_date = models.DateField(default=timezone.now)
    address = models.TextField(blank=True)
    father_name = models.CharField(max_length=255, blank=True, null=True)
    mother_name = models.CharField(max_length=255, blank=True, null=True)
    personal_email = models.EmailField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    employment_start_date = models.DateField(blank=True, null=True)
    employment_end_date = models.DateField(blank=True, null=True)
    employment_type = models.CharField(max_length=20, choices=[('Permanent', 'Permanent'), ('Temporary', 'Temporary')], default='Permanent')
    status = models.CharField(max_length=20, default='Active')
    status_date = models.DateField(null=True, blank=True)
    photo = models.TextField(null=True, blank=True) # Base64 encoded image
    failed_login_attempts = models.IntegerField(default=0)
    is_blocked = models.BooleanField(default=False)
    reactivation_reason = models.TextField(blank=True, null=True)
    last_failed_login_count = models.IntegerField(default=0)
    is_password_reset_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees_deleted')
    deletion_reason = models.TextField(blank=True, null=True)
    def save(self, *args, **kwargs):
        if not self.employee_code:
            import re
            # Find the highest existing numeric employee code
            last_emp = Employee.objects.filter(employee_code__regex=r'^EMP-\d+$').order_by('-employee_code').first()
            
            if last_emp:
                # Extract the numeric part and increment
                last_code = last_emp.employee_code
                number_match = re.search(r'\d+', last_code)
                if number_match:
                    new_number = int(number_match.group()) + 1
                else:
                    new_number = 1
            else:
                new_number = 1
                
            self.employee_code = f"EMP-{new_number:05d}"

        # Deactivate linked User account if Employee is Inactive
        if self.status == 'Inactive' and self.user:
            self.user.is_active = False
            self.user.save(update_fields=['is_active'])
        elif self.status == 'Active' and self.user:
            self.user.is_active = True
            self.user.save(update_fields=['is_active'])

        super().save(*args, **kwargs)
    class Meta:
        ordering = ['name']

    def __str__(self): return self.name

class EmployeeTaskUrlPermission(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='url_permissions')
    task_url = models.ForeignKey(TaskUrl, on_delete=models.CASCADE)
    is_enabled = models.BooleanField(default=True)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    is_overridden = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = ('employee', 'task_url')

class PositionScreenPermission(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='screen_permissions')
    task_url = models.ForeignKey(TaskUrl, on_delete=models.CASCADE)
    is_enabled = models.BooleanField(default=True)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = ('position', 'task_url')


class Project(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    has_segments = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True, null=True)
    geo_scope_level = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('Territory', 'Territory'),
        ('Country', 'Country'),
        ('State', 'State'),
        ('District', 'District'),
        ('Mandal', 'Mandal'),
        ('Cluster', 'Cluster (Metropolitan/City/Town/Village)')
    ])
    continent_name = models.CharField(max_length=100, blank=True, null=True)
    country_name = models.CharField(max_length=100, blank=True, null=True)
    state_name = models.CharField(max_length=100, blank=True, null=True)
    district_name = models.CharField(max_length=100, blank=True, null=True)
    mandal_name = models.CharField(max_length=100, blank=True, null=True)
    cluster = models.ForeignKey('GeoCluster', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    TYPE_CHOICES = [('SINGLE', 'Single Location'), ('MULTIPLE', 'Multiple Location')]
    client_type = models.CharField(max_length=50, choices=[('Government', 'Government'), ('Private', 'Private')], default='Private')
    project_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SINGLE')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    assigned_level = models.ForeignKey(OrganizationLevel, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    assigned_offices = models.ManyToManyField(Office, blank=True, related_name='projects')
    latitude = models.DecimalField(max_digits=12, decimal_places=9, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['name']

    @property
    def is_expired(self):
        from django.utils import timezone
        if not self.end_date:
            return False
        return self.end_date < timezone.now().date()

    @property
    def is_currently_active(self):
        status_upper = (self.status or '').upper()
        return status_upper in ('ACTIVE', 'PLANNING') and not self.is_expired

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_end_date = None
        old_status = None
        if not is_new:
            try:
                old_instance = Project.objects.get(pk=self.pk)
                old_end_date = old_instance.end_date
                old_status = old_instance.status
            except Project.DoesNotExist:
                pass
            
        super().save(*args, **kwargs)
        
        # Propagate end_date, status, and project_type to associated facilities if they changed
        old_project_type = None
        if not is_new:
            try:
                old_project_type = old_instance.project_type
            except Exception: pass

        if self.end_date != old_end_date or self.status != old_status or self.project_type != old_project_type:
            masters = self.facility_masters.all()
            
            # Sync status and project_type to Facility Masters
            fm_updates = {}
            if self.status != old_status: fm_updates['status'] = self.status
            if self.project_type != old_project_type: fm_updates['project_type'] = self.project_type
            
            if fm_updates:
                masters.update(**fm_updates)

            updates = {}
            if self.end_date != old_end_date:
                updates['end_date'] = self.end_date
            if self.status != old_status:
                updates['status'] = self.status
            
            if updates:
                Facility.objects.filter(facility_master__in=masters).update(**updates)

class Segment(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='segments')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class DocumentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField(default=timezone.now, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, related_name='employee_docs')
    file = models.TextField(null=True, blank=True) # Base64 encoded file
    document_number = models.CharField(max_length=100, blank=True, null=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

class EmployeeEducation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='education_records')
    qualification = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100, blank=True)
    institution = models.CharField(max_length=255)
    board_university = models.CharField(max_length=255, blank=True)
    year_of_passing = models.IntegerField()
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    certificate = models.TextField(null=True, blank=True) # Base64 encoded file

    class Meta:
        unique_together = ('employee', 'qualification')

class EmployeeExperience(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='experience_records')
    company = models.CharField(max_length=255)
    job_title = models.CharField(max_length=100)
    from_date = models.DateField()
    to_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    responsibilities = models.TextField(blank=True)
    last_ctc = models.CharField(max_length=50, blank=True)
    reason_for_leaving = models.CharField(max_length=255, blank=True)
    experience_letter = models.TextField(null=True, blank=True) # Base64 encoded file

class EmployeeEmploymentHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='employment_history')
    position_name = models.CharField(max_length=255)
    department_name = models.CharField(max_length=255)
    date_of_join = models.DateField()
    date_of_relieving = models.DateField(null=True, blank=True)
    employee_type = models.CharField(max_length=100, default='Permanent')
    employment_type = models.CharField(max_length=100, default='Full-time')
    status = models.CharField(max_length=20, default='Active')
    reporting_to_name = models.CharField(max_length=255)

class EmployeeBankDetails(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='bank_details')
    bank_name = models.CharField(max_length=255, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    branch_name = models.CharField(max_length=255, blank=True)
    account_holder_name = models.CharField(max_length=255, blank=True)
    account_type = models.CharField(max_length=50, default='Savings', blank=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    aadhaar_number = models.CharField(max_length=20, blank=True, null=True, unique=True)

class EmployeeEPFODetails(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='epfo_details')
    uan_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    epfo_member_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    esic_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    nominee_name = models.CharField(max_length=255, blank=True)
    nominee_relationship = models.CharField(max_length=100, blank=True)
    pf_joining_date = models.DateField(null=True, blank=True)

class EmployeeHealthDetails(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='health_details')
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    physical_disability = models.BooleanField(default=False)
    disability_details = models.TextField(blank=True)
    chronic_illnesses = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

class EmployeeSalaryDetails(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='salary_details')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    conveyance_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_gross = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    annual_ctc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    effective_from = models.DateField(blank=True, null=True)

class APIKey(models.Model):
    name = models.CharField(max_length=255, help_text="Application Name")
    key = models.CharField(max_length=255, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys', null=True)
    
    # Permissions
    actions = models.JSONField(default=dict)
    scope = models.JSONField(default=dict)
    data_permissions = models.JSONField(default=dict)
    
    # Security & Usage
    valid_until = models.DateField(null=True, blank=True)
    allowed_ips = models.TextField(blank=True, help_text="Comma separated IPs")
    rate_limit = models.IntegerField(default=100, help_text="Requests per minute")
    usage_count = models.IntegerField(default=0)
    webhook_url = models.URLField(max_length=500, null=True, blank=True, help_text="URL to POST shift roster change events to")
    webhook_events = models.JSONField(default=list, blank=True, help_text="List of events to fire: shift.assigned, shift.unassigned, shift.bulk_assigned")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = f"sk_{uuid.uuid4().hex}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.key[:8]}...)"

class APIKeyUsageLog(models.Model):
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE, related_name='usage_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    endpoint = models.CharField(max_length=255, null=True, blank=True)
    method = models.CharField(max_length=10, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status_code = models.IntegerField(null=True, blank=True) # Optional, might be hard to get in auth layer
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.api_key.name} - {self.timestamp}"

class LoginHit(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='login_hits')
    username = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('SUCCESS', 'Success'), ('FAILED', 'Failed')])
    timestamp = models.DateTimeField(auto_now_add=True)
    logout_timestamp = models.DateTimeField(null=True, blank=True)
    class Meta: ordering = ['-timestamp']

class AccountBlockHistory(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='block_history')
    action = models.CharField(max_length=20, choices=[('BLOCKED', 'Account Blocked'), ('REACTIVATED', 'Account Reactivated')])
    timestamp = models.DateTimeField(auto_now_add=True)
    failed_attempts = models.IntegerField(default=0)
    block_reason = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    reactivated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reactivation_reason = models.TextField(blank=True, null=True)
    class Meta: ordering = ['-timestamp']

class EmployeeArchive(models.Model):
    original_employee_id = models.IntegerField()
    employee_code = models.CharField(max_length=50)
    deleted_at = models.DateTimeField(auto_now_add=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    deletion_reason = models.TextField()
    employee_data = models.JSONField()
    positions_data = models.JSONField(default=list)
    documents_data = models.JSONField(default=list)
    education_data = models.JSONField(default=list)
    experience_data = models.JSONField(default=list)
    employment_history_data = models.JSONField(default=list)
    bank_details_data = models.JSONField(default=dict)
    epfo_details_data = models.JSONField(default=dict)
    health_details_data = models.JSONField(default=dict)
    salary_details_data = models.JSONField(default=dict)
    login_history_data = models.JSONField(default=list)
    block_history_data = models.JSONField(default=list)
    subordinates_data = models.JSONField(default=list)
    created_records = models.JSONField(default=dict)
    modified_records = models.JSONField(default=dict)
    class Meta: ordering = ['-deleted_at']

class PositionAssignment(models.Model):
    ASSIGNMENT_TYPE_CHOICES = [
        ('NORMAL', 'Normal Assignment'),
        ('FORCED', 'Forced Assignment'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('ACCEPTED', 'Accepted by Assignee'),
        ('APPROVED', 'Fully Approved'),
        ('REJECTED', 'Rejected'),
        ('REVOKED', 'Revoked'),
        ('COMPLETED', 'Completed'),
    ]

    assignor = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assignments_made')
    assignee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assignments_received')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='assignments')
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    assignee_accepted = models.BooleanField(default=False)
    reporting_head_approved = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.assignor.name} -> {self.assignee.name} ({self.position.name})"

    class Meta:
        ordering = ['-created_at']

class PositionShiftRoster(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shift_rosters')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='shift_rosters')
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='shift_rosters')
    date = models.DateField()
    actual_start_time = models.TimeField(null=True, blank=True)
    actual_end_time = models.TimeField(null=True, blank=True)
    attendance_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('PRESENT', 'Present'),
            ('ABSENT', 'Absent'),
            ('LATE', 'Late'),
            ('LEFT_EARLY', 'Left Early'),
            ('PARTIAL_SHIFT', 'Partial Shift'),
            ('WEEK_OFF', 'Week Off'),
        ],
        default='PENDING'
    )
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('position', 'shift', 'date', 'employee')
        ordering = ['date', 'position', 'shift']

    def __str__(self):
        return f"{self.date} - {self.position.name} - {self.shift.name}: {self.employee.name}"


class PositionActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='position_activities')
    assignment = models.ForeignKey(PositionAssignment, on_delete=models.CASCADE, related_name='activities')
    action_type = models.CharField(max_length=20)  # CREATE, EDIT, VIEW, DELETE
    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100, null=True, blank=True)
    record_name = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.action_type} - {self.model_name}"

    class Meta:
        ordering = ['-timestamp']

@receiver(post_save, sender=Office)
@receiver(post_save, sender=Facility)
def sync_office_to_visiting_location(sender, instance, **kwargs):
    # Determine if this is a Facility or a regular Office
    is_facility = hasattr(instance, 'facility_type') or (hasattr(instance, 'facility') and instance.facility)
    
    # Simple logic: If it has a name, it should be a Hotspot
    if not instance.name:
        return

    defaults = {
        'name': instance.name,
        'cluster': getattr(instance, 'cluster', None),
        'address': getattr(instance, 'address', '') or "",
        'contact_person': f"{'Facility' if is_facility else 'Office'} ({instance.name})",
        'contact_number': getattr(instance, 'phone', '') or ""
    }

    # Copy latitude/longitude
    if getattr(instance, 'latitude', None) is not None:
        defaults['latitude'] = instance.latitude
    if getattr(instance, 'longitude', None) is not None:
        defaults['longitude'] = instance.longitude

    # Create or update the Visiting Location
    # Using office_ref as the unique link. For Facilities, it uses the Office base part.
    VisitingLocation.objects.update_or_create(
        office_ref=instance.office_ptr if hasattr(instance, 'office_ptr') else instance,
        defaults=defaults
    )

    


    












@receiver(post_delete, sender=Office)
@receiver(post_delete, sender=Facility)
def delete_linked_visiting_location(sender, instance, **kwargs):
    VisitingLocation.objects.filter(office_ref=instance).delete()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        username = self.user.username if self.user else 'System'
        return f"{self.action} on {self.model_name} by {username}"

class VehicleSwapLog(models.Model):
    office_a = models.ForeignKey('Office', on_delete=models.CASCADE, related_name='swap_logs_a')
    office_b = models.ForeignKey('Office', on_delete=models.CASCADE, related_name='swap_logs_b')
    sac_a = models.CharField(max_length=50)
    sac_b = models.CharField(max_length=50)
    old_vehicle_code_a = models.CharField(max_length=50, blank=True, null=True)
    old_vehicle_code_b = models.CharField(max_length=50, blank=True, null=True)
    new_vehicle_code_a = models.CharField(max_length=50, blank=True, null=True)
    new_vehicle_code_b = models.CharField(max_length=50, blank=True, null=True)
    old_vehicle_no_a = models.CharField(max_length=50, blank=True, null=True)
    old_vehicle_no_b = models.CharField(max_length=50, blank=True, null=True)
    new_vehicle_no_a = models.CharField(max_length=50, blank=True, null=True)
    new_vehicle_no_b = models.CharField(max_length=50, blank=True, null=True)
    crew_swapped = models.BooleanField(default=True)
    triggered_by = models.CharField(max_length=100, default='SYSTEM')
    status = models.CharField(max_length=20, default='SUCCESS')
    error_message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Swap: {self.sac_a} ({self.old_vehicle_code_a}) <-> {self.sac_b} ({self.old_vehicle_code_b}) at {self.timestamp}"


class VehicleSwapRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    requester = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='swap_requests_made')
    from_office = models.ForeignKey('Office', on_delete=models.CASCADE, related_name='swap_requests_from')
    to_office = models.ForeignKey('Office', on_delete=models.CASCADE, related_name='swap_requests_to')
    from_vehicle_code = models.CharField(max_length=50, blank=True, null=True)
    from_vehicle_no = models.CharField(max_length=50, blank=True, null=True)
    to_vehicle_code = models.CharField(max_length=50, blank=True, null=True)
    to_vehicle_no = models.CharField(max_length=50, blank=True, null=True)
    swap_crew = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    actioned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='swap_requests_actioned')
    actioned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request by {self.requester.name}: {self.from_office.sac} -> {self.to_office.sac} ({self.status})"

class ShiftChangeRequest(models.Model):
    REQUEST_TYPE_CHOICES = [
        ('ALLOCATION', 'New Shift Assignment'),
        ('SHIFT_CHANGE', 'Shift Transfer'),
        ('SWAP', 'Shift Swap / Cover'),
        ('REPLACEMENT', 'Early-Leave Replacement'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING_CONSENT', 'Pending Employee Consent'),
        ('PENDING_APPROVAL', 'Pending Manager Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    CONSENT_CHOICES = [
        ('PENDING', 'Pending Decision'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
    ]

    requested_by = models.ForeignKey(
        'Employee', 
        on_delete=models.CASCADE, 
        related_name='shift_requests_made'
    )
    employee = models.ForeignKey(
        'Employee', 
        on_delete=models.CASCADE, 
        related_name='shift_requests_received'
    )
    position = models.ForeignKey(
        'Position', 
        on_delete=models.CASCADE
    )
    date = models.DateField()
    
    from_shift = models.ForeignKey(
        'Shift', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='requests_from'
    )
    to_shift = models.ForeignKey(
        'Shift', 
        on_delete=models.CASCADE, 
        related_name='requests_to'
    )
    
    request_type = models.CharField(
        max_length=20, 
        choices=REQUEST_TYPE_CHOICES, 
        default='ALLOCATION'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING_CONSENT'
    )
    employee_consent = models.CharField(
        max_length=20, 
        choices=CONSENT_CHOICES, 
        default='PENDING'
    )
    
    reason = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Shift Request for {self.employee.name} on {self.date}: -> {self.to_shift.name} ({self.status})"

# Sync Django Admin Interface Actions directly to our custom AuditLog
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION

@receiver(post_save, sender=LogEntry)
def sync_admin_to_audit_log(sender, instance, created, **kwargs):
    if not created:
        return
        
    action_map = {
        ADDITION: 'CREATE',
        CHANGE: 'UPDATE',
        DELETION: 'DELETE',
    }
    
    # Avoid infinite loop or noise if admin edits an AuditLog itself
    if instance.content_type and instance.content_type.model.lower() == 'auditlog':
        return
        
    # Standardize CamelCase for ModelName
    model_name_str = instance.content_type.model.title().replace(' ', '') if instance.content_type else 'Unknown'
    
    # Create matching AuditLog without API Request Context (IP/Agent)
    AuditLog.objects.create(
        user=instance.user,
        action=action_map.get(instance.action_flag, 'UPDATE'),
        model_name=model_name_str,
        record_id=str(instance.object_id),
        changes={'admin_change': instance.change_message} if instance.change_message else {},
        ip_address='Backend Server (Django Admin)',
        user_agent='System Administrator Override'
    )

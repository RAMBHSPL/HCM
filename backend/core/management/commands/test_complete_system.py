from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import (
    OrganizationLevel, Office, Department, Section, Project,
    JobFamily, RoleType, Role, Job, Task,
    Position, Employee,
    GeoCountry, GeoState, GeoDistrict, GeoMandal,
    EmployeeEducation, EmployeeExperience, EmployeeBankDetails,
    EmployeeEPFODetails, EmployeeHealthDetails, EmployeeSalaryDetails,
    EmployeeEmploymentHistory
)
from datetime import date, timedelta
from decimal import Decimal


class Command(BaseCommand):
    help = 'Complete end-to-end system test - creates sample data at all levels'

    def __init__(self):
        super().__init__()
        self.created_objects = {
            'levels': 0,
            'offices': 0,
            'departments': 0,
            'sections': 0,
            'projects': 0,
            'job_families': 0,
            'role_types': 0,
            'roles': 0,
            'jobs': 0,
            'tasks': 0,
            'positions': 0,
            'employees': 0,
            'geo_countries': 0,
            'geo_states': 0,
            'geo_districts': 0,
            'geo_mandals': 0,
            'education_records': 0,
            'experience_records': 0,
            'bank_details': 0,
            'epfo_details': 0,
            'health_details': 0,
            'salary_details': 0,
            'employment_history': 0,
        }

    def print_header(self, title):
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS(f"  {title}"))
        self.stdout.write("="*80 + "\n")

    def print_success(self, message):
        self.stdout.write(self.style.SUCCESS(f"✅ {message}"))

    def print_info(self, message):
        self.stdout.write(f"   {message}")

    def print_error(self, message):
        self.stdout.write(self.style.ERROR(f"❌ {message}"))

    @transaction.atomic
    def handle(self, *args, **options):
        self.print_header("BAVYA EMS - COMPLETE END-TO-END SYSTEM TEST")
        self.stdout.write("This will create comprehensive test data across all modules\n")

        try:
            # Phase 1: Geographic Data
            self.test_geographic_data()
            
            # Phase 2: Organizational Levels
            self.test_organizational_levels()
            
            # Phase 3: Complete Office Hierarchy (L1-L9)
            self.test_office_hierarchy()
            
            # Phase 4: Departments & Sections
            self.test_departments_sections()
            
            # Phase 5: Job Structure
            self.test_job_structure()
            
            # Phase 6: Positions
            self.test_positions()
            
            # Phase 7: Employees
            self.test_employees()
            
            # Phase 8: Employee Profiles
            self.test_employee_profiles()
            
            # Phase 9: Projects
            self.test_projects()
            
            # Final Summary
            self.print_summary()
            
        except Exception as e:
            self.print_error(f"Test failed with error: {str(e)}")
            raise

    def test_geographic_data(self):
        """Test Phase 1: Geographic Hierarchy"""
        self.print_header("PHASE 1: GEOGRAPHIC DATA (Separate from Org Hierarchy)")
        
        # Create Country
        country, created = GeoCountry.objects.get_or_create(
            name="India",
            defaults={'code': 'IN'}
        )
        if created:
            self.created_objects['geo_countries'] += 1
        self.print_success(f"Country: {country.name}")
        
        # Create States
        states_data = [
            ('Telangana', 'TS'),
            ('Karnataka', 'KA'),
            ('Tamil Nadu', 'TN'),
            ('Delhi', 'DL'),
            ('Maharashtra', 'MH'),
        ]
        
        states = {}
        for state_name, code in states_data:
            state, created = GeoState.objects.get_or_create(
                name=state_name,
                country=country,
                defaults={'country_name': country.name}
            )
            if created:
                self.created_objects['geo_states'] += 1
            states[state_name] = state
            self.print_info(f"State: {state.name}")
        
        # Create Districts
        districts_data = [
            ('Telangana', 'Hyderabad'),
            ('Telangana', 'Rangareddy'),
            ('Karnataka', 'Bangalore Urban'),
            ('Karnataka', 'Mysore'),
            ('Tamil Nadu', 'Chennai'),
            ('Delhi', 'New Delhi'),
            ('Maharashtra', 'Mumbai'),
        ]
        
        districts = {}
        for state_name, district_name in districts_data:
            district, created = GeoDistrict.objects.get_or_create(
                name=district_name,
                state=states[state_name],
                defaults={'state_name': state_name}
            )
            if created:
                self.created_objects['geo_districts'] += 1
            districts[f"{state_name}_{district_name}"] = district
            self.print_info(f"District: {district.name}, {state_name}")
        
        # Create Mandals
        mandals_data = [
            ('Telangana', 'Hyderabad', 'Secunderabad'),
            ('Telangana', 'Hyderabad', 'Kukatpally'),
            ('Karnataka', 'Bangalore Urban', 'Koramangala'),
            ('Karnataka', 'Bangalore Urban', 'Whitefield'),
        ]
        
        for state_name, district_name, mandal_name in mandals_data:
            district = districts[f"{state_name}_{district_name}"]
            mandal, created = GeoMandal.objects.get_or_create(
                name=mandal_name,
                district=district,
                defaults={
                    'district_name': district_name,
                    'state_name': state_name
                }
            )
            if created:
                self.created_objects['geo_mandals'] += 1
            self.print_info(f"Mandal: {mandal.name}, {district_name}")
        
        self.print_success(f"Geographic data created: {self.created_objects['geo_states']} states, "
                          f"{self.created_objects['geo_districts']} districts, "
                          f"{self.created_objects['geo_mandals']} mandals")

    def test_organizational_levels(self):
        """Test Phase 2: Verify 9 Organizational Levels"""
        self.print_header("PHASE 2: ORGANIZATIONAL LEVELS (L1-L9)")
        
        levels = OrganizationLevel.objects.all().order_by('rank')
        
        if levels.count() != 9:
            self.print_error(f"Expected 9 levels, found {levels.count()}")
            return
        
        for level in levels:
            self.print_success(f"{level.level_code} - {level.name} (Rank {float(level.rank)})")
        
        self.print_success("All 9 organizational levels verified!")

    def test_office_hierarchy(self):
        """Test Phase 3: Create Complete Office Hierarchy L1-L9"""
        self.print_header("PHASE 3: COMPLETE OFFICE HIERARCHY (L1-L9)")
        
        # Clean up existing test offices to avoid duplicate errors on rerun
        test_office_names = [
            'BAVYA Group', 'Healthcare Vertical', 'Education Vertical',
            'Healthcare Headquarters', 'Education Headquarters',
            'Healthcare South Region', 'Healthcare North Region',
            'Karnataka Zone Office', 'Tamil Nadu Zone Office',
            'Bangalore Circle Office', 'Mysore Circle Office',
            'Bangalore Urban Division', 'Bangalore Rural Division',
            'Koramangala Branch Office', 'Whitefield Branch Office',
            'Mobile Health Unit - Zone A', 'Koramangala Clinic'
        ]
        Office.objects.filter(name__in=test_office_names).delete()

        levels = {level.level_code: level for level in OrganizationLevel.objects.all()}
        
        # L1: Group
        group, created = Office.objects.get_or_create(
            level=levels['L1'],
            sac='GRP-001',
            defaults={
                'name': 'BAVYA Group',
                'registered_name': 'BAVYA Enterprises Group Limited',
                'register_id': 'GRP123456789',
                'din_no': 'DIN-GRP-001',
                'country_name': 'India',
                'state_name': 'Telangana',
                'district_name': 'Hyderabad',
                'address': 'Corporate Tower, HITEC City, Hyderabad',
                'status': 'Active'
            }
        )
        if created:
            self.created_objects['offices'] += 1
        self.print_success(f"L1 - {group.name}")
        
        # L2: Business Verticals (2)
        verticals = []
        vertical_data = [
            ('BV-HC-001', 'Healthcare Vertical', 'Telangana', 'Hyderabad'),
            ('BV-ED-001', 'Education Vertical', 'Maharashtra', 'Mumbai'),
        ]
        
        for code, name, state, district in vertical_data:
            vertical, created = Office.objects.get_or_create(
                level=levels['L2'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': group,
                    'country_name': 'India',
                    'state_name': state,
                    'district_name': district,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            verticals.append(vertical)
            self.print_info(f"L2 - {vertical.name}")
        
        # L3: Head Offices (2, one per vertical)
        hqs = []
        hq_data = [
            ('HQ-HC-001', 'Healthcare Headquarters', verticals[0], 'Telangana', 'Hyderabad'),
            ('HQ-ED-001', 'Education Headquarters', verticals[1], 'Maharashtra', 'Mumbai'),
        ]
        
        for code, name, parent, state, district in hq_data:
            hq, created = Office.objects.get_or_create(
                level=levels['L3'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': state,
                    'district_name': district,
                    'mandal_name': 'Secunderabad' if state == 'Telangana' else '',
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            hqs.append(hq)
            self.print_info(f"L3 - {hq.name}")
        
        # L4: Regional Offices (2 under Healthcare HQ)
        regions = []
        region_data = [
            ('RO-HC-SOUTH-001', 'Healthcare South Region', hqs[0], 'Karnataka', 'Bangalore Urban'),
            ('RO-HC-NORTH-001', 'Healthcare North Region', hqs[0], 'Delhi', 'New Delhi'),
        ]
        
        for code, name, parent, state, district in region_data:
            region, created = Office.objects.get_or_create(
                level=levels['L4'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': state,
                    'district_name': district,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            regions.append(region)
            self.print_info(f"L4 - {region.name}")
        
        # L5: Zonal Offices (2 under South Region)
        zones = []
        zone_data = [
            ('ZO-HC-KA-001', 'Karnataka Zone Office', regions[0], 'Karnataka', 'Bangalore Urban'),
            ('ZO-HC-TN-001', 'Tamil Nadu Zone Office', regions[0], 'Tamil Nadu', 'Chennai'),
        ]
        
        for code, name, parent, state, district in zone_data:
            zone, created = Office.objects.get_or_create(
                level=levels['L5'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': state,
                    'district_name': district,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            zones.append(zone)
            self.print_info(f"L5 - {zone.name}")
        
        # L6: Circle Offices (2 under Karnataka Zone)
        circles = []
        circle_data = [
            ('CO-HC-BLR-001', 'Bangalore Circle Office', zones[0], 'Karnataka', 'Bangalore Urban', 'Koramangala'),
            ('CO-HC-MYS-001', 'Mysore Circle Office', zones[0], 'Karnataka', 'Mysore', ''),
        ]
        
        for code, name, parent, state, district, mandal in circle_data:
            circle, created = Office.objects.get_or_create(
                level=levels['L6'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': state,
                    'district_name': district,
                    'mandal_name': mandal,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            circles.append(circle)
            self.print_info(f"L6 - {circle.name}")
        
        # L7: Divisional Offices (2 under Bangalore Circle)
        divisions = []
        division_data = [
            ('DO-HC-BLR-URB-001', 'Bangalore Urban Division', circles[0], 'URBAN'),
            ('DO-HC-BLR-RUR-001', 'Bangalore Rural Division', circles[0], 'RURAL'),
        ]
        
        for code, name, parent, loc_type in division_data:
            division, created = Office.objects.get_or_create(
                level=levels['L7'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': 'Karnataka',
                    'district_name': 'Bangalore Urban',
                    'mandal_name': 'Koramangala',
                    'location': loc_type,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            divisions.append(division)
            self.print_info(f"L7 - {division.name} ({loc_type})")
        
        # L8: Branch Offices (2 under Urban Division)
        branches = []
        branch_data = [
            ('BR-HC-BLR-KOR-001', 'Koramangala Branch Office', divisions[0], 'Koramangala'),
            ('BR-HC-BLR-WHT-001', 'Whitefield Branch Office', divisions[0], 'Whitefield'),
        ]
        
        for code, name, parent, mandal in branch_data:
            branch, created = Office.objects.get_or_create(
                level=levels['L8'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': 'Karnataka',
                    'district_name': 'Bangalore Urban',
                    'mandal_name': mandal,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            branches.append(branch)
            self.print_info(f"L8 - {branch.name}")
        
        # L9: Facilities (2 under Koramangala Branch)
        facility_data = [
            ('FAC-HC-MHU-001', 'Mobile Health Unit - Zone A', branches[0]),
            ('FAC-HC-CLN-001', 'Koramangala Clinic', branches[0]),
        ]
        
        for code, name, parent in facility_data:
            facility, created = Office.objects.get_or_create(
                level=levels['L9'],
                sac=code,
                defaults={
                    'name': name,
                    'parent': parent,
                    'country_name': 'India',
                    'state_name': 'Karnataka',
                    'district_name': 'Bangalore Urban',
                    'mandal_name': 'Koramangala',
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['offices'] += 1
            self.print_info(f"L9 - {facility.name}")
        
        self.print_success(f"Complete office hierarchy created: {self.created_objects['offices']} offices across 9 levels")

    def test_departments_sections(self):
        """Test Phase 4: Departments & Sections"""
        self.print_header("PHASE 4: DEPARTMENTS & SECTIONS")
        
        # Get offices for department creation
        hq = Office.objects.filter(level__level_code='L3').first()
        region = Office.objects.filter(level__level_code='L4').first()
        branch = Office.objects.filter(level__level_code='L8').first()
        
        if not all([hq, region, branch]):
            self.print_error("Required offices not found")
            return
        
        # Create departments at different levels
        dept_data = [
            ('DEPT-HR-001', 'Corporate HR', hq, 'Corporate HR for entire vertical'),
            ('DEPT-OPS-001', 'Regional Operations', region, 'Operations for region'),
            ('DEPT-ADM-001', 'Branch Administration', branch, 'Local branch administration'),
        ]
        
        departments = []
        for code, name, office, desc in dept_data:
            dept, created = Department.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'office': office,
                    'description': desc,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['departments'] += 1
            departments.append(dept)
            self.print_success(f"Department: {dept.name} @ {office.name}")
        
        # Create sections under Corporate HR
        section_data = [
            ('SEC-REC-001', 'Recruitment', departments[0]),
            ('SEC-PAY-001', 'Payroll', departments[0]),
            ('SEC-TRN-001', 'Training & Development', departments[0]),
        ]
        
        for code, name, dept in section_data:
            section, created = Section.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'department': dept,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['sections'] += 1
            self.print_info(f"Section: {section.name} under {dept.name}")
        
        self.print_success(f"Created {self.created_objects['departments']} departments and {self.created_objects['sections']} sections")

    def test_job_structure(self):
        """Test Phase 5: Job Structure (Families, Role Types, Roles, Jobs, Tasks)"""
        self.print_header("PHASE 5: JOB STRUCTURE")
        
        # Create Job Families
        family_data = [
            ('JF-IT-001', 'IT', 'Information Technology'),
            ('JF-HR-001', 'HR', 'Human Resources'),
            ('JF-OPS-001', 'OPS', 'Operations'),
        ]
        
        families = []
        for code, prefix, name in family_data:
            # Try to get by prefix first (unique field)
            family = JobFamily.objects.filter(prefix=prefix).first()
            if not family:
                family, created = JobFamily.objects.get_or_create(
                    code=code,
                    defaults={
                        'name': name,
                        'prefix': prefix,
                        'status': 'Active'
                    }
                )
                if created:
                    self.created_objects['job_families'] += 1
            families.append(family)
            self.print_success(f"Job Family: {family.name}")

        
        # Create Role Types
        role_type_data = [
            ('RT-IT-DEV-001', 'Software Development', families[0]),
            ('RT-HR-MGT-001', 'HR Management', families[1]),
            ('RT-OPS-FLD-001', 'Field Operations', families[2]),
        ]
        
        role_types = []
        for code, name, family in role_type_data:
            role_type, created = RoleType.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'job_family': family,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['role_types'] += 1
            role_types.append(role_type)
            self.print_info(f"Role Type: {role_type.name}")
        
        # Create Roles
        role_data = [
            ('ROLE-IT-SE-001', 'Software Engineer', role_types[0]),
            ('ROLE-IT-SSE-001', 'Senior Software Engineer', role_types[0]),
            ('ROLE-HR-MGR-001', 'HR Manager', role_types[1]),
            ('ROLE-OPS-MGR-001', 'Operations Manager', role_types[2]),
        ]
        
        roles = []
        for code, name, role_type in role_data:
            role, created = Role.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'role_type': role_type,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['roles'] += 1
            roles.append(role)
            self.print_info(f"Role: {role.name}")
        
        # Create Jobs
        job_data = [
            ('JOB-IT-BE-001', 'Backend Developer', roles[0]),
            ('JOB-IT-FE-001', 'Frontend Developer', roles[0]),
            ('JOB-HR-REC-001', 'Recruitment Specialist', roles[2]),
        ]
        
        jobs = []
        for code, name, role in job_data:
            job, created = Job.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'role': role,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['jobs'] += 1
            jobs.append(job)
            self.print_info(f"Job: {job.name}")
        
        # Create Tasks
        task_data = [
            ('TASK-IT-API-001', 'API Development', jobs[0], 'HIGH'),
            ('TASK-IT-DB-001', 'Database Design', jobs[0], 'HIGH'),
            ('TASK-IT-UI-001', 'UI Development', jobs[1], 'MEDIUM'),
        ]
        
        for code, name, job, priority in task_data:
            task, created = Task.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'job': job,
                    'priority': priority,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['tasks'] += 1
            self.print_info(f"Task: {task.name} ({priority})")
        
        self.print_success(f"Job structure created: {self.created_objects['job_families']} families, "
                          f"{self.created_objects['roles']} roles, {self.created_objects['jobs']} jobs, "
                          f"{self.created_objects['tasks']} tasks")

    def test_positions(self):
        """Test Phase 6: Positions at Each Level"""
        self.print_header("PHASE 6: POSITIONS (L1-L9 Reporting Chain)")
        
        # Get offices at each level
        offices = {}
        for i in range(1, 10):
            office = Office.objects.filter(level__level_code=f'L{i}').first()
            if office:
                offices[f'L{i}'] = office
        
        # Get roles
        ceo_role = Role.objects.filter(name__icontains='Manager').first()
        if not ceo_role:
            ceo_role = Role.objects.first()
        
        # Get department
        dept = Department.objects.first()
        
        # Create positions at each level with reporting hierarchy
        position_data = [
            ('POS-L1-CEO-001', 'Group CEO', offices.get('L1'), None, None),
            ('POS-L2-VH-001', 'Healthcare Vertical Head', offices.get('L2'), None, 'POS-L1-CEO-001'),
            ('POS-L3-DIR-001', 'HQ Director', offices.get('L3'), dept, 'POS-L2-VH-001'),
            ('POS-L4-RM-001', 'Regional Manager - South', offices.get('L4'), None, 'POS-L3-DIR-001'),
            ('POS-L5-ZM-001', 'Zonal Manager - Karnataka', offices.get('L5'), None, 'POS-L4-RM-001'),
            ('POS-L6-CM-001', 'Circle Manager - Bangalore', offices.get('L6'), None, 'POS-L5-ZM-001'),
            ('POS-L7-DM-001', 'Divisional Manager - Urban', offices.get('L7'), None, 'POS-L6-CM-001'),
            ('POS-L8-BM-001', 'Branch Manager - Koramangala', offices.get('L8'), dept, 'POS-L7-DM-001'),
            ('POS-L9-FS-001', 'Facility Supervisor - MHU', offices.get('L9'), None, 'POS-L8-BM-001'),
        ]
        
        positions = {}
        for code, name, office, department, parent_code in position_data:
            if not office:
                continue
                
            parent_pos = positions.get(parent_code) if parent_code else None
            
            position, created = Position.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'office': office,
                    'department': department,
                    'role': ceo_role,
                    'role': ceo_role,
                    'status': 'Active'
                }
            )
            if created:
                self.created_objects['positions'] += 1
                if parent_pos:
                    position.reporting_to.add(parent_pos)
            positions[code] = position
            
            parent_info = f" → reports to {parent_pos.name}" if parent_pos else " (Top Position)"
            self.print_success(f"{position.name} @ {office.name}{parent_info}")
        
        self.print_success(f"Created {self.created_objects['positions']} positions with complete reporting chain")

    def test_employees(self):
        """Test Phase 7: Employees"""
        self.print_header("PHASE 7: EMPLOYEES")
        
        # Get positions
        positions = Position.objects.all().order_by('office__level__rank')[:9]
        
        employee_data = [
            ('Rajesh Kumar', 'rajesh.kumar@bavya.com', '+91-9876543220', 'Male', 'O+', 'Permanent'),
            ('Priya Sharma', 'priya.sharma@bavya.com', '+91-9876543221', 'Female', 'A+', 'Permanent'),
            ('Anita Desai', 'anita.desai@bavya.com', '+91-9876543222', 'Female', 'B+', 'Permanent'),
            ('Vikram Singh', 'vikram.singh@bavya.com', '+91-9876543223', 'Male', 'AB+', 'Temporary'),
            ('Sunita Reddy', 'sunita.reddy@bavya.com', '+91-9876543224', 'Female', 'O-', 'Permanent'),
        ]
        
        employees = []
        for idx, (name, email, phone, gender, blood, emp_type) in enumerate(employee_data):
            if idx >= len(positions):
                break
                
            employee, created = Employee.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'phone': phone,
                    'gender': gender,
                    'blood_group': blood,
                    'employment_type': emp_type,
                    'hire_date': date.today() - timedelta(days=365),
                    'date_of_birth': date(1990, 1, 1) + timedelta(days=idx*365),
                    'address': f'Address for {name}',
                    'status': 'Active'
                }
            )
            
            if created:
                self.created_objects['employees'] += 1
                # Assign position
                employee.positions.add(positions[idx])
                
                # Set reporting (if not first employee)
                if idx > 0:
                    employee.reporting_to = employees[idx-1]
                    employee.save()
            
            employees.append(employee)
            position_name = positions[idx].name if idx < len(positions) else 'N/A'
            self.print_success(f"{employee.name} ({employee.employee_code}) - {position_name}")
        
        self.print_success(f"Created {self.created_objects['employees']} employees with position assignments")

    def test_employee_profiles(self):
        """Test Phase 8: Employee Profiles (Education, Experience, etc.)"""
        self.print_header("PHASE 8: EMPLOYEE PROFILES")
        
        employees = Employee.objects.all()[:3]
        
        for employee in employees:
            # Education
            edu, created = EmployeeEducation.objects.get_or_create(
                employee=employee,
                qualification='B.Tech',
                defaults={
                    'specialization': 'Computer Science',
                    'institution': 'CBIT',
                    'board_university': 'JNTU Hyderabad',
                    'year_of_passing': 2012,
                    'percentage': Decimal('85.50'),
                }
            )
            if created:
                self.created_objects['education_records'] += 1
            
            # Experience
            exp, created = EmployeeExperience.objects.get_or_create(
                employee=employee,
                company='TechCorp Solutions',
                defaults={
                    'job_title': 'Software Developer',
                    'from_date': date(2014, 7, 1),
                    'to_date': date(2018, 12, 31),
                    'location': 'Bangalore',
                    'last_ctc': '₹8,00,000',
                }
            )
            if created:
                self.created_objects['experience_records'] += 1
            
            # Bank Details
            bank, created = EmployeeBankDetails.objects.get_or_create(
                employee=employee,
                defaults={
                    'bank_name': 'HDFC Bank',
                    'account_number': f'50100{employee.id:06d}',
                    'ifsc_code': 'HDFC0001234',
                    'branch_name': 'Hyderabad Main',
                    'account_holder_name': employee.name,
                    'account_type': 'Savings',
                    'pan_number': f'ABCDE{employee.id:04d}F',
                }
            )
            if created:
                self.created_objects['bank_details'] += 1
            
            # EPFO Details
            epfo, created = EmployeeEPFODetails.objects.get_or_create(
                employee=employee,
                defaults={
                    'uan_number': f'12345678{employee.id:04d}',
                    'epfo_member_id': f'MH/MUM/0012345/000/{employee.id:07d}',
                    'pf_joining_date': employee.hire_date,
                }
            )
            if created:
                self.created_objects['epfo_details'] += 1
            
            # Health Details
            health, created = EmployeeHealthDetails.objects.get_or_create(
                employee=employee,
                defaults={
                    'height': Decimal('175.00'),
                    'weight': Decimal('70.00'),
                    'physical_disability': False,
                    'emergency_contact_name': f'{employee.name} Family',
                    'emergency_contact_phone': '+91-9999999999',
                }
            )
            if created:
                self.created_objects['health_details'] += 1
            
            # Salary Details
            salary, created = EmployeeSalaryDetails.objects.get_or_create(
                employee=employee,
                defaults={
                    'basic_salary': Decimal('50000.00'),
                    'hra': Decimal('20000.00'),
                    'special_allowance': Decimal('15000.00'),
                    'monthly_gross': Decimal('100000.00'),
                    'annual_ctc': Decimal('1200000.00'),
                    'effective_from': employee.hire_date,
                }
            )
            if created:
                self.created_objects['salary_details'] += 1
            
            self.print_info(f"Profile created for {employee.name}")
        
        self.print_success(f"Employee profiles created: {self.created_objects['education_records']} education, "
                          f"{self.created_objects['bank_details']} bank details, etc.")

    def test_projects(self):
        """Test Phase 9: Projects"""
        self.print_header("PHASE 9: PROJECTS")
        
        # Get level and offices
        regional_level = OrganizationLevel.objects.filter(level_code='L4').first()
        regional_offices = Office.objects.filter(level=regional_level)
        
        project, created = Project.objects.get_or_create(
            code='PRJ-DTI-2024',
            defaults={
                'name': 'Digital Transformation Initiative',
                'description': 'Company-wide digital transformation project',
                'assigned_level': regional_level,
                'status': 'Active'
            }
        )
        
        if created:
            self.created_objects['projects'] += 1
            # Assign to multiple offices
            project.assigned_offices.set(regional_offices)
        
        self.print_success(f"Project: {project.name} assigned to {regional_offices.count()} offices")

    def print_summary(self):
        """Print final summary"""
        self.print_header("TEST SUMMARY - DATA CREATED")
        
        summary_data = [
            ("Geographic Data", [
                ('Countries', self.created_objects['geo_countries']),
                ('States', self.created_objects['geo_states']),
                ('Districts', self.created_objects['geo_districts']),
                ('Mandals', self.created_objects['geo_mandals']),
            ]),
            ("Organizational Structure", [
                ('Offices (L1-L9)', self.created_objects['offices']),
                ('Departments', self.created_objects['departments']),
                ('Sections', self.created_objects['sections']),
                ('Projects', self.created_objects['projects']),
            ]),
            ("Job Structure", [
                ('Job Families', self.created_objects['job_families']),
                ('Role Types', self.created_objects['role_types']),
                ('Roles', self.created_objects['roles']),
                ('Jobs', self.created_objects['jobs']),
                ('Tasks', self.created_objects['tasks']),
            ]),
            ("Workforce", [
                ('Positions', self.created_objects['positions']),
                ('Employees', self.created_objects['employees']),
            ]),
            ("Employee Profiles", [
                ('Education Records', self.created_objects['education_records']),
                ('Experience Records', self.created_objects['experience_records']),
                ('Bank Details', self.created_objects['bank_details']),
                ('EPFO Details', self.created_objects['epfo_details']),
                ('Health Details', self.created_objects['health_details']),
                ('Salary Details', self.created_objects['salary_details']),
            ]),
        ]
        
        total_created = 0
        for category, items in summary_data:
            self.stdout.write(f"\n{category}:")
            for name, count in items:
                self.stdout.write(f"  ✅ {name:<30} {count:>5}")
                total_created += count
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS(f"\n🎉 TOTAL OBJECTS CREATED: {total_created}"))
        self.stdout.write("\n" + "="*80)
        
        self.stdout.write("\n📋 VERIFICATION STEPS:")
        self.stdout.write("   1. Open http://localhost:5173 in your browser")
        self.stdout.write("   2. Navigate through all sections to verify data")
        self.stdout.write("   3. Check hierarchy paths (L1 → L2 → ... → L9)")
        self.stdout.write("   4. Verify position reporting chain")
        self.stdout.write("   5. Check employee profiles and assignments")
        self.stdout.write("   6. Test all forms and fields")
        self.stdout.write("\n" + "="*80 + "\n")

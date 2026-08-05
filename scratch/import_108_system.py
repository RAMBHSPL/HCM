import os
import sys
import django
import pandas as pd
from datetime import datetime
import re
import difflib

# Set up Django context
sys.path.append(r"c:\Users\user\Desktop\HCM\HCM_V3\backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from django.contrib.auth.models import User
from core.models import (
    Project, Segment, Office, Position, Role, Employee, 
    Department, Section, OrganizationLevel, JobFamily, 
    RoleType, PositionLevel, PositionAssignment,
    GeoMandal, GeoCluster, GeoDistrict, GeoState, FacilityMaster
)

# Open log file
log_file_path = r"c:\Users\user\Desktop\HCM\HCM_V3\scratch\import_108.log"
log_file = open(log_file_path, "w", encoding="utf-8")

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    log_file.write(formatted + "\n")
    log_file.flush()

# Helper function to clean values
def clean_str(val, uppercase=False):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if uppercase:
        s = s.upper()
    return s if s else None

def clean_phone(val, fallback_id=None):
    if pd.isna(val) or not str(val).strip():
        if fallback_id:
            # Generate a unique dummy 10-digit phone number using the digits of employee ID
            digits = ''.join([c for c in str(fallback_id) if c.isdigit()])
            if len(digits) >= 10:
                return digits[-10:]
            else:
                return (digits + "9" * 10)[:10]
        return None
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    s = ''.join([c for c in s if c.isdigit()])
    if not s and fallback_id:
        digits = ''.join([c for c in str(fallback_id) if c.isdigit()])
        if len(digits) >= 10:
            return digits[-10:]
        else:
            return (digits + "9" * 10)[:10]
    return s if s else None

def clean_date(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, pd.Timestamp):
        return val.date()
    try:
        return pd.to_datetime(val).date()
    except:
        return None

# Caches
existing_employees_code = {}
existing_employees_phone = {}
existing_employees_email = {}
offices_cache = {}
positions_cache = {}
mandals_by_clean_name = {}
clusters_by_mandal = {}
offices_by_vehicle_cache = {}

district_mapping = {
    'Anakapalli': 'ANAKAPALLI',
    'Ananthapur': 'ANANTAPUR',
    'ASR': 'ALLURI SITHARAMA RAJU',
    'Bapatla': 'BAPATLA',
    'Chittoor': 'CHITTOOR',
    'East Godavari': 'EAST GODAVARI',
    'Eluru': 'ELURU',
    'Guntur': 'GUNTUR',
    'Kakinada': 'KAKINADA',
    'Konaseema': 'DR.B.R.AMBEDKAR KONASEEMA',
    'Krisna': 'KRISHNA',
    'Kurnool': 'KURNOOL',
    'Nandyal': 'NANDYAL',
    'NTR': 'NTR',
    'Palnadu': 'PALANADU',
    'Prakasam': 'PRAKASAM',
    'SPSR Nellore': 'SRI POTTI SRIRAMULU NELLORE',
    'Sri Sathya Sai': 'SRI SATHYA SAI',
    'Srikakulam': 'SRIKAKULAM',
    'Tirupati': 'TIRUPATI',
    'Visakhapatnam': 'VISAKHAPATNAM',
    'Vizianagaram': 'VIZIANAGARAM',
    'West Godavari': 'WEST GODAVARI',
    'YSR Kadapa': 'YSR KADAPA'
}

hq_mandal_mapping = {
    'Anakapalli': 'ANAKAPALLI',
    'Ananthapur': 'ANANTAPUR',
    'ASR': 'PADERU',
    'Bapatla': 'BAPATLA',
    'Chittoor': 'CHITTOOR',
    'East Godavari': 'RAJAMAHENDRAVARAM',
    'Eluru': 'ELURU',
    'Guntur': 'GUNTUR',
    'Kakinada': 'KAKINADA',
    'Konaseema': 'AMALAPURAM',
    'Krisna': 'MACHILIPATNAM',
    'Kurnool': 'KURNOOL',
    'Nandyal': 'NANDYAL',
    'NTR': 'VIJAYAWADA',
    'Palnadu': 'NARASARAOPET',
    'Prakasam': 'ONGOLE',
    'SPSR Nellore': 'NELLORE',
    'Sri Sathya Sai': 'PUTTAPARTHY',
    'Srikakulam': 'SRIKAKULAM',
    'Tirupati': 'TIRUPATI',
    'Visakhapatnam': 'VISAKHAPATNAM',
    'Vizianagaram': 'VIZIANAGARAM',
    'West Godavari': 'BHIMAVARAM',
    'YSR Kadapa': 'KADAPA'
}

def clean_name(name):
    if not name or pd.isna(name):
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(name).upper())

def get_mandal_candidates(mandal_str):
    m_clean = str(mandal_str).strip().upper()
    m_clean = re.sub(r'\s+(RELIVER|RELEIVER|NEONATAL|UPHC|WARD|GVMCS?|GVMCR?|TOWN|HEADOFFICE|STATEOFFICE|BRANCHOFFICE|REGIONALOFFICE|\(R\))$', '', m_clean)
    m_clean = re.sub(r',.*', '', m_clean)
    parts = re.split(r'[/\\-]| AND |&|\s+|\(|\)', m_clean)
    return [p.strip() for p in parts if p.strip()]

def find_cluster_for_base(base, mandal_val, district_val):
    d_clean = clean_name(district_val)
    mandal_candidates = get_mandal_candidates(mandal_val)
    db_mandals = []
    
    for mc in mandal_candidates:
        mc_clean = clean_name(mc)
        if (mc_clean, d_clean) in mandals_by_clean_name:
            db_mandals.extend(mandals_by_clean_name[(mc_clean, d_clean)])
        elif mc_clean in mandals_by_clean_name:
            db_mandals.extend(mandals_by_clean_name[mc_clean])
            
    if not db_mandals:
        mandal_names_list = list(set([k for k in mandals_by_clean_name.keys() if isinstance(k, str)]))
        for mc in mandal_candidates:
            mc_clean = clean_name(mc)
            close_mandals = difflib.get_close_matches(mc_clean, mandal_names_list, n=1, cutoff=0.75)
            if close_mandals:
                db_mandals.extend(mandals_by_clean_name[close_mandals[0]])
                break
                
    if not db_mandals:
        return None
        
    clusters = []
    for m in db_mandals:
        if m.id in clusters_by_mandal:
            clusters.extend(clusters_by_mandal[m.id])
            
    if not clusters:
        return None
        
    b_clean = clean_name(base)
    b_clean = re.sub(r'(NEONATAL|RELIVER|RELEIVER|UPHC|WARD|GVMCS?|GVMCR?|TOWN|HEADOFFICE|STATEOFFICE|BRANCHOFFICE|REGIONALOFFICE)$', '', b_clean)
    
    cluster_match = None
    # 1. Exact clean match
    for c in clusters:
        c_clean = clean_name(c.name)
        if c_clean == b_clean:
            cluster_match = c
            break
            
    # 2. Substring match
    if not cluster_match:
        for c in clusters:
            c_clean = clean_name(c.name)
            if b_clean in c_clean or c_clean in b_clean:
                cluster_match = c
                break
                
    # 3. Fuzzy match
    if not cluster_match:
        cluster_names = {clean_name(c.name): c for c in clusters}
        close_matches = difflib.get_close_matches(b_clean, list(cluster_names.keys()), n=1, cutoff=0.4)
        if close_matches:
            cluster_match = cluster_names[close_matches[0]]
            
    # 4. Fallback to Mandal headquarters/first cluster
    if not cluster_match:
        for m in db_mandals:
            m_clean_norm = clean_name(m.name)
            mandal_clusters = clusters_by_mandal.get(m.id, [])
            for c in mandal_clusters:
                if clean_name(c.name) == m_clean_norm:
                    cluster_match = c
                    break
            if cluster_match:
                break
        if not cluster_match and db_mandals:
            mandal_clusters = clusters_by_mandal.get(db_mandals[0].id, [])
            if mandal_clusters:
                cluster_match = mandal_clusters[0]
                
    return cluster_match

def preload_data(dept):
    log("Preloading existing data for caching...")
    
    # Merge duplicate 108 L9 offices before caching to clean up the DB
    log("Merging any duplicate L9 offices by vehicle number...")
    all_l9 = Office.objects.filter(projects__code='AP-108-MMU', level__level_code='L9')
    temp_by_vehicle = {}
    for o in all_l9:
        if o.vehicle_no:
            v_clean = o.vehicle_no.strip().upper()
            temp_by_vehicle.setdefault(v_clean, []).append(o)
            
    for v_clean, o_list in temp_by_vehicle.items():
        if len(o_list) > 1:
            primary = o_list[0]
            log(f"Merging {len(o_list)} offices for vehicle {v_clean} into '{primary.name}'...")
            for dup in o_list[1:]:
                # Move positions to primary
                for pos in dup.positions.all():
                    pos.office = primary
                    pos.save()
                # Delete duplicate office
                dup.delete()
                
    # Refresh all_l9 after merges
    all_l9 = Office.objects.filter(projects__code='AP-108-MMU', level__level_code='L9')
    
    # Temporarily prefix all existing 108 L9 SAC codes to avoid unique constraint collisions during updates
    log("Temporarily prefixing existing 108 L9 SAC codes to avoid collisions...")
    for o in all_l9:
        if o.sac and not o.sac.startswith('TEMP-'):
            o.sac = f"TEMP-{o.id}"
            o.save(update_fields=['sac'])
                
    for emp in Employee.objects.all().prefetch_related('positions'):
        if emp.employee_code:
            existing_employees_code[emp.employee_code] = emp
        if emp.phone:
            existing_employees_phone[emp.phone] = emp
        if emp.email:
            existing_employees_email[emp.email] = emp
            
    for office in Office.objects.all().select_related('cluster'):
        offices_cache[office.name] = office
        # Cache L9 108 offices by vehicle
        if office.projects.filter(code='AP-108-MMU').exists() and office.level.level_code == 'L9' and office.vehicle_no:
            offices_by_vehicle_cache[office.vehicle_no.strip().upper()] = office
        
    for pos in Position.objects.filter(department=dept).prefetch_related('reporting_to'):
        positions_cache[pos.name] = pos
        
    from core.models import GeoMandal, GeoCluster
    log("Preloading GeoMandals and GeoClusters...")
    mandals = GeoMandal.objects.all().select_related('district', 'district__state')
    for m in mandals:
        m_clean = clean_name(m.name)
        d_clean = clean_name(m.district.name)
        mandals_by_clean_name.setdefault((m_clean, d_clean), []).append(m)
        mandals_by_clean_name.setdefault(m_clean, []).append(m)
        
    clusters = GeoCluster.objects.all()
    for c in clusters:
        clusters_by_mandal.setdefault(c.mandal_id, []).append(c)
        
    log(f"Preloaded: {len(existing_employees_code)} employees, {len(offices_cache)} offices, {len(positions_cache)} positions, {len(mandals_by_clean_name)} mandal mapping keys, {len(clusters)} clusters.")

# User creation helper
def get_or_create_user(username, email, first_name):
    if not username:
        return None
    username = username.strip()
    user = User.objects.filter(username=username).first()
    if not user:
        user = User.objects.create(
            username=username,
            email=email or '',
            password='pbkdf2_sha256$1000000$oWkqiFdhj44TXj18kbBesF$CXHR8ifZ+dUY2NwtIOkc/1frUvEbn0NPLQjLLGKTHFY=',
            first_name=first_name[:30]
        )
    return user

# Robust Employee resolver with collision protection
def get_or_create_employee(emp_code, name, email, phone, dob, gender, doj):
    emp_code = clean_str(emp_code)
    email = clean_str(email)
    phone = clean_phone(phone, fallback_id=emp_code)
    name = clean_str(name)
    dob = clean_date(dob)
    doj = clean_date(doj)
    gender = clean_str(gender)

    emp = None
    if emp_code and emp_code in existing_employees_code:
        emp = existing_employees_code[emp_code]
    if not emp and phone and phone in existing_employees_phone:
        emp = existing_employees_phone[phone]
    if not emp and email and email in existing_employees_email:
        emp = existing_employees_email[email]

    if emp:
        updated = False
        if emp_code and emp.employee_code != emp_code:
            existing_code_emp = existing_employees_code.get(emp_code)
            if existing_code_emp and existing_code_emp.id != emp.id:
                log(f"Warning: Cannot update employee code for '{emp.name}' to '{emp_code}' because it belongs to '{existing_code_emp.name}'")
            else:
                log(f"Updating employee code for '{emp.name}': {emp.employee_code} -> {emp_code}")
                emp.employee_code = emp_code
                updated = True
                
        if name and emp.name != name:
            emp.name = name
            updated = True
            
        if email and emp.email != email:
            existing_email_emp = existing_employees_email.get(email)
            if existing_email_emp and existing_email_emp.id != emp.id:
                log(f"Warning: Cannot update email for '{emp.name}' to '{email}' because it belongs to '{existing_email_emp.name}'")
            else:
                emp.email = email
                updated = True
                
        if phone and emp.phone != phone:
            existing_phone_emp = existing_employees_phone.get(phone)
            if existing_phone_emp and existing_phone_emp.id != emp.id:
                log(f"Warning: Cannot update phone for '{emp.name}' to '{phone}' because it belongs to '{existing_phone_emp.name}'")
            else:
                emp.phone = phone
                updated = True
                
        if dob and not emp.date_of_birth:
            emp.date_of_birth = dob
            updated = True
        if gender and not emp.gender:
            emp.gender = gender
            updated = True
        if doj and not emp.employment_start_date:
            emp.employment_start_date = doj
            updated = True
            
        if updated:
            emp.save()
            
        # Update cache
        if emp.employee_code:
            existing_employees_code[emp.employee_code] = emp
        if emp.phone:
            existing_employees_phone[emp.phone] = emp
        if emp.email:
            existing_employees_email[emp.email] = emp
        return emp, False
    else:
        # Check database unique constraints before creation
        if phone and phone in existing_employees_phone:
            colliding = existing_employees_phone[phone]
            log(f"Warning: Colliding phone '{phone}' during creation of '{name}'. Reusing existing employee '{colliding.name}' ({colliding.employee_code})")
            return colliding, False
            
        if email and email in existing_employees_email:
            colliding = existing_employees_email[email]
            log(f"Warning: Colliding email '{email}' during creation of '{name}'. Reusing existing employee '{colliding.name}' ({colliding.employee_code})")
            return colliding, False

        user = get_or_create_user(emp_code, email, name)
        emp = Employee.objects.create(
            employee_code=emp_code,
            name=name,
            email=email,
            phone=phone,
            user=user,
            date_of_birth=dob,
            gender=gender or '',
            employment_start_date=doj,
            status='Active'
        )
        # Add to cache
        if emp_code:
            existing_employees_code[emp_code] = emp
        if phone:
            existing_employees_phone[phone] = emp
        if email:
            existing_employees_email[email] = emp
        return emp, True

def run_import():
    try:
        log("Starting Project 108 Data Ingestion...")
        
        file_path = r"c:\Users\user\Desktop\108_Data Template (9).xlsx"
        if not os.path.exists(file_path):
            log(f"Error: Excel template not found at {file_path}")
            return
            
        df = pd.read_excel(file_path, sheet_name='AP_ERS_108')
        log(f"Loaded sheet 'AP_ERS_108' with {len(df)} rows.")

        # Get all unique vehicle numbers from dataframe to pre-map them to sequential values
        raw_v_list = df['VehicleNo'].dropna().tolist()
        unique_vehicles = sorted(list(set(str(v).strip().upper() for v in raw_v_list if str(v).strip())))
        vehicle_to_seq = {v: idx + 1 for idx, v in enumerate(unique_vehicles)}
        vehicle_counts = {}
        # Pre-fetch all valid districts and mandals for fuzzy matching
        districts_master = list(GeoDistrict.objects.all())
        district_names_list = [d.name for d in districts_master]
        mandals_master = list(GeoMandal.objects.all().select_related('district'))
        mandals_by_district_list = {}
        for m in mandals_master:
            dname = m.district.name
            if dname not in mandals_by_district_list:
                mandals_by_district_list[dname] = []
            mandals_by_district_list[dname].append(m.name)

        # 1. Fetch/Create Project
        project, created = Project.objects.get_or_create(
            code='AP-108-MMU',
            defaults={
                'name': '108-MMU',
                'status': 'Active',
            }
        )
        log(f"Project: {project.name} ({project.code}) [Created: {created}]")

        # 1b. Fetch/Create FacilityMaster template for 108
        facility_master_108, fm_created = FacilityMaster.objects.get_or_create(
            name='AP-108-MMU',
            project=project,
            defaults={
                'description': 'Andhra Pradesh 108 Emergency Response Service - Mobile Medical Unit',
                'status': 'Active',
                'mode': 'Mobile',
            }
        )
        log(f"FacilityMaster: {facility_master_108.name} (ID:{facility_master_108.id}) [Created: {fm_created}]")

        # 2. Get Organization Levels
        levels = {
            'L3': OrganizationLevel.objects.get(level_code='L3'),  # Head Office
            'L5': OrganizationLevel.objects.get(level_code='L5'),  # Circle Office
            'L6': OrganizationLevel.objects.get(level_code='L6'),  # Regional Office
            'L8': OrganizationLevel.objects.get(level_code='L8'),  # Branch Office
            'L9': OrganizationLevel.objects.get(level_code='L9'),  # Facilitate
        }

        # 3. Get Position Levels
        pos_levels = {
            1: PositionLevel.objects.get(rank=1),
            2: PositionLevel.objects.get(rank=2),
            3: PositionLevel.objects.get(rank=3),
            4: PositionLevel.objects.get(rank=4),
            5: PositionLevel.objects.get(rank=5),
        }

        # 4. Fetch/Create Department and Section
        dept, _ = Department.objects.get_or_create(
            project=project,
            name='108',
            defaults={'status': 'Active'}
        )
        sect, _ = Section.objects.get_or_create(
            project=project,
            department=dept,
            name='108 sec',
            defaults={'status': 'Active'}
        )
        log(f"Department: {dept.name} | Section: {sect.name}")

        # Preload all DB records to cache
        preload_data(dept)

        # 5. Fetch/Create JobFamily and RoleType
        jf, _ = JobFamily.objects.get_or_create(
            name='Operations',
            defaults={'status': 'Active'}
        )
        rt, _ = RoleType.objects.get_or_create(
            name='Operations',
            job_family=jf,
            defaults={'status': 'Active'}
        )

        # 6. Create/Get Roles
        roles = {
            'COO': Role.objects.get_or_create(project=project, name='COO', defaults={'code': 'RL-COO-108', 'role_type': rt, 'status': 'Active'})[0],
            'SPM': Role.objects.get_or_create(project=project, name='SPM', defaults={'code': 'RL-SPM-108', 'role_type': rt, 'status': 'Active'})[0],
            'RM': Role.objects.get_or_create(project=project, name='Regional Manager', defaults={'code': 'RL-RM-108', 'role_type': rt, 'status': 'Active'})[0],
            'DM': Role.objects.get_or_create(project=project, name='District Manager', defaults={'code': 'RL-DM-108', 'role_type': rt, 'status': 'Active'})[0],
            'OE': Role.objects.get_or_create(project=project, name='OE', defaults={'code': 'RL-OE-108', 'role_type': rt, 'status': 'Active'})[0],
            'DRIVER': Role.objects.get_or_create(project=project, name='Driver', defaults={'code': 'RL-DRIVER-108', 'role_type': rt, 'status': 'Active'})[0],
        }

        # Root Admin/Assignor Employee (COO)
        coo_emp_instance = None

        log("Processing rows in batches...")
        
        batch_size = 100
        row_chunks = [df[i:i + batch_size] for i in range(0, len(df), batch_size)]

        for chunk_idx, chunk in enumerate(row_chunks):
            with transaction.atomic():
                for idx, row in chunk.iterrows():
                    # A. COO level (Dr N Shashikanth)
                    coo_id = clean_str(row.get('COO Emp id'))
                    if coo_id:
                        # Office
                        o_name = "108 HEAD OFFICE"
                        if o_name not in offices_cache:
                            office, _ = Office.objects.get_or_create(
                                name=o_name,
                                defaults={
                                    'level': levels['L3'],
                                    'status': 'Active',
                                }
                            )
                            project.assigned_offices.add(office)
                            offices_cache[o_name] = office
                        coo_office = offices_cache[o_name]

                        # Employee
                        emp, _ = get_or_create_employee(
                            emp_code=coo_id,
                            name=row.get('COO name'),
                            email=row.get('COO Email'),
                            phone=row.get('COO phn no'),
                            dob=row.get('DOB.5'),
                            gender=row.get('Gender.5'),
                            doj=row.get('Date of Joining.5')
                        )
                        if not coo_emp_instance:
                            coo_emp_instance = emp

                        # Position
                        p_name = "COO-108"
                        if p_name not in positions_cache:
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': 'POS-COO-108',
                                    'office': coo_office,
                                    'section': sect,
                                    'role': roles['COO'],
                                    'level': pos_levels[1],
                                    'status': 'Active'
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            positions_cache[p_name] = pos

                    # B. SPM level
                    spm_id = clean_str(row.get('SPM Emp id'))
                    if spm_id:
                        # Office
                        o_name = "108 STATE OFFICE"
                        if o_name not in offices_cache:
                            office, _ = Office.objects.get_or_create(
                                name=o_name,
                                defaults={
                                    'level': levels['L5'],
                                    'parent': offices_cache["108 HEAD OFFICE"],
                                    'status': 'Active',
                                }
                            )
                            project.assigned_offices.add(office)
                            offices_cache[o_name] = office
                        spm_office = offices_cache[o_name]

                        # Employee
                        spm_name = clean_str(row.get('SPM name'))
                        emp, _ = get_or_create_employee(
                            emp_code=spm_id,
                            name=spm_name,
                            email=row.get('SPM Email'),
                            phone=row.get('SPM phn no'),
                            dob=row.get('DOB.4'),
                            gender=row.get('Gender.4'),
                            doj=row.get('Date of Joining.4')
                        )
                        
                        # Setup employee reporting
                        if coo_id and coo_id in existing_employees_code:
                            coo_emp = existing_employees_code[coo_id]
                            if emp.reporting_to != coo_emp:
                                emp.reporting_to = coo_emp
                                emp.save(update_fields=['reporting_to'])

                        # Position
                        p_name = f"SPM-108-{spm_name}"
                        if p_name not in positions_cache:
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': f'POS-SPM-108-{spm_id}',
                                    'office': spm_office,
                                    'section': sect,
                                    'role': roles['SPM'],
                                    'level': pos_levels[2],
                                    'status': 'Active'
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=coo_emp_instance or emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            if "COO-108" in positions_cache:
                                pos.reporting_to.add(positions_cache["COO-108"])
                            positions_cache[p_name] = pos

                    # C. RM level
                    rm_id = clean_str(row.get('RM Emp id'))
                    region_name = clean_str(row.get('Region'))
                    if rm_id and region_name:
                        # Office
                        o_name = f"108 - REGIONAL OFFICE - {region_name}"
                        if o_name not in offices_cache:
                            office, _ = Office.objects.get_or_create(
                                name=o_name,
                                defaults={
                                    'level': levels['L6'],
                                    'parent': offices_cache["108 STATE OFFICE"],
                                    'status': 'Active',
                                }
                            )
                            project.assigned_offices.add(office)
                            offices_cache[o_name] = office
                        rm_office = offices_cache[o_name]

                        # Employee
                        rm_name = clean_str(row.get('RM name'))
                        emp, _ = get_or_create_employee(
                            emp_code=rm_id,
                            name=rm_name,
                            email=row.get('RM Email'),
                            phone=row.get('RM phn no'),
                            dob=row.get('DOB.3'),
                            gender=row.get('Gender.3'),
                            doj=row.get('Date of Joining.3')
                        )
                        
                        # Setup employee reporting
                        if spm_id and spm_id in existing_employees_code:
                            spm_emp = existing_employees_code[spm_id]
                            if emp.reporting_to != spm_emp:
                                emp.reporting_to = spm_emp
                                emp.save(update_fields=['reporting_to'])

                        # Position (Unique by region name to support multiple regions per RM)
                        p_name = f"RM-108-{region_name}"
                        if p_name not in positions_cache:
                            clean_region = region_name.replace(" ", "-")
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': f'POS-RM-108-{clean_region}',
                                    'office': rm_office,
                                    'section': sect,
                                    'role': roles['RM'],
                                    'level': pos_levels[3],
                                    'status': 'Active'
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=coo_emp_instance or emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            spm_pos_name = f"SPM-108-{clean_str(row.get('SPM name'))}"
                            if spm_pos_name in positions_cache:
                                pos.reporting_to.add(positions_cache[spm_pos_name])
                            positions_cache[p_name] = pos

                    # D. DM level
                    dm_id = clean_str(row.get('DM Emp id'))
                    district_name = clean_str(row.get('District.2')) or clean_str(row.get('District'))
                    if dm_id and district_name:
                        # Office
                        o_name = f"108 - BRANCH OFFICE - {district_name}"
                        if o_name not in offices_cache:
                            parent_rm_office = offices_cache.get(f"108 - REGIONAL OFFICE - {region_name}")
                            part = district_name.strip()
                            target_district = district_mapping.get(part, part.upper())
                            target_mandal = hq_mandal_mapping.get(part)
                            
                            mandal_obj = GeoMandal.objects.filter(name=target_mandal, district__name=target_district).first()
                            if not mandal_obj:
                                mandal_obj = GeoMandal.objects.filter(name=target_mandal).first()
                                
                            cluster_obj = None
                            if mandal_obj:
                                cluster_obj = GeoCluster.objects.filter(mandal=mandal_obj, name=target_mandal).first()
                                if not cluster_obj:
                                    cluster_obj = GeoCluster.objects.filter(mandal=mandal_obj).first()
                            
                            office, created = Office.objects.get_or_create(
                                name=o_name,
                                defaults={
                                    'level': levels['L8'],
                                    'parent': parent_rm_office,
                                    'status': 'Active',
                                    'country_name': 'INDIA',
                                    'state_name': 'ANDHRA PRADESH',
                                    'district_name': target_district or '',
                                    'mandal_name': target_mandal or '',
                                    'cluster': cluster_obj,
                                }
                            )
                            if not created:
                                office.country_name = 'INDIA'
                                office.state_name = 'ANDHRA PRADESH'
                                office.district_name = target_district or ''
                                office.mandal_name = target_mandal or ''
                                office.cluster = cluster_obj
                                office.save()
                                
                            project.assigned_offices.add(office)
                            offices_cache[o_name] = office
                        dm_office = offices_cache[o_name]

                        # Employee
                        dm_name = clean_str(row.get('DM Name'))
                        emp, _ = get_or_create_employee(
                            emp_code=dm_id,
                            name=dm_name,
                            email=row.get('DM Email'),
                            phone=row.get('DM phn no'),
                            dob=row.get('DOB.2'),
                            gender=row.get('Gender.2'),
                            doj=row.get('Date of Joining.2')
                        )
                        
                        # Setup employee reporting
                        if rm_id and rm_id in existing_employees_code:
                            rm_emp = existing_employees_code[rm_id]
                            if emp.reporting_to != rm_emp:
                                emp.reporting_to = rm_emp
                                emp.save(update_fields=['reporting_to'])

                        # Position (Unique by district name to support multiple districts per DM)
                        p_name = f"DM-108-{district_name}"
                        if p_name not in positions_cache:
                            clean_district = district_name.replace(" ", "-")
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': f'POS-DM-108-{clean_district}',
                                    'office': dm_office,
                                    'section': sect,
                                    'role': roles['DM'],
                                    'level': pos_levels[4],
                                    'status': 'Active'
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=coo_emp_instance or emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            rm_pos_name = f"RM-108-{region_name}"
                            if rm_pos_name in positions_cache:
                                pos.reporting_to.add(positions_cache[rm_pos_name])
                            positions_cache[p_name] = pos

                    # E. OE level
                    oe_id = clean_str(row.get('OE Emp id'))
                    oe_base_loc = clean_str(row.get('Base Location.1')) or clean_str(row.get('Base Location'))
                    if oe_id:
                        # OE shares the same Branch Office as DM
                        o_name = f"108 - BRANCH OFFICE - {district_name}"
                        oe_office = offices_cache.get(o_name)

                        # Employee
                        oe_name = clean_str(row.get('OE name'))
                        emp, _ = get_or_create_employee(
                            emp_code=oe_id,
                            name=oe_name,
                            email=row.get('OE Email'),
                            phone=row.get('OE phn no'),
                            dob=row.get('DOB.1'),
                            gender=row.get('Gender.1'),
                            doj=row.get('Date of Joining.1')
                        )
                        
                        # Setup employee reporting (OE reports to DM)
                        if dm_id and dm_id in existing_employees_code:
                            dm_emp = existing_employees_code[dm_id]
                            if emp.reporting_to != dm_emp:
                                emp.reporting_to = dm_emp
                                emp.save(update_fields=['reporting_to'])

                        # Position
                        p_name = f"OE-108-{oe_base_loc}"
                        if p_name not in positions_cache:
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': f'POS-OE-108-{oe_id}',
                                    'office': oe_office,
                                    'section': sect,
                                    'role': roles['OE'],
                                    'level': pos_levels[4],
                                    'status': 'Active'
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=coo_emp_instance or emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            dm_pos_name = f"DM-108-{district_name}"
                            if dm_pos_name in positions_cache:
                                pos.reporting_to.add(positions_cache[dm_pos_name])
                            positions_cache[p_name] = pos

                    # F. Driver level (Facilitate office)
                    driver_id = clean_str(row.get('Driver Emp id'))
                    base_location = clean_str(row.get('Base Location'))
                    if driver_id and base_location:
                        v_raw = clean_str(row.get('VehicleNo'))
                        v_clean = v_raw.strip().upper() if v_raw else None
                        
                        # Generate the unique office name format incorporating vehicle number
                        if v_clean:
                            o_name = f"AP-108-MMU-{base_location}-{v_clean}"
                        else:
                            o_name = f"AP-108-MMU-{base_location}"
                            
                        # Resolve sequential code for vehicle
                        sac_val = None
                        vc_val = None
                        if v_clean and v_clean in vehicle_to_seq:
                            seq = vehicle_to_seq[v_clean]
                            sac_val = f"{seq:03d}"
                            vc_val = f"VC-{seq:03d}"

                        cluster_match = find_cluster_for_base(base_location, row.get('Mandal / Block Name'), row.get('District'))

                        # Fetch or create office uniquely per vehicle number
                        office = None
                        if v_clean and v_clean in offices_by_vehicle_cache:
                            office = offices_by_vehicle_cache[v_clean]
                            if office.name != o_name:
                                log(f"Renaming office '{office.name}' to '{o_name}' for vehicle {v_clean}")
                                if office.name in offices_cache:
                                    del offices_cache[office.name]
                                office.name = o_name
                                office.save(update_fields=['name'])
                                offices_cache[o_name] = office

                        s_name = 'ANDHRA PRADESH'
                        raw_d = clean_str(row.get('District'))
                        d_name = district_mapping.get(raw_d, raw_d).upper() if raw_d else ''
                        m_name = clean_str(row.get('Mandal / Block Name'), uppercase=True) or ''
                        
                        if cluster_match:
                            s_name = cluster_match.mandal.district.state.name.upper()
                            d_name = cluster_match.mandal.district.name.upper()
                            m_name = cluster_match.mandal.name.upper()
                        else:
                            if d_name:
                                matches = difflib.get_close_matches(d_name, district_names_list, n=1, cutoff=0.6)
                                if matches:
                                    d_name = matches[0]
                            if m_name and d_name:
                                valid_mandals = mandals_by_district_list.get(d_name, [])
                                matches = difflib.get_close_matches(m_name, valid_mandals, n=1, cutoff=0.5)
                                if matches:
                                    m_name = matches[0]

                        if not office:
                            if o_name not in offices_cache:
                                parent_branch = offices_cache.get(f"108 - BRANCH OFFICE - {district_name}")
                                office = Office.objects.create(
                                    name=o_name,
                                    level=levels['L9'],
                                    parent=parent_branch,
                                    office_type='Mobile',
                                    vehicle_no=v_raw,
                                    vehicle_code=vc_val,
                                    sac=sac_val,
                                    cluster=cluster_match,
                                    facility_master=facility_master_108,
                                    state_name=s_name,
                                    district_name=d_name,
                                    mandal_name=m_name,
                                    location=base_location,
                                    status='Active',
                                )
                                project.assigned_offices.add(office)
                                offices_cache[o_name] = office
                                if v_clean:
                                    offices_by_vehicle_cache[v_clean] = office
                            else:
                                office = offices_cache[o_name]
                        
                        # Sync and update any fields
                        updated_fields = []
                        if office.facility_master_id != facility_master_108.id:
                            office.facility_master = facility_master_108
                            updated_fields.append('facility_master')
                        if cluster_match and office.cluster != cluster_match:
                            office.cluster = cluster_match
                            updated_fields.append('cluster')
                            
                        if office.state_name != s_name:
                            office.state_name = s_name
                            updated_fields.append('state_name')
                        if office.district_name != d_name:
                            office.district_name = d_name
                            updated_fields.append('district_name')
                        if office.mandal_name != m_name:
                            office.mandal_name = m_name
                            updated_fields.append('mandal_name')
                            
                        if v_raw:
                            if office.vehicle_no != v_raw:
                                office.vehicle_no = v_raw
                                updated_fields.append('vehicle_no')
                            if sac_val and office.sac != sac_val:
                                office.sac = sac_val
                                updated_fields.append('sac')
                            if vc_val and office.vehicle_code != vc_val:
                                office.vehicle_code = vc_val
                                updated_fields.append('vehicle_code')
                                
                        if updated_fields:
                            office.save()
                            
                        driver_office = office

                        # Employee
                        driver_name = clean_str(row.get('Driver Name'))
                        emp, _ = get_or_create_employee(
                            emp_code=driver_id,
                            name=driver_name,
                            email=row.get('Driver Email'),
                            phone=row.get('Driver Phone_num'),
                            dob=row.get('DOB'),
                            gender=row.get('Gender'),
                            doj=row.get('Date of Joining')
                        )
                        
                        # Setup employee reporting (Driver reports to OE)
                        if oe_id and oe_id in existing_employees_code:
                            oe_emp = existing_employees_code[oe_id]
                            if emp.reporting_to != oe_emp:
                                emp.reporting_to = oe_emp
                                emp.save(update_fields=['reporting_to'])

                        # Position — use base location only, NO employee code in name/code
                        # Count existing driver positions at this office to get a sequential suffix
                        existing_driver_count = Position.objects.filter(
                            role=roles['DRIVER'], office=driver_office
                        ).count()
                        if existing_driver_count == 0:
                            p_name = f"DRIVER-108-{base_location}"
                        else:
                            p_name = f"DRIVER-108-{base_location}-{existing_driver_count + 1}"

                        if p_name not in positions_cache:
                            # Generate a compact unique code DRV-108-XXXX
                            drv_seq = Position.objects.filter(role=roles['DRIVER']).count() + 1
                            pos, _ = Position.objects.get_or_create(
                                department=dept,
                                name=p_name,
                                defaults={
                                    'code': f'DRV-108-{drv_seq:04d}',
                                    'office': driver_office,
                                    'section': sect,
                                    'role': roles['DRIVER'],
                                    'level': pos_levels[5],
                                    'status': 'Active',
                                    'facility_master': facility_master_108,
                                }
                            )
                            emp.positions.add(pos)
                            PositionAssignment.objects.get_or_create(
                                assignor=coo_emp_instance or emp,
                                assignee=emp,
                                position=pos,
                                defaults={'status': 'APPROVED'}
                            )
                            oe_pos_name = f"OE-108-{oe_base_loc}"
                            if oe_pos_name in positions_cache:
                                pos.reporting_to.add(positions_cache[oe_pos_name])
                            positions_cache[p_name] = pos
                        else:
                            pos = positions_cache[p_name]
                            if pos.office != driver_office:
                                log(f"Updating office for position '{p_name}': {pos.office.name if pos.office else None} -> {driver_office.name}")
                                pos.office = driver_office
                                pos.save(update_fields=['office'])
                            if not emp.positions.filter(id=pos.id).exists():
                                emp.positions.add(pos)

            log(f"Committed batch {chunk_idx + 1}/{len(row_chunks)} (rows up to {min((chunk_idx + 1) * batch_size, len(df))})")

        log("\n--- IMPORT SUMMARY ---")
        log(f"Total rows processed: {len(df)}")
        log(f"Total Offices in cache/DB: {len(offices_cache)}")
        log(f"Total Employees in cache/DB: {len(existing_employees_code)}")
        log(f"Total Positions in cache/DB: {len(positions_cache)}")
        log("Database successfully synchronized.")
    except Exception as e:
        import traceback
        log(f"EXCEPTION: {str(e)}")
        log(traceback.format_exc())
    finally:
        log_file.close()

if __name__ == "__main__":
    run_import()

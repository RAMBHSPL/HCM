import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Office, Department, Section, Project
from django.db import transaction

print("Fixing missing facility_type and departments for L9 offices...")
print("=" * 65)

with transaction.atomic():

    # --- Fix 1: facility_type ---
    # 104-MMU -> Ambulance
    updated_104 = Office.objects.filter(
        level__name='FACILITATE',
        projects__id=22,
        office_type__isnull=True
    ).update(office_type='Ambulance')

    updated_104_empty = Office.objects.filter(
        level__name='FACILITATE',
        projects__id=22,
        office_type=''
    ).update(office_type='Ambulance')

    # 108-MMU -> Mobile
    updated_108 = Office.objects.filter(
        level__name='FACILITATE',
        projects__id=7,
        office_type__isnull=True
    ).update(office_type='Mobile')

    updated_108_empty = Office.objects.filter(
        level__name='FACILITATE',
        projects__id=7,
        office_type=''
    ).update(office_type='Mobile')

    print(f"facility_type set to 'Ambulance' (104-MMU): {updated_104 + updated_104_empty}")
    print(f"facility_type set to 'Mobile'    (108-MMU): {updated_108 + updated_108_empty}")

    # --- Fix 2: Remaining missing departments (the 2 with no project) ---
    still_no_dept = Office.objects.filter(
        level__name='FACILITATE',
        departments__isnull=True
    ).distinct()
    print(f"\nOffices still missing dept: {still_no_dept.count()}")
    for o in still_no_dept:
        proj = o.projects.first()
        print(f"  [{o.id}] {o.name} | project: {proj.name if proj else 'None'}")

print("\n--- Final Verification ---")
from core.models import Office
qs = Office.objects.filter(level__name='FACILITATE')
no_type  = qs.filter(office_type__isnull=True).count() + qs.filter(office_type='').count()
no_dept  = qs.filter(departments__isnull=True).distinct().count()
no_sec   = qs.filter(departments__sections__isnull=True).distinct().count()
print(f"Missing facility_type : {no_type}")
print(f"Missing department    : {no_dept}")
print(f"Missing sections      : {no_sec}")
if no_type == 0 and no_dept == 0 and no_sec == 0:
    print("\nAll L9 offices are fully ready for frontend editing!")

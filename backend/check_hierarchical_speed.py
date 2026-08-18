import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User
from core.views import get_accessible_office_ids, get_recursive_subordinate_ids

user = User.objects.filter(username='Bavya123').first()
if not user:
    print("User Bavya123 not found!")
    user = User.objects.filter(is_superuser=False).first()

if user:
    print(f"Testing for user: {user.username}")
    employee = getattr(user, 'employee_profile', None)
    if employee:
        t0 = time.time()
        sub_ids = get_recursive_subordinate_ids(employee, exclude_self=False)
        t1 = time.time()
        print(f"get_recursive_subordinate_ids took {t1 - t0:.4f}s (returned {len(sub_ids)} IDs)")

        t2 = time.time()
        accessible_office_ids = get_accessible_office_ids(employee)
        t3 = time.time()
        print(f"get_accessible_office_ids took {t3 - t2:.4f}s (returned {len(accessible_office_ids)} IDs)")
    else:
        print("User has no employee profile!")
else:
    print("No non-superuser found!")

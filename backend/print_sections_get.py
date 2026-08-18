import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from core.models import User

# Get the admin user
user = User.objects.filter(is_superuser=True).first() or User.objects.first()

c = Client()
c.force_login(user)

response = c.get('/api/sections/?search=STOR&office_level=9')
print("Status:", response.status_code)
try:
    data = response.json()
    results = data.get('results', [])
    print(f"Results Count: {len(results)}")
    for item in results[:10]:
        print(f"ID: {item.get('id')} | Name: {item.get('name')} | Office: {item.get('office_name')}")
except Exception as e:
    print("Error parsing response:", e)
    print("Response Content snippet:", response.content[:1000])

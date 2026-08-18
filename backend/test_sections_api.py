import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from core.views import SectionViewSet
from core.models import User

# Get user
user = User.objects.filter(is_superuser=True).first() or User.objects.first()

factory = RequestFactory()
# Request with L9 filters similar to what the frontend was sending
request = factory.get('/api/sections/?office_level=L9&search=STOR')
request.user = user

view = SectionViewSet.as_view({'get': 'list'})
response = view(request)
response.render()

print("Status code:", response.status_code)
data = response.data
print("Type of data:", type(data))
if isinstance(data, dict):
    results = data.get('results', [])
    print("Total results in paginated response:", len(results))
    for item in results[:10]:
        print(f"- ID: {item.get('id')} | Name: {item.get('name')} | Dept: {item.get('department_name')} | Office: {item.get('office_name')}")
elif isinstance(data, list):
    print("Total results in list response:", len(data))
    for item in data[:10]:
        print(f"- ID: {item.get('id')} | Name: {item.get('name')} | Dept: {item.get('department_name')} | Office: {item.get('office_name')}")

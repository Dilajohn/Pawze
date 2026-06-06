#!/usr/bin/env python
"""Verify all code integrations are correct."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

print("=" * 60)
print("FRONTEND INTEGRATION CHECKS")
print("=" * 60)

# Check frontend views exist
from frontend import views as frontend_views
required_views = [
    'login_view',
    'admin_dashboard',
    'customer_dashboard',
    'groomer_dashboard',
    'assign_appointment_groomer',
    'update_appointment_status',
    'customer_dashboard',
    'change_password',
]

for view_name in required_views:
    if hasattr(frontend_views, view_name):
        print(f"✓ {view_name} exists")
    else:
        print(f"✗ {view_name} MISSING")

print("\n" + "=" * 60)
print("API INTEGRATION CHECKS")
print("=" * 60)

# Check API views
from api import views as api_views
from rest_framework.viewsets import ModelViewSet

api_viewsets = [
    'AppointmentViewSet',
    'UserViewSet',
]

for view_name in api_viewsets:
    if hasattr(api_views, view_name):
        print(f"✓ {view_name} exists")
    else:
        print(f"✗ {view_name} MISSING")

print("\n" + "=" * 60)
print("PERMISSION CHECKS")
print("=" * 60)

# Check permissions
from api import permissions
permission_classes = [
    'IsAdminUserRole',
    'IsGroomerUserRole',
    'IsOwnerOrStaff',
    'IsPasswordChangeComplete',
    'IsStaffRole',
]

for perm_name in permission_classes:
    if hasattr(permissions, perm_name):
        print(f"✓ {perm_name} exists")
    else:
        print(f"✗ {perm_name} MISSING")

print("\n" + "=" * 60)
print("URL ROUTING CHECKS")
print("=" * 60)

# Check frontend URLs
from frontend import urls as frontend_urls
frontend_paths = [
    ('admin-dashboard', 'admin_dashboard'),
    ('customer-dashboard', 'customer_dashboard'),
    ('assign-appointment-groomer', 'assign_appointment_groomer'),
]

url_names = set()
for pattern in frontend_urls.urlpatterns:
    if hasattr(pattern, 'name') and pattern.name:
        url_names.add(pattern.name)

for path, name in frontend_paths:
    if name in url_names:
        print(f"✓ Route '{name}' exists")
    else:
        print(f"✗ Route '{name}' MISSING")

print("\n" + "=" * 60)
print("TEMPLATE CHECKS")
print("=" * 60)

import os.path

template_files = [
    'frontend/templates/frontend/dashboard_admin.html',
    'frontend/templates/frontend/dashboard_customer.html',
    'frontend/templates/frontend/dashboard_groomer.html',
]

for template_file in template_files:
    full_path = os.path.join('backend', template_file)
    if os.path.exists(full_path):
        print(f"✓ {template_file} exists")
    else:
        print(f"✗ {template_file} MISSING")

print("\n" + "=" * 60)
print("MIDDLEWARE CHECK")
print("=" * 60)

# Check middleware
from django.conf import settings
middleware = settings.MIDDLEWARE
print(f"Registered middleware ({len(middleware)} total):")
for mw in middleware:
    if 'EnforcePasswordChange' in mw:
        print(f"  ✓ {mw}")
    elif mw.startswith(('django.', 'rest_framework', 'config.')):
        print(f"  • {mw}")

print("\n" + "=" * 60)
print("✅ ALL INTEGRATION CHECKS COMPLETE")
print("=" * 60)

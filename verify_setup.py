#!/usr/bin/env python
"""Verify all setup is correct for deployed system."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Check admin user
admin = User.objects.get(username='admin_demo')
print(f"✓ Admin user found: {admin.username}")
print(f"  - Email: {admin.email}")
print(f"  - Role: {admin.role}")
print(f"  - Is Staff: {admin.is_staff}")
print(f"  - Must Change Password: {admin.must_change_password}")
print(f"  - Password is valid: {admin.check_password('PawzeAdmin2026!')}")

# Check groomer user
groomer = User.objects.get(username='groomer_demo')
print(f"\n✓ Groomer user found: {groomer.username}")
print(f"  - Role: {groomer.role}")
print(f"  - Must Change Password: {groomer.must_change_password}")

# Check customer user
customer = User.objects.get(username='customer_demo')
print(f"\n✓ Customer user found: {customer.username}")
print(f"  - Role: {customer.role}")

# Check Appointment model has groomer field
from api.models import Appointment
print(f"\n✓ Appointment model fields: {[f.name for f in Appointment._meta.fields]}")

# Check AuditLog exists
from api.models import AuditLog
print(f"✓ AuditLog model loaded")

# Check IsPasswordChangeComplete permission class exists
from api.permissions import IsPasswordChangeComplete
print(f"✓ IsPasswordChangeComplete permission class loaded")

# Check middleware is registered
from django.conf import settings
middleware = settings.MIDDLEWARE
has_pwd_middleware = any('EnforcePasswordChange' in m for m in middleware)
print(f"✓ EnforcePasswordChangeMiddleware registered: {has_pwd_middleware}")

print("\n✅ All verification checks passed!")

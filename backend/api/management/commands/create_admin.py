"""
Management command: python manage.py create_admin

Creates the initial admin account from environment variables.
Safe to run multiple times — skips creation if the username already exists.

Required env vars:
    ADMIN_USERNAME
    ADMIN_EMAIL
    ADMIN_PASSWORD

Optional:
    ADMIN_FIRST_NAME
    ADMIN_LAST_NAME
"""
import os
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = "Create the initial admin account from environment variables."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "").strip()
        email = os.environ.get("ADMIN_EMAIL", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "").strip()
        first_name = os.environ.get("ADMIN_FIRST_NAME", "").strip()
        last_name = os.environ.get("ADMIN_LAST_NAME", "").strip()

        if not username or not email or not password:
            self.stdout.write(self.style.WARNING(
                "create_admin: ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD "
                "must all be set. Skipping."
            ))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'create_admin: user "{username}" already exists — skipping.')
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.role = "admin"
        user.must_change_password = False
        user.save(update_fields=["role", "must_change_password"])

        self.stdout.write(self.style.SUCCESS(
            f'create_admin: admin account "{username}" created successfully.'
        ))

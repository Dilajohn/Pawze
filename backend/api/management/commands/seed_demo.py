"""
Management command: python manage.py seed_demo

Creates demo accounts for each role and seeds the four standard services.
Safe to run multiple times — uses get_or_create throughout.
"""
from django.core.management.base import BaseCommand
from api.models import Service, User


SERVICES = [
    {'name': 'Bath & Brush',  'duration': 45, 'price': 35000, 'description': 'Hydrating wash, gentle dry, paw cleanup, and coat brushing.'},
    {'name': 'Style Trim',    'duration': 75, 'price': 58000, 'description': 'Breed-aware trim, face shaping, sanitary cut, and finishing spray.'},
    {'name': 'Shed Control',  'duration': 60, 'price': 49000, 'description': 'Deshedding treatment for double-coated companions with coat serum.'},
    {'name': 'Spa Reset',     'duration': 90, 'price': 72000, 'description': 'Luxury package with blueberry facial, nail care, ear cleaning, and bow.'},
]

DEMO_USERS = [
    {
        'username': 'admin_demo',
        'email': 'admin@pawze.local',
        'password': 'PawzeAdmin2026!',
        'first_name': 'Ariana',
        'last_name': 'Cruz',
        'role': 'admin',
        'phone': '+256700100200',
        'location': 'Kampala',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'username': 'groomer_demo',
        'email': 'groomer@pawze.local',
        'password': 'DemoGroom1!',
        'first_name': 'Miko',
        'last_name': 'Reyes',
        'role': 'groomer',
        'phone': '+256700300400',
        'location': 'Jinja',
    },
    {
        'username': 'customer_demo',
        'email': 'customer@pawze.local',
        'password': 'DemoCust1!',
        'first_name': 'Jamie',
        'last_name': 'Torres',
        'role': 'customer',
        'phone': '+256700500600',
        'location': 'Entebbe',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with demo accounts and standard services.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding services…')
        for svc_data in SERVICES:
            svc, created = Service.objects.get_or_create(
                name=svc_data['name'],
                defaults=svc_data,
            )
            status = 'created' if created else 'already exists'
            self.stdout.write(f'  Service "{svc.name}" — {status}')

        self.stdout.write('Seeding demo users…')
        for data in DEMO_USERS:
            password = data.pop('password')
            is_staff = data.pop('is_staff', False)
            is_superuser = data.pop('is_superuser', False)
            username = data['username']

            user, created = User.objects.get_or_create(
                username=username,
                defaults={**data, 'is_staff': is_staff, 'is_superuser': is_superuser},
            )
            if created or not user.check_password(password):
                user.is_staff = is_staff
                user.is_superuser = is_superuser
                for field, value in data.items():
                    setattr(user, field, value)
                user.set_password(password)
                user.save()
                status_label = 'created' if created else 'updated password'
                self.stdout.write(f'  User "{username}" ({user.role}) — {status_label}  [password: {password}]')
            else:
                self.stdout.write(f'  User "{username}" — already exists')

        self.stdout.write(self.style.SUCCESS('\nDemo seed complete. Run the dev server and log in with the credentials above.'))

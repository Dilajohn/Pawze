# Pawze Backend

Django REST Framework backend for the Pawze grooming platform.

## Structure

- `config/` - Django project settings and entrypoints
- `api/` - application models, serializers, views, permissions, tests, and seed command
- `manage.py` - Django management entrypoint

## Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is served at `http://127.0.0.1:8000/api/`.

## Environment

By default the backend uses SQLite. Set these variables to use PostgreSQL:

```bash
POSTGRES_DB=pawze
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Additional variables:

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`

## Key Endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/change-password/`
- `GET/PATCH /api/users/me/`
- `GET/POST /api/appointments/`
- `PATCH /api/appointments/{id}/update_status/`
- `GET/POST /api/pets/`
- `GET/POST /api/inventory/`
- `GET /api/inventory/low_stock/`

## Tests

```bash
python manage.py test
```

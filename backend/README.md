# Pawze Backend

Django REST Framework backend for the Pawze dog grooming management system.

## Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # optional admin access
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`.

## Database

By default the backend uses **SQLite** (no setup needed).  
Set the following environment variables to use **PostgreSQL** instead:

```
POSTGRES_DB=pawze
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | insecure dev key | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |
| `POSTGRES_*` | — | PostgreSQL connection (falls back to SQLite) |

## API Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a customer account |
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/change-password/` | Change own password |
| GET/POST | `/api/appointments/` | List / create appointments |
| POST | `/api/appointments/{id}/feedback/` | Submit feedback (completed only) |
| PATCH | `/api/appointments/{id}/update_status/` | Staff: update status |
| GET/POST | `/api/pets/` | List / create pets |
| GET/POST | `/api/inventory/` | List / create inventory (staff only) |
| GET | `/api/inventory/low_stock/` | Low-stock items |
| GET/POST | `/api/notifications/` | Notifications |
| PATCH | `/api/notifications/{id}/mark_read/` | Mark notification read |
| GET/POST | `/api/users/` | User management (admin only) |
| POST | `/api/users/{id}/reset_password/` | Admin: reset staff password |

## Running Tests

```bash
python manage.py test
```

Tests cover:
- Auth throttling (5 req/min on register/login)
- XSS input sanitisation
- Queryset scoping (customers only see their own records)
- Feedback rating validation (1–5 only)
- Appointment date/time validation (future dates, 09:00–18:00)

# Pawze

Pawze is a Django pet grooming management platform for salons that need to handle customer bookings, pet records, appointment tracking, staff workflows, and inventory in one place.

It combines:

- a Django-rendered public booking experience for pet owners
- role-based Django pages for customers, groomers, and admins
- a Django REST Framework API for business logic and external integrations
- SQLite for local development

## What The Project Does

Pawze helps a grooming business manage the full appointment lifecycle:

- customers can register, log in, manage pets, and book appointments
- staff can view schedules and track appointment status
- admins can manage appointments, inventory, staff accounts, and salon operations

The project also supports:

- Django session authentication for server-rendered pages
- JWT authentication for API clients
- role-based access control
- feedback collection for completed appointments
- notification flows for appointment updates
- low-stock inventory visibility

## Main User Roles

### Customer

- create an account
- manage pet profiles
- book appointments
- review appointment history
- submit feedback after completed visits
- update personal profile details

### Groomer

- view assigned appointments
- update appointment status
- view inventory in read-only mode
- monitor notifications
- update personal profile details

### Admin

- create and manage staff accounts
- create, edit, and remove appointments
- manage inventory items
- reset staff passwords
- monitor notifications across the system
- update personal profile details

## Tech Stack

- Django
- Django REST Framework
- Simple JWT for API authentication
- SQLite for local development
- Server-rendered Django templates
- Static CSS and small vanilla JavaScript helpers

## Project Structure

```text
Pawze/
  backend/    Django project, settings, API app, and manage.py
  frontend/   Django app for templates, static assets, and page views
```

Backend highlights:

- `backend/config/` contains Django settings, URL config, WSGI, and ASGI entrypoints
- `backend/api/` contains models, serializers, permissions, views, tests, and management commands

Frontend highlights:

- `frontend/views.py` contains page controllers for landing, booking, auth, and dashboards
- `frontend/templates/frontend/` contains Django templates
- `frontend/static/frontend/` contains CSS, images, favicon, and vanilla JavaScript
- `frontend/data.py` contains display content used by the landing page

## Local Development

Open the project root:

```bash
cd Pawze
```

Install Python dependencies:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Run the Django project:

```bash
python manage.py migrate
python manage.py runserver
```

Application URLs:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/book/
http://127.0.0.1:8000/login/
http://127.0.0.1:8000/api/
```

## Database

Pawze uses SQLite out of the box for development.

SQLite is a good choice for now if you are:

- building locally
- testing features
- preparing an MVP
- working alone or with very light concurrent use

Later, you can switch to PostgreSQL for production or heavier multi-user workloads.

## Environment Notes

The backend reads these optional environment variables when needed:

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

If PostgreSQL variables are not provided, the app uses SQLite automatically.

## Important API Areas

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/change-password/`
- `GET/PATCH /api/users/me/`
- `GET/POST /api/appointments/`
- `PATCH /api/appointments/{id}/update_status/`
- `POST /api/appointments/{id}/feedback/`
- `GET/POST /api/pets/`
- `GET/POST /api/inventory/`
- `GET/POST /api/notifications/`

## Verification

Use these commands from `backend/`:

```bash
python manage.py check
python manage.py migrate
python manage.py test
```


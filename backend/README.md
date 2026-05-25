# Pawze Backend

This is the Django REST Framework backend for Pawze, a pet grooming management platform that handles users, pets, appointments, notifications, and inventory workflows.

## What The Backend Does

The backend provides:

- authentication with JWT
- role-based authorization
- customer registration
- staff account management
- pet profile storage
- appointment creation and status tracking
- feedback submission for completed appointments
- inventory management endpoints
- notification delivery inside the app

## Tech Stack

- Django
- Django REST Framework
- Simple JWT
- SQLite for local development by default

## Structure

```text
backend/
  api/                   domain app
    management/commands/ seed data command(s)
    migrations/          database migrations
    admin.py             Django admin registrations
    models.py            data models
    serializers.py       API serializers and validation
    permissions.py       role and ownership rules
    signals.py           notification behavior
    tests.py             backend API tests
    urls.py              API routes
    views.py             API views and viewsets
  config/                Django project package
    settings.py
    urls.py
    asgi.py
    wsgi.py
  manage.py
  requirements.txt
```

## Core Domain Areas

### Users

- admin
- groomer
- customer

Custom user fields include:

- role
- phone
- location
- avatar
- must_change_password

### Pets

Customers can store pet details such as:

- name
- breed
- age
- weight
- notes

### Appointments

Appointments support:

- customer and pet association
- service selection
- date and time scheduling
- groomer assignment
- status progression
- optional notes
- feedback after completion

### Inventory

The inventory area supports:

- item creation and updates
- stock thresholds
- low-stock detection
- restock requests
- usage logging

## Local Setup

From the `backend/` folder:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API runs at:

```text
http://127.0.0.1:8000/api/
```

## Database

SQLite is used automatically if PostgreSQL environment variables are not provided.

That makes the backend easy to start locally with no extra database setup.

## Optional Environment Variables

- `DJANGO_SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## Key Endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/change-password/`
- `GET/PATCH /api/users/me/`
- `GET/POST /api/users/`
- `POST /api/users/{id}/reset_password/`
- `GET/POST /api/pets/`
- `GET/POST /api/appointments/`
- `POST /api/appointments/{id}/feedback/`
- `PATCH /api/appointments/{id}/update_status/`
- `GET/POST /api/inventory/`
- `GET /api/inventory/low_stock/`
- `GET/POST /api/notifications/`

## Validation And Safety Features

- throttling on auth-sensitive endpoints
- XSS sanitization for selected text inputs
- role-aware queryset scoping
- rating validation for feedback
- appointment time and date validation
- duplicate-prevention logic for appointment status notifications

## Tests

Run:

```bash
python manage.py test
```

The backend test suite covers:

- registration throttling
- login response behavior
- login by email
- `/users/me/`
- admin staff creation
- input sanitization
- queryset scoping
- feedback validation
- appointment date validation
- notification behavior

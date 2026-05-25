# Pawze

Pawze is a full-stack pet grooming management platform built for salons that need to handle customer bookings, pet records, appointment tracking, staff workflows, and inventory in one place.

It combines:

- a public booking experience for pet owners
- role-based dashboards for customers, groomers, and admins
- a Django REST API for business logic and data storage
- a React frontend for the web interface

## What The Project Does

Pawze helps a grooming business manage the full appointment lifecycle:

- customers can register, log in, manage their pets, and book appointments
- staff can view schedules, track appointment status, and monitor notifications
- admins can manage appointments, inventory, staff accounts, and salon operations

The project also supports:

- JWT-based authentication
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

### Frontend

- React
- Vite
- React Router
- Tailwind CSS

### Backend

- Django
- Django REST Framework
- Simple JWT
- SQLite for local development

## Project Structure

```text
Pawze/
  frontend/   React application
  backend/    Django REST API
```

Backend highlights:

- `backend/config/` contains Django settings, URL config, WSGI, and ASGI entrypoints
- `backend/api/` contains models, serializers, permissions, views, tests, and management commands

Frontend highlights:

- `frontend/src/pages/` contains public pages and dashboards
- `frontend/src/components/` contains layout and shared UI components
- `frontend/src/context/AppContext.jsx` contains shared auth and API interaction logic

## Key Features

- public booking flow without forcing account creation
- customer account registration and login
- dashboard redirection based on role
- admin staff provisioning with forced password reset
- appointment scheduling and status updates
- customer feedback for completed appointments
- inventory tracking and low-stock visibility
- in-app notifications

## Local Development

## 1. Clone and open the project

Open the project root:

```bash
cd Pawze
```

## 2. Run the backend

The backend is configured to use SQLite by default, so you can start without PostgreSQL.

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Backend base URL:

```text
http://127.0.0.1:8000/api/
```

## 3. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev URL:

```text
http://127.0.0.1:5173/
```

## Database

Pawze currently supports SQLite out of the box for development.

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

## Current State Of The Project

Pawze is in a strong MVP stage.

The project already has:

- a clear product direction
- a working backend structure
- authenticated user flows
- role-based dashboard behavior
- test coverage for core backend flows

Recent cleanup and stabilization work improved:

- backend project structure
- user/login API contract
- staff account creation
- notification behavior
- repository hygiene

## Recommended Next Steps

- remove committed runtime folders like virtual environments and `node_modules` from version control
- seed demo users and services for easier testing
- split large dashboard files into smaller feature-focused components
- add more user-facing success and error states across forms
- prepare PostgreSQL configuration for production use later

## Verification

The backend has been verified with:

```bash
python manage.py check
python manage.py migrate
python manage.py test
```



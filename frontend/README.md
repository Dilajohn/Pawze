# Pawze Frontend

This directory is a Django app inside the Pawze project. It owns the server-rendered user interface while `backend/api` owns the REST API and data layer.

## Responsibilities

- public landing page
- authenticated appointment booking
- customer registration and login pages
- role-based dashboard pages
- static styles, images, favicon, and small browser helpers

## Layout

```text
frontend/
  apps.py
  data.py
  urls.py
  views.py
  templates/frontend/
  static/frontend/
```

## Development

Run the app through Django from the backend folder:

```bash
cd backend
python manage.py runserver
```

The frontend is served at:

```text
http://127.0.0.1:8000/
```

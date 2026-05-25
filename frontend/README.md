# Pawze Frontend

This is the React frontend for Pawze, a pet grooming management platform for booking, pet records, salon operations, staff workflows, and inventory visibility.

## What This Frontend Covers

The frontend is responsible for:

- the public landing page
- public appointment booking
- customer registration and login
- role-based dashboard routing
- customer, groomer, and admin dashboard experiences
- interaction with the Django backend API

## Main User Experiences

### Public users

- browse the landing page
- view service offerings
- book an appointment without creating an account
- register for a customer account

### Customers

- manage pet profiles
- create bookings from their dashboard
- review appointment history
- submit feedback for completed appointments
- read notifications
- update profile settings

### Groomers

- view assigned appointments
- update appointment statuses
- review inventory in read-only mode
- read notifications
- update profile settings

### Admins

- manage appointments
- manage inventory
- create staff accounts
- reset staff passwords
- review notifications
- update profile settings

## Stack

- React
- Vite
- React Router
- Tailwind CSS
- custom app context for auth and API actions

## Project Layout

```text
frontend/
  public/          static assets and images
  src/
    assets/        local bundled assets
    components/    shared UI pieces and layout
    context/       app-wide auth and API actions
    data/          marketing content and landing-page copy
    pages/         public pages and dashboards
    utils/         API and formatting helpers
```

## Important Files

- `src/App.jsx` - application routes and top-level shell
- `src/context/AppContext.jsx` - authentication state and shared API mutations
- `src/utils/api.js` - fetch wrapper and token handling
- `src/pages/LandingPage.jsx` - marketing homepage
- `src/pages/booking/PublicBookingPage.jsx` - public appointment flow
- `src/pages/dashboards/` - admin, groomer, and customer dashboards

## Development

From the `frontend/` folder:

```bash
npm install
npm run dev
```

The Vite dev server runs on:

```text
http://127.0.0.1:5173/
```

## Production Build

```bash
npm run build
```

## Backend Connection

By default the frontend expects the backend API at:

```text
http://127.0.0.1:8000/api
```

You can override that with:

```text
VITE_API_BASE_URL
```

## Frontend Notes

- JWT access tokens are stored for authenticated API calls
- refresh flow is handled in the shared API utility
- dashboard access is protected by role
- password-change enforcement is supported for staff accounts created by admins

## Current Focus Areas

- keep the dashboards responsive and easy to scan
- continue reducing oversized page components into smaller reusable feature components
- improve user feedback for saves, errors, and long-running actions

# Pawze Project Report

## Current State

Pawze already has a strong product direction: public booking, role-based dashboards, staff inventory workflows, and a Django API that roughly matches the grooming salon domain. The biggest weaknesses were not the core ideas, but the project hygiene and integration layer between frontend and backend.

## What Was Blocking The Project

1. The backend project layout was flattened into the root of `backend/`, which made Django entrypoints harder to reason about and left behind duplicate legacy files.
2. The auth contract was inconsistent with the frontend. The frontend expected login responses to include the user payload and expected a `/users/me/` endpoint that did not exist.
3. Admin staff creation from the frontend was incompatible with the backend serializer. Role and password fields were not wired for that workflow.
4. Appointment status updates could generate duplicate notifications because both the view and the signal tried to notify the customer.
5. The repository contained merge leftovers and generated clutter: `.bak` files, cache folders, a repair script, and a checked-in virtual environment.
6. The backend had no initial migration, so setup was incomplete.
7. The dependency list was heavier than necessary for local SQLite development and caused installation failures on this environment.

## Changes Implemented

### Backend restructuring

- Moved Django project files into `backend/config/`.
- Updated `manage.py` to use `config.settings`.
- Removed obsolete root-level Django entrypoint files from `backend/`.

### API fixes

- Added a custom login view that accepts username or email and returns the authenticated user with JWT tokens.
- Added `GET/PATCH /api/users/me/`.
- Added admin-compatible staff account creation with role and password handling.
- Added self-or-admin access control for user detail/update operations.
- Fixed appointment status notifications so they only fire once on real status changes.

### Data and validation

- Added the initial Django migration for the `api` app.
- Strengthened feedback rating validation at the model layer.
- Simplified password hasher configuration for easier local setup.

### Cleanup

- Added a root `.gitignore`.
- Removed obsolete backend package entrypoints from the active structure.
- Documented the new backend structure in the READMEs.

## Verification

The backend now passes:

- `python manage.py check`
- `python manage.py migrate`
- `python manage.py test`

The verified test suite covers:

- register throttling
- login response shape
- login by email
- `/users/me/`
- admin staff creation
- XSS sanitization
- queryset scoping
- rating validation
- appointment date validation
- single notification behavior on status updates

## Recommended Next Changes

### High priority

1. Refactor the frontend into smaller feature modules.
   The dashboard pages are doing too much in single files. Split by domain:
   - `appointments/`
   - `inventory/`
   - `users/`
   - `notifications/`
   - shared UI components

2. Normalize frontend API usage.
   The frontend should consistently use:
   - `/api/users/me/` for profile reads and updates
   - backend-provided services instead of any leftover local assumptions

3. Add service and user seed data for local demos.
   The UI depends on realistic services and demo logins. Keep these in a deterministic seed command.

4. Remove committed runtime folders from version control.
   These should not live in the repo:
   - `backend/.pawze_venv/`
   - `backend/.venv/`
   - `frontend/node_modules/`
   - `frontend/dist/`

### Medium priority

1. Split backend settings into `base.py`, `dev.py`, and `prod.py`.
2. Add pagination, filtering, and ordering explicitly to list endpoints.
3. Add structured audit logging for appointment and inventory mutations.
4. Add OpenAPI/Swagger documentation for frontend/backend handoff clarity.
5. Add model-level constraints for appointment scheduling rules where possible.

### Product improvements

1. Store customer contact details explicitly for public bookings instead of embedding them inside notes.
2. Add appointment cancellation and reschedule flows.
3. Add inventory transaction history screens in the frontend.
4. Add service management UI for admins.
5. Add email or SMS notification integration instead of console-only notifications.

## Suggested Implementation Plan

### Phase 1: Stabilize the foundation

- Keep the new backend layout.
- Remove committed generated folders from the repo.
- Update frontend profile flows to use `/users/me/`.
- Seed demo services and demo staff users.

### Phase 2: Improve maintainability

- Break large dashboard components into feature modules.
- Introduce reusable table, form, modal, and empty-state components.
- Add API hooks or a small data layer for repeated fetch logic.

### Phase 3: Harden the product

- Add more tests for role permissions, inventory usage, and staff account lifecycle.
- Add environment-specific settings and secret management.
- Move from console notifications to real delivery channels.

### Phase 4: Prepare for deployment

- Add production settings and allowed host configuration.
- Decide on PostgreSQL as the production database and document setup separately from local SQLite.
- Add CI checks for backend tests and frontend lint/build.

## Overall Assessment

Pawze is in a good prototype-to-MVP transition stage. The domain model is solid enough to build on, but the project needed structural cleanup and contract alignment before feature work would stay reliable. After this backend pass, the project is in a much safer place to extend.

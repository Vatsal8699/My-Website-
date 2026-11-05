# API overview

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <JWT>`.

- `GET /health` — service and database health.
- `POST /auth/register` — create founder or mentor account (admin registration is blocked).
- `POST /auth/login` and `GET /auth/me` — authentication.
- `GET /dashboard` — database-backed record counts and recent startups.
- `GET/POST /:resource`, `GET/PATCH/DELETE /:resource/:id` — resource operations.

Resources: startups, founders, mentors, milestones, funding, meetings, workshops, evaluations, notifications, investors, team, documents, activity and users. Admin role is required for deletion. Mentor write access is restricted to evaluations, meetings and notifications.
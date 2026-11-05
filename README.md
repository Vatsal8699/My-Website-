# VentureDesk — Startup Incubator Management Platform

A full-stack React + Express + MongoDB platform for incubator operations: role-based access, startups, founders, mentors, milestones, funding, meetings, evaluations, notifications and reports.

## Requirements
- Node.js 20+
- MongoDB 6+ (local or MongoDB Atlas)

## Setup
1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
2. Run `npm install` at the repository root.
3. Run `npm run seed:admin` after setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
4. Run `npm run dev` and open http://localhost:5173.

## Scripts
- `npm run dev` starts Express and Vite.
- `npm run build` builds the React client.
- `npm start` starts the API.
- `npm run seed:admin` creates the first admin account.

## Stack
React, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React, Node.js, Express, MongoDB/Mongoose, JWT and bcrypt.

## Security & production
Passwords are bcrypt-hashed; APIs use JWT authentication, role checks, validation, rate limiting, Helmet, CORS allowlisting and audit events. Set HTTPS, SMTP, secure environment secrets, persistent private file storage, backups and monitoring before production deployment. MongoDB must be available to run database-backed workflows.

See `docs/API.md` and `docs/DEPLOYMENT.md` for API and deployment guidance. Never commit `.env`.
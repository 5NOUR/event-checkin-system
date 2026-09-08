# Architecture Overview

## System Context

- **Frontend**: Single Page Application (SPA) built with React + Vite.
- **Backend**: REST API + WebSocket server (Node.js + Express).
- **Database**: PostgreSQL (relational).
- **Infrastructure**: Docker Compose for local development.

## Frontend Architecture

```text
src/
├── pages/ (Admin, Organizer, Staff, Public, Auth)
├── components/ (UI, Forms, Scanner)
├── hooks/ (useAuth, useSocket)
├── services/ (API clients, Socket client)
├── store/ (Global state - Context/Zustand)
├── locales/ (i18n translations)
└── utils/ (helpers)
```

- **State Management**: TanStack Query for server state, Context/Zustand for UI state.
- **Routing**: React Router v6 with role-based route guards.

## Backend Architecture (Layered)

```text
src/
├── config/ (Env, DB, Socket)
├── middleware/ (Auth, RBAC, Validation, ErrorHandler)
├── services/ (Business Logic)
├── controllers/ (Request/Response handlers)
├── routes/ (API endpoints v1)
├── validators/ (Zod schemas)
├── sockets/ (Event rooms & listeners)
└── utils/ (QR, Token, CSV, Logger)
```

- **Auth**: JWT (stateless). Passed via `Authorization: Bearer <token>`.
- **Authorization**: Middleware checks `req.user.role` and resource ownership.
- **Error Handling**: Centralized `errorHandler` middleware returns `{ success: false, error: { code, message } }`.

## Database Relations (Core)

- `User` (1) → (M) `Event` (organizer)
- `User` (M) ↔ (M) `Event` via `EventStaff` (check-in staff)
- `Event` (1) → (M) `Registration`
- `Registration` (1) → (1) `CheckInToken`
- `Registration` (1) → (1) `CheckIn` (optional, created on check-in)

## Security

- **RBAC**: Enforced on backend for every endpoint.
- **IDOR Prevention**: Services always check `event.organizerId === userId` or staff assignment.
- **Input Validation**: Zod validators on all routes.
- **CORS**: Configured to allow only `FRONTEND_URL`.
- **Rate Limiting**: On login and check-in endpoints.

## Real-time Flow

1. Client connects to Socket.IO.
2. Client joins room: `event:${eventId}`.
3. On successful check-in, backend emits `attendance-update` to that room.
4. Dashboard listens and updates stats/chart automatically.

## Deployment Strategy (V1)

- Backend and Frontend served separately.
- Database hosted on PostgreSQL (Docker or managed service).
- Simple process manager (PM2) or Docker production compose.

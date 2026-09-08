# Event Check-in System

A production-grade full-stack web application for managing events, attendee registrations, and QR-code-based check-ins. Built with a modular monolith architecture, real-time updates, and a premium UI.

## Key Features

- **Multi-role System**: Admin, Organizer, and Check-in Staff with strict RBAC.
- **Event Management**: Create, publish, cancel, and manage events with capacity limits.
- **Public Event Pages**: Responsive landing pages for attendees to register.
- **Registration Workflow**: Pending → Approved/Rejected → QR Generation.
- **QR Check-in**: Secure, token-based QR codes with anti-fraud validation (wrong event, already checked-in, etc.).
- **Browser Scanner**: Mobile-first camera QR scanner.
- **Real-time Dashboard**: Live attendance updates via WebSockets (Socket.IO).
- **Analytics**: Attendance statistics, charts, and CSV export.
- **Staff Management**: Assign check-in staff to specific events.
- **In-app Notifications**: Real-time alerts for approvals, capacity alerts, etc.
- **Local File Uploads**: Event cover images stored locally (ready for cloud migration).

## Tech Stack

| Layer              | Technology                                                                                                        |
| :----------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, TanStack Query, Zod, Recharts, i18next (Arabic/English) |
| **Backend**        | Node.js 20/22, Express 4, TypeScript, Prisma ORM, Socket.IO                                                       |
| **Database**       | PostgreSQL 16 (Docker)                                                                                            |
| **Infrastructure** | Docker, Docker Compose, Git                                                                                       |

## Quick Start

1. Clone the repository.
2. Copy `.env.example` to `.env` in both `backend/` and `frontend/` (adjust as needed).
3. Run `docker-compose up -d` to start PostgreSQL.
4. Follow the setup guide in `docs/SETUP.md` (coming soon).

## Documentation

- [Project Specification](docs/PROJECT_SPEC.md)
- [Architecture Decision](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT

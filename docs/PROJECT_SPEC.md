# Project Specification: Event Check-in System

## 1. Overview

A web application for event organizers to manage registrations and perform secure QR-based check-ins. Attendees do not create accounts.

## 2. Goals

- Provide a professional event management dashboard.
- Enable secure, fraud-resistant check-in via mobile browser.
- Support Arabic and English interfaces.
- Serve as a portfolio-ready, production-like project.

## 3. Non-Goals (V1)

- No SaaS multi-tenancy.
- No real email delivery (simulated only).
- No payment processing.
- No waitlists.
- No mobile native apps.
- No cloud storage for images (local storage).

## 4. User Roles

### Admin

- Login.
- View system overview.
- Manage Organizers (create/disable).
- View all events and users.
- No event creation/edit permissions.

### Organizer

- Login.
- Full CRUD on their own events.
- Manage registrations (approve/reject).
- View analytics and real-time attendance.
- Assign Check-in Staff.
- CSV export.
- View notifications.

### Check-in Staff

- Login.
- Access only assigned events.
- Use QR scanner to check-in attendees.
- View basic attendee info (name, status).
- NO event management or export.

### Attendee (No Account)

- Visit public event page.
- Fill registration form.
- Receive QR code upon approval.

## 5. Event Status Flow

`DRAFT` → `PUBLISHED` → `REGISTRATION_CLOSED` (auto or manual) → `ONGOING` (manual) → `COMPLETED` (manual).  
`CANCELLED` can be triggered at any time (except from `COMPLETED`).

## 6. Registration & Capacity

- Max capacity per event (e.g., 500).
- Registration status: `PENDING` → `APPROVED` / `REJECTED`.
- When capacity is reached, new registrations are rejected immediately (atomic transaction).
- No waitlist.

## 7. QR System

- Token-based: Random UUID v4 per approved registration.
- QR encodes only the token (not personal data).
- Validation checks:
  - Token exists.
  - Registration is APPROVED.
  - Token belongs to the scanned event.
  - Not already checked-in.
  - Event is not cancelled/completed.

## 8. Real-time

- Socket.IO rooms per event.
- Updates: check-in count, recent check-ins, analytics.

## 9. Localization

- Arabic (default) and English.
- Managed via i18next.

## 10. File Storage

- Event cover images uploaded to `backend/uploads/`.
- Max file size: 2MB. Allowed types: JPEG, PNG, WEBP.

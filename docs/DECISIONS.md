# Architectural Decisions

## 1. Why PostgreSQL?

- Relational integrity is crucial for events, registrations, and staff assignments.
- ACID transactions to prevent capacity race conditions.
- Widely supported and free.

## 2. Why Prisma?

- Type-safe database access with excellent TypeScript integration.
- Automatic migrations and seeding.
- Current stable version (6.x) supports all our needs.

## 3. Why REST over GraphQL?

- Simpler for V1.
- Sufficient for our use case (no complex nested queries required).
- Easier to cache and debug.

## 4. Why Socket.IO?

- Real-time needs are minimal (attendance updates).
- Handles fallback automatically (polling if WebSocket fails).
- Well-documented and stable.

## 5. Why Local Image Upload?

- **Decision**: Store cover images in `backend/uploads/`.
- **Reason**: User has no cloud budget/accounts. This is free and works.
- **Future**: Easily replace with `multer-s3` or `cloudinary` later by changing the service layer.

## 6. Why no Attendee Accounts?

- Simplicity. Attendees are transient users.
- Reduces friction in registration.
- Avoids password management complexity.

## 7. Why Browser-based QR Scanner?

- No native app required.
- Modern browsers (Chrome, Safari, Firefox) support camera APIs well.
- Cost-effective and accessible.

## 8. Arabic Language Support

- Using i18next for internationalization.
- Arabic is set as default to match user preference.
- UI layout supports RTL (Right-to-Left) via Tailwind classes.

## 9. Capacity Race Condition Solution

- Use Prisma `$transaction` with `FOR UPDATE` or use `updateMany` with a condition:
  ```sql
  UPDATE "Event" SET "capacity" = "capacity" - 1 WHERE "id" = ? AND "capacity" > 0
  ```

# Database Design (Prisma Schema Draft)

## Models

### User

| Field        | Type            | Description                   |
| :----------- | :-------------- | :---------------------------- |
| id           | String (UUID)   | Primary Key                   |
| email        | String (unique) | Login identifier              |
| passwordHash | String          | Bcrypt hash                   |
| name         | String          | Full name                     |
| role         | Enum            | `ADMIN`, `ORGANIZER`, `STAFF` |
| isActive     | Boolean         | Soft-delete/disable           |
| createdAt    | DateTime        |                               |

### Event

| Field                | Type             | Description                                                                      |
| :------------------- | :--------------- | :------------------------------------------------------------------------------- |
| id                   | String (UUID)    | PK                                                                               |
| title                | String           |                                                                                  |
| slug                 | String (unique)  | URL-friendly title                                                               |
| description          | Text             |                                                                                  |
| coverImageUrl        | String?          | Local path or URL                                                                |
| location             | String           |                                                                                  |
| date                 | DateTime         |                                                                                  |
| startTime            | String (or Time) |                                                                                  |
| endTime              | String (or Time) |                                                                                  |
| capacity             | Int              |                                                                                  |
| registrationDeadline | DateTime?        |                                                                                  |
| status               | Enum             | `DRAFT`, `PUBLISHED`, `REGISTRATION_CLOSED`, `ONGOING`, `COMPLETED`, `CANCELLED` |
| organizerId          | String           | FK to User                                                                       |
| createdAt            | DateTime         |                                                                                  |

### EventStaff (Join Table)

| Field      | Type                |
| :--------- | :------------------ |
| id         | String (UUID) PK    |
| eventId    | String (FK)         |
| staffId    | String (FK to User) |
| isActive   | Boolean             |
| assignedAt | DateTime            |

### Registration

| Field                 | Type                                     |
| :-------------------- | :--------------------------------------- |
| id                    | String (UUID) PK                         |
| eventId               | String (FK)                              |
| fullName              | String                                   |
| email                 | String                                   |
| phone                 | String?                                  |
| organization          | String?                                  |
| jobTitle              | String?                                  |
| status                | Enum (`PENDING`, `APPROVED`, `REJECTED`) |
| registeredAt          | DateTime                                 |
| approvedAt            | DateTime?                                |
| rejectedAt            | DateTime?                                |
| **Unique Constraint** | `(eventId, email)`                       |

### CheckInToken

| Field          | Type                     |
| :------------- | :----------------------- |
| id             | String (UUID) PK         |
| registrationId | String (FK, unique)      |
| token          | String (unique, UUID v4) |
| createdAt      | DateTime                 |

### CheckIn

| Field           | Type                       |
| :-------------- | :------------------------- |
| id              | String (UUID) PK           |
| registrationId  | String (FK, unique)        |
| checkedInAt     | DateTime                   |
| method          | Enum (`QR_SCAN`, `MANUAL`) |
| checkedByUserId | String (FK to User)        |

### Notification

| Field             | Type                                    |
| :---------------- | :-------------------------------------- |
| id                | String (UUID) PK                        |
| userId            | String (FK)                             |
| title             | String                                  |
| message           | Text                                    |
| isRead            | Boolean                                 |
| relatedEntityType | String? (e.g., 'Event', 'Registration') |
| relatedEntityId   | String?                                 |
| createdAt         | DateTime                                |

### AuditLog (Optional)

| Field     | Type             |
| :-------- | :--------------- |
| id        | String (UUID) PK |
| userId    | String (FK)      |
| action    | String           |
| details   | Json             |
| ipAddress | String?          |
| createdAt | DateTime         |

## Indexes

- `Event.organizerId`
- `Event.slug`
- `Registration.eventId`
- `Registration.status`
- `CheckInToken.token` (Unique)
- `Notification.userId`

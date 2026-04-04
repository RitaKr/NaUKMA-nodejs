# Event Booking System API

A RESTful API for booking event tickets, built with Node.js, Express, TypeScript, Prisma, and SQLite.

## Tech Stack

- **Node.js** + **Express** — HTTP server
- **TypeScript** — type safety
- **Prisma** + **SQLite** — database ORM
- **Zod** — request validation
- **JWT** — authentication
- **bcryptjs** — password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Run database migration
npm run db:migrate

# 4. Seed admin user (optional)
npm run db:seed

# 5. Start development server
npm run dev
```

The server runs on `http://localhost:3000` by default.

### Environment Variables

| Variable       | Description              | Example                   |
|----------------|--------------------------|---------------------------|
| `PORT`         | Server port              | `3000`                    |
| `DATABASE_URL` | SQLite file path         | `file:./dev.db`           |
| `JWT_SECRET`   | JWT signing secret       | `supersecretkey`          |

## API Endpoints

### Authentication (public)

| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| POST   | /auth/register   | Register new user |
| POST   | /auth/login      | Login             |

**POST /auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST /auth/login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Both return `{ token, user }`.

### Users

| Method | Endpoint     | Description          | Access    |
|--------|--------------|----------------------|-----------|
| GET    | /users/me    | Current user profile | Auth      |
| GET    | /users       | List all users       | ADMIN     |
| GET    | /users/:id   | Get user by ID       | ADMIN     |

### Events (public GET, ADMIN write)

| Method | Endpoint              | Description               | Access  |
|--------|----------------------|---------------------------|---------|
| GET    | /events              | List events (filterable)  | Public  |
| GET    | /events/:id          | Get event by ID           | Public  |
| POST   | /events              | Create event              | ADMIN   |
| PUT    | /events/:id          | Update event              | ADMIN   |
| DELETE | /events/:id          | Delete event              | ADMIN   |
| GET    | /events/:id/bookings | Get event bookings        | ADMIN   |

**GET /events — Query Parameters**

| Param     | Description                      | Example          |
|-----------|----------------------------------|------------------|
| category  | Filter by category               | `concert`        |
| location  | Filter by location (contains)    | `Kyiv`           |
| date      | Filter by date (YYYY-MM-DD)      | `2026-06-10`     |
| minPrice  | Minimum ticket price             | `0`              |
| maxPrice  | Maximum ticket price             | `1000`           |
| sortBy    | Sort field: `date` or `price`    | `date`           |
| order     | Sort order: `asc` or `desc`      | `asc`            |
| page      | Page number (default: 1)         | `1`              |
| limit     | Items per page (default: 10)     | `10`             |

**POST /events**
```json
{
  "title": "Jazz Evening",
  "description": "Live jazz concert in Kyiv at a beautiful venue.",
  "date": "2026-06-10T19:00:00.000Z",
  "location": "Kyiv",
  "capacity": 100,
  "category": "concert",
  "price": 500
}
```

### Bookings

| Method | Endpoint              | Description            | Access |
|--------|-----------------------|------------------------|--------|
| POST   | /bookings             | Create booking         | Auth   |
| GET    | /bookings             | List bookings          | Auth   |
| GET    | /bookings/:id         | Get booking by ID      | Auth   |
| POST   | /bookings/:id/cancel  | Cancel booking         | Auth   |

> **Note:** `GET /bookings` returns all bookings for ADMIN, own bookings for USER.

**POST /bookings**
```json
{
  "eventId": "event-uuid",
  "quantity": 2
}
```

### Stats (ADMIN only)

| Method | Endpoint        | Description             |
|--------|-----------------|-------------------------|
| GET    | /stats/events   | Event statistics        |
| GET    | /stats/bookings | Booking statistics      |

## Authentication

Send the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

- Missing/invalid token → `401 Unauthorized`
- Insufficient role → `403 Forbidden`

## Business Logic

- **Registration**: unique email, password stored as bcrypt hash, default role `USER`
- **Event creation**: `availableSeats` starts equal to `capacity`; date must be in future
- **Booking**: checks seats availability, atomically decrements `availableSeats`, calculates `totalPrice = quantity × price`
- **Cancel booking**: restores `availableSeats`; only works for ACTIVE bookings on future events
- **Delete event**: blocked if active bookings exist

## Project Structure

```
src/
├── app.ts               # Express app
├── server.ts            # Entry point
├── db/
│   ├── client.ts        # Prisma client
│   └── seed.ts          # DB seed
├── routes/              # Route definitions
├── controllers/         # Request handlers
├── services/            # Business logic
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── validate.ts
├── schemas/             # Zod validation schemas
└── utils/
    ├── jwt.ts
    └── errors.ts
```

## Scripts

| Command            | Description                        |
|--------------------|------------------------------------|
| `npm run dev`      | Start development server           |
| `npm run build`    | Compile TypeScript                 |
| `npm start`        | Run compiled production server     |
| `npm run db:migrate` | Run Prisma migrations            |
| `npm run db:generate` | Regenerate Prisma client        |
| `npm run db:studio` | Open Prisma Studio               |
| `npm run db:seed`  | Seed admin user                    |

## Default Admin Account (after seeding)

- **Email**: `admin@example.com`
- **Password**: `admin12345`

# 🚗 Vehicle Rental Management Backend API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg)](https://expressjs.com/)
[![Knex.js](https://img.shields.io/badge/Knex.js-3.1-orange.svg)](https://knexjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Locking-red.svg)](https://redis.io/)

A production-ready, enterprise-grade RESTful API backend built for vehicle rental companies to manage fleet inventory, customer rental bookings, authentication, and complex monthly financial activity reporting.

---

## 📌 Project Overview

The **Vehicle Rental Management System** is designed to streamline operations for car rental agencies. It enables staff members to manage vehicle fleets (including categories, rates, and photo uploads), process customer bookings with automated server-side pricing calculations, prevent double-booking conflicts, and analyze monthly rental activity and revenue metrics per vehicle.

### 🎯 Key Objectives & Use Cases
- **Staff Authentication**: Secure JWT-based authentication with bcrypt password hashing and rate-limited login endpoints.
- **Fleet Management**: CRUD operations for vehicles with soft-delete support, category filtering, search capabilities, and local photo file uploads via Multer.
- **Rental Bookings**: Create, update, and manage rental reservations. Server-side automatic rate calculation ($Daily\_Rate \times Days$).
- **Overlap Prevention**: Application-level validation combined with database row locking (`FOR UPDATE`) and Redis Distributed Locking to strictly forbid double-booking an active vehicle on overlapping date ranges.
- **Prorated Monthly Activity Reports**: Advanced SQL CTE queries that accurately clip rental date ranges spanning across calendar month boundaries (e.g., July 29 – August 3) to compute exact days rented and proportional revenue for any given month (`YYYY-MM`).

---

## 🏗 Architecture & Design Highlights

The project adheres to **Object-Oriented Programming (OOP)** and **Clean Layered Architecture** principles:

```
[ HTTP Requests ]
       │
       ▼
 ┌───────────┐
 │ Controllers│  <-- Handles Request parsing & HTTP responses
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │ Services  │  <-- Business Logic, Calculations & Lock Management
 └─────┬─────┘
       │
       ▼
 ┌───────────┐
 │Repositories│  <-- Database queries (Knex & PostgreSQL Raw SQL)
 └─────┬─────┘
       │
       ▼
 [ PostgreSQL ] / [ Redis ]
```

- **Separation of Concerns**: Controllers, Services, Repositories, Validators, and Types are strictly decoupled into modular feature folders (`auth`, `vehicles`, `rentals`, `reports`).
- **Distributed Concurrency Guard**: Redis key locking (`acquireLock`) combined with PostgreSQL transactional row locking (`FOR UPDATE`) guarantees high concurrency safety against simultaneous duplicate bookings.
- **Type Safety**: End-to-end static typing across request bodies, query parameters, responses, and Express `Request` context extensions (`req.user`).
- **Input Validation**: Centralized request payload sanitization powered by **Joi** schemas.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (`tsc`, `tsx`)
- **Web Framework**: Express.js
- **Query Builder**: Knex.js
- **Database**: PostgreSQL (`pg` driver)
- **Caching & Locking**: Redis / `ioredis`
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt`
- **File Storage**: Multer (Local static storage)
- **Validation**: Joi
- **Code Quality**: ESLint, Prettier

---

## 🗄 Database Schema & ERD

```
+--------------------------------+       +------------------------------------+
|             staff              |       |              vehicles              |
+--------------------------------+       +------------------------------------+
| id (PK, serial)                |       | id (PK, serial)                    |
| email (unique, string)         |       | name (string)                      |
| password_hash (string)         |       | plate_number (unique, string)      |
| name (string)                  |       | category (string)                  |
| created_at (timestamp)         |       | daily_rate (decimal 10,2)          |
| updated_at (timestamp)         |       | photo_path (nullable string)       |
+--------------------------------+       | deleted_at (nullable timestamp)    |
                                         | created_at (timestamp)             |
                                         | updated_at (timestamp)             |
                                         +------------------------------------+
                                                           ^
                                                           | 1:N
                                         +-----------------+------------------+
                                         |              rentals               |
                                         +------------------------------------+
                                         | id (PK, serial)                    |
                                         | vehicle_id (FK -> vehicles.id)     |
                                         | customer_name (string)             |
                                         | customer_phone (string)            |
                                         | start_date (date)                  |
                                         | end_date (date)                    |
                                         | total_amount (decimal 10,2)        |
                                         | status (booked/ongoing/completed/  |
                                         |         cancelled)                 |
                                         | created_at (timestamp)             |
                                         | updated_at (timestamp)             |
                                         +------------------------------------+
```

### Schema & Migration Files
- [src/db/schema.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/schema.ts): Database interfaces, table names, and status enums.
- [20260801_000001_create_staff.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000001_create_staff.ts): Staff table migration.
- [20260801_000002_create_vehicles.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000002_create_vehicles.ts): Vehicles table migration (with partial index on `deleted_at`).
- [20260801_000003_create_rentals.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000003_create_rentals.ts): Rentals table migration with foreign key and index constraints.

---

## 📁 Project Structure

```
src/
├── app.ts                 # Express app setup & middleware configuration
├── server.ts              # HTTP Server entrypoint
├── config/                # Environment, Knex, and Redis configurations
│   ├── env.ts
│   ├── knex.ts
│   └── redis.ts
├── common/                # Shared utilities, errors, middlewares, and types
│   ├── errors/            # Custom AppError classes (NotFoundError, ConflictError, etc.)
│   ├── middlewares/       # Error handler, validator, and 404 middlewares
│   ├── types/             # Common API response interfaces and Express extension
│   └── utils/             # Async handler & pagination helpers
├── db/                    # Knex schema definitions, migrations, and seeds
│   ├── migrations/
│   ├── seeds/
│   └── schema.ts
├── modules/               # Feature Modules
│   ├── auth/              # Auth controller, service, repository, routes, validators
│   ├── vehicles/          # Vehicle management & photo upload
│   ├── rentals/           # Booking logic, overlap checks & pricing
│   └── reports/           # Financial & monthly activity reporting
└── scripts/               # Test and demonstration scripts
    ├── test_all_routes.ts
    └── test_concurrent_rentals.ts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher (Local or Neon PostgreSQL)
- **Redis Server**: Optional (Falls back gracefully or connects via standard URI)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository_url>
cd vehicle-rental-management
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

Configure environment variables inside `.env`:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vehicle_rental
DB_POOL_MIN=2
DB_POOL_MAX=10
JWT_SECRET=super_secret_jwt_key_change_in_prod
JWT_EXPIRES_IN=8h
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5
RATE_LIMIT_WINDOW_MIN=15
RATE_LIMIT_MAX=5
REDIS_URL=redis://localhost:6379
```

---

## 🗄 Database Migrations & Seeding

Run the database migrations and seed default data:
```bash
# Execute migrations to build tables cleanly
npm run migrate:latest

# Seed database with initial staff account, vehicles, and sample rentals
npm run seed:run

# Rollback migrations if needed
npm run migrate:rollback
```

### Default Credentials (Seeded Account)
- **Email**: `admin@rental.com`
- **Password**: `Password123!`

---

## 💻 Running the Server

```bash
# Start in development mode with live reload
npm run dev

# Build TypeScript to JavaScript dist folder
npm run build

# Start production server
npm start
```

---

## 📡 API Documentation

### Auth Module
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticate staff member and receive JWT token |
| `GET` | `/api/v1/auth/me` | JWT | Get authenticated staff profile |
| `POST` | `/api/v1/auth/change-password` | JWT | Update staff password |

### Vehicles Module
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/vehicles` | JWT | List vehicles with pagination (`?page=`, `?limit=`), `?category=`, and `?search=` |
| `GET` | `/api/v1/vehicles/:id` | JWT | Get single vehicle details |
| `POST` | `/api/v1/vehicles` | JWT | Create vehicle (`multipart/form-data` with `photo`) |
| `PUT` | `/api/v1/vehicles/:id` | JWT | Update vehicle (supports optional photo replacement) |
| `DELETE` | `/api/v1/vehicles/:id` | JWT | Soft-delete vehicle (`deleted_at` timestamp) |
| `GET` | `/api/v1/vehicles/:id/availability` | JWT | Check vehicle availability for date range |

### Rentals Module
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/rentals` | JWT | List rentals (`?vehicle_id=`, `?status=`, `?start_date=`, `?end_date=`) |
| `GET` | `/api/v1/rentals/:id` | JWT | Get rental details |
| `POST` | `/api/v1/rentals` | JWT | Create rental reservation (validates overlap & calculates total amount) |
| `PUT` | `/api/v1/rentals/:id` | JWT | Update rental (re-validates overlap if dates/vehicle change) |
| `PATCH` | `/api/v1/rentals/:id/status` | JWT | Update rental status (`booked`, `ongoing`, `completed`, `cancelled`) |
| `DELETE` | `/api/v1/rentals/:id` | JWT | Delete rental record |

### Reports Module
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/reports/rentals` | JWT | Monthly activity & revenue report (`?month=YYYY-MM`, optional `?vehicle_id=`) |

---

## 📐 Core Logic & Algorithm Explanations

### 1. Overlap Prevention & Concurrency Control

#### Overlap Formula
Two closed date intervals $[A_{start}, A_{end}]$ and $[B_{start}, B_{end}]$ overlap if and only if:
$$\text{start\_date} \le \text{B.end\_date} \quad \text{AND} \quad \text{end\_date} \ge \text{B.start\_date}$$

In `RentalRepository.findOverlapping`, active bookings (`status IN ('booked', 'ongoing')`) are checked against existing reservations. Cancelled or completed rentals do not block availability.

#### Race Condition Handling (Redis Lock + DB Transaction)
To ensure concurrent booking requests for the same vehicle cannot double-book:
1. **Redis Distributed Lock**: `acquireLock('lock:vehicle:{id}')` prevents simultaneous application processes from entering the booking block.
2. **Database Transaction + Row Lock**: `findOverlapping(..., trx)` executes `FOR UPDATE` lock inside a SQL transaction.

---

### 2. Monthly Revenue Proration & Report Calculation

When requesting a report for a specific month (e.g. `2026-08`), rentals that span across month boundaries (e.g., `2026-07-29` to `2026-08-03`) are clipped so that only the days belonging to August are counted towards August revenue.

#### PostgreSQL Raw SQL CTE Logic (`ReportRepository.getMonthlyReportData`):
```sql
WITH month_bounds AS (
  SELECT
    date_trunc('month', :monthDate::date)::date AS month_start,
    (date_trunc('month', :monthDate::date) + interval '1 month - 1 day')::date AS month_end
),
clipped AS (
  SELECT
    r.id, r.vehicle_id, r.total_amount, r.start_date, r.end_date,
    GREATEST(r.start_date, mb.month_start) AS clip_start,
    LEAST(r.end_date, mb.month_end) AS clip_end
  FROM rentals r
  CROSS JOIN month_bounds mb
  WHERE r.status IN ('booked', 'ongoing', 'completed')
    AND r.start_date <= mb.month_end
    AND r.end_date >= mb.month_start
),
per_rental AS (
  SELECT
    id, vehicle_id,
    (clip_end - clip_start + 1) AS days_in_month,
    total_amount * (clip_end - clip_start + 1)::decimal / NULLIF(end_date - start_date + 1, 0) AS revenue_in_month
  FROM clipped
)
SELECT
  v.id, v.name, v.plate_number, v.category,
  COUNT(pr.id)::int AS total_bookings,
  COALESCE(SUM(pr.days_in_month), 0)::int AS days_rented,
  COALESCE(ROUND(SUM(pr.revenue_in_month), 2), 0)::float AS revenue
FROM vehicles v
LEFT JOIN per_rental pr ON pr.vehicle_id = v.id
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.name, v.plate_number, v.category
ORDER BY revenue DESC, days_rented DESC, v.id ASC;
```

---

## 🧪 Testing & Code Quality

```bash
# Type check using TypeScript Compiler
npx tsc --noEmit

# Run ESLint check
npm run lint

# Format code with Prettier
npm run format

# Run Concurrent Booking Stress Test
npx tsx src/scripts/test_concurrent_rentals.ts
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

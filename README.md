# Vehicle Rental Management Backend API

A production-ready RESTful API backend built with **Node.js**, **Express**, **TypeScript**, **Knex.js**, and **PostgreSQL** for managing vehicle fleets, customer rental bookings, and monthly financial reports.

---

## 1. Project Overview

The Vehicle Rental Management System is a backend solution designed for vehicle rental businesses. It provides staff members with endpoints to manage fleet inventories, record customer rental bookings, prevent overlapping reservation conflicts, and generate monthly financial performance reports per vehicle.

### Core Functional Capabilities
1. **Staff Authentication**: JWT-based authentication for staff members with bcrypt password hashing and rate-limited login endpoints.
2. **Vehicle Fleet Management**: Full CRUD operations for vehicles with soft-delete functionality (`deleted_at`), category filtering, name/plate search, and image file upload processing via Multer.
3. **Rental Booking Engine**: Booking creation and management with server-side automated pricing ($Daily\_Rate \times Days$).
4. **Overlap Prevention**: Application-level overlap validation combined with PostgreSQL transaction row locking (`FOR UPDATE`) and Redis Distributed Locking to guarantee zero double-booking under concurrent traffic.
5. **Prorated Monthly Financial Reports**: SQL Common Table Expressions (CTE) using `GREATEST` and `LEAST` functions to clip date ranges spanning across calendar month boundaries (e.g. July 29 – August 3) and calculate exact prorated daily revenue for any requested month (`YYYY-MM`).

---

## 2. Technology Stack

- **Runtime Environment**: Node.js (v18+)
- **Programming Language**: TypeScript (v5.7)
- **Web Framework**: Express.js (v4.21)
- **Query Builder**: Knex.js (v3.1)
- **Database Engine**: PostgreSQL (v14+)
- **Caching & Distributed Locks**: Redis / ioredis
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcrypt
- **File Upload Storage**: Multer (Local static file storage)
- **Validation**: Joi (v17)
- **Code Quality**: ESLint, Prettier

---

## 3. Architecture & Design Principles

The application is structured following Object-Oriented Programming (OOP) and Clean Layered Architecture patterns:

```
[ Client Request ]
        │
        ▼
  [ Controller ]   <-- Handles Request parsing & HTTP responses
        │
        ▼
   [ Service ]     <-- Implements Business Logic, Pricing & Lock Guard
        │
        ▼
  [ Repository ]  <-- Executes Knex query builder & PostgreSQL Raw SQL
        │
        ▼
[ PostgreSQL / Redis ]
```

- **Modular Separation**: Decoupled domain modules (`auth`, `vehicles`, `rentals`, `reports`) containing isolated routes, controllers, services, repositories, validators, and types.
- **Concurrency Safety**: Two-tier locking strategy using Redis key locks (`acquireLock`) alongside database transactional row locks (`FOR UPDATE`).
- **Type Definitions**: Static typing across all request payloads, query parameters, responses, and Express Request context extensions (`req.user`).

---

## 4. Database Schema & ERD

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

---

## 5. Database Migrations & Seeds

### Purpose of Migration Files
Migration files serve as version-controlled database schema definitions written in TypeScript. Executing migrations builds all tables, foreign keys, unique constraints, and indexes on an empty database without requiring manual SQL creation.

### Migration Files (`src/db/migrations/`)
1. `20260801_000001_create_staff.ts`: Defines the `staff` user table.
2. `20260801_000002_create_vehicles.ts`: Defines the `vehicles` table with partial index on `deleted_at`.
3. `20260801_000003_create_rentals.ts`: Defines the `rentals` table with foreign keys and index constraints.

### Seed Files (`src/db/seeds/`)
- `001_staff.ts`: Seeds default administrator staff credentials.
- `002_vehicles.ts`: Seeds sample vehicle fleet data across categories.
- `003_rentals.ts`: Seeds sample rental bookings, including a boundary-spanning booking (`2026-07-29` to `2026-08-03`) to enable report testing.

---

## 6. Installation & Setup Instructions

### Prerequisites
- Node.js (v18.x or higher)
- PostgreSQL (v14.x or higher)
- Redis Server (Optional, connects via `REDIS_URL`)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/twahanur/Vehicle-Rent-Management.git
cd Vehicle-Rent-Management
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to create a `.env` file:
```bash
cp .env.example .env
```

Configure parameters in `.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vehicle_rental
DB_POOL_MIN=2
DB_POOL_MAX=10
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=8h
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5
RATE_LIMIT_WINDOW_MIN=15
RATE_LIMIT_MAX=5
REDIS_URL=redis://localhost:6379
```

### Step 3: Run Database Migrations & Seeds
```bash
# Execute schema migrations
npm run migrate:latest

# Populate database with seed data
npm run seed:run
```

### Step 4: Run Application
```bash
# Start development server with hot-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Default Credentials
- **Email**: `admin@rental.com`
- **Password**: `Password123!`

---

## 7. API Reference

### Authentication Endpoints
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticate staff member and receive JWT token |
| `GET` | `/api/v1/auth/me` | JWT | Get current authenticated staff profile |
| `POST` | `/api/v1/auth/change-password` | JWT | Change staff account password |

### Vehicle Management Endpoints
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/vehicles` | JWT | List vehicles with pagination (`?page=`, `?limit=`), `?category=`, and `?search=` |
| `GET` | `/api/v1/vehicles/:id` | JWT | Retrieve vehicle by ID |
| `POST` | `/api/v1/vehicles` | JWT | Create vehicle (`multipart/form-data` with `photo` upload) |
| `PUT` | `/api/v1/vehicles/:id` | JWT | Update vehicle details (supports optional photo replacement) |
| `DELETE` | `/api/v1/vehicles/:id` | JWT | Soft-delete vehicle (`deleted_at` timestamp) |
| `GET` | `/api/v1/vehicles/:id/availability` | JWT | Check vehicle availability for specified date range |

### Rental Endpoints
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/rentals` | JWT | List rentals (`?vehicle_id=`, `?status=`, `?start_date=`, `?end_date=`) |
| `GET` | `/api/v1/rentals/:id` | JWT | Retrieve rental details by ID |
| `POST` | `/api/v1/rentals` | JWT | Create rental (validates overlap & calculates total amount) |
| `PUT` | `/api/v1/rentals/:id` | JWT | Update rental (re-validates overlap on date/vehicle modification) |
| `PATCH` | `/api/v1/rentals/:id/status` | JWT | Update rental status (`booked`, `ongoing`, `completed`, `cancelled`) |
| `DELETE` | `/api/v1/rentals/:id` | JWT | Delete rental record |

### Financial Report Endpoints
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/v1/reports/rentals` | JWT | Retrieve monthly activity and revenue report (`?month=YYYY-MM`, optional `?vehicle_id=`) |

---

## 8. Core Algorithm Explanations

### Overlap Check Formula
Two closed date intervals $[A_{start}, A_{end}]$ and $[B_{start}, B_{end}]$ overlap if and only if:
$$\text{start\_date} \le \text{B.end\_date} \quad \text{AND} \quad \text{end\_date} \ge \text{B.start\_date}$$

The query filters active reservations (`status IN ('booked', 'ongoing')`) so cancelled or completed rentals do not block availability.

### Monthly Revenue Proration Query
When generating a report for a target month (e.g. `2026-08`), rentals spanning month boundaries (e.g., `2026-07-29` to `2026-08-03`) are clipped to count only days falling strictly inside the target month:

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

## 9. Code Quality & Testing

```bash
# Perform TypeScript type-checking
npx tsc --noEmit

# Run ESLint checks
npm run lint

# Format codebase with Prettier
npm run format

# Run concurrent booking stress test
npx tsx src/scripts/test_concurrent_rentals.ts
```

---

## 10. Repository & Contact Details

- **GitHub Repository**: [https://github.com/twahanur/Vehicle-Rent-Management](https://github.com/twahanur/Vehicle-Rent-Management)
- **Developer Name**: Twahanur Rahman
- **Portfolio**: [https://twahanur.dev](https://twahanur.dev)
- **GitHub Profile**: [https://github.com/twahanur](https://github.com/twahanur)
- **LinkedIn**: [https://linkedin.com/in/twahanur](https://linkedin.com/in/twahanur)
- **Email**: [twahanur.rahman@gmail.com](mailto:twahanur.rahman@gmail.com)

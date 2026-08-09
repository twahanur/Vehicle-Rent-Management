# Vehicle Rental Management Backend API

A production-ready RESTful API built with **Node.js**, **Express**, **TypeScript**, **Knex.js**, and **PostgreSQL (Neon DB)** for a vehicle rental company.

---

## 📌 Architecture & Design Highlights

- **Modular Architecture**: Feature-based folder structure (`auth`, `vehicles`, `rentals`, `reports`). Each module owns its routes, controllers, services, repositories, validators, and types.
- **Database Migrations & Seeds**: Native Knex migrations with indexed query optimization.
- **Transaction-Safe Booking**: Overlap check logic executed inside database transactions using `FOR UPDATE` row locking to prevent double-booking race conditions.
- **Date Interval Clipping Report**: SQL CTE query utilizing `GREATEST`/`LEAST` functions to accurately clip rental date ranges and prorate daily revenues for any requested month (`YYYY-MM`).
- **Input Validation**: Joi schemas for request body, URL parameters, and query string sanitization.
- **Security**: Password hashing with `bcrypt`, JWT token authentication with custom Express Request type extension, and login rate limiting.

---

## 🗄️ Database Schema Design

### ERD Diagram

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

### Schema Files
- [src/db/schema.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/schema.ts): Centralized database schema interfaces and table constants.
- Migration 1: [create_staff.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000001_create_staff.ts)
- Migration 2: [create_vehicles.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000002_create_vehicles.ts)
- Migration 3: [create_rentals.ts](file:///home/twahanur/Development/Vehicle%20Management/src/db/migrations/20260801_000003_create_rentals.ts)

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL or Neon DB connection string

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

Example `.env` configuration:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://neondb_owner:YOUR_KEY@ep-lively-queen-aoj46q60-pooler.c-2.ap-southeast-1.aws.neon.tech/car-rental-management?sslmode=require
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=8h
UPLOAD_DIR=uploads
```

### 3. Installation & Migrations

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate:latest

# Seed default admin user & sample vehicles/rentals
npm run seed:run
```

### 4. Running the Server

```bash
# Development mode with hot-reload
npm run dev

# Production build
npm run build
npm start
```

---

## 🔑 Default Seed Account

- **Email**: `admin@rental.com`
- **Password**: `Password123!`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticate staff member & return JWT token |
| `GET` | `/api/v1/vehicles` | JWT Required | List vehicles (`?page=`, `?limit=`, `?category=`, `?search=`) |
| `GET` | `/api/v1/vehicles/:id` | JWT Required | Get vehicle by ID |
| `POST` | `/api/v1/vehicles` | JWT Required | Create vehicle (supports `multipart/form-data` photo upload) |
| `PUT` | `/api/v1/vehicles/:id` | JWT Required | Update vehicle |
| `DELETE` | `/api/v1/vehicles/:id` | JWT Required | Soft-delete vehicle (`deleted_at` timestamp) |
| `GET` | `/api/v1/rentals` | JWT Required | List rentals (`?vehicle_id=`, `?status=`, `?start_date=`, `?end_date=`) |
| `GET` | `/api/v1/rentals/:id` | JWT Required | Get rental by ID |
| `POST` | `/api/v1/rentals` | JWT Required | Create rental (validates date overlaps & calculates total amount) |
| `PUT` | `/api/v1/rentals/:id` | JWT Required | Update rental (re-triggers overlap check on date change) |
| `DELETE` | `/api/v1/rentals/:id` | JWT Required | Delete rental record |
| `GET` | `/api/v1/reports/rentals` | JWT Required | Get monthly revenue report (`?month=YYYY-MM`, optional `?vehicle_id=`) |

---

## 📐 Key Algorithm Explanations

### 1. Overlap Check Formula
Two closed date intervals `[startA, endA]` and `[startB, endB]` overlap if and only if:
$$\text{startA} \le \text{endB} \quad \text{AND} \quad \text{startB} \le \text{endA}$$

This query filters only active rentals (`status IN ('booked', 'ongoing')`) so cancelled or completed rentals do not block availability.

### 2. Monthly Report Date Clipping
When generating a report for month `YYYY-MM` (e.g. `2026-08`), a rental spanning `2026-07-29` to `2026-08-03` is clipped using SQL:
- `clip_start = GREATEST(start_date, month_start)` -> `2026-08-01`
- `clip_end = LEAST(end_date, month_end)` -> `2026-08-03`
- `days_in_month = clip_end - clip_start + 1` -> `3 days`
- `prorated_revenue = total_amount * (days_in_month / total_rental_days)`

---

## 🧪 Testing

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run end-to-end automated verification script
npx tsx "../../.gemini/antigravity-ide/brain/f1a04757-605c-4849-91a1-6067b0a984eb/scratch/test_e2e.ts"
```

# Vehicle Rental Management API - Complete Routes Specification

This document lists all available API endpoints in the Vehicle Rental Management system, including Authentication, Vehicle Fleet Management, Rental Booking, Revenue Reports, and Interactive Documentation.

---

## 📌 Route Summary Table

| Method | Endpoint | Protection | Query / Body Parameters | Description |
|---|---|---|---|---|
| `GET` | `/` | Public | None | Health check & API version |
| `GET` | `/api-docs` | Public | None | Interactive Swagger UI Documentation |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | `email`, `password` | Authenticate staff & get JWT token |
| `GET` | `/api/v1/auth/me` | JWT Token | None | Get currently logged-in staff profile |
| `POST` | `/api/v1/auth/change-password` | JWT Token | `current_password`, `new_password` | Change staff account password |
| `GET` | `/api/v1/vehicles` | JWT Token | `page`, `limit`, `category`, `search` | List paginated vehicles with filters |
| `GET` | `/api/v1/vehicles/stats/summary` | JWT Token | None | Fleet status overview (Total, Active, Soft-Deleted) |
| `GET` | `/api/v1/vehicles/:id` | JWT Token | Path parameter: `id` | Get single vehicle details by ID |
| `GET` | `/api/v1/vehicles/:id/availability` | JWT Token | `start_date`, `end_date` | Check if vehicle is free for a date range |
| `POST` | `/api/v1/vehicles` | JWT Token | `name`, `plate_number`, `category`, `daily_rate`, `photo` (file) | Create a new vehicle |
| `PUT` | `/api/v1/vehicles/:id` | JWT Token | `name`, `plate_number`, `category`, `daily_rate`, `photo` (file) | Update existing vehicle details |
| `DELETE` | `/api/v1/vehicles/:id` | JWT Token | Path parameter: `id` | Soft-delete vehicle (`deleted_at`) |
| `GET` | `/api/v1/rentals` | JWT Token | `page`, `limit`, `vehicle_id`, `status`, `start_date`, `end_date` | List paginated rentals with filters |
| `GET` | `/api/v1/rentals/:id` | JWT Token | Path parameter: `id` | Get single rental details by ID |
| `POST` | `/api/v1/rentals` | JWT Token | `vehicle_id`, `customer_name`, `customer_phone`, `start_date`, `end_date` | Create new rental (checks overlap & calculates total) |
| `PUT` | `/api/v1/rentals/:id` | JWT Token | `vehicle_id`, `customer_name`, `customer_phone`, `start_date`, `end_date`, `status` | Update rental (re-checks overlap on date change) |
| `PATCH` | `/api/v1/rentals/:id/status` | JWT Token | `status` (`booked`, `ongoing`, `completed`, `cancelled`) | Quick update rental status |
| `DELETE` | `/api/v1/rentals/:id` | JWT Token | Path parameter: `id` | Hard delete rental record |
| `GET` | `/api/v1/reports/rentals` | JWT Token | `month` (YYYY-MM), `vehicle_id` (optional) | Monthly revenue report with prorated date clipping |

---

## 🔍 Detailed Endpoint Documentation

### 1. Health Check
- **Route**: `GET /`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Vehicle Rental Management API is running",
    "version": "1.0.0",
    "documentation": "/api-docs"
  }
  ```

### 2. Swagger API Playground
- **Route**: `GET /api-docs`
- **Description**: Interactive UI to view and test all endpoints directly in the browser.

### 3. Staff Login
- **Route**: `POST /api/v1/auth/login`
- **Body**: `{ "email": "admin@rental.com", "password": "Password123!" }`

### 4. Get Logged-in Staff Profile
- **Route**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: `200 OK` (Returns staff ID, email, name, timestamps)

### 5. Change Password
- **Route**: `POST /api/v1/auth/change-password`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**: `{ "current_password": "Password123!", "new_password": "NewPassword123!" }`

### 6. Fleet Statistics Summary
- **Route**: `GET /api/v1/vehicles/stats/summary`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "total_vehicles": 5,
      "active_vehicles": 4,
      "deleted_vehicles": 1
    }
  }
  ```

### 7. Vehicle Date Range Availability Check
- **Route**: `GET /api/v1/vehicles/:id/availability?start_date=2026-09-01&end_date=2026-09-05`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "vehicle_id": 1,
      "vehicle_name": "Toyota Camry",
      "daily_rate": 100,
      "start_date": "2026-09-01",
      "end_date": "2026-09-05",
      "is_available": true,
      "conflicting_rentals_count": 0
    }
  }
  ```

### 8. Quick Rental Status Update
- **Route**: `PATCH /api/v1/rentals/:id/status`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**: `{ "status": "completed" }`
- **Response**: `200 OK`

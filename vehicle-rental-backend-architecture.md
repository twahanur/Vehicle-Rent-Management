# Vehicle Rental Management Backend — Architecture & Plan

## 1. Tech Stack (Final)

| Concern | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime/Framework | Node.js + Express |
| Query builder | Knex.js |
| DB | PostgreSQL (pg driver) |
| Validation | Joi |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File upload | Multer (disk storage) |
| Lint/format | ESLint + Prettier |
| Env | dotenv |
| Rate limit (bonus) | express-rate-limit |

Reasoning: Postgres over MySQL because we need `tstzrange`/`daterange` overlap operators (`&&`) for a
provably-correct overlap check, and `GREATEST`/`LEAST` + `generate_series` for the report — all native
and clean in Postgres.

---

## 2. Folder Structure (Modular / Feature-based — OOP inside each module)

Each business feature is a self-contained **module**: its own routes, controller, service, repository,
validator, types, and any middleware unique to that feature all live together. Only truly cross-cutting
infrastructure (DB connection, error classes, the generic error handler, migrations/seeds) sits in
`common/` and `db/`, since those aren't owned by any single feature.

```
vehicle-rental-backend/
├── src/
│   ├── config/
│   │   ├── env.ts                    # parses & validates process.env once
│   │   └── knex.ts                   # knex instance (pool config from env)
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 20260801_000001_create_staff.ts
│   │   │   ├── 20260801_000002_create_vehicles.ts
│   │   │   └── 20260801_000003_create_rentals.ts
│   │   └── seeds/
│   │       ├── 001_staff.ts
│   │       ├── 002_vehicles.ts
│   │       └── 003_rentals.ts        # includes a rental spanning a month boundary
│   ├── common/
│   │   ├── errors/
│   │   │   ├── AppError.ts           # base class: statusCode + message
│   │   │   ├── NotFoundError.ts
│   │   │   ├── ConflictError.ts      # for 409 overlap
│   │   │   └── ValidationError.ts
│   │   ├── middlewares/
│   │   │   ├── validate.middleware.ts    # generic Joi-schema runner (module validators plug into this)
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── notFoundRoute.middleware.ts
│   │   ├── types/
│   │   │   ├── express/index.d.ts    # augments Request with req.user
│   │   │   └── api-response.types.ts # ApiSuccess<T> / ApiError shared envelope
│   │   └── utils/
│   │       ├── asyncHandler.ts
│   │       └── pagination.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts        # reads from `staff` table
│   │   │   ├── auth.validator.ts         # Joi: login schema
│   │   │   ├── auth.middleware.ts        # verifyJwt — imported by OTHER modules' routes too
│   │   │   ├── rateLimiter.middleware.ts # only guards POST /auth/login
│   │   │   └── auth.types.ts
│   │   ├── vehicles/
│   │   │   ├── vehicle.routes.ts
│   │   │   ├── vehicle.controller.ts
│   │   │   ├── vehicle.service.ts
│   │   │   ├── vehicle.repository.ts
│   │   │   ├── vehicle.validator.ts
│   │   │   ├── vehicle.upload.middleware.ts  # multer config for photo field
│   │   │   └── vehicle.types.ts
│   │   ├── rentals/
│   │   │   ├── rental.routes.ts
│   │   │   ├── rental.controller.ts
│   │   │   ├── rental.service.ts             # overlap check + total_amount calc live here
│   │   │   ├── rental.repository.ts          # findOverlapping(), transaction-wrapped create()
│   │   │   ├── rental.validator.ts
│   │   │   └── rental.types.ts
│   │   └── reports/
│   │       ├── report.routes.ts
│   │       ├── report.controller.ts
│   │       ├── report.service.ts
│   │       ├── report.repository.ts          # the clipping/prorating SQL lives here
│   │       ├── report.validator.ts           # Joi: month=YYYY-MM format
│   │       └── report.types.ts
│   ├── routes/
│   │   └── index.ts                  # mounts: /auth, /vehicles, /rentals, /reports
│   ├── app.ts                        # express app assembly (global middlewares + routes/index)
│   └── server.ts                     # bootstraps app.listen()
├── uploads/                          # local photo storage (gitignored, keep .gitkeep)
├── .env.example
├── .env                              # gitignored
├── .eslintrc.json
├── .prettierrc
├── knexfile.ts
├── tsconfig.json
├── package.json
└── README.md
```

**Rules for this structure:**
- **Ownership:** if a piece of logic only serves one feature (vehicle photo upload, rental overlap check,
  report clipping SQL), it lives inside that module's folder — not in a shared top-level folder.
- **Cross-module reuse is via import, not duplication.** `auth.middleware.ts` (JWT verify) is written once
  inside `modules/auth/`, but `vehicle.routes.ts`, `rental.routes.ts`, and `report.routes.ts` all `import
  { verifyJwt } from '../auth/auth.middleware'` and apply it to their routers. It stays "owned" by auth,
  just consumed elsewhere — this is normal and doesn't break modularity.
- **Layering inside each module is still strict:** `routes → controller → service → repository → knex`.
  A module's controller never imports knex directly; only that module's own repository does.
- **`common/` is intentionally thin** — only things with zero business meaning (error base classes, the
  global error-handling middleware, the generic Joi-validation runner, shared TS types). If in doubt,
  the logic belongs inside a module, not in `common/`.
- **`db/migrations` and `db/seeds` stay centralized**, not split per-module — Knex's migration runner
  needs one consistent source of truth and ordered timestamps across all tables, and rentals' migration
  depends on vehicles' migration already having run (FK), so splitting them per-module would just add
  cross-folder coupling without benefit.
- `routes/index.ts` is the only place that knows about all four modules at once — it just mounts each
  module's router under its base path:
  ```ts
  router.use('/auth', authRoutes);
  router.use('/vehicles', vehicleRoutes);
  router.use('/rentals', rentalRoutes);
  router.use('/reports', reportRoutes);
  ```

---

## 3. Database Schema (ERD, text form)

```
staff                        vehicles                         rentals
------------------           ------------------------         ---------------------------
id PK                        id PK                             id PK
email UNIQUE NOT NULL        name NOT NULL                     vehicle_id FK -> vehicles.id
password_hash NOT NULL       plate_number UNIQUE NOT NULL       customer_name NOT NULL
name NOT NULL                category NOT NULL                 customer_phone NOT NULL
created_at, updated_at       daily_rate DECIMAL(10,2) NOT NULL  start_date DATE NOT NULL
                              photo_path NULL                   end_date DATE NOT NULL
                              deleted_at NULL                   total_amount DECIMAL(10,2) NOT NULL
                              created_at, updated_at             status ENUM(...) DEFAULT 'booked'
                                                                  created_at, updated_at
```

Indexes to add in migration (not strictly asked, but defend these in review):
- `vehicles.plate_number` — unique index (required anyway)
- `rentals.vehicle_id` — btree index, since every overlap check filters by it
- `rentals(vehicle_id, start_date, end_date)` composite — speeds up the overlap query
- `vehicles.deleted_at` — partial index `WHERE deleted_at IS NULL` for the common "active vehicles" filter

`staff` table has no `deleted_at` — not asked for, keep scope tight.

---

## 4. Auth Flow

1. `POST /auth/login` — Joi validates `{email, password}`.
2. `AuthService.login`: fetch staff by email → `bcrypt.compare` → if fail, throw 401.
3. On success, sign JWT: payload `{ id, email }`, `expiresIn: '8h'` (configurable via env).
4. `auth.middleware.ts` on protected routes: reads `Authorization: Bearer <token>`, verifies, attaches
   `req.user = { id, email }`. Missing/invalid token → 401.
5. Express `Request` type augmented in `types/express/index.d.ts`:
   ```ts
   declare global {
     namespace Express {
       interface Request {
         user?: { id: number; email: string };
       }
     }
   }
   ```
6. Rate limiting (bonus) applied only on `/auth/login` — e.g. 5 requests / 15 min per IP, via
   `express-rate-limit`, mounted before the login route.

---

## 5. The Overlap Check — this is the part to defend in review

**Rule:** Two rentals for the *same vehicle* conflict if their date ranges intersect AND both are
"active" (active = status in `booked` or `ongoing`; `cancelled`/`completed` never block).

Two inclusive date ranges `[startA, endA]` and `[startB, endB]` overlap **iff**:
```
startA <= endB AND endB >= startA   →  simplified to the standard interval-overlap test:
startA <= endB  AND  startB <= endA
```
This is the classic "do two closed intervals intersect" formula — it correctly handles same-day
overlaps, partial overlaps, and one range fully containing another, with no edge-case gaps.

Repository method (`rental.repository.ts`):

```ts
async findOverlapping(
  vehicleId: number,
  startDate: string,
  endDate: string,
  excludeRentalId?: number,
): Promise<Rental[]> {
  const query = knex('rentals')
    .where('vehicle_id', vehicleId)
    .whereIn('status', ['booked', 'ongoing'])
    .andWhere('start_date', '<=', endDate)
    .andWhere('end_date', '>=', startDate);

  if (excludeRentalId) {
    query.andWhereNot('id', excludeRentalId);
  }
  return query;
}
```

- On **create**: call this with the new dates, no exclusion. If any rows return → throw `ConflictError`
  (409).
- On **update** (only when `start_date`/`end_date`/`vehicle_id` actually change): call this with
  `excludeRentalId = current rental's id`, so the rental doesn't conflict with itself.

**Bonus — transaction-safe booking:** two people hitting `POST /rentals` for the same vehicle at the
same instant is a race condition — both could pass the overlap check before either commits. Fix:

```ts
await knex.transaction(async (trx) => {
  // SELECT ... FOR UPDATE locks the matching vehicle rows for the duration of the transaction
  const conflicts = await trx('rentals')
    .where('vehicle_id', vehicleId)
    .whereIn('status', ['booked', 'ongoing'])
    .andWhere('start_date', '<=', endDate)
    .andWhere('end_date', '>=', startDate)
    .forUpdate();

  if (conflicts.length > 0) throw new ConflictError('Vehicle already booked for these dates');

  const [rental] = await trx('rentals').insert({...}).returning('*');
  return rental;
});
```
`FOR UPDATE` takes row locks on any existing overlapping rentals for that vehicle, so a second concurrent
transaction querying the same vehicle blocks until the first commits/rolls back — then re-evaluates with
up-to-date data. (If there are zero existing rows to lock — e.g. vehicle's first-ever rental — Postgres
can't lock "nothing"; that's an accepted, documented limitation. Mitigation if needed: a Postgres advisory
lock keyed on `vehicle_id`, taken at the top of the transaction, closes this last gap.)

`total_amount` calculation (server-side, inclusive-day rule):
```ts
const days = Math.floor(
  (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
) + 1;   // same start/end date => 1 day
const totalAmount = round2(days * dailyRate);
```

---

## 6. The Monthly Report Query — clipping days to the requested month

**Rule:** For `GET /reports/rentals?month=2026-08`, a rental running **Jul 29 → Aug 3** should contribute
only the 3 days that fall inside August (Aug 1, 2, 3), not all 6.

This is an interval-clipping problem: clip `[start_date, end_date]` against `[month_start, month_end]`
using `GREATEST`/`LEAST`, then count days in the clipped range.

```sql
WITH month_bounds AS (
  SELECT
    date_trunc('month', :month::date)::date AS month_start,
    (date_trunc('month', :month::date) + interval '1 month - 1 day')::date AS month_end
),
clipped AS (
  SELECT
    r.id,
    r.vehicle_id,
    r.total_amount,
    r.start_date,
    r.end_date,
    GREATEST(r.start_date, mb.month_start) AS clip_start,
    LEAST(r.end_date, mb.month_end)        AS clip_end
  FROM rentals r
  CROSS JOIN month_bounds mb
  WHERE r.status IN ('booked','ongoing','completed')   -- cancelled rentals don't count
    AND r.start_date <= mb.month_end
    AND r.end_date   >= mb.month_start                  -- only rentals that actually touch this month
),
per_rental AS (
  SELECT
    id,
    vehicle_id,
    (clip_end - clip_start + 1) AS days_in_month,        -- inclusive day count, clipped
    -- revenue is prorated: (days actually in month / total rental days) * total_amount
    total_amount * (clip_end - clip_start + 1)::decimal
      / (end_date - start_date + 1) AS revenue_in_month
  FROM clipped
)
SELECT
  v.id,
  v.name,
  COUNT(pr.id)                         AS total_bookings,
  COALESCE(SUM(pr.days_in_month), 0)   AS days_rented,
  COALESCE(ROUND(SUM(pr.revenue_in_month), 2), 0) AS revenue
FROM vehicles v
LEFT JOIN per_rental pr ON pr.vehicle_id = v.id
WHERE v.deleted_at IS NULL
  AND (:vehicle_id::int IS NULL OR v.id = :vehicle_id)
GROUP BY v.id, v.name
ORDER BY revenue DESC;
```

Why revenue is **prorated** (not the full `total_amount` counted for any rental that merely touches the
month): the spec says "only count days/revenue that fall inside the requested month" — days are explicitly
clipped, so revenue must be derived from the clipped days too, otherwise a 6-day rental worth $600 would
report $600 in August for 3 days of actual August usage. Prorating by `days_in_month / total_days` keeps
revenue and days consistent (`revenue / days_in_month == daily_rate`, always).

Top vehicle is just `ORDER BY revenue DESC LIMIT 1` on the same result set — computed in the service layer
by taking `results[0]` after the query above, no second query needed.

This whole thing is wrapped in `ReportService.getMonthlyReport(month, vehicleId?)`, which:
1. validates `month` matches `YYYY-MM`,
2. calls `ReportRepository.getMonthlyReport(...)`,
3. shapes the response: `{ month, vehicles: [...], topVehicle: {...} | null }`.

---

## 7. API Surface (with types)

```
POST   /auth/login                     public
GET    /vehicles                       auth  ?page=&limit=&category=&search=
GET    /vehicles/:id                   auth
POST   /vehicles                       auth  multipart/form-data (photo field)
PUT    /vehicles/:id                   auth  multipart/form-data (photo optional)
DELETE /vehicles/:id                   auth  soft delete (sets deleted_at)

GET    /rentals                        auth  ?vehicle_id=&status=&start_date=&end_date=&page=&limit=
GET    /rentals/:id                    auth
POST   /rentals                        auth
PUT    /rentals/:id                    auth
DELETE /rentals/:id                    auth

GET    /reports/rentals                auth  ?month=YYYY-MM&vehicle_id=
```

Response envelope (consistent across all endpoints):
```ts
type ApiSuccess<T> = { success: true; data: T; meta?: { page, limit, total } };
type ApiError = { success: false; error: { message: string; code?: string } };
```

Key request/response types (`types/rental.types.ts`):
```ts
export interface CreateRentalBody {
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;   // YYYY-MM-DD
  end_date: string;
}

export interface RentalResponse {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'booked' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
```
Same pattern for `vehicle.types.ts`, `report.types.ts`, `staff.types.ts`. Every controller method is typed
`(req: Request, res: Response<ApiSuccess<X> | ApiError>, next: NextFunction) => Promise<void>`.

---

## 8. Error Handling

- Custom error classes (`AppError` base, subclasses set `statusCode`).
- Every service throws; controllers `try { } catch (e) { next(e) }` or wrapped in a shared
  `asyncHandler` util to avoid repeating try/catch.
- Single `errorHandler.middleware.ts` at the end of the middleware chain: known `AppError` → its status
  code + message; unknown errors → 500 + generic message (never leak stack trace in production).

---

## 9. Environment Variables (`.env.example`)

```
NODE_ENV=development
PORT=4000

DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vehicle_rental
DB_POOL_MIN=2
DB_POOL_MAX=10

JWT_SECRET=change_me
JWT_EXPIRES_IN=8h

UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5

RATE_LIMIT_WINDOW_MIN=15
RATE_LIMIT_MAX=5
```
`config/env.ts` validates all of these at boot with a small Joi schema — fail fast if anything's missing,
instead of discovering it mid-request.

---

## 10. Migrations & Seeds Plan

Order matters (FK dependency): `staff` → `vehicles` → `rentals`.

Seed data (`003_rentals.ts`) must include, at minimum:
- 2–3 vehicles, a few normal non-overlapping rentals per vehicle,
- **one rental spanning a month boundary** (e.g. `2026-07-29` → `2026-08-03`) so
  `GET /reports/rentals?month=2026-08` and `?month=2026-07` both have something real to clip and prove
  correct,
- one `cancelled` rental that *would* overlap another if it counted, to prove cancelled rentals are
  correctly excluded from both the overlap check and the report.

`npx knex migrate:latest && npx knex seed:run` should build cleanly on an empty DB — no manual steps.

---

## 11. Build Order (how I'll actually implement this, step by step)

1. Project scaffold: `package.json`, `tsconfig.json`, ESLint/Prettier, `.env.example`, `knexfile.ts`.
2. Migrations for all 3 tables + indexes → verify `migrate:latest` on empty DB.
3. Seeds (including the month-boundary rental).
4. `config/env.ts`, `config/knex.ts`, error classes, `errorHandler` middleware, `asyncHandler` util.
5. Auth: staff repository → auth service (bcrypt + JWT) → auth controller/route → auth middleware →
   rate limiter on login.
6. Vehicles: repository → service (incl. soft delete, pagination/filter/search) → Joi validators →
   Multer config → controller/routes.
7. Rentals: repository (incl. `findOverlapping`) → service (overlap check + total_amount calc +
   transaction) → validators → controller/routes.
8. Reports: repository (the clipping SQL above) → service → controller/route.
9. README with setup/run steps, Postman collection or curl examples.
10. Final pass: confirm every route is JWT-protected except `/auth/login`, confirm 409 on overlap,
    confirm report math against hand-calculated expected values for the seeded boundary rental.

---

## 12. Things I'll be ready to explain in review

- Why the overlap formula `startA <= endB AND startB <= endA` is provably correct for closed intervals.
- Why revenue is prorated in the report, not just "full amount if touches the month."
- Why `FOR UPDATE` (+ optional advisory lock) is used instead of relying on a unique constraint — there's
  no clean column-level constraint for range-overlap-on-insert without a Postgres exclusion constraint
  (`EXCLUDE USING gist`), which is a valid alternative I can discuss trade-offs on if asked.
- Why soft delete uses `deleted_at` instead of a boolean `is_deleted` — timestamp doubles as an audit trail.

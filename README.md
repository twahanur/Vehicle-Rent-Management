# 🚗 Vehicle Rental Management Backend API

A RESTful API backend built with **Node.js**, **Express**, **TypeScript**, **Knex.js**, and **PostgreSQL** for managing vehicle fleets, customer rental bookings, and monthly financial reports.

---

## 📖 1. Project Overview (প্রজেক্ট ওভারভিউ)

এটি একটি কার রেন্টাল কোম্পানির ব্যাকএন্ড সিস্টেম। এই ব্যাকএন্ডের প্রধান কাজগুলো হলো:

1. **Staff Authentication**: স্টাফ লগইন (JWT টোকেন দিয়ে) ও সিকিউরিটি।
2. **Vehicle Fleet Management**: গাড়ির তথ্য যোগ করা, আপডেট করা, ছবি আপলোড (Multer), তালিকা দেখা এবং সফট-ডিলিট (Soft Delete) করা।
3. **Rental Booking System**: গ্রাহকের বুকিং নেওয়া এবং সার্ভার-সাইডে ভাড়া হিসাব করা ($Daily\_Rate \times Days$).
4. **Double Booking Prevention**: একই গাড়ি একই তারিখে যেন দু'বার বুক না হতে পারে, সেজন্য অ্যাপ লেভেলে ওভারল্যাপ চেকিং, ডাটাবেজ ট্রানজেকশন লকিং (`FOR UPDATE`) এবং Redis Distributed Locking ব্যবহার করা হয়েছে।
5. **Monthly Revenue Report**: কোনো নির্দিষ্ট মাসের (যেমন `2026-08`) গাড়ির পারফরম্যান্স ও আয়ের রিপোর্ট। একাধিক মাসজুড়ে থাকা বুকিংয়ের ক্ষেত্রে শুধু উক্ত মাসের দিন ও আয় হিসাব করা হয়।

---

## 🗄 2. Database Migrations & Seeds (মাইগ্রেশন ও সিড ফাইল কী এবং কেন?)

### ❓ মাইগ্রেশন (Migration) ফাইল কী?
ডাটাবেজ মাইগ্রেশন ফাইল হলো এমন কিছু কোড ফাইল (Script), যা খালি ডাটাবেজে (Empty Database) টেবিলগুলো নিজে নিজে সঠিক নিয়ম অনুযায়ী তৈরি করে। 

### ❓ কেন মাইগ্রেশন প্রয়োজন এবং README-তে কেন লেখা হয়েছে?
- **রিকোয়ারমেন্ট অনুযায়ী**: প্রজেক্টের রিকোয়ারমেন্টে বলা হয়েছে *"Schema should build cleanly on an empty database using migrations"*.
- **স্বয়ংক্রিয় টেবিল তৈরি**: ম্যানুয়ালি SQL কোড বা PgAdmin এ টেবিল না বানিয়ে একটিমাত্র কমান্ড (`npm run migrate:latest`) দিলে প্রজেক্টের সব টেবিল সঠিক সম্পর্কের (Foreign Key, Unique Key, Indexes) সাথে তৈরি হয়ে যাবে।

### 📋 মাইগ্রেশন ফাইলসমূহ (`src/db/migrations/`):
1. **`20260801_000001_create_staff.ts`**: `staff` টেবিল তৈরি করে (id, email, password_hash, name, timestamps)।
2. **`20260801_000002_create_vehicles.ts`**: `vehicles` টেবিল তৈরি করে (id, name, plate_number, category, daily_rate, photo_path, deleted_at, timestamps)।
3. **`20260801_000003_create_rentals.ts`**: `rentals` টেবিল তৈরি করে (id, vehicle_id FK, customer_name, customer_phone, start_date, end_date, total_amount, status, timestamps)।

### 🌾 সিড (Seed) ফাইল কী?
সিড ফাইল হলো ডামি টেস্ট ডাটা যা ডাটাবেজে শুরুতে প্রবেশ করানো হয়।
- **`src/db/seeds/001_staff.ts`**: টেস্ট করার জন্য ডিফল্ট অ্যাডমিন স্টাফ তৈরি করে (`admin@rental.com` / `Password123!`).
- **`src/db/seeds/002_vehicles.ts`**: নমুনা গাড়ির ডাটা তৈরি করে।
- **`src/db/seeds/003_rentals.ts`**: রেন্টাল ডাটা তৈরি করে, যার মধ্যে একটি বুকিং `2026-07-29` থেকে `2026-08-03` পর্যন্ত রাখা হয়েছে যাতে মাসের সীমানা অতিক্রম করার হিসাব টেস্ট করা যায়।

---

## 🚀 3. Quick Setup & Run Instructions (প্রজেক্ট চালানোর নিয়ম)

### Step 1: Clone & Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables (`.env`)
`.env.example` ফাইল কপি করে `.env` ফাইল তৈরি করুন:
```bash
cp .env.example .env
```

`.env` ফাইলে আপনার ডাটাবেজ লিংক দিন:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vehicle_rental
JWT_SECRET=your_jwt_secret_key
UPLOAD_DIR=uploads
```

### Step 3: Run Database Migrations & Seeds
ডাটাবেজে টেবিল তৈরি করা এবং প্রাথমিক ডাটা ঢোকানোর জন্য এই কমান্ড দুটি চালান:
```bash
# ১. ডাটাবেজ টেবিল তৈরি করতে
npm run migrate:latest

# ২. টেস্ট ডাটা ডাটাবেজে ইনসার্ট করতে
npm run seed:run
```

### Step 4: Start the Application
```bash
# ডেভেলপমেন্ট মোডে চালাতে (Hot Reload)
npm run dev

# প্রোডাকশন বিল্ড ও রান করতে
npm run build
npm start
```

---

## 🔑 Default Login Credentials
- **Email**: `admin@rental.com`
- **Password**: `Password123!`

---

## 📡 4. API Endpoints Overview (এন্ডপয়েন্ট তালিকা)

| Method | Endpoint | Access | Description (বিবরণ) |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | স্টাফ লগইন ও JWT টোকেন গ্রহণ |
| `GET` | `/api/v1/vehicles` | Staff | গাড়ির তালিকা (পেজিনেশন, ক্যাটাগরি ফিল্টার, নেম সার্চ) |
| `GET` | `/api/v1/vehicles/:id` | Staff | নির্দিষ্ট গাড়ির বিস্তারিত তথ্য |
| `POST` | `/api/v1/vehicles` | Staff | নতুন গাড়ি যোগ করা (ছবি আপলোড সহ) |
| `PUT` | `/api/v1/vehicles/:id` | Staff | গাড়ির তথ্য ও ছবি আপডেট করা |
| `DELETE` | `/api/v1/vehicles/:id` | Staff | গাড়ি 소프트 ডিলিট (Soft Delete) |
| `GET` | `/api/v1/rentals` | Staff | রেন্টাল বুকিং তালিকা (ফিল্টার সহ) |
| `GET` | `/api/v1/rentals/:id` | Staff | নির্দিষ্ট রেন্টাল বুকিং তথ্য |
| `POST` | `/api/v1/rentals` | Staff | নতুন রেন্টাল বুকিং (ওভারল্যাপ চেক ও টাকা হিসাব) |
| `PUT` | `/api/v1/rentals/:id` | Staff | রেন্টাল বুকিং আপডেট (পুনরায় ওভারল্যাপ চেক) |
| `DELETE` | `/api/v1/rentals/:id` | Staff | রেন্টাল ডাটা ডিলিট |
| `GET` | `/api/v1/reports/rentals` | Staff | মাসিক ইনকাম ও বুকিং রিপোর্ট (`?month=YYYY-MM`) |

---

## 🧠 5. Key Logic Explanations (প্রধান দুটি কোয়ারির ব্যাখ্যা)

### 1. Overlap Check Logic (ডাবল বুকিং রোধের লজিক)
দুইটি তারিখের রেঞ্জ $[A_{start}, A_{end}]$ এবং $[B_{start}, B_{end}]$ তখনই ওভারল্যাপ করবে যদি:
$$start\_date \le B.end\_date \quad \text{AND} \quad end\_date \ge B.start\_date$$
যদি কোনো গাড়ি ইতোমধ্যে `booked` বা `ongoing` থাকে, তবে নতুন বুকিং বাতিল করে `409 Conflict` রিটার্ন করা হয়।

### 2. Monthly Report Logic (মাসিক রিপোর্ট প্রোরেশন)
জুলাই ২৯ থেকে আগস্ট ৩ তারিখের বুকিং আগস্ট মাসের রিপোর্টে কীভাবে গণনা করা হয়?
- `clip_start = GREATEST('2026-07-29', '2026-08-01')` $\rightarrow$ `2026-08-01`
- `clip_end = LEAST('2026-08-03', '2026-08-31')` $\rightarrow$ `2026-08-03`
- আগস্ট মাসের মোট দিন = $3 - 1 + 1 = 3\text{ দিন}$।
- আয় = $Total\_Amount \times \frac{3}{6}$।

---

## 🧪 6. Testing & Quality Checks

```bash
# TypeScript কম্পাইলেশন চেক
npx tsc --noEmit

# ESLint কোড কোয়ালিটি চেক
npm run lint

# Concurrency স্ট্রেস টেস্ট (Redis Lock Verification)
npx tsx src/scripts/test_concurrent_rentals.ts
```

---

## 🔗 7. Repository & Contact Details (গিটহাব লিংক ও যোগাযোগ)

- **GitHub Repository**: [https://github.com/twahanur/Vehicle-Rent-Management](https://github.com/twahanur/Vehicle-Rent-Management)
- **Developer Name**: Twahanur Rahman
- **GitHub Profile**: [https://github.com/twahanur](https://github.com/twahanur)
- **Email**: [thohanur143@gmail.com](mailto:thohanur143@gmail.com)


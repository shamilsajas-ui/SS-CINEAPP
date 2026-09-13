# CineBook 🎬 — Production Cinema Ticket-Booking Platform

A production-ready cinema ticket-booking web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Neon Serverless PostgreSQL**, and **Drizzle ORM**.

Designed for deployment on **Vercel** with full ACID transactional seat locking, test-mode payment processing, digital QR passes, customer booking history, and an administrative management portal.

---

## Architecture & Multi-Agent Design

CineBook was architected and built by the **CineBook Multi-Agent Team**:

### Agent 1 — App Agent (Frontend & Experience)
- **Cinematic Storefront**:
  - Home page (`/`): Blockbuster hero spotlight, search by title, multi-criteria filtering (genre, cinema, language, and date).
  - Movie details (`/movies/[id]`): High-res backdrops, trailer modal, cast, synopsis, and showtime schedule matrix.
  - Partner Cinemas (`/cinemas`, `/cinemas/[id]`): Cinema profiles with IMAX, Dolby Atmos, and luxury recliner amenities.
  - Interactive Seat Map (`/showtimes/[id]/seats`): Curved screen visualization, color-coded seat tiers (Regular, Premium, VIP, Accessible), and real-time 10-minute hold reservation.
  - Checkout (`/checkout/[bookingId]`): Dynamic countdown timer, itemized fee & tax breakdown, test card simulator with idempotency protection.
  - Digital Ticket Pass (`/tickets/[bookingId]`): Tear-off notch ticket pass with barcode, booking reference (`CB-XXXX-XXXX`), and signed QR code.
  - Booking History (`/account/bookings`): Tabs for upcoming & past movies with self-service cancellation and seat restoration.
  - Authentication (`/login`, `/register`): JWT HTTP-only cookies with one-click demo logins for Customers and Admins.
  - Admin Management Suite (`/admin/*`): Real-time revenue & occupancy analytics, movie catalog manager, showtime scheduler, gate ticket scanner, and security audit logs.

### Agent 2 — Database Engine Agent (ACID Transactions & Data Integrity)
- **14 Tables**:
  - `users`, `genres`, `movies`, `movie_genres`, `cinemas`, `auditoriums`, `seats`, `showtimes`, `showtime_seats`, `bookings`, `booking_items`, `payments`, `tickets`, `audit_logs`.
- **Database Rules**:
  - UUID primary keys throughout.
  - Timestamps stored in UTC (`timestamp with time zone`).
  - Money stored strictly in integer minor units (cents), never floating-point!
  - Unique constraints:
    - Cinema screen names per cinema (`cinema_auditorium_name_idx`)
    - Seat positions per auditorium (`auditorium_seat_position_idx`)
    - Unique showtime seat mapping preventing duplicate seat entries (`showtime_seat_unique_idx`)
    - Booking items mapping preventing double booking (`booking_showtime_seat_idx`)
  - Status enums:
    - Seat: `AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`
    - Booking: `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `REFUNDED`
    - Payment: `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` (stored separately from booking status)
- **10-Step Concurrency-Safe Booking Transaction**:
  1. Begin DB transaction.
  2. Lock requested showtime-seat records.
  3. Confirm every seat is available (or expired hold).
  4. Create temporary seat hold with 10-minute expiration.
  5. Calculate price strictly on the server in minor units.
  6. Create pending booking record (`CB-XXXX-XXXX`).
  7. Commit transaction.
  8. Confirm seats only after verified payment.
  9. Use payment idempotency keys to prevent duplicate charges or retry duplicates.
  10. Reject booking with 409 Conflict if any selected seat was acquired concurrently.
- **Hold Release Cron Endpoint**:
  - `/api/cron/release-holds`: Idempotent endpoint protected with `CRON_SECRET`. Releases expired holds, reverts seats to `AVAILABLE`, marks linked bookings `EXPIRED`, and creates audit logs.

### Agent 3 — QA Agent (Automated Testing & Quality Assurance)
- **Automated Test Suite (`scripts/run-qa-tests.ts`)**:
  - Database entity and seed verification.
  - Bcrypt password validation and invalid password rejection.
  - Minor units mathematical integrity (subtotal + fees + taxes = total).
  - **Simultaneous Race Condition Test**: Two asynchronous requests attempt to reserve the exact same seat simultaneously; verifies strictly ONE succeeds and ONE is rejected with 409 Conflict.
  - Payment idempotency: Duplicate payment attempts with identical key return cached results without double charge.
  - Expired seat hold release: Simulates expired hold and asserts seats return to `AVAILABLE`.
  - Privacy enforcement: Users cannot view or cancel other users' bookings (403 Forbidden).
  - Booking cancellation: Cancelling booking restores seats back to `AVAILABLE` for other customers.
  - Immutable audit trail verification.

---

## Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ (Node.js v22 LTS recommended)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
cd CINEAPP
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection string (or empty for local embedded PGLite) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string for migrations |
| `JWT_SECRET` | Secret key for signing session tokens (min 32 characters) |
| `CRON_SECRET` | Bearer token protecting `/api/cron/release-holds` |
| `STRIPE_SECRET_KEY` | Stripe test mode secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Application base URL (`http://localhost:3000`) |

### 3. Initialize & Seed Database
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed sample movies, cinemas, auditoriums, seats, and showtimes
npm run db:seed
```

### 4. Run the Automated QA Test Suite
```bash
npm run test:qa
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

Pre-configured credentials for evaluation:

| Role | Email | Password | Access |
|---|---|---|---|
| **Customer** | `jane@example.com` | `customerpassword123` | Ticket booking, checkout, QR pass, booking history, cancellations |
| **Admin** | `admin@cinebook.com` | `adminpassword123` | Full access + Admin Console, movie manager, showtime scheduler, gate ticket validator |

*(Convenient one-click fill buttons are available directly on the `/login` page)*

---

## Deploying to Vercel with Neon PostgreSQL

### Step 1: Provision Neon PostgreSQL on Vercel Marketplace
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Navigate to **Integrations** or **Storage** and select **Neon Serverless PostgreSQL**.
3. Create a new Neon database instance.
4. Note your pooled connection string (`DATABASE_URL`) and direct unpooled connection string (`DATABASE_URL_UNPOOLED`).

### Step 2: Set Environment Variables on Vercel
In your Vercel Project Settings > **Environment Variables**, add:
- `DATABASE_URL`: Your pooled Neon connection string (with `?sslmode=require`)
- `DATABASE_URL_UNPOOLED`: Your direct unpooled connection string
- `JWT_SECRET`: Random 32+ character string
- `CRON_SECRET`: Random token matching `vercel.json` cron config
- `STRIPE_SECRET_KEY`: `sk_test_...`
- `STRIPE_WEBHOOK_SECRET`: `whsec_...`
- `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`

### Step 3: Run Database Migrations on Neon
Before or during first deployment, execute migrations on your Neon database:
```bash
DATABASE_URL_UNPOOLED="your-neon-direct-url" npm run db:migrate
DATABASE_URL_UNPOOLED="your-neon-direct-url" npm run db:seed
```

### Step 4: Deploy
Push your repository to GitHub / GitLab and import it into Vercel, or deploy using the Vercel CLI:
```bash
vercel --prod
```

Vercel will automatically read `vercel.json` and schedule `/api/cron/release-holds` every 5 minutes to release expired holds.

---

## Project Structure

```
├── app/
│   ├── layout.tsx                    # Root layout with CineBook dark mode & navbar
│   ├── page.tsx                      # Discovery home page & multi-filter search
│   ├── globals.css                   # Tailwind CSS & custom cinema styling
│   ├── movies/[id]/page.tsx          # Movie details & showtimes matrix
│   ├── cinemas/                      # Cinema directory & schedules
│   ├── showtimes/[id]/seats/page.tsx # Interactive curved seat map with live hold timer
│   ├── checkout/[bookingId]/page.tsx # Order review, 10-min countdown, test payment
│   ├── tickets/[bookingId]/page.tsx  # Perforated cinema pass with QR code
│   ├── account/bookings/page.tsx     # Customer bookings & cancellation modal
│   ├── login/page.tsx                # Customer & Admin login with demo quick-fills
│   ├── register/page.tsx             # Customer registration
│   ├── admin/                        # Operations console, gate scanner, catalog, audit logs
│   └── api/                          # Next.js Serverless Functions for all workflows
├── db/
│   ├── schema.ts                     # 14 Drizzle PostgreSQL tables & enums
│   ├── index.ts                      # Unified database client (Neon / Postgres / PGLite)
│   ├── migrate.ts                    # Migration runner
│   └── seed.ts                       # Rich demo dataset generator
├── drizzle/                          # Generated SQL migrations
├── lib/
│   ├── auth.ts                       # JWT and Bcrypt utilities
│   ├── booking-engine.ts             # Concurrency-safe seat hold & payment engine
│   ├── qrcode.ts                     # Dynamic digital ticket QR code generator
│   └── types.ts                      # Shared TypeScript definitions
├── scripts/
│   └── run-qa-tests.ts               # Agent 3 automated QA test runner
├── vercel.json                       # Cron job configuration for hold release
└── package.json
```

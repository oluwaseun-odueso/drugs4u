# Pharma4 – Prescription Management System (Drugs 4U)

A full-stack web application for managing pharmacy prescriptions, customer records, and inventory.

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | React 18 + Vite     |
| Backend  | PHP 8.1+ (REST API) |
| Database | MySQL 9.2           |

## Project Structure

```
pharma4/
├── backend/                PHP REST API
│   ├── api/                Endpoint handlers
│   ├── config/             Database & CORS config
│   ├── middleware/         Auth middleware
│   ├── helpers/            Response helpers
│   ├── tests/              PHPUnit test suite
│   │   ├── Unit/           Unit tests (helpers, middleware)
│   │   └── Integration/    Integration tests (auth, customers, prescriptions, roles)
│   ├── phpunit.xml.example PHPUnit config template
│   └── schema.sql          Database schema + seed data
├── frontend/               React application
│   └── src/
│       ├── pages/          Route-level page components
│       ├── components/     Shared UI components
│       ├── contexts/       React context (auth)
│       ├── lib/            API client
│       └── tests/          Vitest unit tests
├── e2e/                    Playwright end-to-end tests
├── docs/                   Test plan (MD + DOCX)
└── playwright.config.js    Playwright configuration
```

## Features

- **Authentication** — Session-based login/logout for staff (admin / pharmacist roles)
- **Customer Management** — Register, search, view, and edit customers with medical history, allergies, and conditions
- **Medicines** — Manage the medicine catalogue with flags for controlled drugs, age restrictions, and ID checks
- **Inventory** — Track stock batches, expiry dates, and low-stock thresholds
- **Prescriptions** — Create prescriptions with multi-item support; automatic stock deduction on creation
- **Risk Alerts** — Automatic flagging for age-restricted medicines (ID check) and low stock; persistent alerts log with acknowledgement
- **Reports** — Prescriptions by date, by customer, and stock usage report with date-range filtering
- **Dashboard** — Live summary of customers, prescriptions, pending actions, and unread alerts

## Setup

### 1. Database

```sql
-- Run once in MySQL
SOURCE backend/schema.sql;
```

Default credentials:
- Admin: **admin / Admin@2026Rx**
- Pharmacist: **pharmacist / Pharm@2026Rx**

### 2. Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DB credentials and URLs
```

Serve `backend/` from your web server root (Abyss, Apache, or nginx with PHP).
The `.htaccess` file handles API routing.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # Development server on http://localhost:5173
npm run build      # Production build → dist/
```

The Vite dev server proxies all `/api/*` requests to `http://localhost` (configurable in `vite.config.js`).

## API Endpoints

| Method | Path                    | Description                    |
|--------|-------------------------|--------------------------------|
| POST   | /api/auth/login         | Authenticate                   |
| POST   | /api/auth/logout        | End session                    |
| GET    | /api/auth/me            | Current user                   |
| GET    | /api/customers          | List / search customers        |
| GET    | /api/customers?id=N     | Customer detail + history      |
| POST   | /api/customers          | Create customer                |
| PUT    | /api/customers?id=N     | Update customer                |
| GET    | /api/medicines          | List medicines with stock      |
| POST   | /api/medicines          | Add medicine (admin)           |
| PUT    | /api/medicines?id=N     | Update medicine (admin)        |
| GET    | /api/inventory          | List inventory batches         |
| POST   | /api/inventory          | Add batch                      |
| PUT    | /api/inventory?id=N     | Update batch quantity          |
| GET    | /api/prescriptions      | List prescriptions (filterable)|
| POST   | /api/prescriptions      | Create prescription            |
| PUT    | /api/prescriptions?id=N | Update status                  |
| GET    | /api/alerts             | List alerts                    |
| PUT    | /api/alerts?id=N        | Acknowledge alert              |
| GET    | /api/reports?type=...   | Reports (by_date/customer/stock)|
| GET    | /api/dashboard          | Dashboard stats                |

## Testing

### Backend (PHPUnit — unit + integration)

```bash
cp backend/phpunit.xml.example backend/phpunit.xml
# Edit backend/phpunit.xml with your local MySQL credentials
cd backend
vendor/bin/phpunit --testdox
```

The bootstrap script automatically creates and seeds a `pharma4_test` database.

### Frontend (Vitest — unit)

```bash
cd frontend
npm test
```

### End-to-End (Playwright)

Start both servers first, then run:

```bash
# Terminal 1 — backend
cd backend && php -S localhost:8080 router.php

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — run E2E tests
npx playwright test

# View HTML report
npx playwright show-report e2e/report
```

See `docs/TEST_PLAN.md` for the full test plan and requirements traceability matrix.

## Deployment

The application is deployed on [Render](https://render.com):
- Frontend (Static Site): React build served via Render CDN
- Backend (Docker): PHP 8.1 + Apache running in a container
- Database: MySQL hosted on [Railway](https://railway.app)

The `render.yaml` blueprint at the repo root defines both services.

## Security

- All database queries use PDO prepared statements (no string interpolation)
- Passwords hashed with `password_hash()` / `password_verify()`
- Session-based authentication checked on every protected endpoint
- Role-based access control (admin vs pharmacist)
- Soft-delete for customers (no permanent data loss)
- CORS restricted to the configured frontend URL

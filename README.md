# ClinicFlow — Patient & Appointment Management System

ClinicFlow is a modern, production-ready PERN-stack (PostgreSQL, Express 5, React 19, Node.js) web application designed for clinic staff and administrators to manage patients, schedule appointments, prevent booking conflicts, and monitor clinic KPIs.

---

## 1. Quickstart & Evaluation Guide

### Prerequisites
Ensure the following tools are installed on your system before starting:
- **Docker** (v20.10+ or Docker Desktop)
- **Docker Compose** (v2+)
- **Make** (standard Unix build utility)
- **Git**

> [!NOTE]
> All application execution, node dependencies, database initialization, tests, and linting run **strictly inside Docker containers**. You do **not** need Node.js, npm, or PostgreSQL installed locally on your host machine.

### Launch Instructions
Follow these steps to clone, launch, and verify the entire stack locally:

```bash
# 1. Clone the repository
git clone git@github.com:ilmahdi/tython_technical_test.git
cd tython_technical_test

# 2. Start all services in development mode
# Note: `make up` automatically generates `back/.env` and `front/.env` from `.env.example` templates if missing.
make up

# 3. Access the application in your browser:
# - Frontend Application: http://localhost:1313 (log in with test credentials below)
# - Interactive API Docs (Swagger): http://localhost:1314/api/docs
# - Backend API Healthcheck: http://localhost:1314/health

# 4. Run automated tests and quality checks inside Docker:
make test-back    # Runs Jest + Supertest (48/48 green tests)
make lint-front   # Runs Oxlint frontend linter (0 errors, 0 warnings)
make build-front  # Validates Vite production compilation

# 5. Additional management commands:
make logs         # Stream real-time container logs
make down         # Stop all services
make clean        # Reset containers, network, and database volumes
```

### Pre-Seeded Test Credentials
The database automatically seeds with the following default accounts. Quick-fill buttons are also provided on the `/login` page for 1-click form population:

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin Director | `admin@clinicflow.local` | `Admin123!` | Full clinic access + **Patient Deletion** (`DELETE /api/patients/:id`) |
| **Staff** | Dr. Sarah Smith | `dr.sarah@clinicflow.local` | `Staff123!` | View/Create/Edit patients & appointments |
| **Staff** | Nurse John Doe | `nurse.john@clinicflow.local` | `Staff123!` | View/Create/Edit patients & appointments |

---

## 2. Deliverables Matrix

| # | Deliverable | Description & Reference |
| :--- | :--- | :--- |
| **1.1** | **Conception DB (ERD)** | Complete ERD, relationship justifications, cascade rules, and index matrix in [DATABASE_DESIGN.md](./DATABASE_DESIGN.md). |
| **1.2** | **Backend API** | Layered Node.js / Express 5 REST API (`routes` → `controllers` → `services` → `repositories`) with Zod validation. |
| **1.3** | **Frontend UI** | Modern React 19 + Vite + Tailwind CSS v4 design system with Lucide icons. |
| **1.4** | **Database & Migrations** | PostgreSQL 16 schema initialization and pre-seeded dataset in [`back/postgres-init/`](./back/postgres-init/). |
| **1.5** | **Documentation & Setup** | This comprehensive guide including environment variables, Makefile commands, credentials, and API docs. |

---

## 3. Application URLs & Ports

| Service | Host URL | Container Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:1313](http://localhost:1313) | `3000` | React 19 SPA with client-side routing & Vite proxy |
| **Backend API** | [http://localhost:1314](http://localhost:1314) | `3000` | Express REST API (Health check: `/health`, `/api/health`) |
| **Interactive API Docs (Swagger)** | [http://localhost:1314/api/docs](http://localhost:1314/api/docs) | `3000` | OpenAPI 3.0 Swagger UI & test console (`/api/docs.json`) |
| **Database** | `localhost:5432` (internal) | `5432` | PostgreSQL 16 with UUID generation (`pgcrypto`) |

---

## 4. Environment Configuration

### Backend (`back/.env` / `back/.env.example`)
```env
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password_I1O-Qd+d1

DB_HOST=app-db
DB_PORT=5432
PORT=3000

NODE_ENV=development
JWT_SECRET=clinicflow_super_secret_jwt_key_2026_dev
JWT_EXPIRES_IN=24h
```

### Frontend (`front/.env` / `front/.env.example`)
```env
VITE_API_URL=/api
```

---

## 5. Architecture & Mandatory Business Rules

### 5.1 Backend Layered Architecture
```
HTTP Requests
     │
     ▼
routes/            ── Authenticate (JWT) & Authorize ('admin') & Validate (Zod)
     │
     ▼
controllers/       ── Extract parameters, invoke services, return HTTP status
     │
     ▼
services/          ── Business rules, transactions, concurrency locks
     │
     ▼
repositories/      ── Parameterized SQL queries ($1, $2) via pg pool
     │
     ▼
PostgreSQL 16
```

### 5.2 The 30-Minute Conflict Engine
* **Rule**: A patient cannot have two `confirmed` appointments within a 30-minute window ($|t_{\text{new}} - t_{\text{existing}}| < 30 \text{ minutes}$).
* **Enforcement**:
  * Applies **only to confirmed appointments** (pending and cancelled appointments do not block).
  * Validated during `POST /api/appointments` and `PATCH /api/appointments/:id/status` (when transitioning to `confirmed`).
  * **Concurrency-Safe**: Uses PostgreSQL database transactions with row-level locks (`SELECT id FROM patients WHERE id = $1 FOR UPDATE`) before checking time ranges, preventing race condition double-bookings.
  * Violations trigger an HTTP `409 Conflict` response with an explanatory message.

### 5.3 Soft Delete & Admin Protection
* `DELETE /api/patients/:id` is strictly protected by role-based authorization (`authorize('admin')`).
* Patient deletion uses soft delete (`deleted_at = CURRENT_TIMESTAMP`), preserving foreign key relationships and historical consultations.
* Soft-deleted patients are automatically excluded from listing, search, dashboard metrics, and new appointment creation.

### 5.4 Pagination & Search
* `GET /api/patients?search=&page=&limit=` performs database-level pagination using `LIMIT` and `OFFSET`.
* Case-insensitive search runs across both `full_name` and `cin` using SQL `ILIKE`.

---

## 6. REST API Endpoint Specification

> [!TIP]
> **Interactive Swagger Documentation**: Explore and execute requests live at [http://localhost:1314/api/docs](http://localhost:1314/api/docs) (or inspect the raw OpenAPI spec at `/api/docs.json`).

### Authentication
| Method | Endpoint | Auth | Role | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | None | Public | `{ email, password }` | Authenticates user; returns JWT token + user profile. |
| `GET` | `/api/auth/me` | JWT | Any | None | Returns the currently authenticated user. |

### Patients
| Method | Endpoint | Auth | Role | Query / Body Params | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/patients` | JWT | Any | `{ fullName, cin, phone, birthDate, address? }` | Registers a new patient. Validates unique CIN. |
| `GET` | `/api/patients` | JWT | Any | `?search=&page=&limit=` | Paginated patient listing with multi-field search. |
| `GET` | `/api/patients/:id` | JWT | Any | `id` (UUID) | Returns patient profile + chronological appointments. |
| `PUT` | `/api/patients/:id` | JWT | Any | `{ fullName, cin, phone, birthDate, address? }` | Updates patient details. |
| `DELETE`| `/api/patients/:id` | JWT | **Admin** | `id` (UUID) | Soft-deletes a patient. |

### Appointments
| Method | Endpoint | Auth | Role | Query / Body Params | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments` | JWT | Any | `{ patientId, appointmentDate, reason, notes?, status? }` | Creates appointment (enforces 30-min rule if confirmed). |
| `GET` | `/api/appointments` | JWT | Any | `?date=&status=` | Filters appointments by calendar date and/or status. |
| `PATCH`| `/api/appointments/:id/status` | JWT | Any | `{ status: "pending"\|"confirmed"\|"cancelled" }` | Updates status (enforces 30-min rule if confirming). |

### Dashboard
| Method | Endpoint | Auth | Role | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | JWT | Any | None | Returns 4 live KPIs (`totalPatients`, `todayAppointments`, `pendingAppointments`, `confirmedAppointments`). |

---

## 7. Frontend UI Highlights

The frontend is constructed with **React 19**, **Vite**, **Tailwind CSS v4**, Lucide icons, and custom reusable UI components (`button`, `card`, `dialog`, `badge`, `input`, `table`):

- **/login**: Clean medical portal login with test account quick-fill cards, real-time error banner, and secure JWT storage.
- **/dashboard**: Real-time KPI summary cards, today's appointments table, and fast-action shortcuts.
- **/patients**: Paginated patient directory, instant search by Name or CIN, Add Patient modal, Edit Patient modal, and role-protected Delete action (visible only to Admin).
- **/patients/:id**: Complete patient demographic card and full chronological appointment history.
- **/appointments**: Schedule view with date picker and status filtering (`pending`, `confirmed`, `cancelled`), in-place status updater, and New Appointment modal with inline 30-min conflict warnings.

---

## 8. Verification & Automated Test Results

### Backend Test Suite (`make test-back`)
Passing with **48/48 tests (100% green)** across 5 test suites:
- `tests/auth.test.js`: Login validation, password verification, token generation, `/me` profile.
- `tests/patient.test.js`: CRUD, unique CIN enforcement, pagination metadata, search, admin-only delete guard.
- `tests/appointment.test.js`: Appointment lifecycle, 30-minute conflict window ($t \pm 30\text{ min}$), concurrency transaction locks, status patch.
- `tests/dashboard.test.js`: Accurate KPI aggregations.
- `tests/health.test.js`: Service availability check.

### Frontend Quality Assurance
- `make lint-front`: **0 errors, 0 warnings** (Oxlint).
- `make build-front`: **Successful production bundle build**.
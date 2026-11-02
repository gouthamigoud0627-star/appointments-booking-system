# Schedora Enterprise Platform

> **High-Performance Multi-Tenant Appointment Booking, Business Directory & Physical Arrival Management Platform**  
> *Tagline: "Scan. Verify. Check in."*

[![Architecture: Production Ready](https://img.shields.io/badge/Architecture-PostgreSQL%2015%2B%20%7C%20Redis%207%20%7C%20React%2019-blue.svg)](#system-architecture)
[![License: Proprietary Enterprise](https://img.shields.io/badge/License-Proprietary%20Enterprise-emerald.svg)](#licensing--governance)
[![Security: SOC2 & GDPR Ready](https://img.shields.io/badge/Security-RLS%20%7C%20Audit%20Logged%20%7C%20RBAC-purple.svg)](#security-architecture)
[![PostgreSQL: 13 Modules](https://img.shields.io/badge/Database-13%20Modules%20%7C%2050%2B%20Indexes-success.svg)](./schedora_database_schema.sql)

---

## 1. Executive Overview

**Schedora Enterprise** is a mission-critical appointment scheduling, workforce roster management, and customer arrival verification platform architected for single-location independents, multi-unit franchises, and high-volume enterprise service networks.

Built to address the three primary failure modes of legacy booking software—**scheduling concurrency collisions (double bookings)**, **unmitigated customer no-shows (averaging 18-22% across service industries)**, and **insecure multi-tenant data leaks**—Schedora pairs sub-millisecond slot reservation locks with cryptographic physical arrival tokens, dynamic waitlist management, and strict Row-Level Security (RLS) data partitioning.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  SCHEDORA ECOSYSTEM                                      │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────┤
│    Customer Discovery & Booking│    Business Operating System   │  Physical Arrival Kiosk  │
│  • Local Service Directory    │  • Dynamic Roster Scheduling  │  • Fast QR Check-In      │
│  • Real-Time Slot Locking     │  • Multi-Staff Resource Mgmt  │  • Geofence Verification │
│  • Instant SMS / Push Receipt │  • Real-Time Analytics & CRM  │  • Turnstile / Token Seq │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────┘
```

---

## 2. Who Should Read What (Role-Based Guide)

To help your team onboard in minutes, consult this navigation map tailored to your specific organizational discipline:

| Persona / Role | Primary Documents to Read | Key Sections of Interest |
|---|---|---|
| **Founders & C-Suite** (CEO, COO) | [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)<br>[Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md) | Business Case, 340% ROI Model, Unit Economics, 18-Month Vision |
| **Product Managers & Business Analysts** | [Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md)<br>[INDEX_&_QUICK_START.md](./INDEX_&_QUICK_START.md) | Feature Breakdowns, 5 Future Phases, User Flows & Personas |
| **CTO, Principal Architects & Tech Leads** | [Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md)<br>[schedora_database_schema.sql](./schedora_database_schema.sql) | Microservices Boundaries, Concurrency Guarantees, SLAs |
| **Backend & Database Engineers (DBA)** | [schedora_database_schema.sql](./schedora_database_schema.sql)<br>[Database_Migration_Guide.md](./Database_Migration_Guide.md) | 13 Functional Modules, 50+ Indexes, Triggers, Zero-Downtime Cutover |
| **Frontend & Mobile Engineers** | [Schedora_API_Specification.md](./Schedora_API_Specification.md)<br>[INDEX_&_QUICK_START.md](./INDEX_&_QUICK_START.md) | 60+ REST Endpoints, WebSocket Events, State Management, UI Specs |
| **DevOps, SRE & Cloud Engineers** | [Database_Migration_Guide.md](./Database_Migration_Guide.md)<br>[INDEX_&_QUICK_START.md](./INDEX_&_QUICK_START.md) | PgBouncer Sizing, Docker Compose, k6 Load Tests, Rollback Runbook |
| **SecOps & Compliance Officers** | [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)<br>[schedora_database_schema.sql](./schedora_database_schema.sql) | Multi-Tenant RLS Policies, Audit Logging, GDPR/CCPA & HIPAA Ready |

---

## 3. Comprehensive Documentation Catalog

The Schedora repository contains seven production-grade architectural specifications:

```
schedora/
├── README.md                      # [THIS FILE] Top-level portal, repository structure, onboarding
├── INDEX_&_QUICK_START.md         # Visual index, role quickstarts, 4-week timeline, launch checklist
├── EXECUTIVE_SUMMARY.md           # 15-minute executive briefing, ROI analysis, market transformation
├── Schedora_Enterprise_Prompt.md  # Complete 360-degree system architecture, roadmap, monetization
├── schedora_database_schema.sql   # Production DDL: 13 modules, 50+ indexes, triggers, RLS, views
├── Database_Migration_Guide.md    # Week-by-week implementation, zero-downtime cutover runbook
└── Schedora_API_Specification.md  # 60+ REST endpoints, WebSocket schema, curl & JSON payloads
```

---

## 4. Key Architectural Capabilities

### 4.1 Strict Multi-Tenancy via Row-Level Security (RLS)
Every operational query executes under an active `app.current_tenant_id` session variable enforced by PostgreSQL Row-Level Security policies. Cross-tenant leakage is mathematically prohibited at the storage engine layer, eliminating reliance on application-layer `WHERE tenant_id = ?` filters.

### 4.2 Zero-Conflict Slot Reservation Engine
- **Distributed In-Memory Lock**: High-frequency slot selection uses Redis distributed mutex locks (`SET slot:{staff_id}:{timestamp} {user_id} NX PX 600000`) for a 10-minute hold window during customer checkout.
- **Relational Integrity Invariant**: The PostgreSQL schema utilizes custom exclusion constraint logic and pessimistic transactions (`SELECT ... FOR UPDATE`) ensuring zero possibility of overlapping double-bookings.

### 4.3 Cryptographic Physical Arrival Tokens
Customers receive a deterministic 6-character alpha-numeric token paired with a Signed JWT QR code. On arrival at the venue:
1. The customer scans at a physical tablet kiosk or staff mobile terminal.
2. Geofence radius checks (< 100 meters) and time window verification (within ±30 minutes of scheduled start) validate arrival.
3. The booking status atomically transitions from `CONFIRMED` to `ARRIVED`, advancing the real-time queue display via WebSockets.

### 4.4 Automated Multi-Channel Notification Engine
Integrated event bus triggers transactional communications across:
- **SMS & WhatsApp**: Instant confirmation, 24-hour reminder, and "Your turn in 5 minutes" queue warnings.
- **Email**: ICS calendar attachment, rich itinerary, payment receipts, and cancellation links.
- **Webhooks**: Outbound HTTP deliveries with HMAC-SHA256 signatures for POS, CRM, and ERP integrations.

---

## 5. Technology Stack

| Layer | Primary Technology | Version | Key Responsibility |
|---|---|---|---|
| **Client UI** | React, TypeScript, Tailwind CSS | React 19 / TS 5.4 | Responsive booking portal, business dashboard, arrival kiosk |
| **Application Server** | Node.js, Express / Fastify | v20 LTS / v22 | REST API, WebSocket server, authentication, webhook dispatch |
| **Primary Database** | PostgreSQL | 15.4+ / 16 | Relational persistence, RLS, exclusion constraints, JSONB |
| **Cache & Locks** | Redis Enterprise | 7.2+ | Ephemeral slot locks, session caching, rate limiting, pub/sub |
| **Search Engine** | Elasticsearch / OpenSearch | 8.11+ | Multi-criteria business discovery, full-text catalog queries |
| **Connection Pool** | PgBouncer | 1.22+ | Transaction-level connection pooling (1,000+ client pools) |
| **Reverse Proxy** | NGINX / Cloudflare | Latest | SSL termination, DDoS defense, WAF, static asset caching |

---

## 6. Quick Start & Local Development

### 6.1 Prerequisites
- **Node.js**: `v20.10.0+` or `v22.x`
- **Docker Engine**: `24.0+` with Docker Compose v2
- **PostgreSQL Client**: `psql 15+` (for direct schema deployment)

### 6.2 Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/schedora.git
cd schedora

# Install application dependencies
npm install
```

### 6.3 Environment Configuration
Copy the sample environment variables and configure your secrets:
```bash
cp .env.example .env
```

Ensure the following minimal variables are configured:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://schedora_app:secure_password@localhost:5432/schedora_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=super-secure-256-bit-entropy-jwt-secret-key-32chars
SESSION_SECRET=another-super-secure-cryptographic-salt
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
```

### 6.4 Initialize Database with Production DDL
```bash
# Start PostgreSQL & Redis services via Docker
docker compose up -d postgres redis

# Apply the master enterprise schema
psql -h localhost -U postgres -d schedora_db -f schedora_database_schema.sql
```

### 6.5 Launch Local Development Server
```bash
# Starts Node server + Vite client concurrently on port 3000
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application:
- Customer Directory & Booking: `http://localhost:3000/`
- Business Management Portal: `http://localhost:3000/dashboard`
- Physical Arrival Kiosk: `http://localhost:3000/check-in`

---

## 7. Project Structure & Codebase Organization

```
schedora/
├── src/
│   ├── components/            # Reusable UI component library (Modals, Forms, Tables)
│   │   ├── Layout.tsx         # Enterprise business administration layout
│   │   ├── PublicLayout.tsx   # Customer-facing header, navigation, and footer
│   │   └── ProtectedRoute.tsx # Route-level RBAC & authentication guards
│   ├── pages/                 # Full application page views
│   │   ├── Landing.tsx        # High-converting customer landing experience
│   │   ├── BusinessDirectory.tsx # Searchable directory with location/category filters
│   │   ├── PublicBooking.tsx  # Dynamic multi-step appointment scheduler
│   │   ├── BookingConfirmation.tsx # Digital pass, QR code, and ICS download
│   │   ├── CheckIn.tsx        # Physical kiosk QR scan & token check-in portal
│   │   ├── Dashboard.tsx      # Executive command center with daily KPI widgets
│   │   ├── Calendar.tsx       # Multi-staff resource calendar (Day/Week/Month)
│   │   ├── Services.tsx       # Service catalog, pricing, and duration setup
│   │   ├── Staff.tsx          # Team profiles, working shifts, and skill mapping
│   │   └── Analytics.tsx      # Revenue, utilization, and no-show trend metrics
│   ├── context/               # Global state providers (Auth, Theme, Notifications)
│   ├── lib/                   # Utility helpers, date mathematics, API clients
│   ├── types.ts               # Core TypeScript domain entities & interfaces
│   └── main.tsx               # Client entry point
├── server.ts                  # Node.js Express server with Vite middleware integration
├── schedora_database_schema.sql # 13-Module Production PostgreSQL Schema
├── Database_Migration_Guide.md # 6-Phase Zero-Downtime Migration Playbook
├── Schedora_API_Specification.md # Complete REST & WebSocket Contract
├── Schedora_Enterprise_Prompt.md # Master Product & Engineering Architecture
├── EXECUTIVE_SUMMARY.md       # C-Level Investment & Transformation Brief
├── INDEX_&_QUICK_START.md     # Visual index, Role Guides, Launch Checklist
├── package.json               # Dependency definitions & scripts
└── tsconfig.json              # TypeScript compilation rules
```

---

## 8. Quality Assurance & Testing Strategy

Schedora enforces a rigorous multi-tier verification pipeline:

```
  ┌─────────────────────────────────────────────────────────────┐
  │ End-to-End User Journeys (Playwright / Cypress)             │
  │ • Customer Booking Flow  • Kiosk QR Verification  • Admin   │
  ├─────────────────────────────────────────────────────────────┤
  │ Integration & Concurrency Tests (Jest / Supertest / Testdb) │
  │ • Concurrent Lock Acquisition  • RLS Isolation  • Webhooks │
  ├─────────────────────────────────────────────────────────────┤
  │ Unit Tests (Vitest)                                         │
  │ • Working Hours Computation  • Token Generation  • Filters │
  ├─────────────────────────────────────────────────────────────┤
  │ Load & Stress Tests (k6 / Locust)                           │
  │ • 15,000 req/sec Spike Tests  • 100,000 Concurrent Sockets  │
  └─────────────────────────────────────────────────────────────┘
```

Execute tests via:
```bash
# Run unit & component tests
npm run test

# Run database integration tests against local PostgreSQL
npm run test:db

# Run k6 load simulation for booking slot lock acquisition
k6 run tests/load/slot-booking-spike.js
```

---

## 9. Deployment & Operational Runbooks

Schedora supports continuous containerized deployments to any Kubernetes cluster (GKE, EKS, AKS), Google Cloud Run, AWS ECS, or bare-metal VPS clusters.

### Production Environment Variables Checklist
- [ ] `DATABASE_URL`: Connection string pointing to PgBouncer pooler (port 6432)
- [ ] `DIRECT_DATABASE_URL`: Direct connection string to primary instance (port 5432) for DDL migrations
- [ ] `REDIS_URL`: High-availability Redis Cluster URI with TLS (`rediss://`)
- [ ] `JWT_SECRET`: High-entropy 256-bit cryptographically random secret
- [ ] `CORS_ORIGIN`: Explicit comma-delimited whitelist of authorized origins
- [ ] `ENCRYPTION_KEY`: AES-256-GCM symmetric master key for field-level token encryption
- [ ] `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Secure payment processing tokens

For step-by-step database cutover instructions, consult the [Database Migration Guide](./Database_Migration_Guide.md).

---

## 10. Licensing & Enterprise Governance

Copyright © 2026 Schedora Technologies Inc. All rights reserved.

This software, its accompanying database schemas, documentation, and source code are proprietary assets. Unauthorized copying, distribution, reverse engineering, or hosted multi-tenant deployment without an active commercial license agreement is strictly prohibited.

For commercial licensing, enterprise SLAs, and custom deployment assistance:
- **Enterprise Support**: `enterprise@schedora.io`
- **Security & Vulnerability Disclosures**: `security@schedora.io`
- **Developer Documentation Hub**: [INDEX_&_QUICK_START.md](./INDEX_&_QUICK_START.md)

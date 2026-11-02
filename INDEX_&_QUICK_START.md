# Schedora Enterprise: Master Index & Quick Start Guide

> **Your Universal Onboarding Compass, Operational Timeline & Field Troubleshooting Manual**  
> *Target Completion: 4-Week Production Deployment*

---

## 1. Visual Index of All Documents

The Schedora documentation suite is engineered as an interdependent, production-ready systems specification. Use this visual index to navigate between high-level executive rationale and deep low-level code artifacts:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DOCUMENT RELATIONSHIP MAP                            │
└────────────────────────────────────────────────────────────────────────────────────────┘

                      ┌────────────────────────────────────────┐
                      │               README.md                │
                      │         (Global Entry Point)           │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
  ┌─────────────────────────────┐                 ┌─────────────────────────────┐
  │    EXECUTIVE_SUMMARY.md     │                 │   INDEX_&_QUICK_START.md    │
  │  • 15-Minute Business Case  │                 │  • Visual Document Matrix   │
  │  • 340% ROI Financial Model │                 │  • Quick Start by Role      │
  │  • Market Transformation    │                 │  • 4-Week Timeline & Runbook│
  └──────────────┬──────────────┘                 │  • Field Troubleshooting    │
                 │                                └──────────────┬──────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Schedora_Enterprise_Prompt.md     │
                      │  • 360° Vision & MVP Specifications    │
                      │  • 5 Future Phases (ML, Marketplace)   │
                      │  • Clean Modular Microservices         │
                      │  • 18-Month Product Roadmap            │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
  ┌─────────────────────────────┐                 ┌─────────────────────────────┐
  │ schedora_database_schema.sql│                 │Schedora_API_Specification.md│
  │  • 13 Functional Modules    │                 │  • 60+ REST Endpoints       │
  │  • 50+ Specialized Indexes  │                 │  • WebSocket Subscriptions  │
  │  • Row-Level Security (RLS) │                 │  • curl & JSON Request/Resp │
  │  • Audit Triggers & Views   │                 │  • Rate Limiting & Auth Spec│
  └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Database_Migration_Guide.md       │
                      │  • 6-Phase Zero-Downtime Migration     │
                      │  • Dual-Write & Backfill Pipelines     │
                      │  • PgBouncer & Cutover Runbook         │
                      │  • Emergency Rollback Protocols        │
                      └────────────────────────────────────────┘
```

### Document Matrix & Content Mapping

| Document Name | Size | Primary Audience | Core Artifacts Provided |
|---|---|---|---|
| **[README.md](./README.md)** | ~12 KB | All Project Members | System overview, tech stack, local installation, repo taxonomy |
| **[INDEX_&_QUICK_START.md](./INDEX_&_QUICK_START.md)** | ~17 KB | Leads, PMs, SREs | Document map, role paths, 4-week timeline, launch checklist, triage |
| **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** | ~15 KB | C-Suite, Investors | Transformation thesis, unit economics, 340% ROI, SOC2 compliance |
| **[Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md)** | ~31 KB | Architects, Tech Leads | Complete functional spec, 5 expansion phases, roadmap, SLAs |
| **[schedora_database_schema.sql](./schedora_database_schema.sql)** | ~34 KB | DBAs, Backend Devs | 13 modules, 50+ indexes, RLS security rules, triggers, views |
| **[Database_Migration_Guide.md](./Database_Migration_Guide.md)** | ~14 KB | DevOps, SREs, DBAs | Phase 1-6 dual-write strategy, k6 validation, cutover execution |
| **[Schedora_API_Specification.md](./Schedora_API_Specification.md)** | ~17 KB | Frontend/App Devs | 60+ REST routes, WebSocket protocols, curl examples, auth specs |

---

## 2. Quick Start by Role

Select your professional track to execute your immediate deliverables:

### 2.1 The Founder & Executive Track (15-Minute Ramp)
1. **Read**: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) to understand how Schedora reduces appointment no-shows from 22% to under 4.5% while delivering a 340% 3-year ROI.
2. **Review**: Section 9 of [Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md) for monetization tiers (Starter, Professional, Enterprise, Marketplace take rates).
3. **Action**: Verify the 4-week implementation milestones below and assign project champions for each workstream.

### 2.2 The Product Manager (PM) Track (30-Minute Ramp)
1. **Read**: Sections 2 through 4 of [Schedora_Enterprise_Prompt.md](./Schedora_Enterprise_Prompt.md) to internalize the user flows across Customer, Staff, and Venue Admin personas.
2. **Review**: The 5 Future Phases (ML slot pricing, Marketplace discovery, Omnichannel booking) to build your Q2–Q4 backlog.
3. **Reference**: [Schedora_API_Specification.md](./Schedora_API_Specification.md) to understand API capabilities when defining acceptance criteria for mobile/web stories.
4. **Action**: Customize the [Launch Checklist](#4-launch-checklist) with your brand's operational sign-offs.

### 2.3 The Software Engineer Track (Backend / Full-Stack)
1. **Setup**: Follow Section 6 of [README.md](./README.md) to boot the local environment via Docker and Node.
2. **Deep Dive**: Inspect [schedora_database_schema.sql](./schedora_database_schema.sql) modules 1, 2, 5, 6, and 7 to understand tenant partitioning, staff availability windows, and arrival tokens.
3. **Contract Familiarization**: Implement service endpoints conforming directly to [Schedora_API_Specification.md](./Schedora_API_Specification.md).
4. **Verify**: Ensure all API route handlers set `SET LOCAL app.current_tenant_id = :tenantId` before querying data to satisfy Row-Level Security.

### 2.4 The Frontend & Mobile Engineer Track
1. **Setup**: Run `npm install` and `npm run dev` to access the responsive React 19 / Tailwind UI on `localhost:3000`.
2. **API Mocking & Integration**: Review [Schedora_API_Specification.md](./Schedora_API_Specification.md) for request bodies, bearer auth headers, and response pagination formats.
3. **Real-Time Integration**: Implement WebSocket listeners for `slot:locked`, `appointment:created`, and `arrival:verified` to drive dynamic calendar updates.
4. **Kiosk Implementation**: Integrate `GET /api/v1/kiosks/:kiosk_id` and `POST /api/v1/appointments/check-in` for the tablet arrival portal.

### 2.5 The DevOps, SRE & Database Administrator Track
1. **Infrastructure**: Provision PostgreSQL 15+ (Aurora or Cloud SQL) with `uuid-ossp` and `btree_gist` extensions.
2. **Connection Sizing**: Deploy PgBouncer in transaction pooling mode as outlined in [Database_Migration_Guide.md](./Database_Migration_Guide.md).
3. **Cache & Queues**: Stand up Redis 7+ cluster for distributed lock management and WebSocket session broadcasts.
4. **Execution**: Follow [Database_Migration_Guide.md](./Database_Migration_Guide.md) for the 6-phase zero-downtime rollout.

---

## 3. 4-Week Implementation Timeline

The following timeline details the end-to-end rollout schedule from initial schema validation to high-availability production cutover:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SCHEDORA 4-WEEK PRODUCTION GANTT TIMELINE                       │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ WEEK / WORKSTREAM             │ KEY ACTIVITIES                │ DELIVERABLES & GATES   │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ WEEK 1: Preparation & Setup   │ • Cloud VPC & DB Provisioning │ • Staging DB Active    │
│                               │ • Master Schema Compilation   │ • Dry-run Migration OK │
│                               │ • Redis Cluster Setup         │ • Baseline Benchmarks  │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ WEEK 2: Schema & Services     │ • DDL Deployment with RLS     │ • 13 Modules Ingested  │
│                               │ • Dual-Write Adapter Build    │ • Auth & RBAC Verified │
│                               │ • Core REST API Endpoints     │ • Integration Test Run │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ WEEK 3: Data & Integrations   │ • Historical Data Backfill    │ • 100% Checksum Match  │
│                               │ • Webhook & Stripe Binding    │ • Shadow Traffic Live  │
│                               │ • Frontend Portal Wiring      │ • Kiosk QR Scanner OK  │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ WEEK 4: Hardening & Cutover   │ • k6 15k req/s Load Testing   │ • p99 Latency < 80ms   │
│                               │ • Security & Penetration Audit│ • Weekend Zero-Downtime│
│                               │ • Production Cutover Weekend  │ • Post-Launch Sign-off │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

### Week-by-Week Operational Breakdown

#### Week 1: Infrastructure & Schema Preparation
- **Day 1-2**: Provision staging and production PostgreSQL 15+ instances with PgBouncer connection pooling. Install extensions: `uuid-ossp`, `pgcrypto`, `btree_gist`.
- **Day 3-4**: Run dry-run execution of `schedora_database_schema.sql` on staging environment. Verify table inheritance, constraints, and RLS enforcement.
- **Day 5**: Stand up Redis 7 instance with sentinel/cluster replication. Establish baseline network latency between Node application pods, Redis, and PgBouncer.

#### Week 2: Schema Deployment & Application Integration
- **Day 6-7**: Deploy core database schema to staging. Run seed data generators covering 500 tenants, 2,500 staff, and 100,000 appointment records.
- **Day 8-9**: Implement application data access layer using Row-Level Security session variables (`app.current_tenant_id`). Verify that cross-tenant read/write attempts throw permission errors.
- **Day 10**: Wire authentication endpoints (`/auth/login`, `/auth/refresh`, MFA flows) according to `Schedora_API_Specification.md`.

#### Week 3: Historical Backfill & Client App Binding
- **Day 11-12**: Execute historical data migration ETL from legacy database into Schedora schemas with MD5 hash validation per batch.
- **Day 13-14**: Enable dual-write adapter. New bookings are written to both legacy and Schedora databases with automated reconciliation workers.
- **Day 15**: Bind customer web booking flow, business dashboard, and physical kiosk QR check-in flows to live API endpoints.

#### Week 4: Stress Hardening, Security Audit & Cutover
- **Day 16-17**: Run comprehensive k6 load tests simulating 15,000 concurrent slot locking requests and 100,000 active WebSocket connections.
- **Day 18-19**: Perform static application security testing (SAST), penetration testing on API endpoints, and GDPR/CCPA data export verification.
- **Day 20-21**: Execute Phase 6 Cutover Runbook during off-peak weekend window. Switch DNS records to production gateway and monitor real-time metrics.

---

## 4. Launch Checklist

### Pre-Launch Checklist (T-14 Days to T-24 Hours)

#### Security & Compliance
- [ ] PostgreSQL Row-Level Security enabled on all multi-tenant tables (`tenants`, `businesses`, `appointments`, `customers`, `staff_profiles`).
- [ ] Database credentials rotated and stored in AWS Secrets Manager / GCP Secret Manager / Vault.
- [ ] Field-level encryption active on sensitive customer PII (`phone`, `email`, `medical_notes`).
- [ ] Rate-limiting enabled across public endpoints (max 60 req/min for booking discovery, 5 req/min for auth).
- [ ] CORS policies locked down to verified customer web and kiosk application domains.

#### Infrastructure & Performance
- [ ] PgBouncer configured in `transaction` mode with `default_pool_size = 50` and `max_client_conn = 5000`.
- [ ] Redis configured with `volatile-lru` eviction policy and persistence (AOF + RDB snapshots).
- [ ] GIN indexes verified on `customers` full-text search and `system_events.payload` JSONB columns.
- [ ] Exclusion constraints on `appointments` verified using `btree_gist` to prevent double-booking.
- [ ] Cloud CDN caching configured for static web assets (1 year max-age with content hashing).

#### Application & Integrations
- [ ] Stripe webhook secret verified and idempotent event processing implemented.
- [ ] SMS / WhatsApp provider fallback routes configured (Twilio -> MessageBird -> AWS SNS).
- [ ] Physical arrival kiosk tablets tested with rear camera auto-focus for QR scanning.
- [ ] Outbound webhooks configured with exponential backoff and dead-letter queues.

---

### Day-of-Launch Checklist (T-0 Runbook)

```
[ ] T - 4 Hours : Freeze all production code deployments and schema modifications.
[ ] T - 3 Hours : Verify replica lag is < 50ms across all PostgreSQL read replicas.
[ ] T - 2 Hours : Warm Redis caches with active staff schedules and service catalogs.
[ ] T - 1 Hour  : Reduce public DNS TTL to 60 seconds.
[ ] T - 30 Min  : SRE and Engineering leads join launch bridge room.
[ ] T - 15 Min  : Execute dual-write consistency validator script (target: 0 discrepancies).
[ ] T - 00 Min  : Flip primary traffic switch at Cloudflare / API Gateway.
[ ] T + 15 Min  : Confirm first 100 live bookings, slot lock acquisitions, and SMS receipts.
[ ] T + 30 Min  : Verify physical check-in flow at flagship venue kiosk.
[ ] T + 60 Min  : Reset DNS TTL to standard 86400 seconds. Launch successful.
```

---

## 5. Production Field Troubleshooting Guide

### 5.1 Issue: Database Connection Pool Exhaustion (PgBouncer Saturation)
* **Symptom**: HTTP 500/504 errors on booking endpoints. Logs show `remaining connection slots are reserved for non-replication superuser connections` or `server_login_retry`.
* **Root Cause**: Long-running transactions or unclosed connections holding pool slots, often due to synchronous third-party HTTP calls (e.g., Stripe, Twilio) inside database transaction blocks.
* **Immediate Triage**:
  1. Inspect active connections:
     ```sql
     SELECT pid, usename, state, query_start, now() - query_start AS duration, query 
     FROM pg_stat_activity 
     WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;
     ```
  2. Terminate rogue transactions older than 60 seconds:
     ```sql
     SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE state = 'idle in transaction' AND query_start < now() - INTERVAL '60 seconds';
     ```
  3. **Prevention Rule**: Never initiate external network calls inside `BEGIN ... COMMIT` blocks. Use background message queues for third-party dispatches.

---

### 5.2 Issue: Redis Distributed Slot Lock Leaks
* **Symptom**: Customers receive "Slot is currently being booked by another customer" error even though no one is actively checking out.
* **Root Cause**: Lock keys created without an explicit expiration TTL (`PX`), or server crashed between lock acquisition and TTL setting.
* **Immediate Triage**:
  1. Identify stale locks for a specific staff member:
     ```bash
     redis-cli --scan --pattern "slot_lock:*" | xargs -L 1 redis-cli TTL
     ```
  2. Purge expired keys lacking TTL:
     ```bash
     redis-cli EVAL "local keys = redis.call('keys', 'slot_lock:*') for i,k in ipairs(keys) do if redis.call('ttl', k) == -1 then redis.call('expire', k, 60) end end return #keys" 0
     ```
  3. **Prevention Rule**: Always use atomic lock acquisition: `SET slot_lock:{staffId}:{time} {userId} NX PX 600000` (10 minutes).

---

### 5.3 Issue: JWT Invalidation Race Conditions During Role Changes
* **Symptom**: Revoked staff members or downgraded administrators can still access privileged endpoints for up to 15 minutes.
* **Root Cause**: Stateless JWT tokens remain cryptographically valid until expiration (`exp`), ignoring immediate database role updates.
* **Immediate Triage**:
  1. When a user role is revoked, issue a token revocation epoch into Redis:
     ```bash
     redis-cli SET "user_token_revoked_epoch:{userId}" 1740000000 EX 86400
     ```
  2. The API Gateway authentication middleware checks `iat < user_token_revoked_epoch` and rejects tokens issued prior to the revocation timestamp.

---

### 5.4 Issue: Webhook Idempotency Failures & Duplicate Charges
* **Symptom**: Customers receive duplicate booking confirmation emails or duplicate payment ledger entries.
* **Root Cause**: Webhook provider retried a transient 504 timeout, but the original request had already partially processed without recording an idempotency key.
* **Immediate Triage**:
  1. Ensure all incoming webhook deliveries query the `webhook_deliveries` table:
     ```sql
     SELECT id, status FROM webhook_deliveries WHERE idempotency_key = :key FOR UPDATE;
     ```
  2. If a record exists with status `PROCESSED`, immediately return HTTP `200 OK` with cached response payload.

---

### 5.5 Issue: Physical Arrival Token Clock Skew & Kiosk Desync
* **Symptom**: Arrival kiosk displays "Token Expired" or "Token Not Yet Valid" when customers arrive at their scheduled appointment time.
* **Root Cause**: NTP time desynchronization between physical kiosk hardware (tablet OS) and cloud application servers, or timezone offset mismatches.
* **Immediate Triage**:
  1. Verify cloud server UTC time against standard atomic clock: `ntpstat` or `timedatectl`.
  2. Ensure the arrival verification endpoint allows a configurable grace buffer:
     ```sql
     -- Allow arrival check-in from 30 minutes before to 60 minutes after scheduled time
     WHERE scheduled_start_time - INTERVAL '30 minutes' <= NOW() 
       AND scheduled_start_time + INTERVAL '60 minutes' >= NOW();
     ```
  3. Force kiosk tablets to synchronize time via MDM (Mobile Device Management) network time protocol.

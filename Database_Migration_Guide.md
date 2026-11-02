# Schedora Enterprise: Master Database Migration Playbook

> **Week-by-Week Implementation Plan, Dual-Write Pipeline & Zero-Downtime Cutover Runbook**  
> *Target Engine: PostgreSQL 15.4+ / 16.x on AWS Aurora / GCP Cloud SQL*  
> *Architected for Zero Customer Interruption and Zero Data Loss (RPO = 0, RTO < 15m)*

---

## 1. Migration Strategy & Executive Principles

Migrating an enterprise scheduling platform involves strict technical constraints: appointments are time-sensitive financial commitments where a lost record or double-booking can directly compromise revenue and patient/client trust. 

This playbook executes a **Dual-Write, Shadow-Read Migration Pattern** across six structured phases over 4 weeks:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          DUAL-WRITE SHADOW MIGRATION PATTERN                           │
└────────────────────────────────────────────────────────────────────────────────────────┘

                           [ Client HTTP Request ]
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Application Gateway     │
                        └─────────────┬─────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼ (Primary Write)                         ▼ (Async Dual-Write)
      ┌───────────────────────┐                 ┌───────────────────────┐
      │   Legacy Database     │                 │   Schedora Postgres   │
      │   (MySQL / Mongo)     │                 │   (13 New Modules)    │
      └──────────┬────────────┘                 └──────────┬────────────┘
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  Reconciliation Worker    │
                        │  (Detects & Flags Drifts) │
                        └───────────────────────────┘
```

### Guiding Principles
1. **Never Take a Maintenance Window**: Consumer discovery and physical arrival kiosks must remain online 24/7/365.
2. **Reversible at Every Gate**: Prior to the final cutover, any phase can be aborted within 60 seconds with zero data corruption.
3. **Continuous Data Validation**: Background checksum jobs continuously audit cryptographic hashes between legacy and target records.

---

## 2. Week-by-Week Implementation Plan

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        6-PHASE MIGRATION IMPLEMENTATION ROADMAP                        │
├─────────┬───────────────────────────────┬──────────────────────────────────────────────┤
│ PHASE   │ TIMELINE                      │ OBJECTIVES & MILESTONES                      │
├─────────┼───────────────────────────────┼──────────────────────────────────────────────┤
│ Phase 1 │ Week 1 (Days 1–5)             │ Environment Provisioning, Sizing & Dry Runs  │
│ Phase 2 │ Week 2 (Days 6–9)             │ Master DDL Rollout, Extensions & RLS Setup   │
│ Phase 3 │ Week 2–3 (Days 10–16)         │ Dual-Write Adapter & Historical ETL Backfill │
│ Phase 4 │ Week 3–4 (Days 17–22)         │ Application Query Migration & Cache Warm-Up  │
│ Phase 5 │ Week 4 (Days 23–26)           │ k6 Stress Testing, Chaos Drills & Rehearsal  │
│ Phase 6 │ Weekend (Day 27–28)           │ Live Production Cutover (Zero-Downtime)      │
└─────────┴───────────────────────────────┴──────────────────────────────────────────────┘
```

---

### Phase 1: Preparation & Infrastructure Sizing (Week 1)
- **Database Provisioning**:
  - Provision Primary PostgreSQL instance (`db.r6g.2xlarge` or GCP `db-custom-8-32768`).
  - Configure multi-AZ standby failover replica in a secondary availability zone.
  - Deploy **PgBouncer 1.22+** directly in front of the database cluster with transaction pooling.
- **Kernel & Database Tuning**:
  Add the following baseline configurations to `postgresql.conf`:
  ```ini
  max_connections = 400
  shared_buffers = 8GB
  effective_cache_size = 24GB
  maintenance_work_mem = 2GB
  checkpoint_completion_target = 0.9
  wal_buffers = 16MB
  default_statistics_target = 100
  random_page_cost = 1.1
  effective_io_concurrency = 200
  work_mem = 32MB
  min_wal_size = 2GB
  max_wal_size = 16GB
  max_worker_processes = 8
  max_parallel_workers_per_gather = 4
  ```
- **Validation Dry Run**: Apply `schedora_database_schema.sql` on a dedicated staging database to benchmark schema generation time and constraint dependencies.

---

### Phase 2: Schema Deployment & Security Hardening (Week 2)
- **Extension Installation**:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  CREATE EXTENSION IF NOT EXISTS "btree_gist";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  ```
- **DDL Execution**:
  Deploy the 13 modules using the unprivileged `schedora_migrator` user.
- **Index Building Strategy**:
  When deploying indexes to a live database, always append `CONCURRENTLY` to avoid table-level locks:
  ```sql
  CREATE INDEX CONCURRENTLY idx_appointments_staff_time 
  ON appointments(staff_id, scheduled_start, scheduled_end);
  ```
- **Row-Level Security Verification**:
  Verify tenant isolation policies by testing queries under different tenant scopes:
  ```sql
  -- Set tenant context
  SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) FROM appointments; -- Should only return Tenant 1 records
  ```

---

### Phase 3: Dual-Write Adapter & Historical Data Migration (Week 2–3)
- **Dual-Write Architecture**:
  1. Update the application write path: when a customer books or reschedules, the primary transaction commits to the legacy database, and an asynchronous worker writes the transformed payload to PostgreSQL.
  2. Implement an outbox table in the legacy database to guarantee eventual consistency.
- **Historical Backfill Script**:
  Run batch extraction for historical appointments and customer profiles:
  ```bash
  # Execute batch ETL with 5,000 records per transaction
  python3 scripts/migrate_historical_data.py \
    --source-db-url="$LEGACY_DB_URL" \
    --target-db-url="$SCHEDORA_DB_URL" \
    --batch-size=5000 \
    --start-date="2020-01-01"
  ```
- **Continuous Checksum Reconciliation**:
  Run a continuous reconciliation daemon comparing record hashes:
  ```sql
  -- Verifying customer record consistency
  SELECT l.id, l.email, s.email 
  FROM legacy_customers l
  LEFT JOIN customers s ON l.id = s.id
  WHERE s.id IS NULL OR md5(l.email) != md5(s.email);
  ```
  *Gate Criterion: Zero discrepancies across 5 consecutive 24-hour audit runs.*

---

### Phase 4: Application Integration & Connection Pooling (Week 3–4)
- **PgBouncer Pool Configuration**:
  Deploy PgBouncer configuration (`/etc/pgbouncer/pgbouncer.ini`):
  ```ini
  [databases]
  schedora_db = host=127.0.0.1 port=5432 dbname=schedora_db pool_mode=transaction

  [pgbouncer]
  listen_port = 6432
  listen_addr = 0.0.0.0
  auth_type = scram-sha-256
  auth_file = /etc/pgbouncer/userlist.txt
  max_client_conn = 5000
  default_pool_size = 60
  reserve_pool_size = 15
  reserve_pool_timeout = 5
  max_db_connections = 120
  ```
- **Shadow Reads Enablement**:
  Enable shadow reads: 100% of reads are served from legacy, but 20% of traffic is duplicated in background to Schedora PostgreSQL to benchmark query plans, index utilization, and connection buffer pool sizing.
- **Cache Warm-Up**:
  Pre-populate Redis cache with business operating hours, staff schedules, and upcoming 7-day bookings.

---

### Phase 5: Stress Testing, Chaos Drills & Rehearsal (Week 4)
- **k6 Load Simulation**:
  Simulate 15,000 peak concurrent booking requests:
  ```javascript
  // tests/load/k6-booking-spike.js
  import http from 'k6/http';
  import { check, sleep } from 'k6';

  export const options = {
    stages: [
      { duration: '2m', target: 5000 },
      { duration: '5m', target: 15000 },
      { duration: '2m', target: 0 },
    ],
  };

  export default function () {
    const res = http.get('https://api.schedora.com/api/v1/availability?staff_id=...&date=2026-10-01');
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(0.1);
  }
  ```
- **Chaos & Failover Rehearsal**:
  Trigger a simulated primary PostgreSQL crash during load testing. Verify that Aurora / Cloud SQL automated failover completes in under 35 seconds without dropping persistent client connections in PgBouncer.

---

## 3. Phase 6: Zero-Downtime Weekend Cutover Runbook

Schedule during off-peak traffic window (e.g., Sunday 02:00 UTC).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CUTOVER EXECUTION RUNBOOK                                │
├────────────┬───────────────────────────────────────────────────────────────────────────┤
│ TIME (UTC) │ ACTION ITEM                                                               │
├────────────┼───────────────────────────────────────────────────────────────────────────┤
│ 01:30      │ Engineering & SRE leads assemble in virtual incident bridge.              │
│ 01:45      │ Reduce Cloudflare DNS TTL for api.schedora.com to 60 seconds.             │
│ 02:00      │ Run final historical data reconciliation script (Confirm 0 drift).        │
│ 02:05      │ Promote Schedora PostgreSQL as the primary write target in application.   │
│ 02:06      │ Legacy database flipped to read-only replica mode.                        │
│ 02:08      │ Monitor error rates, PgBouncer pool latency, and Redis lock acquisitions. │
│ 02:15      │ Execute physical kiosk check-in synthetic test across 10 flagship venues. │
│ 02:30      │ Confirm 1,000+ successful customer bookings on new PostgreSQL cluster.    │
│ 03:00      │ Reset Cloudflare DNS TTL to 86,400 seconds. Declare cutover complete.    │
└────────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Operational Troubleshooting & Rollback Protocols

### 4.1 Abort Criteria & Immediate Rollback
If any of the following conditions persist for > 120 seconds during Phase 6:
- HTTP 5xx error rate exceeds 0.5% of total requests,
- API p99 latency exceeds 300ms,
- Any data reconciliation drift is detected between legacy and PostgreSQL,

**Execute Immediate Rollback Protocol**:
```bash
# 1. Flip application feature flag to route primary writes back to Legacy DB
curl -X POST https://admin.schedora.com/api/ops/feature-flags/db-primary \
  -H "Authorization: Bearer $MASTER_OPS_KEY" \
  -d '{"target": "legacy"}'

# 2. Flush PgBouncer connection buffers
psql -p 6432 -U pgbouncer -d pgbouncer -c "PAUSE; RELOAD; RESUME;"

# 3. Post incident status update to status.schedora.com
```

### 4.2 Handling Table Deadlocks During Migration
If a long-running migration locks a critical table:
```sql
-- Find blocked queries and locking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM  pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Terminate blocking process safely
SELECT pg_cancel_backend(blocking_pid);
```

### 4.3 Replication Lag Remediation
If PostgreSQL read replicas lag behind the primary during dual-write:
1. Increase `max_wal_senders` and `wal_keep_size` on primary.
2. Ensure read replicas have identical CPU and IOPS capacity as primary.
3. Temporarily route heavy analytics traffic away from replicas to avoid resource starvation.

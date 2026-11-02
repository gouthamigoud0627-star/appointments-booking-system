# Schedora Enterprise: REST & Real-Time API Specification

> **Comprehensive Enterprise API Contract, Authentication Protocols & Real-Time WebSocket Events**  
> *Base URL: `https://api.schedora.com/api/v1`*  
> *Protocol: HTTPS / TLS 1.3 & WSS (WebSockets)*  
> *Format: JSON (Content-Type: application/json)*  
> *Specification Version: 2.4.0 (Enterprise Production)*

---

## 1. Global API Standards & Architecture

### 1.1 Authentication & Multi-Tenancy Headers
All authenticated API requests require a standard Bearer token header. In multi-tenant enterprise environments, the tenant context is derived automatically from the token, or explicitly passed via `X-Tenant-ID`:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: 00000000-0000-0000-0000-000000000001
Content-Type: application/json
Accept: application/json
```

### 1.2 Rate Limiting Policies
Schedora enforces tier-based rate limiting via Redis token bucket filters:
- **Public Discovery Endpoints**: 120 requests / minute per client IP.
- **Booking & Slot Lock Endpoints**: 30 requests / minute per client IP.
- **Business Portal Authenticated Endpoints**: 600 requests / minute per tenant.
- **Hardware Kiosk Endpoints**: 300 requests / minute per authorized kiosk key.

When rate limits are exceeded, the API returns HTTP `429 Too Many Requests` with headers:
```http
Retry-After: 30
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1740003630
```

### 1.3 Standard Response Envelope
All REST endpoints return responses wrapped in a consistent JSON structure:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 1420,
    "total_pages": 71,
    "request_id": "req_01HP9Z84J2QXB4M3182"
  }
}
```

Standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "SLOT_ALREADY_LOCKED",
    "message": "The requested appointment time slot is temporarily held by another customer.",
    "details": {
      "staff_id": "b3e9447e-8c31-4a37-b6e8-b7cfca7140e1",
      "locked_until": "2026-10-15T14:40:00Z"
    },
    "timestamp": "2026-10-15T14:30:02Z",
    "request_id": "req_01HP9Z84J2QXB4M3182"
  }
}
```

---

## 2. Authentication & Identity Management

### 2.1 User Login
`POST /auth/login`
Authenticates a user and returns short-lived access JWT and HTTP-only refresh token.

```bash
curl -X POST https://api.schedora.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.sarah@premierdental.com",
    "password": "SecurePassword123!"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u_948a31b2-10f8-45b0-8f92-23c21a115891",
      "email": "dr.sarah@premierdental.com",
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "role": "business_admin",
      "tenant_id": "00000000-0000-0000-0000-000000000001"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "expires_in": 900,
      "token_type": "Bearer"
    }
  }
}
```

### 2.2 Refresh Access Token
`POST /auth/refresh`
Refreshes an expired access token using the valid refresh cookie/token.

```bash
curl -X POST https://api.schedora.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "rsh_910482019482019482019482"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

### 2.3 Multi-Factor Authentication Verify
`POST /auth/mfa/verify`
Validates a TOTP code during 2FA challenge.

```bash
curl -X POST https://api.schedora.com/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "ch_9481920391",
    "totp_code": "849201"
  }'
```

### 2.4 Password Reset Request & Confirmation
`POST /auth/password/reset-request`  
`POST /auth/password/reset-confirm`

### 2.5 User Profile & Current Session
`GET /auth/me`
Retrieves authenticated user profile, tenant assignments, and granular RBAC permission codes.

---

## 3. Appointment Management (7 Core Endpoints)

### 3.1 Lock & Reserve a Time Slot
`POST /appointments/lock`
Acquires a distributed Redis mutex on the target staff member and time slot for 10 minutes.

```bash
curl -X POST https://api.schedora.com/api/v1/appointments/lock \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "sp_58910e12-4f32-47ba-89a1-98bcfe0211a4",
    "service_id": "svc_11029481-9bfe-4011-80a2-4a00bc918491",
    "scheduled_start": "2026-10-15T14:00:00Z",
    "duration_minutes": 45
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "lock_token": "lck_894810239103984",
    "expires_at": "2026-10-15T14:10:00Z",
    "ttl_seconds": 600
  }
}
```

### 3.2 Create & Confirm Appointment
`POST /appointments`
Finalizes appointment creation, converts lock into confirmed booking, issues arrival token.

```bash
curl -X POST https://api.schedora.com/api/v1/appointments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lock_token": "lck_894810239103984",
    "business_id": "b_1001",
    "location_id": "loc_2002",
    "customer": {
      "first_name": "Marcus",
      "last_name": "Vance",
      "email": "marcus.vance@example.com",
      "phone": "+14155552671"
    },
    "payment_method_id": "pm_card_visa"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "appointment_id": "app_f3b49c00-0e42-4f6b-80a5-b1a9c1e149f1",
    "booking_reference": "SCH-894102",
    "scheduled_start": "2026-10-15T14:00:00Z",
    "scheduled_end": "2026-10-15T14:45:00Z",
    "status": "confirmed",
    "arrival_token": {
      "code": "SC-4892",
      "qr_payload": "https://schedora.com/check-in?token=SC-4892&sig=d89e...",
      "expires_at": "2026-10-15T16:00:00Z"
    }
  }
}
```

### 3.3 Get Appointment Details
`GET /appointments/:id`
Retrieves appointment details including assigned staff, service variants, pricing, and arrival token status.

### 3.4 List Appointments (Filtered)
`GET /appointments?location_id=:locId&start_date=2026-10-01&end_date=2026-10-31&status=confirmed`
Supports pagination, sorting, and filtering by staff ID, customer ID, or status.

### 3.5 Reschedule Appointment
`PUT /appointments/:id/reschedule`

```bash
curl -X PUT https://api.schedora.com/api/v1/appointments/app_f3b49c00/reschedule \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_start_time": "2026-10-16T10:00:00Z",
    "staff_id": "sp_58910e12-4f32-47ba-89a1-98bcfe0211a4",
    "reason": "Client business trip"
  }'
```

### 3.6 Cancel Appointment
`POST /appointments/:id/cancel`
Executes cancellation policy, applies late cancellation fees if within policy window, releases lock, and offers slot to waitlist.

### 3.7 Physical Arrival Check-In (Kiosk & Geofence)
`POST /appointments/check-in`
Verifies cryptographic arrival token or QR code payload and transitions appointment status to `arrived`.

```bash
curl -X POST https://api.schedora.com/api/v1/appointments/check-in \
  -H "X-Kiosk-Key: ksk_live_94810293810293810293" \
  -H "Content-Type: application/json" \
  -d '{
    "token_code": "SC-4892",
    "kiosk_id": "ksk_77192",
    "verification_method": "kiosk_qr"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "appointment_id": "app_f3b49c00-0e42-4f6b-80a5-b1a9c1e149f1",
    "status": "arrived",
    "customer_name": "Marcus Vance",
    "service_name": "Comprehensive Dental Exam",
    "staff_name": "Dr. Sarah Jenkins",
    "queue_position": 2,
    "assigned_room": "Operatory 3",
    "verified_at": "2026-10-15T13:52:14Z"
  }
}
```

---

## 4. Business & Location Management (4 Endpoints)

### 4.1 Create Business Profile
`POST /businesses`
Registers a new business branch or franchised entity under the current tenant.

```bash
curl -X POST https://api.schedora.com/api/v1/businesses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lumina Dermatology",
    "slug": "lumina-dermatology",
    "category": "healthcare",
    "email": "contact@luminaderma.com",
    "phone": "+14155558900"
  }'
```

### 4.2 Get Business Profile & Public Settings
`GET /businesses/:id` (or `GET /businesses/by-slug/:slug`)

### 4.3 Update Business Catalog & Policies
`PUT /businesses/:id`
Updates operational policies, cancellation grace periods, deposit requirements, and branding.

### 4.4 Manage Locations & Business Hours
`POST /businesses/:id/locations`  
`PUT /locations/:id/hours`

```bash
curl -X PUT https://api.schedora.com/api/v1/locations/loc_2002/hours \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": [
      { "day_of_week": 1, "open_time": "08:00", "close_time": "18:00", "is_closed": false },
      { "day_of_week": 2, "open_time": "08:00", "close_time": "18:00", "is_closed": false },
      { "day_of_week": 0, "open_time": "00:00", "close_time": "00:00", "is_closed": true }
    ]
  }'
```

---

## 5. Staff & Workforce Management (3 Endpoints)

### 5.1 List & Provision Staff Profiles
`GET /staff` & `POST /staff`

```bash
curl -X POST https://api.schedora.com/api/v1/staff \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "b_1001",
    "first_name": "Elena",
    "last_name": "Rostova",
    "email": "elena.r@premierdental.com",
    "title": "Senior Hygienist",
    "commission_rate": 15.0
  }'
```

### 5.2 Update Shift Schedules & Availability
`PUT /staff/:id/schedules`
Defines weekly working shifts, break periods, and location allocations.

### 5.3 Assign Qualified Services to Staff
`POST /staff/:id/services`
Maps service IDs to staff profile with optional custom duration and pricing overrides.

---

## 6. Payment Processing & Financial Ledger (5 Endpoints)

### 6.1 Create Stripe Payment Intent (Deposit / Pre-Auth)
`POST /payments/create-intent`

```bash
curl -X POST https://api.schedora.com/api/v1/payments/create-intent \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "app_f3b49c00-0e42-4f6b-80a5-b1a9c1e149f1",
    "amount": 25.00,
    "currency": "USD",
    "capture_method": "manual"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_3MtwxAEomE2W94xT0bvR_secret_99810",
    "payment_intent_id": "pi_3MtwxAEomE2W94xT0bvR",
    "amount": 25.00,
    "status": "requires_payment_method"
  }
}
```

### 6.2 Confirm Payment & Update Ledger
`POST /payments/confirm`

### 6.3 Process Refund
`POST /payments/refunds`

```bash
curl -X POST https://api.schedora.com/api/v1/payments/refunds \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_89102830",
    "amount": 25.00,
    "reason": "customer_cancelled_before_buffer"
  }'
```

### 6.4 List Invoices & Download PDF Receipts
`GET /invoices` & `GET /invoices/:id/pdf`

### 6.5 Stripe Inbound Webhook Receiver
`POST /webhooks/stripe`
Handles raw Stripe webhook signatures and idempotent event dispatches.

---

## 7. Notifications & Customer Engagement (4 Endpoints)

### 7.1 Send Multi-Channel Broadcast
`POST /notifications/broadcast`
Broadcast urgent alerts (e.g., weather emergency, delayed clinic schedule) to clients booked today.

```bash
curl -X POST https://api.schedora.com/api/v1/notifications/broadcast \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "loc_2002",
    "channels": ["sms", "email"],
    "message": "Due to local flooding, clinic opening is delayed by 1 hour today. All appointments shifted by 60 mins."
  }'
```

### 7.2 Fetch & Customize Templates
`GET /notifications/templates` & `PUT /notifications/templates/:id`

### 7.3 Update Customer Communication Preferences
`PUT /customers/:id/preferences`

### 7.4 Trigger Manual SMS / Email Reminder
`POST /appointments/:id/remind`

---

## 8. Analytics & Reporting (3 Endpoints)

### 8.1 Executive Business Overview Metrics
`GET /analytics/overview?start_date=2026-09-01&end_date=2026-09-30`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_appointments": 1420,
    "completed_count": 1318,
    "no_show_count": 48,
    "no_show_rate_pct": 3.38,
    "gross_revenue": 218450.00,
    "net_revenue": 204320.00,
    "average_ticket_size": 153.84
  }
}
```

### 8.2 Staff Utilization & Productivity
`GET /analytics/staff-utilization?location_id=:locId&period=month`

### 8.3 Revenue & Cancellation Breakdown
`GET /analytics/revenue-breakdown`

---

## 9. Search & Discovery Engine

### 9.1 Full-Text & Geolocation Discovery
`GET /search/businesses?category=wellness&lat=37.7749&lng=-122.4194&radius_km=15`

```bash
curl -X GET "https://api.schedora.com/api/v1/search/businesses?category=wellness&lat=37.7749&lng=-122.4194&radius_km=15" \
  -H "Accept: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "b_1001",
      "name": "Apex Spine & Wellness",
      "slug": "apex-spine-wellness",
      "distance_km": 2.4,
      "rating_average": 4.92,
      "rating_count": 184,
      "address": "450 Sutter St, Suite 800, San Francisco, CA",
      "next_available_slot": "2026-10-16T09:30:00Z"
    }
  ]
}
```

### 9.2 Real-Time Availability Matrix Query
`GET /availability?business_id=b_1001&service_id=svc_01&date=2026-10-16`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2026-10-16",
    "slots": [
      {
        "start_time": "2026-10-16T09:00:00Z",
        "end_time": "2026-10-16T09:45:00Z",
        "staff_id": "sp_58910e12",
        "staff_name": "Dr. Sarah Jenkins",
        "available": true
      },
      {
        "start_time": "2026-10-16T09:45:00Z",
        "end_time": "2026-10-16T10:30:00Z",
        "staff_id": "sp_58910e12",
        "staff_name": "Dr. Sarah Jenkins",
        "available": false,
        "reason": "held_in_checkout"
      }
    ]
  }
}
```

---

## 10. Real-Time WebSocket Architecture (WSS)

Connect via: `wss://api.schedora.com/ws/v1`

### 10.1 Authentication & Channel Subscription
Send authentication handshake upon connection:
```json
{
  "action": "subscribe",
  "topic": "business:b_1001:calendar",
  "token": "eyJhbGciOiJIUzI1Ni..."
}
```

### 10.2 Core WebSocket Event Catalog

| Event Name | Direction | Payload Summary |
|---|---|---|
| `slot:locked` | Server -> Client | Broadcasts temporary slot reservation hold to all calendar views |
| `appointment:created` | Server -> Client | Notifies business dashboard of new confirmed booking |
| `arrival:verified` | Server -> Client | Notifies front desk and service provider of client physical check-in |
| `queue:updated` | Server -> Client | Real-time queue advance event for lobby wait displays |
| `kiosk:heartbeat` | Client -> Server | Periodic ping from physical check-in tablet hardware |

#### Example Event: `arrival:verified`
```json
{
  "event": "arrival:verified",
  "timestamp": "2026-10-15T13:52:15Z",
  "data": {
    "appointment_id": "app_f3b49c00-0e42-4f6b-80a5-b1a9c1e149f1",
    "customer_name": "Marcus Vance",
    "token_code": "SC-4892",
    "staff_id": "sp_58910e12-4f32-47ba-89a1-98bcfe0211a4",
    "location_id": "loc_2002",
    "queue_number": 4
  }
}
```

---

## 11. Error Code Reference & Status Matrix

| Error Code | HTTP Status | Description & Recommended Client Action |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid Bearer JWT. Re-authenticate via `/auth/login`. |
| `FORBIDDEN` | 403 | Insufficient RBAC permission code for the requested action. |
| `TENANT_NOT_FOUND` | 404 | Provided `X-Tenant-ID` does not exist or has been suspended. |
| `SLOT_ALREADY_LOCKED` | 409 | Another user is holding the slot lock. Prompt user to select next slot. |
| `SLOT_OVERLAPPING` | 409 | Slot conflicts with an existing confirmed booking or staff break. |
| `TOKEN_EXPIRED` | 410 | Physical arrival token has expired past the ±60-minute window. |
| `GEOFENCE_OUT_OF_RANGE` | 422 | Mobile check-in attempt exceeded the 100m location radius threshold. |
| `PAYMENT_REQUIRED` | 402 | Pre-authorization hold or deposit card declined by issuing bank. |
| `RATE_LIMIT_EXCEEDED` | 429 | Request rate exceeded allowed tier limit. Back off per `Retry-After`. |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled database or system exception. Contact support with `request_id`. |

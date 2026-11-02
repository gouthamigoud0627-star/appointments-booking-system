# Full-Screen Onboarding Flow with Calendar & Business Timings Plan

## 1. Overview & Objective
Transform the onboarding and registration questionnaire into an immersive, full-screen experience where the background remains completely stationary (`fixed inset-0`), the questionnaire scrolls smoothly, the "Next" option is permanently visible on screen via a sticky bottom bar, and the flow seamlessly extends into an interactive Calendar and Business Operating Hours ("when will it open & all") schedule.

---

## 2. Key Implementations

### A. Full-Screen Shell & Stationary Background (`src/components/AuthLayout.jsx`)
1. **Stationary Background (`fixed inset-0 -z-10`)**:
   - Fixed the background mesh pattern using `position: fixed; inset: 0` so it never moves, jumps, or jitters when users scroll through questions or enter text.
2. **Full-Screen Viewport**:
   - Configured `fixed inset-0 overflow-hidden flex flex-col` with a fixed top header and a smooth vertical scrollable body (`flex-1 overflow-y-auto`).

### B. Sticky On-Screen "Next" Navigation Bar
1. Embedded a sticky bottom navigation bar (`sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t`) on all steps.
2. Users can always see the "Back" action, the active step progress indicator, and the primary **"Next / Continue"** button without scrolling.

### C. Step 6: Interactive Appointment Calendar
1. Calendar widget with dynamic month navigation (previous / next month).
2. Weekday headers (Sun - Sat) with interactive day buttons:
   - Today's date highlighted with border
   - Selected date in solid indigo with check state
   - Past days disabled
   - Green dot indicators for open business days
3. Quick date selector chips: "Today", "Tomorrow", "This Weekend", "Next Monday".
4. Confirmed selected date banner.

### D. Step 7: Business Timings & Operating Hours ("When will it open & all")
1. **Live Operating Status Badge**:
   - Real-time indicator ("🟢 OPEN TODAY").
2. **Key Timings Overview**:
   - Opens At (e.g. `08:30 AM`)
   - Closes At (e.g. `07:30 PM`)
   - Lunch Break (e.g. `01:00 PM - 02:00 PM`)
3. **Full 7-Day Weekly Schedule Breakdown**:
   - Clear cards for Monday through Sunday detailing opening and closing hours.
4. **Interactive Time Slots for Selected Date**:
   - Morning slots (`09:30 AM`, `10:30 AM`, `11:30 AM`)
   - Afternoon & Evening slots (`02:30 PM`, `04:15 PM`, `05:30 PM`, `06:30 PM`)
5. **Arrival Token Queue Notice**:
   - Zero-wait token preview (e.g. Token #A-14).
6. **Booking Confirmation**:
   - Completes customer registration and persists chosen booking preferences.

---

## 3. Verification
- `lint_applet` passed (`tsc --noEmit`).
- `compile_applet` succeeded and production bundle built cleanly.

# Smart Society Management

## Current State
Full-stack society management app with localStorage-backed store. Existing pages: Dashboard, Properties, Billing, Security, Communication (Notices + Complaints + Polls), Staff, Expenses, Analytics, Settings. RBAC with 5 roles. Communication page contains both Notices and Complaints as tabs.

## Requested Changes (Diff)

### Add
- **P&L Statement page** (SuperAdmin, Admin): Income side from billing payments per month, Expense side from expenses module; monthly P&L table with totals, net surplus/deficit, and a bar chart comparing income vs expenses by month.
- **Directory page** (all roles): Resident directory pulled from Units data, showing Name, Flat No, Phone Number, Unit Type, Ownership Type. Admin can add/edit entries. Residents see all contacts.
- **Vehicle Registration page** (SuperAdmin, Admin, SecurityGuard, Resident): Register vehicles per flat — fields: Flat No, Owner Name, Vehicle Number, Vehicle Type (Car/Bike/Other), Color, Brand. Admin can add/edit/delete. Residents can register their own vehicle.
- **AMC Tracker page** (SuperAdmin, Admin): Track Annual Maintenance Contracts — fields: Item/Equipment Name, Vendor, Contract Start, Contract End, Amount, Contact, Status (Active/Expired/Expiring Soon), Notes. Color-coded expiry status. Renew action.
- **Standalone Complaints page** (SuperAdmin, Admin, Resident): Extract complaint tab from Communication into its own sidebar page for easier access.
- **Standalone Notices page** (SuperAdmin, Admin, Resident): Extract notices tab from Communication into its own sidebar page for easier access.
- Vehicle and AMC types + seed data in societyStore.ts
- Nav items for all new pages

### Modify
- `societyStore.ts`: Add Vehicle and AMC interfaces, seed data, and CRUD operations
- `Layout.tsx`: Add 6 new nav items (P&L, Directory, Vehicles, AMC, Complaints, Notices) with appropriate RBAC roles
- `App.tsx`: Add routing cases for 6 new pages
- Communication.tsx: keep Polls tab, remove Notices and Complaints tabs (or keep for backward compat — keep both for now, standalone pages are additional entry points)

### Remove
- Nothing removed — Communication page stays intact, new pages are additional standalone views

## Implementation Plan
1. Extend societyStore: add `Vehicle` and `AmcContract` types, seed data arrays, CRUD ops, and expose via store context
2. Create `PnL.tsx`: monthly P&L table (income from payments, expenses from expenses module), bar chart, net summary KPIs
3. Create `Directory.tsx`: table of all units with owner info; search/filter; admin can add/edit unit contact details
4. Create `VehicleRegistration.tsx`: vehicle list table, add/edit/delete dialog; filter by flat/type
5. Create `AmcTracker.tsx`: AMC table with color-coded expiry badges (Active=green, Expiring Soon=orange <30 days, Expired=red); add/edit/renew dialogs
6. Create `Complaints.tsx`: standalone page wrapping complaint functionality (reuse from Communication)
7. Create `Notices.tsx`: standalone page wrapping notice functionality (reuse from Communication)
8. Update `App.tsx` with 6 new page imports and switch cases
9. Update `Layout.tsx` with 6 new nav items and roles

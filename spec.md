# Smart Society Management

## Current State

- **Settings page** already contains 4 tabs: "Societies", "Society Info", "User Management", "My Profile" -- all under a single Settings page in the sidebar.
- **Dashboard** reads all KPIs (towers, units, visitors, complaints, financialSummary) entirely from `useSocietyStore` (localStorage).
- **Expenses** module (Admin/SuperAdmin only) reads and writes all expense data entirely from `useSocietyStore` (localStorage).
- **Billing**, **Properties**, and **Resident experience** (Notices, Complaints) have already been partially migrated to the Motoko backend in prior sessions.
- The Motoko backend (`main.mo`) has functions: `getTowers`, `getUnits`, `getBills`, `getFinancialSummary`, `getActiveVisitors`, `getComplaints` -- but **no expense-related functions** exist yet.

## Requested Changes (Diff)

### Add
- Backend Motoko functions for Expenses: `createExpense`, `getExpenses`, `updateExpense`, `deleteExpense`, `deleteAllExpenses` with Expense type including: id, title, category, amount, description, paidTo, paidBy, date, paymentMethod, receiptNumber, societyId.
- Dashboard frontend reads KPI data from Motoko backend (towers count, units count, financial summary, active visitors count, complaints count) while falling back gracefully to 0 if backend calls fail.
- Dashboard shows a loading skeleton while fetching backend data.

### Modify
- **Dashboard.tsx**: Replace `useSocietyStore` KPI data calls with Motoko `backend` API calls (`getTowers`, `getUnits`, `getFinancialSummary`, `getActiveVisitors`, `getComplaints`). The activityFeed static array remains as-is (empty).
- **Expenses.tsx**: Replace all `useSocietyStore` expense calls with Motoko `backend` API calls (`getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `deleteAllExpenses`). Loading and error states are required.
- **Settings.tsx**: No structural changes -- Society, Society Info, and User Management are already tabs inside Settings. Confirm no extra sidebar navigation items are added for these. The tab labels and order should be: Societies → Society Info → User Management → My Profile (for SuperAdmin), or Societies → Society Info → My Profile (for Admin/committee roles).

### Remove
- Dashboard's dependency on `useSocietyStore` for KPI data (towers, units, financialSummary, activeVisitors, complaints).
- Expenses' dependency on `useSocietyStore` for all expense CRUD operations.

## Implementation Plan

1. **Backend (main.mo)**: Add `Expense` type and all 5 expense functions (`createExpense`, `getExpenses`, `updateExpense`, `deleteExpense`, `deleteAllExpenses`). societyId is stored on each expense but current backend uses a single-canister model so societyId is accepted as a parameter for future-proofing.
2. **backend.d.ts**: Add `Expense` interface and the 5 new expense function signatures.
3. **Dashboard.tsx**: Wire to backend using `useEffect` + `backend.*` calls. Show loading skeleton on KPI cards while fetching. Graceful fallback to 0 on error.
4. **Expenses.tsx**: Migrate all CRUD to backend. Remove societyStore import for expenses. Show loading state on mount, error state on failure.
5. **Settings.tsx**: No changes needed -- tabs are already correct. Confirm Society / Society Info / User Management remain under Settings tabs only (not as separate sidebar items).
6. Build and deploy.

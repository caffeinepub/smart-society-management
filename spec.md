# Smart Society Management

## Current State
- All Billing data (bills, payments) is stored in browser localStorage via `societyStore.ts`
- The Resident billing view was previously partially wired to the Motoko backend (uses `actor.getBills()`, `actor.recordPayment()`, `actor.getSocietyInfo()`)
- The Admin/SuperAdmin billing view still uses `useSocietyStore()` for all CRUD (createBill, updateBill, deleteBill, deleteAllBills, recordPayment, getFinancialSummary)
- The backend `Bill` type only has: id, unitId, unitNumber, amount, dueDate, month, year, status
- The frontend `Bill` type includes full maintenance breakdown (9 fields), previousDue, grandTotal, societyId
- Properties data (towers, units) is still in localStorage

## Requested Changes (Diff)

### Add
- Extended `Bill` type in `main.mo` with all breakdown fields: serviceCharges, nonOccupancyCharges, liftMaintenance, parkingCharges, sinkingFund, otherCharges, houseTax, repairMaintenance, interest, previousDue, grandTotal, societyId
- `updateBill` function in `main.mo` to support editing existing bills
- `deleteBill(id)` function in `main.mo`
- `deleteAllBills()` function in `main.mo`
- Updated `backend.d.ts` to reflect all new Bill fields and functions

### Modify
- `Billing.tsx` admin view: replace all `store.createBill / updateBill / deleteBill / deleteAllBills / recordPayment / getBills / getFinancialSummary` calls with backend actor calls
- `Billing.tsx` resident view: already uses backend, ensure it still works with updated Bill type
- Admin billing form: wire to `actor.createBill(...)` with all breakdown fields
- Edit bill dialog: wire to `actor.updateBill(...)`
- Record payment: wire to `actor.recordPayment(...)`
- Delete bill: wire to `actor.deleteBill(...)`
- Delete all bills: wire to `actor.deleteAllBills()`
- Financial summary KPIs: wire to `actor.getFinancialSummary()`

### Remove
- No modules removed

## Implementation Plan
1. Update `main.mo`: extend Bill type with 9 breakdown fields + previousDue + grandTotal + societyId; add updateBill, deleteBill, deleteAllBills functions
2. Update `backend.d.ts`: add all new fields and function signatures
3. Update `Billing.tsx`: replace localStorage calls with actor calls for admin view; add loading/error states; keep resident view working
4. Ensure units list for bill generation comes from `actor.getUnits()` (already available in backend)

/**
 * societyStore.ts
 * localStorage-backed in-memory store for Smart Society Management.
 * Replaces all backend actor calls to work fully in the browser.
 */

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole =
  | "SuperAdmin"
  | "Admin"
  | "Chairman"
  | "Secretary"
  | "Treasurer"
  | "SecurityGuard"
  | "Resident"
  | "Staff";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: AppRole;
  societyId?: number; // null/undefined for SuperAdmin, required for all others
  unitId?: number;
  unitNumber?: string;
  createdAt: string;
}

export interface Society {
  id: number;
  name: string;
  address: string;
  city: string;
  registrationNumber: string;
  contactPhone: string;
  isEnabled: boolean; // true = active/enabled, false = inactive/suspended
}

export interface SocietyInfo {
  name: string;
  address: string;
  city: string;
  registrationNumber: string;
  contactPhone: string;
}

export interface Tower {
  id: number;
  name: string;
  totalFloors: number;
  societyId: number; // which society this tower belongs to
}

export interface MaintenanceBreakdown {
  serviceCharges: number;
  nonOccupancyCharges: number;
  liftMaintenance: number;
  parkingCharges: number;
  sinkingFund: number;
  otherCharges: number;
  houseTax: number;
  repairMaintenance: number;
  interest: number;
}

export interface Unit {
  id: number;
  towerId: number;
  unitNumber: string;
  floor: number;
  ownerName: string;
  isOccupied: boolean;
  monthlyMaintenance: number; // grand total (breakdown sum + previousDue)
  maintenanceBreakdown?: MaintenanceBreakdown;
  previousDue?: number;
  societyId: number;
  // Extended unit details
  area?: number; // in sqft
  ownershipType?: string; // e.g. "Owner", "Tenant", "Co-owner"
  phone?: string;
  email?: string;
  memberCount?: number;
  unitType?: string; // e.g. "1BHK", "2BHK", "3BHK", "Studio", "Penthouse"
}

export interface BillBreakdown {
  serviceCharges: number;
  nonOccupancyCharges: number;
  liftMaintenance: number;
  parkingCharges: number;
  sinkingFund: number;
  otherCharges: number;
  houseTax: number;
  repairMaintenance: number;
  interest: number;
}

export interface Bill {
  id: number;
  unitId: number;
  unitNumber: string;
  amount: number; // sum of breakdown fields
  previousDue: number; // carry-forward from previous month
  grandTotal: number; // amount + previousDue
  breakdown: BillBreakdown;
  dueDate: string;
  month: number;
  year: number;
  status: string; // "Paid" | "Pending" | "Overdue"
  societyId: number;
}

export interface Payment {
  id: number;
  billId: number;
  amount: number;
  paidAt: string;
  paymentMethod: string;
}

export interface FinancialSummary {
  totalBilled: number;
  totalCollected: number;
  pendingDues: number;
}

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  purpose: string;
  hostUnit: string;
  hostUnitId: number;
  checkInTime: string;
  checkOutTime: string | null;
  status: string; // "Active" | "CheckedOut"
  societyId: number;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  postedBy: string;
  postedAt: string;
  isActive: boolean;
  societyId: number;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  unitNumber: string;
  residentName: string;
  status: string; // "Open" | "InProgress" | "Resolved" | "Closed"
  priority: string; // "Low" | "Medium" | "High" | "Critical"
  createdAt: string;
  resolution: string | null;
  societyId: number;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  societyId: number;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joiningDate: string;
  isActive: boolean;
  societyId: number;
}

export interface Attendance {
  id: number;
  staffId: number;
  date: string;
  status: string; // "Present" | "Absent" | "HalfDay"
}

export interface SalaryRecord {
  id: number;
  staffId: number;
  month: number;
  year: number;
  amount: number;
  paidOn: string;
  status: string; // "Paid" | "Pending" | "Partial"
}

export interface Expense {
  id: number;
  title: string;
  category: string; // "Maintenance", "Utilities", "Staff Salary", "Security", "Cleaning", "Repairs", "Administrative", "Other"
  amount: number;
  description: string;
  paidTo: string; // vendor / payee name
  paidBy: string; // admin who recorded it
  date: string; // YYYY-MM-DD
  paymentMethod: string; // "Cash", "Bank Transfer", "Cheque", "UPI"
  receiptNumber: string; // optional reference
  societyId: number;
}

export interface Vehicle {
  id: number;
  unitId: number;
  unitNumber: string;
  ownerName: string;
  vehicleNumber: string;
  vehicleType: string; // "Car" | "Bike" | "Scooter" | "Other"
  brand: string;
  color: string;
  societyId: number;
}

export interface AmcContract {
  id: number;
  equipmentName: string;
  vendor: string;
  contactPerson: string;
  contactPhone: string;
  contractStart: string; // YYYY-MM-DD
  contractEnd: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: string;
  notes: string;
  status: string; // "Active" | "Expired" | "Expiring Soon"
  societyId: number;
}

// ─── Store state shape ────────────────────────────────────────────────────────

interface StoreState {
  societyInfo: SocietyInfo;
  societies: Society[];
  activeSocietyId: number;
  towers: Tower[];
  units: Unit[];
  bills: Bill[];
  payments: Payment[];
  visitors: Visitor[];
  notices: Notice[];
  complaints: Complaint[];
  polls: Poll[];
  staff: Staff[];
  attendance: Attendance[];
  salaryRecords: SalaryRecord[];
  expenses: Expense[];
  vehicles: Vehicle[];
  amcContracts: AmcContract[];
  users: User[];
  currentUserId: number | null;
  nextId: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function buildSeedData(): StoreState {
  const towers: Tower[] = [];

  const units: Unit[] = [];

  const bills: Bill[] = [];

  const payments: Payment[] = [];

  const visitors: Visitor[] = [];

  const notices: Notice[] = [];

  const complaints: Complaint[] = [];

  const polls: Poll[] = [];

  const staff: Staff[] = [];
  const attendance: Attendance[] = [];
  const salaryRecords: SalaryRecord[] = [];

  const societies: Society[] = [];

  const expenses: Expense[] = [];

  const vehicles: Vehicle[] = [];

  const amcContracts: AmcContract[] = [];

  function hashPassword(email: string, password: string): string {
    return btoa(unescape(encodeURIComponent(`${email}:${password}`)));
  }

  const users: User[] = [
    {
      id: 1,
      name: "Super Admin",
      email: "admin@society.com",
      passwordHash: hashPassword("admin@society.com", "admin123"),
      role: "SuperAdmin",
      // SuperAdmin has no societyId — global access
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    societyInfo: {
      name: "",
      address: "",
      city: "",
      registrationNumber: "",
      contactPhone: "",
    },
    societies,
    activeSocietyId: 0,
    towers,
    units,
    bills,
    payments,
    visitors,
    notices,
    complaints,
    polls,
    staff,
    attendance,
    salaryRecords,
    expenses,
    vehicles,
    amcContracts,
    users,
    currentUserId: null,
    nextId: 10,
  };
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = "ssm_store";

function loadFromStorage(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      // Migrate: ensure societies and activeSocietyId exist for older saves
      if (!parsed.societies) {
        parsed.societies = [
          {
            id: 1,
            name: parsed.societyInfo.name,
            address: parsed.societyInfo.address,
            city: parsed.societyInfo.city,
            registrationNumber: parsed.societyInfo.registrationNumber,
            contactPhone: parsed.societyInfo.contactPhone,
            isEnabled: true,
          },
        ];
        parsed.activeSocietyId = 1;
      }
      // Migrate: ensure isEnabled exists on all societies (default to true)
      if (parsed.societies) {
        parsed.societies = parsed.societies.map((soc) => ({
          ...soc,
          isEnabled: (soc as any).isEnabled ?? true,
        }));
      }
      // Migrate towers: ensure societyId exists
      if (parsed.towers) {
        parsed.towers = parsed.towers.map((t) => ({
          ...t,
          societyId: t.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate bills: ensure breakdown/previousDue/grandTotal/societyId exist
      if (parsed.bills) {
        parsed.bills = parsed.bills.map((b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bd = (b.breakdown ?? {}) as any;
          const migratedBreakdown: BillBreakdown = {
            serviceCharges: bd.serviceCharges ?? bd.baseMaintenance ?? b.amount,
            nonOccupancyCharges: bd.nonOccupancyCharges ?? 0,
            liftMaintenance: bd.liftMaintenance ?? 0,
            parkingCharges: bd.parkingCharges ?? 0,
            sinkingFund: bd.sinkingFund ?? 0,
            otherCharges: bd.otherCharges ?? 0,
            houseTax: bd.houseTax ?? 0,
            repairMaintenance: bd.repairMaintenance ?? 0,
            interest: bd.interest ?? 0,
          };
          return {
            ...b,
            previousDue: b.previousDue ?? 0,
            grandTotal: b.grandTotal ?? b.amount,
            breakdown: migratedBreakdown,
            societyId: b.societyId ?? (parsed.activeSocietyId || 1),
          };
        });
      }
      // Migrate units: ensure new fields exist and societyId
      if (parsed.units) {
        parsed.units = parsed.units.map((u) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bd = u.maintenanceBreakdown as any;
          if (
            bd &&
            bd.baseMaintenance !== undefined &&
            bd.serviceCharges === undefined
          ) {
            u.maintenanceBreakdown = {
              serviceCharges: bd.baseMaintenance,
              nonOccupancyCharges: bd.nonOccupancyCharges ?? 0,
              liftMaintenance: bd.liftMaintenance ?? 0,
              parkingCharges: bd.parkingCharges ?? 0,
              sinkingFund: bd.sinkingFund ?? 0,
              otherCharges: bd.otherCharges ?? 0,
              houseTax: bd.houseTax ?? 0,
              repairMaintenance: bd.repairMaintenance ?? 0,
              interest: bd.interest ?? 0,
            };
          }
          // Migrate societyId on units
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (u as any).societyId =
            (u as any).societyId ?? (parsed.activeSocietyId || 1);
          return u;
        });
      }
      // Migrate visitors: ensure societyId
      if (parsed.visitors) {
        parsed.visitors = parsed.visitors.map((v) => ({
          ...v,
          societyId: v.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate notices: ensure societyId
      if (parsed.notices) {
        parsed.notices = parsed.notices.map((n) => ({
          ...n,
          societyId: n.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate complaints: ensure societyId
      if (parsed.complaints) {
        parsed.complaints = parsed.complaints.map((c) => ({
          ...c,
          societyId: c.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate polls: ensure societyId
      if (parsed.polls) {
        parsed.polls = parsed.polls.map((p) => ({
          ...p,
          societyId: p.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate staff: ensure societyId
      if (parsed.staff) {
        parsed.staff = parsed.staff.map((s) => ({
          ...s,
          societyId: s.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate users: assign societyId=1 to all non-SuperAdmin users missing societyId
      if (parsed.users) {
        parsed.users = parsed.users.map((u) => ({
          ...u,
          societyId: u.societyId ?? (u.role === "SuperAdmin" ? undefined : 1),
        }));
      }
      // Migrate: ensure expenses array exists
      if (!parsed.expenses) {
        parsed.expenses = [];
      }
      // Migrate: ensure vehicles array exists
      if (!parsed.vehicles) {
        parsed.vehicles = [];
      }
      // Migrate: ensure amcContracts array exists
      if (!parsed.amcContracts) {
        parsed.amcContracts = [];
      }
      // Migrate: ensure users array exists
      if (!parsed.users || parsed.users.length === 0) {
        const seed = buildSeedData();
        parsed.users = seed.users;
      }
      if (parsed.currentUserId === undefined) {
        parsed.currentUserId = null;
      }
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return buildSeedData();
}

function saveToStorage(state: StoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

// ─── Store operations ─────────────────────────────────────────────────────────

function createOps(state: StoreState, setState: (s: StoreState) => void) {
  const mutate = (updater: (s: StoreState) => StoreState) => {
    const next = updater(state);
    saveToStorage(next);
    setState(next);
  };

  const nextId = () => {
    const id = state.nextId;
    return id;
  };

  return {
    // Society Info
    getSocietyInfo: (): SocietyInfo => state.societyInfo,
    updateSocietyInfo: (
      name: string,
      address: string,
      city: string,
      registrationNumber: string,
      contactPhone: string,
    ): void => {
      mutate((s) => ({
        ...s,
        societyInfo: { name, address, city, registrationNumber, contactPhone },
        societies: s.societies.map((soc) =>
          soc.id === s.activeSocietyId
            ? { ...soc, name, address, city, registrationNumber, contactPhone }
            : soc,
        ),
      }));
    },

    // Societies
    getSocieties: (): Society[] => state.societies,
    getActiveSocietyId: (): number => state.activeSocietyId,
    registerSociety: (
      name: string,
      address: string,
      city: string,
      registrationNumber: string,
      contactPhone: string,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        societies: [
          ...s.societies,
          {
            id,
            name,
            address,
            city,
            registrationNumber,
            contactPhone,
            isEnabled: true,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    toggleSocietyEnabled: (id: number): void => {
      mutate((s) => ({
        ...s,
        societies: s.societies.map((soc) =>
          soc.id === id ? { ...soc, isEnabled: !soc.isEnabled } : soc,
        ),
      }));
    },
    deleteSociety: (id: number): void => {
      mutate((s) => ({
        ...s,
        societies: s.societies.filter((soc) => soc.id !== id),
      }));
    },
    setActiveSociety: (id: number): void => {
      mutate((s) => {
        const soc = s.societies.find((x) => x.id === id);
        if (!soc) return s;
        return {
          ...s,
          activeSocietyId: id,
          societyInfo: {
            name: soc.name,
            address: soc.address,
            city: soc.city,
            registrationNumber: soc.registrationNumber,
            contactPhone: soc.contactPhone,
          },
        };
      });
    },
    updateActiveSociety: (
      name: string,
      address: string,
      city: string,
      registrationNumber: string,
      contactPhone: string,
    ): void => {
      mutate((s) => ({
        ...s,
        societyInfo: { name, address, city, registrationNumber, contactPhone },
        societies: s.societies.map((soc) =>
          soc.id === s.activeSocietyId
            ? { ...soc, name, address, city, registrationNumber, contactPhone }
            : soc,
        ),
      }));
    },
    updateSociety: (
      id: number,
      name: string,
      address: string,
      city: string,
      registrationNumber: string,
      contactPhone: string,
    ): void => {
      mutate((s) => {
        const updatedSocieties = s.societies.map((soc) =>
          soc.id === id
            ? { ...soc, name, address, city, registrationNumber, contactPhone }
            : soc,
        );
        // Also update societyInfo if editing the active society
        const newSocietyInfo =
          id === s.activeSocietyId
            ? { name, address, city, registrationNumber, contactPhone }
            : s.societyInfo;
        return {
          ...s,
          societies: updatedSocieties,
          societyInfo: newSocietyInfo,
        };
      });
    },

    // Towers
    getTowers: (societyId?: number | null): Tower[] =>
      societyId != null
        ? state.towers.filter((t) => t.societyId === societyId)
        : state.towers,
    createTower: (
      name: string,
      totalFloors: number,
      societyId: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        towers: [...s.towers, { id, name, totalFloors, societyId }],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateTower: (
      id: number,
      name: string,
      totalFloors: number,
      societyId: number,
    ): void => {
      mutate((s) => ({
        ...s,
        towers: s.towers.map((t) =>
          t.id === id ? { id, name, totalFloors, societyId } : t,
        ),
      }));
    },
    deleteTower: (id: number): void => {
      mutate((s) => ({ ...s, towers: s.towers.filter((t) => t.id !== id) }));
    },

    // Units
    getUnits: (societyId?: number | null): Unit[] =>
      societyId != null
        ? state.units.filter((u) => u.societyId === societyId)
        : state.units,
    createUnit: (
      towerId: number,
      unitNumber: string,
      floor: number,
      ownerName: string,
      isOccupied: boolean,
      monthlyMaintenance: number,
      maintenanceBreakdown?: MaintenanceBreakdown,
      previousDue?: number,
      area?: number,
      ownershipType?: string,
      phone?: string,
      email?: string,
      memberCount?: number,
      unitType?: string,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        units: [
          ...s.units,
          {
            id,
            towerId,
            unitNumber,
            floor,
            ownerName,
            isOccupied,
            monthlyMaintenance,
            maintenanceBreakdown,
            previousDue: previousDue ?? 0,
            area,
            ownershipType,
            phone,
            email,
            memberCount,
            unitType,
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateUnit: (
      id: number,
      towerId: number,
      unitNumber: string,
      floor: number,
      ownerName: string,
      isOccupied: boolean,
      monthlyMaintenance: number,
      maintenanceBreakdown?: MaintenanceBreakdown,
      previousDue?: number,
      area?: number,
      ownershipType?: string,
      phone?: string,
      email?: string,
      memberCount?: number,
      unitType?: string,
      societyId?: number,
    ): void => {
      mutate((s) => ({
        ...s,
        units: s.units.map((u) =>
          u.id === id
            ? {
                id,
                towerId,
                unitNumber,
                floor,
                ownerName,
                isOccupied,
                monthlyMaintenance,
                maintenanceBreakdown,
                previousDue: previousDue ?? 0,
                area,
                ownershipType,
                phone,
                email,
                memberCount,
                unitType,
                societyId: societyId ?? u.societyId ?? s.activeSocietyId,
              }
            : u,
        ),
      }));
    },
    deleteUnit: (id: number): void => {
      mutate((s) => ({ ...s, units: s.units.filter((u) => u.id !== id) }));
    },

    // Bills
    getBills: (societyId?: number | null): Bill[] =>
      societyId != null
        ? state.bills.filter((b) => b.societyId === societyId)
        : state.bills,
    createBill: (
      unitId: number,
      unitNumber: string,
      breakdown: BillBreakdown,
      previousDue: number,
      dueDate: string,
      month: number,
      year: number,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      const amount =
        breakdown.serviceCharges +
        breakdown.nonOccupancyCharges +
        breakdown.liftMaintenance +
        breakdown.parkingCharges +
        breakdown.sinkingFund +
        breakdown.otherCharges +
        breakdown.houseTax +
        breakdown.repairMaintenance +
        breakdown.interest;
      const grandTotal = amount + previousDue;
      mutate((s) => ({
        ...s,
        bills: [
          ...s.bills,
          {
            id,
            unitId,
            unitNumber,
            amount,
            previousDue,
            grandTotal,
            breakdown,
            dueDate,
            month,
            year,
            status: "Pending",
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    deleteBill: (id: number): void => {
      mutate((s) => ({
        ...s,
        bills: s.bills.filter((b) => b.id !== id),
        payments: s.payments.filter((p) => p.billId !== id),
      }));
    },
    deleteAllBills: (societyId?: number | null): void => {
      mutate((s) => {
        const billIdsToRemove =
          societyId != null
            ? new Set(
                s.bills
                  .filter((b) => b.societyId === societyId)
                  .map((b) => b.id),
              )
            : null;
        return {
          ...s,
          bills:
            societyId != null
              ? s.bills.filter((b) => b.societyId !== societyId)
              : [],
          payments: billIdsToRemove
            ? s.payments.filter((p) => !billIdsToRemove.has(p.billId))
            : [],
        };
      });
    },
    updateBill: (
      id: number,
      breakdown: BillBreakdown,
      previousDue: number,
      dueDate: string,
      month: number,
      year: number,
    ): void => {
      const amount =
        breakdown.serviceCharges +
        breakdown.nonOccupancyCharges +
        breakdown.liftMaintenance +
        breakdown.parkingCharges +
        breakdown.sinkingFund +
        breakdown.otherCharges +
        breakdown.houseTax +
        breakdown.repairMaintenance +
        breakdown.interest;
      const grandTotal = amount + previousDue;
      mutate((s) => ({
        ...s,
        bills: s.bills.map((b) =>
          b.id === id
            ? {
                ...b,
                breakdown,
                amount,
                previousDue,
                grandTotal,
                dueDate,
                month,
                year,
              }
            : b,
        ),
      }));
    },
    recordPayment: (
      billId: number,
      amount: number,
      paymentMethod: string,
    ): void => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        bills: s.bills.map((b) =>
          b.id === billId ? { ...b, status: "Paid" } : b,
        ),
        payments: [
          ...s.payments,
          {
            id,
            billId,
            amount,
            paidAt: new Date().toISOString(),
            paymentMethod,
          },
        ],
        nextId: s.nextId + 1,
      }));
    },
    getFinancialSummary: (societyId?: number | null): FinancialSummary => {
      const filteredBills =
        societyId != null
          ? state.bills.filter((b) => b.societyId === societyId)
          : state.bills;
      const totalBilled = filteredBills.reduce(
        (sum, b) => sum + b.grandTotal,
        0,
      );
      const totalCollected = filteredBills
        .filter((b) => b.status === "Paid")
        .reduce((sum, b) => sum + b.grandTotal, 0);
      return {
        totalBilled,
        totalCollected,
        pendingDues: totalBilled - totalCollected,
      };
    },

    // Visitors
    getVisitors: (societyId?: number | null): Visitor[] =>
      societyId != null
        ? state.visitors.filter((v) => v.societyId === societyId)
        : state.visitors,
    getActiveVisitors: (societyId?: number | null): Visitor[] =>
      state.visitors.filter(
        (v) =>
          v.status === "Active" &&
          (societyId == null || v.societyId === societyId),
      ),
    registerVisitor: (
      name: string,
      phone: string,
      purpose: string,
      hostUnit: string,
      hostUnitId: number,
      checkInTime: string,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        visitors: [
          ...s.visitors,
          {
            id,
            name,
            phone,
            purpose,
            hostUnit,
            hostUnitId,
            checkInTime,
            checkOutTime: null,
            status: "Active",
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    checkOutVisitor: (id: number, checkOutTime: string): void => {
      mutate((s) => ({
        ...s,
        visitors: s.visitors.map((v) =>
          v.id === id ? { ...v, checkOutTime, status: "CheckedOut" } : v,
        ),
      }));
    },
    deleteVisitor: (id: number): void => {
      mutate((s) => ({
        ...s,
        visitors: s.visitors.filter((v) => v.id !== id),
      }));
    },
    deleteAllVisitors: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        visitors:
          societyId != null
            ? s.visitors.filter((v) => v.societyId !== societyId)
            : [],
      }));
    },

    // Notices
    getNotices: (societyId?: number | null): Notice[] =>
      societyId != null
        ? state.notices.filter((n) => n.societyId === societyId)
        : state.notices,
    createNotice: (
      title: string,
      content: string,
      category: string,
      postedBy: string,
      postedAt: string,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        notices: [
          ...s.notices,
          {
            id,
            title,
            content,
            category,
            postedBy,
            postedAt,
            isActive: true,
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },

    deleteNotice: (id: number): void => {
      mutate((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== id) }));
    },
    toggleNoticeActive: (id: number): void => {
      mutate((s) => ({
        ...s,
        notices: s.notices.map((n) =>
          n.id === id ? { ...n, isActive: !n.isActive } : n,
        ),
      }));
    },
    deleteAllNotices: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        notices:
          societyId != null
            ? s.notices.filter((n) => n.societyId !== societyId)
            : [],
      }));
    },

    // Complaints
    getComplaints: (societyId?: number | null): Complaint[] =>
      societyId != null
        ? state.complaints.filter((c) => c.societyId === societyId)
        : state.complaints,
    createComplaint: (
      title: string,
      description: string,
      category: string,
      unitNumber: string,
      residentName: string,
      priority: string,
      createdAt: string,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        complaints: [
          ...s.complaints,
          {
            id,
            title,
            description,
            category,
            unitNumber,
            residentName,
            status: "Open",
            priority,
            createdAt,
            resolution: null,
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateComplaintStatus: (
      id: number,
      status: string,
      resolution: string | null,
    ): void => {
      mutate((s) => ({
        ...s,
        complaints: s.complaints.map((c) =>
          c.id === id ? { ...c, status, resolution } : c,
        ),
      }));
    },

    deleteComplaint: (id: number): void => {
      mutate((s) => ({
        ...s,
        complaints: s.complaints.filter((c) => c.id !== id),
      }));
    },
    deleteAllComplaints: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        complaints:
          societyId != null
            ? s.complaints.filter((c) => c.societyId !== societyId)
            : [],
      }));
    },

    // Polls
    getPolls: (societyId?: number | null): Poll[] =>
      societyId != null
        ? state.polls.filter((p) => p.societyId === societyId)
        : state.polls,
    createPoll: (
      question: string,
      options: string[],
      createdBy: string,
      createdAt: string,
      societyId?: number,
    ): number => {
      const pollId = state.nextId;
      let optId = state.nextId + 1;
      const pollOptions: PollOption[] = options.map((text) => ({
        id: optId++,
        text,
        votes: 0,
      }));
      mutate((s) => ({
        ...s,
        polls: [
          ...s.polls,
          {
            id: pollId,
            question,
            options: pollOptions,
            createdBy,
            createdAt,
            isActive: true,
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: optId,
      }));
      return pollId;
    },
    voteOnPoll: (pollId: number, optionId: number): void => {
      mutate((s) => ({
        ...s,
        polls: s.polls.map((p) =>
          p.id === pollId
            ? {
                ...p,
                options: p.options.map((o) =>
                  o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
                ),
              }
            : p,
        ),
      }));
    },

    deletePoll: (id: number): void => {
      mutate((s) => ({ ...s, polls: s.polls.filter((p) => p.id !== id) }));
    },
    deleteAllPolls: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        polls:
          societyId != null
            ? s.polls.filter((p) => p.societyId !== societyId)
            : [],
      }));
    },

    // Staff
    getStaff: (societyId?: number | null): Staff[] =>
      societyId != null
        ? state.staff.filter((s) => s.societyId === societyId)
        : state.staff,
    addStaff: (
      name: string,
      role: string,
      phone: string,
      salary: number,
      joiningDate: string,
      societyId?: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        staff: [
          ...s.staff,
          {
            id,
            name,
            role,
            phone,
            salary,
            joiningDate,
            isActive: true,
            societyId: societyId ?? s.activeSocietyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },

    deleteStaff: (id: number): void => {
      mutate((s) => ({ ...s, staff: s.staff.filter((st) => st.id !== id) }));
    },
    deleteAllStaff: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        staff:
          societyId != null
            ? s.staff.filter((st) => st.societyId !== societyId)
            : [],
      }));
    },

    // Attendance
    getAttendance: (): Attendance[] => state.attendance,
    markAttendance: (staffId: number, date: string, status: string): number => {
      const existing = state.attendance.find(
        (a) => a.staffId === staffId && a.date === date,
      );
      if (existing) {
        mutate((s) => ({
          ...s,
          attendance: s.attendance.map((a) =>
            a.staffId === staffId && a.date === date ? { ...a, status } : a,
          ),
        }));
        return existing.id;
      }
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        attendance: [...s.attendance, { id, staffId, date, status }],
        nextId: s.nextId + 1,
      }));
      return id;
    },

    deleteAllAttendance: (staffIds?: Set<number>): void => {
      mutate((s) => ({
        ...s,
        attendance: staffIds
          ? s.attendance.filter((a) => !staffIds.has(a.staffId))
          : [],
      }));
    },

    // Salary Records
    getSalaryRecords: (): SalaryRecord[] => state.salaryRecords,
    addSalaryRecord: (
      staffId: number,
      month: number,
      year: number,
      amount: number,
      paidOn: string,
      status: string,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        salaryRecords: [
          ...s.salaryRecords,
          { id, staffId, month, year, amount, paidOn, status },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },

    deleteAllSalaryRecords: (staffIds?: Set<number>): void => {
      mutate((s) => ({
        ...s,
        salaryRecords: staffIds
          ? s.salaryRecords.filter((r) => !staffIds.has(r.staffId))
          : [],
      }));
    },

    // Payments
    getPayments: (societyId?: number | null): Payment[] => {
      if (societyId == null) return state.payments;
      return state.payments.filter((pay) => {
        const bill = state.bills.find((b) => b.id === pay.billId);
        return bill?.societyId === societyId;
      });
    },

    // Expenses
    getExpenses: (societyId?: number | null): Expense[] =>
      societyId != null
        ? state.expenses.filter((e) => e.societyId === societyId)
        : state.expenses,
    createExpense: (
      title: string,
      category: string,
      amount: number,
      description: string,
      paidTo: string,
      paidBy: string,
      date: string,
      paymentMethod: string,
      receiptNumber: string,
      societyId: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        expenses: [
          ...s.expenses,
          {
            id,
            title,
            category,
            amount,
            description,
            paidTo,
            paidBy,
            date,
            paymentMethod,
            receiptNumber,
            societyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateExpense: (
      id: number,
      title: string,
      category: string,
      amount: number,
      description: string,
      paidTo: string,
      paidBy: string,
      date: string,
      paymentMethod: string,
      receiptNumber: string,
      societyId: number,
    ): void => {
      mutate((s) => ({
        ...s,
        expenses: s.expenses.map((e) =>
          e.id === id
            ? {
                id,
                title,
                category,
                amount,
                description,
                paidTo,
                paidBy,
                date,
                paymentMethod,
                receiptNumber,
                societyId,
              }
            : e,
        ),
      }));
    },
    deleteExpense: (id: number): void => {
      mutate((s) => ({
        ...s,
        expenses: s.expenses.filter((e) => e.id !== id),
      }));
    },
    deleteAllExpenses: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        expenses:
          societyId != null
            ? s.expenses.filter((e) => e.societyId !== societyId)
            : [],
      }));
    },

    // Vehicles
    getVehicles: (): Vehicle[] => state.vehicles,
    createVehicle: (
      unitId: number,
      unitNumber: string,
      ownerName: string,
      vehicleNumber: string,
      vehicleType: string,
      brand: string,
      color: string,
      societyId: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        vehicles: [
          ...s.vehicles,
          {
            id,
            unitId,
            unitNumber,
            ownerName,
            vehicleNumber,
            vehicleType,
            brand,
            color,
            societyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateVehicle: (
      id: number,
      unitId: number,
      unitNumber: string,
      ownerName: string,
      vehicleNumber: string,
      vehicleType: string,
      brand: string,
      color: string,
      societyId: number,
    ): void => {
      mutate((s) => ({
        ...s,
        vehicles: s.vehicles.map((v) =>
          v.id === id
            ? {
                id,
                unitId,
                unitNumber,
                ownerName,
                vehicleNumber,
                vehicleType,
                brand,
                color,
                societyId,
              }
            : v,
        ),
      }));
    },
    deleteVehicle: (id: number): void => {
      mutate((s) => ({
        ...s,
        vehicles: s.vehicles.filter((v) => v.id !== id),
      }));
    },
    deleteAllVehicles: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        vehicles:
          societyId != null
            ? s.vehicles.filter((v) => v.societyId !== societyId)
            : [],
      }));
    },

    // AMC Contracts
    getAmcContracts: (): AmcContract[] => state.amcContracts,
    createAmcContract: (
      equipmentName: string,
      vendor: string,
      contactPerson: string,
      contactPhone: string,
      contractStart: string,
      contractEnd: string,
      amount: number,
      paymentMethod: string,
      notes: string,
      status: string,
      societyId: number,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        amcContracts: [
          ...s.amcContracts,
          {
            id,
            equipmentName,
            vendor,
            contactPerson,
            contactPhone,
            contractStart,
            contractEnd,
            amount,
            paymentMethod,
            notes,
            status,
            societyId,
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },
    updateAmcContract: (
      id: number,
      equipmentName: string,
      vendor: string,
      contactPerson: string,
      contactPhone: string,
      contractStart: string,
      contractEnd: string,
      amount: number,
      paymentMethod: string,
      notes: string,
      status: string,
      societyId: number,
    ): void => {
      mutate((s) => ({
        ...s,
        amcContracts: s.amcContracts.map((a) =>
          a.id === id
            ? {
                id,
                equipmentName,
                vendor,
                contactPerson,
                contactPhone,
                contractStart,
                contractEnd,
                amount,
                paymentMethod,
                notes,
                status,
                societyId,
              }
            : a,
        ),
      }));
    },
    deleteAmcContract: (id: number): void => {
      mutate((s) => ({
        ...s,
        amcContracts: s.amcContracts.filter((a) => a.id !== id),
      }));
    },
    deleteAllAmcContracts: (societyId?: number | null): void => {
      mutate((s) => ({
        ...s,
        amcContracts:
          societyId != null
            ? s.amcContracts.filter((a) => a.societyId !== societyId)
            : [],
      }));
    },

    // ── Auth operations ───────────────────────────────────────────────────────

    getUsers: (): User[] => state.users,
    createAdminUser: (
      name: string,
      email: string,
      password: string,
      role: AppRole,
      societyId: number,
      unitId?: number,
      unitNumber?: string,
    ): { success: boolean; error?: string } => {
      const existingUser = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (existingUser)
        return {
          success: false,
          error: "An account with this email already exists",
        };
      const id = state.nextId;
      const passwordHash = btoa(
        unescape(
          encodeURIComponent(`${email.trim().toLowerCase()}:${password}`),
        ),
      );
      const newUser: User = {
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        societyId,
        unitId,
        unitNumber,
        createdAt: new Date().toISOString(),
      };
      mutate((s) => ({
        ...s,
        users: [...s.users, newUser],
        nextId: s.nextId + 1,
      }));
      return { success: true };
    },
    deleteUser: (id: number): void => {
      mutate((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
    },
    updateAdminUser: (
      id: number,
      name: string,
      email: string,
      role: AppRole,
      societyId?: number,
      unitId?: number,
      unitNumber?: string,
    ): { success: boolean; error?: string } => {
      const existingUser = state.users.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== id,
      );
      if (existingUser) {
        return {
          success: false,
          error: "Another account with this email already exists",
        };
      }
      mutate((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === id
            ? {
                ...u,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role,
                societyId,
                unitId,
                unitNumber,
              }
            : u,
        ),
      }));
      return { success: true };
    },
    getCurrentUser: (): User | null => {
      if (state.currentUserId === null) return null;
      return state.users.find((u) => u.id === state.currentUserId) ?? null;
    },
    signIn: (
      email: string,
      password: string,
    ): { success: boolean; error?: string; user?: User } => {
      const hash = btoa(
        unescape(
          encodeURIComponent(`${email.trim().toLowerCase()}:${password}`),
        ),
      );
      const user = state.users.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.passwordHash === hash,
      );
      if (!user) {
        return { success: false, error: "Invalid email or password" };
      }
      // Block non-SuperAdmin login if their society is inactive
      if (user.role !== "SuperAdmin" && user.societyId != null) {
        const society = state.societies.find((s) => s.id === user.societyId);
        if (society && !society.isEnabled) {
          return {
            success: false,
            error:
              "Society is currently inactive. Please contact your Super Admin.",
          };
        }
      }
      mutate((s) => ({ ...s, currentUserId: user.id }));
      return { success: true, user };
    },
    signUp: (
      name: string,
      email: string,
      password: string,
      role: AppRole,
      unitId?: number,
      unitNumber?: string,
      societyId?: number,
    ): { success: boolean; error?: string } => {
      // Admin and SuperAdmin accounts must be created by SuperAdmin
      if (role === "SuperAdmin" || role === "Admin") {
        return {
          success: false,
          error: "Admin accounts must be created by the Super Admin",
        };
      }
      const existingUser = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (existingUser) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }
      const id = state.nextId;
      const passwordHash = btoa(
        unescape(
          encodeURIComponent(`${email.trim().toLowerCase()}:${password}`),
        ),
      );
      const newUser: User = {
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        societyId,
        unitId,
        unitNumber,
        createdAt: new Date().toISOString(),
      };
      mutate((s) => ({
        ...s,
        users: [...s.users, newUser],
        currentUserId: id,
        nextId: s.nextId + 1,
      }));
      return { success: true };
    },
    signOut: (): void => {
      mutate((s) => ({ ...s, currentUserId: null }));
    },
    updateUserProfile: (id: number, name: string, email: string): void => {
      mutate((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === id
            ? { ...u, name: name.trim(), email: email.trim().toLowerCase() }
            : u,
        ),
      }));
    },
    updateUserPassword: (
      id: number,
      currentPassword: string,
      newPassword: string,
    ): { success: boolean; error?: string } => {
      const user = state.users.find((u) => u.id === id);
      if (!user) return { success: false, error: "User not found" };
      const currentHash = btoa(
        unescape(encodeURIComponent(`${user.email}:${currentPassword}`)),
      );
      if (user.passwordHash !== currentHash) {
        return { success: false, error: "Current password is incorrect" };
      }
      const newHash = btoa(
        unescape(encodeURIComponent(`${user.email}:${newPassword}`)),
      );
      mutate((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === id ? { ...u, passwordHash: newHash } : u,
        ),
      }));
      return { success: true };
    },

    // Expose state for hooks to use directly if needed
    _nextId: nextId,
  };
}

// ─── Context & Hook ───────────────────────────────────────────────────────────

type StoreOps = ReturnType<typeof createOps>;

const SocietyStoreContext = createContext<StoreOps | null>(null);

export function SocietyStoreProvider({
  children,
}: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(loadFromStorage);

  // Re-sync if localStorage was cleared externally
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === null) {
        setState(buildSeedData());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const ops = useCallback(() => createOps(state, setState), [state])();

  return createElement(SocietyStoreContext.Provider, { value: ops }, children);
}

export function useSocietyStore(): StoreOps {
  const ctx = useContext(SocietyStoreContext);
  if (!ctx)
    throw new Error("useSocietyStore must be used inside SocietyStoreProvider");
  return ctx;
}

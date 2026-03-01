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

export interface Society {
  id: number;
  name: string;
  address: string;
  city: string;
  registrationNumber: string;
  contactPhone: string;
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
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  postedBy: string;
  postedAt: string;
  isActive: boolean;
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
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joiningDate: string;
  isActive: boolean;
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
  nextId: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

function buildSeedData(): StoreState {
  const towers: Tower[] = [
    { id: 1, name: "Tower A", totalFloors: 12, societyId: 1 },
    { id: 2, name: "Tower B", totalFloors: 10, societyId: 1 },
    { id: 3, name: "Tower C", totalFloors: 8, societyId: 1 },
  ];

  const units: Unit[] = [
    {
      id: 1,
      towerId: 1,
      unitNumber: "A-101",
      floor: 1,
      ownerName: "Rajesh Kumar",
      isOccupied: true,
      monthlyMaintenance: 3500,
    },
    {
      id: 2,
      towerId: 1,
      unitNumber: "A-203",
      floor: 2,
      ownerName: "Sunita Sharma",
      isOccupied: true,
      monthlyMaintenance: 3500,
    },
    {
      id: 3,
      towerId: 1,
      unitNumber: "A-301",
      floor: 3,
      ownerName: "Amit Verma",
      isOccupied: true,
      monthlyMaintenance: 4000,
    },
    {
      id: 4,
      towerId: 1,
      unitNumber: "A-405",
      floor: 4,
      ownerName: "Priya Nair",
      isOccupied: false,
      monthlyMaintenance: 4000,
    },
    {
      id: 5,
      towerId: 2,
      unitNumber: "B-102",
      floor: 1,
      ownerName: "Vikram Shah",
      isOccupied: true,
      monthlyMaintenance: 3000,
    },
    {
      id: 6,
      towerId: 2,
      unitNumber: "B-203",
      floor: 2,
      ownerName: "Priya Singh",
      isOccupied: true,
      monthlyMaintenance: 3000,
    },
    {
      id: 7,
      towerId: 2,
      unitNumber: "B-304",
      floor: 3,
      ownerName: "Deepak Rao",
      isOccupied: false,
      monthlyMaintenance: 3500,
    },
    {
      id: 8,
      towerId: 2,
      unitNumber: "B-401",
      floor: 4,
      ownerName: "Meena Pillai",
      isOccupied: true,
      monthlyMaintenance: 4500,
    },
    {
      id: 9,
      towerId: 3,
      unitNumber: "C-102",
      floor: 1,
      ownerName: "Arjun Mehta",
      isOccupied: true,
      monthlyMaintenance: 2500,
    },
    {
      id: 10,
      towerId: 3,
      unitNumber: "C-105",
      floor: 1,
      ownerName: "Kavitha Reddy",
      isOccupied: true,
      monthlyMaintenance: 2500,
    },
    {
      id: 11,
      towerId: 3,
      unitNumber: "C-201",
      floor: 2,
      ownerName: "Suresh Iyer",
      isOccupied: false,
      monthlyMaintenance: 3000,
    },
    {
      id: 12,
      towerId: 3,
      unitNumber: "C-302",
      floor: 3,
      ownerName: "Lakshmi Patel",
      isOccupied: true,
      monthlyMaintenance: 3000,
    },
  ];

  const bills: Bill[] = [
    {
      id: 1,
      unitId: 1,
      unitNumber: "A-101",
      amount: 3500,
      previousDue: 0,
      grandTotal: 3500,
      breakdown: {
        serviceCharges: 2500,
        nonOccupancyCharges: 300,
        liftMaintenance: 300,
        parkingCharges: 200,
        sinkingFund: 100,
        otherCharges: 100,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-02-10`,
      month: 1,
      year: CURRENT_YEAR,
      status: "Paid",
    },
    {
      id: 2,
      unitId: 2,
      unitNumber: "A-203",
      amount: 3500,
      previousDue: 0,
      grandTotal: 3500,
      breakdown: {
        serviceCharges: 2500,
        nonOccupancyCharges: 300,
        liftMaintenance: 300,
        parkingCharges: 200,
        sinkingFund: 100,
        otherCharges: 100,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-02-10`,
      month: 1,
      year: CURRENT_YEAR,
      status: "Paid",
    },
    {
      id: 3,
      unitId: 5,
      unitNumber: "B-102",
      amount: 3000,
      previousDue: 0,
      grandTotal: 3000,
      breakdown: {
        serviceCharges: 2200,
        nonOccupancyCharges: 250,
        liftMaintenance: 250,
        parkingCharges: 150,
        sinkingFund: 100,
        otherCharges: 50,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-02-10`,
      month: 1,
      year: CURRENT_YEAR,
      status: "Paid",
    },
    {
      id: 4,
      unitId: 9,
      unitNumber: "C-102",
      amount: 2500,
      previousDue: 0,
      grandTotal: 2500,
      breakdown: {
        serviceCharges: 1800,
        nonOccupancyCharges: 200,
        liftMaintenance: 200,
        parkingCharges: 150,
        sinkingFund: 100,
        otherCharges: 50,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-02-10`,
      month: 1,
      year: CURRENT_YEAR,
      status: "Pending",
    },
    {
      id: 5,
      unitId: 3,
      unitNumber: "A-301",
      amount: 4000,
      previousDue: 0,
      grandTotal: 4000,
      breakdown: {
        serviceCharges: 2900,
        nonOccupancyCharges: 350,
        liftMaintenance: 350,
        parkingCharges: 200,
        sinkingFund: 100,
        otherCharges: 100,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-03-10`,
      month: 2,
      year: CURRENT_YEAR,
      status: "Paid",
    },
    {
      id: 6,
      unitId: 6,
      unitNumber: "B-203",
      amount: 3000,
      previousDue: 500,
      grandTotal: 3500,
      breakdown: {
        serviceCharges: 2200,
        nonOccupancyCharges: 250,
        liftMaintenance: 250,
        parkingCharges: 150,
        sinkingFund: 100,
        otherCharges: 50,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-03-10`,
      month: 2,
      year: CURRENT_YEAR,
      status: "Pending",
    },
    {
      id: 7,
      unitId: 10,
      unitNumber: "C-105",
      amount: 2500,
      previousDue: 2500,
      grandTotal: 5000,
      breakdown: {
        serviceCharges: 1800,
        nonOccupancyCharges: 200,
        liftMaintenance: 200,
        parkingCharges: 150,
        sinkingFund: 100,
        otherCharges: 50,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-01-10`,
      month: 12,
      year: CURRENT_YEAR - 1,
      status: "Overdue",
    },
    {
      id: 8,
      unitId: 8,
      unitNumber: "B-401",
      amount: 4500,
      previousDue: 0,
      grandTotal: 4500,
      breakdown: {
        serviceCharges: 3300,
        nonOccupancyCharges: 400,
        liftMaintenance: 400,
        parkingCharges: 200,
        sinkingFund: 100,
        otherCharges: 100,
        houseTax: 0,
        repairMaintenance: 0,
        interest: 0,
      },
      dueDate: `${CURRENT_YEAR}-03-10`,
      month: 2,
      year: CURRENT_YEAR,
      status: "Paid",
    },
  ];

  const payments: Payment[] = [
    {
      id: 1,
      billId: 1,
      amount: 3500,
      paidAt: `${CURRENT_YEAR}-01-28T10:30:00Z`,
      paymentMethod: "UPI",
    },
    {
      id: 2,
      billId: 2,
      amount: 3500,
      paidAt: `${CURRENT_YEAR}-01-29T14:15:00Z`,
      paymentMethod: "Online",
    },
    {
      id: 3,
      billId: 3,
      amount: 3000,
      paidAt: `${CURRENT_YEAR}-02-05T09:45:00Z`,
      paymentMethod: "Bank Transfer",
    },
    {
      id: 4,
      billId: 5,
      amount: 4000,
      paidAt: `${CURRENT_YEAR}-02-20T11:00:00Z`,
      paymentMethod: "Cash",
    },
    {
      id: 5,
      billId: 8,
      amount: 4500,
      paidAt: `${CURRENT_YEAR}-02-22T16:30:00Z`,
      paymentMethod: "UPI",
    },
  ];

  const visitors: Visitor[] = [
    {
      id: 1,
      name: "Ravi Shankar",
      phone: "+91 98765 12345",
      purpose: "Personal Visit",
      hostUnit: "A-101",
      hostUnitId: 1,
      checkInTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      checkOutTime: null,
      status: "Active",
    },
    {
      id: 2,
      name: "Amazon Delivery",
      phone: "+91 80045 67890",
      purpose: "Package Delivery",
      hostUnit: "B-203",
      hostUnitId: 6,
      checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      status: "CheckedOut",
    },
    {
      id: 3,
      name: "Plumber – Ganesh",
      phone: "+91 77654 32109",
      purpose: "Maintenance Work",
      hostUnit: "C-102",
      hostUnitId: 9,
      checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      checkOutTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      status: "CheckedOut",
    },
    {
      id: 4,
      name: "Neha Kapoor",
      phone: "+91 93245 88712",
      purpose: "Guest Visit",
      hostUnit: "A-301",
      hostUnitId: 3,
      checkInTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      checkOutTime: null,
      status: "Active",
    },
  ];

  const notices: Notice[] = [
    {
      id: 1,
      title: "Annual General Body Meeting – March 2026",
      content:
        "All residents are cordially invited to attend the Annual General Body Meeting scheduled for 15th March 2026 at 6:00 PM in the Community Hall. Agenda: budget review, maintenance updates, and election of new committee members.",
      category: "General",
      postedBy: "Society Committee",
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      id: 2,
      title: "Water Supply Interruption – Tower B",
      content:
        "Please note that water supply to Tower B will be interrupted on 5th March 2026 from 10 AM to 4 PM due to pipeline maintenance work. Residents are requested to store water in advance.",
      category: "Maintenance",
      postedBy: "Maintenance Team",
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      id: 3,
      title: "Maintenance Charge Revision – Effective April 2026",
      content:
        "The managing committee has approved a 8% revision in monthly maintenance charges effective from April 2026, to account for increased operational costs. Detailed breakdown will be shared separately.",
      category: "Financial",
      postedBy: "Treasurer",
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 1,
      title: "Water leakage in bathroom ceiling",
      description:
        "There is persistent water leakage from the bathroom ceiling, likely from the unit above. The wall has developed damp patches and paint is peeling.",
      category: "Plumbing",
      unitNumber: "C-105",
      residentName: "Kavitha Reddy",
      status: "InProgress",
      priority: "High",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: null,
    },
    {
      id: 2,
      title: "Lift frequently breaking down",
      description:
        "The lift in Tower A has broken down 4 times this month. It is particularly difficult for elderly residents and those living on higher floors.",
      category: "Lift",
      unitNumber: "A-405",
      residentName: "Priya Nair",
      status: "Open",
      priority: "Critical",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: null,
    },
    {
      id: 3,
      title: "Garbage not collected for 3 days",
      description:
        "The cleaning staff have not collected garbage from the common bins near Block B for the past 3 days. It is causing a foul smell and attracting pests.",
      category: "Cleanliness",
      unitNumber: "B-102",
      residentName: "Vikram Shah",
      status: "Resolved",
      priority: "Medium",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      resolution:
        "Spoke with cleaning supervisor. Extra collection scheduled. Issue resolved.",
    },
    {
      id: 4,
      title: "Parking spot blocked by unknown vehicle",
      description:
        "An unknown vehicle has been parked in my reserved parking spot for the past 2 days. Despite leaving a note, the vehicle has not been moved.",
      category: "Parking",
      unitNumber: "B-401",
      residentName: "Meena Pillai",
      status: "Open",
      priority: "Medium",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: null,
    },
    {
      id: 5,
      title: "Streetlight not working near Gate 2",
      description:
        "The streetlight near Gate 2 has been non-functional for over a week. The area becomes very dark at night and is a safety concern.",
      category: "Electrical",
      unitNumber: "A-203",
      residentName: "Sunita Sharma",
      status: "Open",
      priority: "High",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      resolution: null,
    },
  ];

  const polls: Poll[] = [
    {
      id: 1,
      question: "Should we install CCTV cameras in all common areas?",
      options: [
        { id: 1, text: "Yes, strongly agree", votes: 42 },
        { id: 2, text: "Yes, but only key areas", votes: 28 },
        { id: 3, text: "No, privacy concern", votes: 8 },
        { id: 4, text: "Need more discussion", votes: 14 },
      ],
      createdBy: "Security Committee",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      id: 2,
      question:
        "What facility would you prefer for the vacant ground floor space?",
      options: [
        { id: 5, text: "Gymnasium / Fitness Center", votes: 55 },
        { id: 6, text: "Children's Play Area", votes: 32 },
        { id: 7, text: "Community Library", votes: 18 },
        { id: 8, text: "Indoor Games Room", votes: 27 },
      ],
      createdBy: "Residents Committee",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
  ];

  const staff: Staff[] = [
    {
      id: 1,
      name: "Ramesh Gupta",
      role: "Security Guard",
      phone: "+91 92345 11111",
      salary: 14000,
      joiningDate: "2023-06-01",
      isActive: true,
    },
    {
      id: 2,
      name: "Shyam Lal",
      role: "Security Guard",
      phone: "+91 92345 22222",
      salary: 14000,
      joiningDate: "2022-11-15",
      isActive: true,
    },
    {
      id: 3,
      name: "Geeta Devi",
      role: "Housekeeping",
      phone: "+91 92345 33333",
      salary: 11000,
      joiningDate: "2023-01-10",
      isActive: true,
    },
    {
      id: 4,
      name: "Mahesh Yadav",
      role: "Plumber",
      phone: "+91 92345 44444",
      salary: 16000,
      joiningDate: "2021-09-20",
      isActive: true,
    },
    {
      id: 5,
      name: "Raju Electrician",
      role: "Electrician",
      phone: "+91 92345 55555",
      salary: 17000,
      joiningDate: "2021-07-05",
      isActive: true,
    },
    {
      id: 6,
      name: "Suresh Naidu",
      role: "Gardener",
      phone: "+91 92345 66666",
      salary: 10000,
      joiningDate: "2024-02-01",
      isActive: true,
    },
  ];

  // Build attendance for the current month
  const today = new Date();
  const attendance: Attendance[] = [];
  let attendanceId = 1;
  for (const staffMember of staff) {
    // Past 7 days of attendance
    for (let d = 6; d >= 1; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().slice(0, 10);
      const statuses = [
        "Present",
        "Present",
        "Present",
        "Present",
        "HalfDay",
        "Absent",
        "Present",
      ];
      const statusIdx = d % statuses.length;
      attendance.push({
        id: attendanceId++,
        staffId: staffMember.id,
        date: dateStr,
        status: statuses[statusIdx],
      });
    }
  }

  const salaryRecords: SalaryRecord[] = [
    {
      id: 1,
      staffId: 1,
      month: 1,
      year: CURRENT_YEAR,
      amount: 14000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 2,
      staffId: 2,
      month: 1,
      year: CURRENT_YEAR,
      amount: 14000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 3,
      staffId: 3,
      month: 1,
      year: CURRENT_YEAR,
      amount: 11000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 4,
      staffId: 4,
      month: 1,
      year: CURRENT_YEAR,
      amount: 16000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 5,
      staffId: 5,
      month: 1,
      year: CURRENT_YEAR,
      amount: 17000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 6,
      staffId: 6,
      month: 1,
      year: CURRENT_YEAR,
      amount: 10000,
      paidOn: `${CURRENT_YEAR}-02-01`,
      status: "Paid",
    },
    {
      id: 7,
      staffId: 1,
      month: 2,
      year: CURRENT_YEAR,
      amount: 14000,
      paidOn: `${CURRENT_YEAR}-03-01`,
      status: "Pending",
    },
    {
      id: 8,
      staffId: 2,
      month: 2,
      year: CURRENT_YEAR,
      amount: 14000,
      paidOn: `${CURRENT_YEAR}-03-01`,
      status: "Pending",
    },
  ];

  const societies: Society[] = [
    {
      id: 1,
      name: "Prestige Lakeside Habitat",
      address: "14, Whitefield Main Road",
      city: "Bengaluru",
      registrationNumber: "CHS/KA/2021/004512",
      contactPhone: "+91 98765 43210",
    },
  ];

  const expenses: Expense[] = [
    {
      id: 101,
      title: "Pump Room Repair",
      category: "Repairs",
      amount: 8500,
      description:
        "Replacement of submersible pump motor in basement pump room.",
      paidTo: "Aqua Tech Services",
      paidBy: "Admin",
      date: `${CURRENT_YEAR}-01-15`,
      paymentMethod: "Cheque",
      receiptNumber: "AQ/2026/0115",
      societyId: 1,
    },
    {
      id: 102,
      title: "Electricity Bill – Common Areas",
      category: "Utilities",
      amount: 12400,
      description:
        "Monthly electricity bill for lifts, parking lights, lobby, and common corridors.",
      paidTo: "BESCOM",
      paidBy: "Admin",
      date: `${CURRENT_YEAR}-01-20`,
      paymentMethod: "Bank Transfer",
      receiptNumber: "BESCOM/JAN26",
      societyId: 1,
    },
    {
      id: 103,
      title: "Garden Maintenance",
      category: "Maintenance",
      amount: 3200,
      description:
        "Monthly charges for garden upkeep, plant trimming, and watering.",
      paidTo: "GreenLeaf Landscaping",
      paidBy: "Admin",
      date: `${CURRENT_YEAR}-01-31`,
      paymentMethod: "Cash",
      receiptNumber: "",
      societyId: 1,
    },
    {
      id: 104,
      title: "Security Agency Bill – January",
      category: "Security",
      amount: 42000,
      description:
        "Monthly invoice from security agency for 3 guards (day + night shifts).",
      paidTo: "Shield Security Services",
      paidBy: "SuperAdmin",
      date: `${CURRENT_YEAR}-02-05`,
      paymentMethod: "Bank Transfer",
      receiptNumber: "SSS/INV/2026/012",
      societyId: 1,
    },
    {
      id: 105,
      title: "Lift AMC – Annual Contract",
      category: "Maintenance",
      amount: 18000,
      description:
        "Annual maintenance contract for 2 lifts in Tower A and Tower B.",
      paidTo: "Otis Elevators Pvt Ltd",
      paidBy: "SuperAdmin",
      date: `${CURRENT_YEAR}-02-10`,
      paymentMethod: "Cheque",
      receiptNumber: "OTIS/AMC/2026",
      societyId: 1,
    },
    {
      id: 106,
      title: "Housekeeping Supplies",
      category: "Cleaning",
      amount: 2750,
      description:
        "Purchase of phenyl, brooms, dustpans, and cleaning chemicals for common areas.",
      paidTo: "Clean World Supplies",
      paidBy: "Admin",
      date: `${CURRENT_YEAR}-02-18`,
      paymentMethod: "Cash",
      receiptNumber: "",
      societyId: 1,
    },
  ];

  const vehicles: Vehicle[] = [
    {
      id: 151,
      unitId: 1,
      unitNumber: "A-101",
      ownerName: "Rajesh Kumar",
      vehicleNumber: "KA 01 AB 1234",
      vehicleType: "Car",
      brand: "Maruti Swift",
      color: "White",
      societyId: 1,
    },
    {
      id: 152,
      unitId: 1,
      unitNumber: "A-101",
      ownerName: "Rajesh Kumar",
      vehicleNumber: "KA 01 CD 5678",
      vehicleType: "Bike",
      brand: "Honda Activa",
      color: "Black",
      societyId: 1,
    },
    {
      id: 153,
      unitId: 2,
      unitNumber: "A-203",
      ownerName: "Sunita Sharma",
      vehicleNumber: "KA 02 EF 9012",
      vehicleType: "Car",
      brand: "Hyundai i20",
      color: "Silver",
      societyId: 1,
    },
    {
      id: 154,
      unitId: 3,
      unitNumber: "A-301",
      ownerName: "Amit Verma",
      vehicleNumber: "KA 03 GH 3456",
      vehicleType: "Car",
      brand: "Toyota Innova",
      color: "Grey",
      societyId: 1,
    },
    {
      id: 155,
      unitId: 5,
      unitNumber: "B-102",
      ownerName: "Vikram Shah",
      vehicleNumber: "KA 05 IJ 7890",
      vehicleType: "Car",
      brand: "Honda City",
      color: "Blue",
      societyId: 1,
    },
    {
      id: 156,
      unitId: 8,
      unitNumber: "B-401",
      ownerName: "Meena Pillai",
      vehicleNumber: "KA 08 KL 1122",
      vehicleType: "Scooter",
      brand: "TVS Jupiter",
      color: "Red",
      societyId: 1,
    },
    {
      id: 157,
      unitId: 9,
      unitNumber: "C-102",
      ownerName: "Arjun Mehta",
      vehicleNumber: "KA 09 MN 3344",
      vehicleType: "Car",
      brand: "Tata Nexon",
      color: "Orange",
      societyId: 1,
    },
    {
      id: 158,
      unitId: 12,
      unitNumber: "C-302",
      ownerName: "Lakshmi Patel",
      vehicleNumber: "KA 12 OP 5566",
      vehicleType: "Bike",
      brand: "Royal Enfield",
      color: "Black",
      societyId: 1,
    },
  ];

  const amcToday = new Date();
  const expiringSoonDate = new Date(amcToday);
  expiringSoonDate.setDate(expiringSoonDate.getDate() + 25);
  const expiredDate = new Date(amcToday);
  expiredDate.setDate(expiredDate.getDate() - 30);
  const futureDate1 = new Date(amcToday);
  futureDate1.setFullYear(futureDate1.getFullYear() + 1);
  const futureDate2 = new Date(amcToday);
  futureDate2.setMonth(futureDate2.getMonth() + 8);

  const amcContracts: AmcContract[] = [
    {
      id: 161,
      equipmentName: "Lift Tower A",
      vendor: "Otis Elevators Pvt Ltd",
      contactPerson: "Ramesh Naidu",
      contactPhone: "+91 98001 11111",
      contractStart: `${CURRENT_YEAR}-01-01`,
      contractEnd: futureDate1.toISOString().slice(0, 10),
      amount: 18000,
      paymentMethod: "Cheque",
      notes:
        "Annual service contract includes 2 scheduled visits + emergency calls",
      status: "Active",
      societyId: 1,
    },
    {
      id: 162,
      equipmentName: "Lift Tower B",
      vendor: "Otis Elevators Pvt Ltd",
      contactPerson: "Ramesh Naidu",
      contactPhone: "+91 98001 11111",
      contractStart: `${CURRENT_YEAR}-01-01`,
      contractEnd: expiringSoonDate.toISOString().slice(0, 10),
      amount: 18000,
      paymentMethod: "Cheque",
      notes: "Renewal due soon",
      status: "Expiring Soon",
      societyId: 1,
    },
    {
      id: 163,
      equipmentName: "Water Pump (Submersible)",
      vendor: "Aqua Tech Services",
      contactPerson: "Sunil Kamath",
      contactPhone: "+91 99002 22222",
      contractStart: `${CURRENT_YEAR - 1}-06-01`,
      contractEnd: expiredDate.toISOString().slice(0, 10),
      amount: 8500,
      paymentMethod: "Bank Transfer",
      notes: "Expired – renewal pending approval",
      status: "Expired",
      societyId: 1,
    },
    {
      id: 164,
      equipmentName: "Fire Safety Equipment",
      vendor: "FireSafe India",
      contactPerson: "Anil Sharma",
      contactPhone: "+91 97003 33333",
      contractStart: `${CURRENT_YEAR}-02-01`,
      contractEnd: futureDate1.toISOString().slice(0, 10),
      amount: 12000,
      paymentMethod: "Bank Transfer",
      notes:
        "Covers fire extinguisher refilling, hydrant checks, and alarm testing",
      status: "Active",
      societyId: 1,
    },
    {
      id: 165,
      equipmentName: "CCTV System",
      vendor: "SecureVision Technologies",
      contactPerson: "Pradeep Menon",
      contactPhone: "+91 96004 44444",
      contractStart: `${CURRENT_YEAR}-01-15`,
      contractEnd: futureDate2.toISOString().slice(0, 10),
      amount: 6500,
      paymentMethod: "UPI",
      notes: "32 cameras – maintenance and DVR backup support",
      status: "Active",
      societyId: 1,
    },
    {
      id: 166,
      equipmentName: "Generator (DG Set)",
      vendor: "Power Solutions Pvt Ltd",
      contactPerson: "Mahesh Reddy",
      contactPhone: "+91 95005 55555",
      contractStart: `${CURRENT_YEAR - 1}-04-01`,
      contractEnd: expiringSoonDate.toISOString().slice(0, 10),
      amount: 15000,
      paymentMethod: "Cheque",
      notes: "Quarterly service + fuel top-up not included",
      status: "Expiring Soon",
      societyId: 1,
    },
  ];

  return {
    societyInfo: {
      name: "Prestige Lakeside Habitat",
      address: "14, Whitefield Main Road",
      city: "Bengaluru",
      registrationNumber: "CHS/KA/2021/004512",
      contactPhone: "+91 98765 43210",
    },
    societies,
    activeSocietyId: 1,
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
    nextId: 200,
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
          },
        ];
        parsed.activeSocietyId = 1;
      }
      // Migrate towers: ensure societyId exists
      if (parsed.towers) {
        parsed.towers = parsed.towers.map((t) => ({
          ...t,
          societyId: t.societyId ?? (parsed.activeSocietyId || 1),
        }));
      }
      // Migrate bills: ensure breakdown/previousDue/grandTotal exist
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
          };
        });
      }
      // Migrate units: ensure new fields exist
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
          return u;
        });
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
          { id, name, address, city, registrationNumber, contactPhone },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
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
    getTowers: (): Tower[] => state.towers,
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
    getUnits: (): Unit[] => state.units,
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
              }
            : u,
        ),
      }));
    },
    deleteUnit: (id: number): void => {
      mutate((s) => ({ ...s, units: s.units.filter((u) => u.id !== id) }));
    },

    // Bills
    getBills: (): Bill[] => state.bills,
    createBill: (
      unitId: number,
      unitNumber: string,
      breakdown: BillBreakdown,
      previousDue: number,
      dueDate: string,
      month: number,
      year: number,
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
          },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
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
    getFinancialSummary: (): FinancialSummary => {
      const totalBilled = state.bills.reduce((sum, b) => sum + b.grandTotal, 0);
      const totalCollected = state.bills
        .filter((b) => b.status === "Paid")
        .reduce((sum, b) => sum + b.grandTotal, 0);
      return {
        totalBilled,
        totalCollected,
        pendingDues: totalBilled - totalCollected,
      };
    },

    // Visitors
    getVisitors: (): Visitor[] => state.visitors,
    getActiveVisitors: (): Visitor[] =>
      state.visitors.filter((v) => v.status === "Active"),
    registerVisitor: (
      name: string,
      phone: string,
      purpose: string,
      hostUnit: string,
      hostUnitId: number,
      checkInTime: string,
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

    // Notices
    getNotices: (): Notice[] => state.notices,
    createNotice: (
      title: string,
      content: string,
      category: string,
      postedBy: string,
      postedAt: string,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        notices: [
          ...s.notices,
          { id, title, content, category, postedBy, postedAt, isActive: true },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
    },

    // Complaints
    getComplaints: (): Complaint[] => state.complaints,
    createComplaint: (
      title: string,
      description: string,
      category: string,
      unitNumber: string,
      residentName: string,
      priority: string,
      createdAt: string,
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

    // Polls
    getPolls: (): Poll[] => state.polls,
    createPoll: (
      question: string,
      options: string[],
      createdBy: string,
      createdAt: string,
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

    // Staff
    getStaff: (): Staff[] => state.staff,
    addStaff: (
      name: string,
      role: string,
      phone: string,
      salary: number,
      joiningDate: string,
    ): number => {
      const id = state.nextId;
      mutate((s) => ({
        ...s,
        staff: [
          ...s.staff,
          { id, name, role, phone, salary, joiningDate, isActive: true },
        ],
        nextId: s.nextId + 1,
      }));
      return id;
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

    // Payments
    getPayments: (): Payment[] => state.payments,

    // Expenses
    getExpenses: (): Expense[] => state.expenses,
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

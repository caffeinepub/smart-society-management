import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SalaryRecord {
    id: bigint;
    status: string;
    month: bigint;
    staffId: bigint;
    year: bigint;
    amount: bigint;
    paidOn: string;
}
export interface SocietyInfo {
    city: string;
    name: string;
    registrationNumber: string;
    address: string;
    contactPhone: string;
}
export interface Attendance {
    id: bigint;
    status: string;
    staffId: bigint;
    date: string;
}
export interface BillBreakdown {
    nonOccupancyCharges: bigint;
    interest: bigint;
    repairMaintenance: bigint;
    serviceCharges: bigint;
    otherCharges: bigint;
    houseTax: bigint;
    liftMaintenance: bigint;
    sinkingFund: bigint;
    parkingCharges: bigint;
}
export interface Poll {
    id: bigint;
    question: string;
    createdAt: string;
    createdBy: string;
    isActive: boolean;
    options: Array<PollOption>;
}
export interface Tower {
    id: bigint;
    totalFloors: bigint;
    name: string;
}
export interface Unit {
    id: bigint;
    towerId: bigint;
    floor: bigint;
    ownerName: string;
    ownerId?: Principal;
    isOccupied: boolean;
    unitNumber: string;
    monthlyMaintenance: bigint;
}
export interface Staff {
    id: bigint;
    salary: bigint;
    name: string;
    role: string;
    joiningDate: string;
    isActive: boolean;
    phone: string;
}
export interface Complaint {
    id: bigint;
    status: string;
    residentId: Principal;
    title: string;
    createdAt: string;
    description: string;
    resolution?: string;
    unitNumber: string;
    category: string;
    priority: string;
    residentName: string;
}
export interface Notice {
    id: bigint;
    title: string;
    postedAt: string;
    postedBy: string;
    content: string;
    isActive: boolean;
    category: string;
}
export interface PollOption {
    id: bigint;
    votes: bigint;
    text: string;
}
export interface Bill {
    id: bigint;
    status: string;
    month: bigint;
    societyId: bigint;
    breakdown: BillBreakdown;
    year: bigint;
    dueDate: string;
    unitId: bigint;
    grandTotal: bigint;
    unitNumber: string;
    previousDue: bigint;
    amount: bigint;
}
export interface Visitor {
    id: bigint;
    status: string;
    hostUnit: string;
    name: string;
    checkInTime: string;
    hostUnitId: bigint;
    checkOutTime?: string;
    phone: string;
    purpose: string;
}
export interface FinancialSummary {
    totalCollected: bigint;
    totalBilled: bigint;
    pendingDues: bigint;
}
export interface UserProfile {
    name: string;
    unitId?: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSalaryRecord(staffId: bigint, month: bigint, year: bigint, amount: bigint, paidOn: string, status: string): Promise<bigint>;
    addStaff(name: string, role: string, phone: string, salary: bigint, joiningDate: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkOutVisitor(id: bigint, checkOutTime: string): Promise<void>;
    createBill(unitId: bigint, unitNumber: string, amount: bigint, dueDate: string, month: bigint, year: bigint, previousDue: bigint, grandTotal: bigint, societyId: bigint, breakdown: BillBreakdown): Promise<bigint>;
    createComplaint(title: string, description: string, category: string, unitNumber: string, residentName: string, priority: string, createdAt: string): Promise<bigint>;
    createNotice(title: string, content: string, category: string, postedBy: string, postedAt: string): Promise<bigint>;
    createPoll(question: string, options: Array<string>, createdBy: string, createdAt: string): Promise<bigint>;
    createTower(name: string, totalFloors: bigint): Promise<bigint>;
    createUnit(towerId: bigint, unitNumber: string, floor: bigint, ownerName: string, ownerId: Principal | null, isOccupied: boolean, monthlyMaintenance: bigint): Promise<bigint>;
    deleteAllBills(): Promise<void>;
    deleteBill(id: bigint): Promise<void>;
    deleteTower(id: bigint): Promise<void>;
    deleteUnit(id: bigint): Promise<void>;
    getActiveVisitors(): Promise<Array<Visitor>>;
    getAttendance(): Promise<Array<Attendance>>;
    getBills(): Promise<Array<Bill>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComplaints(): Promise<Array<Complaint>>;
    getFinancialSummary(): Promise<FinancialSummary>;
    getNotices(): Promise<Array<Notice>>;
    getPolls(): Promise<Array<Poll>>;
    getSalaryRecords(): Promise<Array<SalaryRecord>>;
    getSocietyInfo(): Promise<SocietyInfo | null>;
    getStaff(): Promise<Array<Staff>>;
    getTowers(): Promise<Array<Tower>>;
    getUnits(): Promise<Array<Unit>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitors(): Promise<Array<Visitor>>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(staffId: bigint, date: string, status: string): Promise<bigint>;
    recordPayment(billId: bigint, amount: bigint, paymentMethod: string): Promise<void>;
    registerVisitor(name: string, phone: string, purpose: string, hostUnit: string, hostUnitId: bigint, checkInTime: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBill(id: bigint, unitId: bigint, unitNumber: string, amount: bigint, dueDate: string, month: bigint, year: bigint, previousDue: bigint, grandTotal: bigint, societyId: bigint, breakdown: BillBreakdown, status: string): Promise<void>;
    updateComplaintStatus(id: bigint, status: string, resolution: string | null): Promise<void>;
    updateSocietyInfo(name: string, address: string, city: string, registrationNumber: string, contactPhone: string): Promise<void>;
    updateTower(id: bigint, name: string, totalFloors: bigint): Promise<void>;
    updateUnit(id: bigint, towerId: bigint, unitNumber: string, floor: bigint, ownerName: string, ownerId: Principal | null, isOccupied: boolean, monthlyMaintenance: bigint): Promise<void>;
    voteOnPoll(pollId: bigint, optionId: bigint): Promise<void>;
}

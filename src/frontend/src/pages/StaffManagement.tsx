import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote,
  CalendarCheck,
  CheckCircle2,
  MinusCircle,
  Phone,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "../components/RoleSelection";
import { useSocietyStore } from "../store/societyStore";

const staffRoles = [
  "Security Guard",
  "Housekeeping",
  "Gardener",
  "Lift Operator",
  "Electrician",
  "Plumber",
  "Manager",
  "Accountant",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface StaffManagementProps {
  role: AppRole;
}

export default function StaffManagement({ role }: StaffManagementProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const isAdmin = role === "SuperAdmin" || role === "Admin";

  // Add staff form
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("Security Guard");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffSalary, setStaffSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Salary form
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryStaffId, setSalaryStaffId] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [salaryYear, setSalaryYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryStatus, setSalaryStatus] = useState("Paid");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));

  // Attendance
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const staffList = store.getStaff();
  const attendance = store.getAttendance();
  const salaryRecords = store.getSalaryRecords();

  const handleAddStaff = () => {
    if (!staffName || !staffPhone || !staffSalary) return;
    store.addStaff(
      staffName,
      staffRole,
      staffPhone,
      Number(staffSalary),
      joiningDate,
    );
    toast.success("Staff member added");
    setStaffOpen(false);
    setStaffName("");
    setStaffPhone("");
    setStaffSalary("");
    refresh();
  };

  const handleMarkAttendance = (staffId: number, status: string) => {
    store.markAttendance(staffId, attendanceDate, status);
    toast.success("Attendance marked");
    refresh();
  };

  const handleAddSalary = () => {
    if (!salaryStaffId || !salaryAmount) return;
    store.addSalaryRecord(
      Number(salaryStaffId),
      Number(salaryMonth),
      Number(salaryYear),
      Number(salaryAmount),
      paidOn,
      salaryStatus,
    );
    toast.success("Salary record added");
    setSalaryOpen(false);
    setSalaryStaffId("");
    setSalaryAmount("");
    refresh();
  };

  const getAttendanceForStaff = (staffId: number) =>
    attendance.find((a) => a.staffId === staffId && a.date === attendanceDate);

  const getStaffName = (staffId: number) =>
    staffList.find((s) => s.id === staffId)?.name ?? "Unknown";

  return (
    <div className="space-y-6 max-w-7xl">
      <Tabs defaultValue="directory">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="font-body">
            <TabsTrigger value="directory" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Directory ({staffList.length})
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Attendance
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="salary" className="gap-1.5">
                <Banknote className="w-3.5 h-3.5" /> Salary
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Directory */}
        <TabsContent value="directory" className="mt-0">
          <div className="flex justify-end mb-4">
            {isAdmin && (
              <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 font-body">
                    <Plus className="w-4 h-4" /> Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Add Staff Member
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body">Full Name</Label>
                        <Input
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="Staff name"
                          className="font-body"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Phone</Label>
                        <Input
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className="font-body"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body">Role</Label>
                        <Select value={staffRole} onValueChange={setStaffRole}>
                          <SelectTrigger className="font-body">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {staffRoles.map((r) => (
                              <SelectItem
                                key={r}
                                value={r}
                                className="font-body"
                              >
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Monthly Salary (₹)</Label>
                        <Input
                          type="number"
                          value={staffSalary}
                          onChange={(e) => setStaffSalary(e.target.value)}
                          placeholder="e.g. 15000"
                          className="font-body"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body">Joining Date</Label>
                      <Input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <Button
                      className="w-full font-body"
                      onClick={handleAddStaff}
                      disabled={!staffName || !staffPhone || !staffSalary}
                    >
                      Add Staff Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {staffList.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-display font-semibold">No staff members</p>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Add staff members to manage their attendance and salary
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff, i) => (
                <motion.div
                  key={staff.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-base flex-shrink-0"
                          style={{ background: "oklch(0.52 0.18 243)" }}
                        >
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-base truncate">
                            {staff.name}
                          </h3>
                          <p className="text-sm font-body text-muted-foreground">
                            {staff.role}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-body text-muted-foreground">
                              {staff.phone}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className="font-body text-xs flex-shrink-0"
                          style={
                            staff.isActive
                              ? {
                                  background: "oklch(0.9 0.08 155)",
                                  color: "oklch(0.3 0.1 155)",
                                  border: "1px solid oklch(0.82 0.1 155)",
                                }
                              : {
                                  background: "oklch(0.92 0.015 245)",
                                  color: "oklch(0.45 0.03 248)",
                                }
                          }
                        >
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        <span className="text-xs font-body text-muted-foreground">
                          Salary
                        </span>
                        <span className="font-display font-bold text-sm">
                          ₹{staff.salary.toLocaleString("en-IN")}/mo
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-0">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="font-body text-sm">Date:</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="font-body w-40"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                Attendance —{" "}
                {new Date(attendanceDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffList.length === 0 ? (
                <p className="text-sm font-body text-muted-foreground text-center py-8">
                  No staff members added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {staffList.map((staff) => {
                    const record = getAttendanceForStaff(staff.id);
                    return (
                      <div
                        key={staff.id.toString()}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display font-bold flex-shrink-0"
                          style={{ background: "oklch(0.52 0.18 243)" }}
                        >
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-sm truncate">
                            {staff.name}
                          </p>
                          <p className="text-xs font-body text-muted-foreground">
                            {staff.role}
                          </p>
                        </div>
                        {record ? (
                          <Badge
                            className="font-body text-xs"
                            style={
                              record.status === "Present"
                                ? {
                                    background: "oklch(0.9 0.08 155)",
                                    color: "oklch(0.3 0.1 155)",
                                    border: "1px solid oklch(0.82 0.1 155)",
                                  }
                                : record.status === "HalfDay"
                                  ? {
                                      background: "oklch(0.95 0.08 75)",
                                      color: "oklch(0.4 0.12 65)",
                                      border: "1px solid oklch(0.88 0.1 70)",
                                    }
                                  : {
                                      background: "oklch(0.95 0.07 25)",
                                      color: "oklch(0.4 0.15 25)",
                                      border: "1px solid oklch(0.88 0.1 25)",
                                    }
                            }
                          >
                            {record.status}
                          </Badge>
                        ) : null}
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button
                              variant={
                                record?.status === "Present"
                                  ? "default"
                                  : "outline"
                              }
                              size="icon"
                              className="w-8 h-8"
                              title="Present"
                              onClick={() =>
                                handleMarkAttendance(staff.id, "Present")
                              }
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={
                                record?.status === "HalfDay"
                                  ? "default"
                                  : "outline"
                              }
                              size="icon"
                              className="w-8 h-8"
                              title="Half Day"
                              onClick={() =>
                                handleMarkAttendance(staff.id, "HalfDay")
                              }
                            >
                              <MinusCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={
                                record?.status === "Absent"
                                  ? "destructive"
                                  : "outline"
                              }
                              size="icon"
                              className="w-8 h-8"
                              title="Absent"
                              onClick={() =>
                                handleMarkAttendance(staff.id, "Absent")
                              }
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary */}
        {isAdmin && (
          <TabsContent value="salary" className="mt-0">
            <div className="flex justify-end mb-4">
              <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 font-body">
                    <Plus className="w-4 h-4" /> Add Salary Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Add Salary Record
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="font-body">Staff Member</Label>
                      <Select
                        value={salaryStaffId}
                        onValueChange={(val) => {
                          setSalaryStaffId(val);
                          const s = staffList.find(
                            (s) => s.id.toString() === val,
                          );
                          if (s) setSalaryAmount(s.salary.toString());
                        }}
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.map((s) => (
                            <SelectItem
                              key={s.id.toString()}
                              value={s.id.toString()}
                              className="font-body"
                            >
                              {s.name} — {s.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body">Month</Label>
                        <Select
                          value={salaryMonth}
                          onValueChange={setSalaryMonth}
                        >
                          <SelectTrigger className="font-body">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem
                                key={m}
                                value={(months.indexOf(m) + 1).toString()}
                                className="font-body"
                              >
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Year</Label>
                        <Input
                          type="number"
                          value={salaryYear}
                          onChange={(e) => setSalaryYear(e.target.value)}
                          className="font-body"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body">Amount (₹)</Label>
                        <Input
                          type="number"
                          value={salaryAmount}
                          onChange={(e) => setSalaryAmount(e.target.value)}
                          placeholder="Amount"
                          className="font-body"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Paid On</Label>
                        <Input
                          type="date"
                          value={paidOn}
                          onChange={(e) => setPaidOn(e.target.value)}
                          className="font-body"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body">Status</Label>
                      <Select
                        value={salaryStatus}
                        onValueChange={setSalaryStatus}
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Paid", "Pending", "Partial"].map((s) => (
                            <SelectItem key={s} value={s} className="font-body">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full font-body"
                      onClick={handleAddSalary}
                      disabled={!salaryStaffId || !salaryAmount}
                    >
                      Add Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-body font-semibold">
                        Staff
                      </TableHead>
                      <TableHead className="font-body font-semibold">
                        Month/Year
                      </TableHead>
                      <TableHead className="font-body font-semibold">
                        Amount
                      </TableHead>
                      <TableHead className="font-body font-semibold">
                        Paid On
                      </TableHead>
                      <TableHead className="font-body font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 font-body text-muted-foreground"
                        >
                          No salary records yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaryRecords.map((record) => (
                        <TableRow key={record.id.toString()}>
                          <TableCell className="font-display font-semibold">
                            {getStaffName(record.staffId)}
                          </TableCell>
                          <TableCell className="font-body">
                            {months[record.month - 1]?.slice(0, 3)}{" "}
                            {record.year}
                          </TableCell>
                          <TableCell className="font-body font-medium">
                            ₹{record.amount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {record.paidOn}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs"
                              style={
                                record.status === "Paid"
                                  ? {
                                      background: "oklch(0.9 0.08 155)",
                                      color: "oklch(0.3 0.1 155)",
                                      border: "1px solid oklch(0.82 0.1 155)",
                                    }
                                  : record.status === "Pending"
                                    ? {
                                        background: "oklch(0.95 0.08 75)",
                                        color: "oklch(0.4 0.12 65)",
                                        border: "1px solid oklch(0.88 0.1 70)",
                                      }
                                    : {
                                        background: "oklch(0.92 0.06 240)",
                                        color: "oklch(0.35 0.15 243)",
                                        border: "1px solid oklch(0.84 0.1 240)",
                                      }
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

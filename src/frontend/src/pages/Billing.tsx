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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, IndianRupee, Plus, Receipt, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { AppRole } from "../components/RoleSelection";
import { useSocietyStore } from "../store/societyStore";

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

function getBillStatusStyle(status: string) {
  if (status === "Paid")
    return {
      background: "oklch(0.9 0.08 155)",
      color: "oklch(0.3 0.1 155)",
      border: "1px solid oklch(0.82 0.1 155)",
    };
  if (status === "Overdue")
    return {
      background: "oklch(0.95 0.07 25)",
      color: "oklch(0.4 0.15 25)",
      border: "1px solid oklch(0.88 0.1 25)",
    };
  return {
    background: "oklch(0.95 0.08 75)",
    color: "oklch(0.4 0.12 65)",
    border: "1px solid oklch(0.88 0.1 70)",
  };
}

interface BillingProps {
  role: AppRole;
}

export default function Billing({ role }: BillingProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Generate bill form — unit selector
  const [billUnitId, setBillUnitId] = useState("");
  const [billUnitNumber, setBillUnitNumber] = useState("");
  const [billMonth, setBillMonth] = useState("");
  const [billYear, setBillYear] = useState(new Date().getFullYear().toString());
  const [billDueDate, setBillDueDate] = useState("");

  // Breakdown fields
  const [baseMaintenance, setBaseMaintenance] = useState("");
  const [waterCharges, setWaterCharges] = useState("");
  const [liftMaintenance, setLiftMaintenance] = useState("");
  const [parkingCharges, setParkingCharges] = useState("");
  const [sinkingFund, setSinkingFund] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [previousDue, setPreviousDue] = useState("0");

  // Reactive totals
  const totalMaintenance = [
    baseMaintenance,
    waterCharges,
    liftMaintenance,
    parkingCharges,
    sinkingFund,
    otherCharges,
  ].reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grandTotal = totalMaintenance + (Number(previousDue) || 0);

  // Record payment form
  const [payBillId, setPayBillId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Online");

  const bills = store.getBills();
  const units = store.getUnits();
  const financialSummary = store.getFinancialSummary();

  const resetGenerateForm = () => {
    setBillUnitId("");
    setBillUnitNumber("");
    setBillMonth("");
    setBillDueDate("");
    setBaseMaintenance("");
    setWaterCharges("");
    setLiftMaintenance("");
    setParkingCharges("");
    setSinkingFund("");
    setOtherCharges("");
    setPreviousDue("0");
  };

  const handleCreateBill = () => {
    if (
      !billUnitId ||
      !billMonth ||
      !billYear ||
      !billDueDate ||
      totalMaintenance === 0
    )
      return;
    store.createBill(
      Number(billUnitId),
      billUnitNumber,
      {
        baseMaintenance: Number(baseMaintenance) || 0,
        waterCharges: Number(waterCharges) || 0,
        liftMaintenance: Number(liftMaintenance) || 0,
        parkingCharges: Number(parkingCharges) || 0,
        sinkingFund: Number(sinkingFund) || 0,
        otherCharges: Number(otherCharges) || 0,
      },
      Number(previousDue) || 0,
      billDueDate,
      Number(billMonth),
      Number(billYear),
    );
    toast.success("Bill generated successfully");
    setGenerateOpen(false);
    resetGenerateForm();
    refresh();
  };

  const handleRecordPayment = () => {
    if (!payBillId || !payAmount) return;
    store.recordPayment(Number(payBillId), Number(payAmount), payMethod);
    toast.success("Payment recorded successfully");
    setPaymentOpen(false);
    setPayBillId("");
    setPayAmount("");
    setPayMethod("Online");
    refresh();
  };

  // Chart data: group bills by month
  const chartData = months.slice(0, 6).map((m, idx) => {
    const monthBills = bills.filter(
      (b) => b.month === idx + 1 && b.year === new Date().getFullYear(),
    );
    return {
      month: m.slice(0, 3),
      billed: monthBills.reduce((sum, b) => sum + b.grandTotal, 0),
      collected: monthBills
        .filter((b) => b.status === "Paid")
        .reduce((sum, b) => sum + b.grandTotal, 0),
    };
  });

  const isAdmin = role === "SuperAdmin" || role === "Admin";

  return (
    <div className="space-y-6 max-w-7xl">
      <Tabs defaultValue="bills">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="font-body">
            <TabsTrigger value="bills">Bills</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="payment">Record Payment</TabsTrigger>
                <TabsTrigger value="overview">Financial Overview</TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Bills Tab */}
        <TabsContent value="bills" className="mt-0">
          <div className="flex justify-end mb-4 gap-2">
            {isAdmin && (
              <Dialog
                open={generateOpen}
                onOpenChange={(v) => {
                  setGenerateOpen(v);
                  if (!v) resetGenerateForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 font-body">
                    <Plus className="w-4 h-4" /> Generate Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Generate Maintenance Bill
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {/* Unit selector */}
                    <div className="space-y-1.5">
                      <Label className="font-body">Unit</Label>
                      <Select
                        value={billUnitId}
                        onValueChange={(val) => {
                          setBillUnitId(val);
                          const u = units.find((u) => u.id.toString() === val);
                          if (u) {
                            setBillUnitNumber(u.unitNumber);
                            setBaseMaintenance(u.monthlyMaintenance.toString());
                            setWaterCharges("0");
                            setLiftMaintenance("0");
                            setParkingCharges("0");
                            setSinkingFund("0");
                            setOtherCharges("0");
                          }
                        }}
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem
                              key={u.id.toString()}
                              value={u.id.toString()}
                              className="font-body"
                            >
                              {u.unitNumber} - {u.ownerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month / Year */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-body">Month</Label>
                        <Select value={billMonth} onValueChange={setBillMonth}>
                          <SelectTrigger className="font-body">
                            <SelectValue placeholder="Month" />
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
                          value={billYear}
                          onChange={(e) => setBillYear(e.target.value)}
                          className="font-body"
                        />
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1.5">
                      <Label className="font-body">Due Date</Label>
                      <Input
                        type="date"
                        value={billDueDate}
                        onChange={(e) => setBillDueDate(e.target.value)}
                        className="font-body"
                      />
                    </div>

                    <Separator />

                    {/* Maintenance Breakdown */}
                    <div>
                      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Maintenance Breakdown
                      </p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Base Maintenance (₹)
                            </Label>
                            <Input
                              type="number"
                              value={baseMaintenance}
                              onChange={(e) =>
                                setBaseMaintenance(e.target.value)
                              }
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Water Charges (₹)
                            </Label>
                            <Input
                              type="number"
                              value={waterCharges}
                              onChange={(e) => setWaterCharges(e.target.value)}
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Lift Maintenance (₹)
                            </Label>
                            <Input
                              type="number"
                              value={liftMaintenance}
                              onChange={(e) =>
                                setLiftMaintenance(e.target.value)
                              }
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Parking Charges (₹)
                            </Label>
                            <Input
                              type="number"
                              value={parkingCharges}
                              onChange={(e) =>
                                setParkingCharges(e.target.value)
                              }
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Sinking Fund (₹)
                            </Label>
                            <Input
                              type="number"
                              value={sinkingFund}
                              onChange={(e) => setSinkingFund(e.target.value)}
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Other Charges (₹)
                            </Label>
                            <Input
                              type="number"
                              value={otherCharges}
                              onChange={(e) => setOtherCharges(e.target.value)}
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total maintenance read-only */}
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: "oklch(0.94 0.008 240)" }}
                    >
                      <span className="text-sm font-body text-muted-foreground">
                        Total Maintenance
                      </span>
                      <span className="font-body font-semibold">
                        ₹{totalMaintenance.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <Separator />

                    {/* Previous Due */}
                    <div className="space-y-1.5">
                      <Label className="font-body">Previous Due (₹)</Label>
                      <Input
                        type="number"
                        value={previousDue}
                        onChange={(e) => setPreviousDue(e.target.value)}
                        placeholder="0"
                        className="font-body"
                      />
                    </div>

                    {/* Grand Total read-only */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: "oklch(0.92 0.06 240)" }}
                    >
                      <span className="text-sm font-body font-semibold">
                        Grand Total
                      </span>
                      <span
                        className="font-display font-bold text-lg"
                        style={{ color: "oklch(0.35 0.15 243)" }}
                      >
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <Button
                      className="w-full font-body"
                      onClick={handleCreateBill}
                      disabled={
                        !billUnitId ||
                        !billMonth ||
                        !billYear ||
                        !billDueDate ||
                        totalMaintenance === 0
                      }
                    >
                      Generate Bill
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body font-semibold">
                      Unit
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Month/Year
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Amount (₹)
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Prev. Due (₹)
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Grand Total (₹)
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Due Date
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="font-body font-semibold">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 8 : 7}
                        className="text-center py-12 font-body text-muted-foreground"
                      >
                        No bills generated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map((bill) => (
                      <TableRow key={bill.id.toString()}>
                        <TableCell className="font-display font-semibold">
                          {bill.unitNumber}
                        </TableCell>
                        <TableCell className="font-body">
                          {months[bill.month - 1]?.slice(0, 3)} {bill.year}
                        </TableCell>
                        <TableCell className="font-body font-medium">
                          ₹{bill.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {bill.previousDue > 0
                            ? `₹${bill.previousDue.toLocaleString("en-IN")}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          className="font-body font-semibold"
                          style={{ color: "oklch(0.35 0.15 243)" }}
                        >
                          ₹{bill.grandTotal.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {bill.dueDate}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={getBillStatusStyle(bill.status)}
                          >
                            {bill.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {bill.status !== "Paid" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-body h-7"
                                onClick={() => {
                                  setPayBillId(bill.id.toString());
                                  setPayAmount(bill.grandTotal.toString());
                                  setPaymentOpen(true);
                                }}
                              >
                                Record Pay
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Record Payment Tab */}
        {isAdmin && (
          <TabsContent value="payment" className="mt-0">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="font-display text-base">
                  Record Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-body">Bill</Label>
                  <Select
                    value={payBillId}
                    onValueChange={(val) => {
                      setPayBillId(val);
                      const b = bills.find((b) => b.id.toString() === val);
                      if (b) setPayAmount(b.grandTotal.toString());
                    }}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Select unpaid bill" />
                    </SelectTrigger>
                    <SelectContent>
                      {bills
                        .filter((b) => b.status !== "Paid")
                        .map((b) => (
                          <SelectItem
                            key={b.id.toString()}
                            value={b.id.toString()}
                            className="font-body"
                          >
                            {b.unitNumber} — {months[b.month - 1]?.slice(0, 3)}{" "}
                            {b.year} — ₹{b.grandTotal.toLocaleString("en-IN")}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Amount Paid (₹)</Label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Amount"
                    className="font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Payment Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Online", "Cash", "Cheque", "Bank Transfer", "UPI"].map(
                        (m) => (
                          <SelectItem key={m} value={m} className="font-body">
                            {m}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full font-body"
                  onClick={handleRecordPayment}
                  disabled={!payBillId || !payAmount}
                >
                  Record Payment
                </Button>
              </CardContent>
            </Card>

            {/* Hidden dialog form for quick record from bills tab */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Record Payment
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="font-body">Amount (₹)</Label>
                    <Input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Payment Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger className="font-body">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Online", "Cash", "Cheque", "UPI"].map((m) => (
                          <SelectItem key={m} value={m} className="font-body">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full font-body"
                    onClick={handleRecordPayment}
                    disabled={!payBillId || !payAmount}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {/* Financial Overview Tab */}
        {isAdmin && (
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Billed",
                    value: `₹${financialSummary.totalBilled.toLocaleString("en-IN")}`,
                    icon: <Receipt className="w-4 h-4" />,
                    color: "oklch(0.52 0.18 243)",
                  },
                  {
                    label: "Collected",
                    value: `₹${financialSummary.totalCollected.toLocaleString("en-IN")}`,
                    icon: <TrendingUp className="w-4 h-4" />,
                    color: "oklch(0.58 0.16 155)",
                  },
                  {
                    label: "Pending Dues",
                    value: `₹${financialSummary.pendingDues.toLocaleString("en-IN")}`,
                    icon: <Clock className="w-4 h-4" />,
                    color: "oklch(0.62 0.2 25)",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-5 flex items-center gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${stat.color}18` }}
                        >
                          <span style={{ color: stat.color }}>{stat.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-body text-muted-foreground mb-0.5">
                            {stat.label}
                          </p>
                          <p className="font-display text-xl font-bold">
                            {stat.value}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <IndianRupee
                      className="w-4 h-4"
                      style={{ color: "oklch(var(--primary))" }}
                    />
                    Monthly Billing Overview (Current Year)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.88 0.015 245)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fontFamily: "Plus Jakarta Sans" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fontFamily: "Plus Jakarta Sans" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `₹${v / 1000}k` : `₹${v}`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `₹${value.toLocaleString("en-IN")}`,
                          undefined,
                        ]}
                        contentStyle={{
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: 12,
                          border: "1px solid oklch(0.88 0.015 245)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="billed"
                        name="Billed"
                        fill="oklch(0.52 0.18 243)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="collected"
                        name="Collected"
                        fill="oklch(0.58 0.16 155)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

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
import {
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit2,
  FileCheck,
  IndianRupee,
  Plus,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
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
import type { Bill, Payment, SocietyInfo } from "../store/societyStore";
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

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function printBillPDF(bill: Bill, societyInfo: SocietyInfo) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
  document.body.appendChild(iframe);

  const monthName = months[bill.month - 1] ?? "";
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Maintenance Bill – ${bill.unitNumber} – ${monthName} ${bill.year}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; background: #fff; }
  .header { text-align: center; border-bottom: 2px solid #1e3a6e; padding-bottom: 16px; margin-bottom: 24px; }
  .society-name { font-size: 22px; font-weight: 700; color: #1e3a6e; letter-spacing: 0.5px; }
  .bill-title { font-size: 15px; font-weight: 600; color: #444; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; background: #f7f9ff; padding: 14px 18px; border-radius: 6px; border: 1px solid #dde4f5; }
  .meta-row { display: flex; flex-direction: column; gap: 1px; }
  .meta-label { font-size: 10px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .meta-value { font-size: 13px; font-weight: 600; color: #111; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  th { background: #1e3a6e; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .subtotal-row td { background: #f0f4ff; font-weight: 600; }
  .prev-due-row td { background: #fff8ee; color: #b45309; font-weight: 600; }
  .grand-total-row td { background: #1e3a6e; color: #fff; font-weight: 700; font-size: 14px; }
  .amount-col { text-align: right; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-paid { background: #d1fae5; color: #065f46; }
  .status-pending { background: #fef9c3; color: #854d0e; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
<div class="header">
  <div class="society-name">${societyInfo.name}</div>
  <div class="bill-title">Maintenance Bill</div>
</div>
<div class="meta-grid">
  <div class="meta-row"><span class="meta-label">Unit Number</span><span class="meta-value">${bill.unitNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Bill Period</span><span class="meta-value">${monthName} ${bill.year}</span></div>
  <div class="meta-row"><span class="meta-label">Due Date</span><span class="meta-value">${bill.dueDate}</span></div>
  <div class="meta-row"><span class="meta-label">Status</span><span class="meta-value"><span class="status-badge status-${bill.status.toLowerCase()}">${bill.status}</span></span></div>
</div>
<table>
  <thead>
    <tr>
      <th>Description</th>
      <th class="amount-col">Amount (₹)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Service Charges</td><td class="amount-col">${bill.breakdown.serviceCharges.toLocaleString("en-IN")}</td></tr>
    <tr><td>Non-Occupancy Charges</td><td class="amount-col">${bill.breakdown.nonOccupancyCharges.toLocaleString("en-IN")}</td></tr>
    <tr><td>Lift Maintenance</td><td class="amount-col">${bill.breakdown.liftMaintenance.toLocaleString("en-IN")}</td></tr>
    <tr><td>Parking Charges</td><td class="amount-col">${bill.breakdown.parkingCharges.toLocaleString("en-IN")}</td></tr>
    <tr><td>Sinking Fund</td><td class="amount-col">${bill.breakdown.sinkingFund.toLocaleString("en-IN")}</td></tr>
    <tr><td>Other Charges</td><td class="amount-col">${bill.breakdown.otherCharges.toLocaleString("en-IN")}</td></tr>
    ${(bill.breakdown.houseTax ?? 0) > 0 ? `<tr><td>House Tax</td><td class="amount-col">${(bill.breakdown.houseTax ?? 0).toLocaleString("en-IN")}</td></tr>` : ""}
    ${(bill.breakdown.repairMaintenance ?? 0) > 0 ? `<tr><td>Repair &amp; Maintenance</td><td class="amount-col">${(bill.breakdown.repairMaintenance ?? 0).toLocaleString("en-IN")}</td></tr>` : ""}
    ${(bill.breakdown.interest ?? 0) > 0 ? `<tr><td>Interest</td><td class="amount-col">${(bill.breakdown.interest ?? 0).toLocaleString("en-IN")}</td></tr>` : ""}
    <tr class="subtotal-row"><td>Total Maintenance</td><td class="amount-col">₹${bill.amount.toLocaleString("en-IN")}</td></tr>
    <tr class="prev-due-row"><td>Previous Due</td><td class="amount-col">₹${bill.previousDue.toLocaleString("en-IN")}</td></tr>
    <tr class="grand-total-row"><td>Grand Total</td><td class="amount-col">₹${bill.grandTotal.toLocaleString("en-IN")}</td></tr>
  </tbody>
</table>
<div class="footer">This is a computer generated bill. For queries contact: ${societyInfo.contactPhone}</div>
</body>
</html>`;

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
}

function printReceiptPDF(
  bill: Bill,
  payment: Payment,
  societyInfo: SocietyInfo,
) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
  document.body.appendChild(iframe);

  const monthName = months[bill.month - 1] ?? "";
  const receiptNo = `RCP-${bill.id}-${payment.id}`;
  const paymentDate = formatDate(payment.paidAt);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Payment Receipt – ${receiptNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; background: #fff; }
  .header { text-align: center; padding-bottom: 20px; margin-bottom: 28px; }
  .society-name { font-size: 22px; font-weight: 700; color: #065f46; letter-spacing: 0.5px; }
  .receipt-title { font-size: 15px; font-weight: 600; color: #444; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
  .receipt-box { border: 2px solid #065f46; border-radius: 8px; padding: 28px 32px; max-width: 480px; margin: 0 auto; }
  .receipt-no { text-align: right; font-size: 11px; color: #888; margin-bottom: 20px; }
  .receipt-no strong { color: #065f46; font-size: 13px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-of-type { border-bottom: none; }
  .row-label { color: #666; font-size: 12px; }
  .row-value { font-weight: 600; color: #111; font-size: 13px; }
  .amount-row { background: #f0fdf4; padding: 12px 16px; border-radius: 6px; margin: 16px -4px; }
  .amount-label { font-size: 12px; color: #065f46; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .amount-value { font-size: 22px; font-weight: 700; color: #065f46; }
  .thankyou { text-align: center; margin-top: 24px; font-size: 14px; color: #065f46; font-weight: 600; }
  .checkmark { font-size: 40px; text-align: center; margin-bottom: 8px; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style>
</head>
<body>
<div class="header">
  <div class="society-name">${societyInfo.name}</div>
  <div class="receipt-title">Payment Receipt</div>
</div>
<div class="receipt-box">
  <div class="receipt-no">Receipt No: <strong>${receiptNo}</strong></div>
  <div class="checkmark">✅</div>
  <div class="row"><span class="row-label">Unit Number</span><span class="row-value">${bill.unitNumber}</span></div>
  <div class="row"><span class="row-label">Bill Period</span><span class="row-value">${monthName} ${bill.year}</span></div>
  <div class="row"><span class="row-label">Payment Date</span><span class="row-value">${paymentDate}</span></div>
  <div class="row"><span class="row-label">Payment Method</span><span class="row-value">${payment.paymentMethod}</span></div>
  <div class="amount-row row">
    <span class="amount-label">Amount Paid</span>
    <span class="amount-value">₹${payment.amount.toLocaleString("en-IN")}</span>
  </div>
  <div class="thankyou">Thank you for your payment.</div>
</div>
<div class="footer">This is a computer generated receipt. For queries contact: ${societyInfo.contactPhone}</div>
</body>
</html>`;

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
}

// ─── Pay Bill Dialog ──────────────────────────────────────────────────────────

function PayBillDialog({
  bill,
  societyInfo,
  onClose,
}: {
  bill: Bill | null;
  societyInfo: SocietyInfo;
  onClose: () => void;
}) {
  const store = useSocietyStore();
  const open = bill !== null;
  const [copied, setCopied] = useState(false);

  if (!bill) return null;

  const monthName = months[(bill.month ?? 1) - 1] ?? "";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("societypay@upi").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayUPI = () => {
    store.recordPayment(bill.id, bill.grandTotal, "UPI");
    toast.success("Payment recorded. Thank you!");
    onClose();
  };

  const handlePayBank = () => {
    store.recordPayment(bill.id, bill.grandTotal, "Bank Transfer");
    toast.success("Payment recorded. Thank you!");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <CreditCard
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 155)" }}
            />
            Pay Bill
          </DialogTitle>
        </DialogHeader>

        {/* Bill summary */}
        <div
          className="rounded-lg px-4 py-3 mb-1"
          style={{
            background: "oklch(0.96 0.03 240)",
            border: "1px solid oklch(0.88 0.05 240)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body text-muted-foreground">Unit</p>
              <p className="font-display font-semibold">{bill.unitNumber}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-body text-muted-foreground">Period</p>
              <p className="font-body font-medium">
                {monthName} {bill.year}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-body text-muted-foreground">
                Amount Due
              </p>
              <p
                className="font-display font-bold text-lg"
                style={{ color: "oklch(0.35 0.15 243)" }}
              >
                ₹{bill.grandTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upi">
          <TabsList className="w-full font-body">
            <TabsTrigger value="upi" className="flex-1">
              UPI Payment
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex-1">
              Bank Transfer
            </TabsTrigger>
          </TabsList>

          {/* UPI Tab */}
          <TabsContent value="upi" className="mt-4 space-y-4">
            <div
              className="rounded-xl p-5 flex flex-col items-center gap-4"
              style={{
                background: "oklch(0.97 0.02 280)",
                border: "1px solid oklch(0.88 0.04 280)",
              }}
            >
              {/* QR Code placeholder */}
              <div
                className="w-44 h-44 rounded-lg flex flex-col items-center justify-center gap-2"
                style={{
                  background: "#fff",
                  border: "2px solid oklch(0.78 0.06 280)",
                }}
              >
                {/* Decorative QR-like grid */}
                <div className="grid grid-cols-5 gap-0.5 mb-1">
                  {Array.from({ length: 25 }, (_, i) => i).map((i) => (
                    <div
                      key={`qr-cell-${i}`}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        background: [
                          0, 1, 2, 5, 9, 10, 11, 12, 14, 17, 20, 21, 22, 23, 24,
                        ].includes(i)
                          ? "oklch(0.2 0.04 280)"
                          : "oklch(0.94 0.01 280)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-body text-muted-foreground font-medium">
                  Scan to Pay
                </p>
              </div>

              {/* UPI ID */}
              <div className="w-full">
                <p className="text-xs font-body text-muted-foreground mb-1.5 text-center">
                  UPI ID
                </p>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "#fff",
                    border: "1px solid oklch(0.82 0.05 280)",
                  }}
                >
                  <span className="font-body font-semibold flex-1 text-center">
                    societypay@upi
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={handleCopyUPI}
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {copied && (
                  <p
                    className="text-xs text-center mt-1"
                    style={{ color: "oklch(0.45 0.15 155)" }}
                  >
                    Copied!
                  </p>
                )}
              </div>

              <div
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "oklch(0.93 0.05 280)" }}
              >
                <span className="text-sm font-body text-muted-foreground">
                  Amount to Pay
                </span>
                <span
                  className="font-display font-bold"
                  style={{ color: "oklch(0.35 0.15 280)" }}
                >
                  ₹{bill.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Button
              className="w-full font-body gap-2"
              style={{ background: "oklch(0.52 0.18 155)", color: "#fff" }}
              onClick={handlePayUPI}
            >
              <CreditCard className="w-4 h-4" />I have paid via UPI
            </Button>
          </TabsContent>

          {/* Bank Transfer Tab */}
          <TabsContent value="bank" className="mt-4 space-y-4">
            <div
              className="rounded-xl p-5 space-y-3"
              style={{
                background: "oklch(0.97 0.02 245)",
                border: "1px solid oklch(0.88 0.04 245)",
              }}
            >
              <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Bank Account Details
              </p>
              {[
                { label: "Account Name", value: societyInfo.name },
                { label: "Account Number", value: "1234 5678 9012 3456" },
                { label: "IFSC Code", value: "HDFC0001234" },
                { label: "Bank", value: "HDFC Bank" },
                { label: "Branch", value: "Whitefield, Bengaluru" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="text-xs font-body text-muted-foreground pt-0.5 w-32 flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-body font-semibold text-sm text-right">
                    {value}
                  </span>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-muted-foreground">
                  Amount to Transfer
                </span>
                <span
                  className="font-display font-bold text-base"
                  style={{ color: "oklch(0.35 0.15 243)" }}
                >
                  ₹{bill.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Button
              className="w-full font-body gap-2"
              style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
              onClick={handlePayBank}
            >
              <CreditCard className="w-4 h-4" />I have paid via Bank Transfer
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Bill Dialog ─────────────────────────────────────────────────────────

function EditBillDialog({
  bill,
  onClose,
}: {
  bill: {
    id: number;
    breakdown: {
      serviceCharges: number;
      nonOccupancyCharges: number;
      liftMaintenance: number;
      parkingCharges: number;
      sinkingFund: number;
      otherCharges: number;
      houseTax: number;
      repairMaintenance: number;
      interest: number;
    };
    previousDue: number;
    dueDate: string;
    month: number;
    year: number;
  } | null;
  onClose: () => void;
}) {
  const store = useSocietyStore();
  const open = bill !== null;

  const [serviceCharges, setServiceCharges] = useState("");
  const [nonOccupancyCharges, setWaterCharges] = useState("");
  const [liftMaintenance, setLiftMaintenance] = useState("");
  const [parkingCharges, setParkingCharges] = useState("");
  const [sinkingFund, setSinkingFund] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [houseTax, setHouseTax] = useState("");
  const [repairMaintenance, setRepairMaintenance] = useState("");
  const [interest, setInterest] = useState("");
  const [previousDue, setPreviousDue] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [billMonth, setBillMonth] = useState("");
  const [billYear, setBillYear] = useState("");

  // Sync form whenever the selected bill changes
  useEffect(() => {
    if (bill) {
      setServiceCharges(bill.breakdown.serviceCharges.toString());
      setWaterCharges(bill.breakdown.nonOccupancyCharges.toString());
      setLiftMaintenance(bill.breakdown.liftMaintenance.toString());
      setParkingCharges(bill.breakdown.parkingCharges.toString());
      setSinkingFund(bill.breakdown.sinkingFund.toString());
      setOtherCharges(bill.breakdown.otherCharges.toString());
      setHouseTax((bill.breakdown.houseTax ?? 0).toString());
      setRepairMaintenance((bill.breakdown.repairMaintenance ?? 0).toString());
      setInterest((bill.breakdown.interest ?? 0).toString());
      setPreviousDue(bill.previousDue.toString());
      setDueDate(bill.dueDate);
      setBillMonth(bill.month.toString());
      setBillYear(bill.year.toString());
    }
  }, [bill]);

  const totalMaintenance = [
    serviceCharges,
    nonOccupancyCharges,
    liftMaintenance,
    parkingCharges,
    sinkingFund,
    otherCharges,
    houseTax,
    repairMaintenance,
    interest,
  ].reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grandTotal = totalMaintenance + (Number(previousDue) || 0);

  const handleSave = () => {
    if (!bill || !dueDate || !billMonth || !billYear || totalMaintenance === 0)
      return;
    store.updateBill(
      bill.id,
      {
        serviceCharges: Number(serviceCharges) || 0,
        nonOccupancyCharges: Number(nonOccupancyCharges) || 0,
        liftMaintenance: Number(liftMaintenance) || 0,
        parkingCharges: Number(parkingCharges) || 0,
        sinkingFund: Number(sinkingFund) || 0,
        otherCharges: Number(otherCharges) || 0,
        houseTax: Number(houseTax) || 0,
        repairMaintenance: Number(repairMaintenance) || 0,
        interest: Number(interest) || 0,
      },
      Number(previousDue) || 0,
      dueDate,
      Number(billMonth),
      Number(billYear),
    );
    toast.success("Bill updated successfully");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Month / Year / Due Date */}
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
          <div className="space-y-1.5">
            <Label className="font-body">Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="font-body"
            />
          </div>

          <Separator />

          {/* Maintenance Breakdown */}
          <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
            Maintenance Breakdown
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Service Charges (₹)</Label>
                <Input
                  type="number"
                  value={serviceCharges}
                  onChange={(e) => setServiceCharges(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">
                  Non-Occupancy Charges (₹)
                </Label>
                <Input
                  type="number"
                  value={nonOccupancyCharges}
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
                  onChange={(e) => setLiftMaintenance(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Parking Charges (₹)</Label>
                <Input
                  type="number"
                  value={parkingCharges}
                  onChange={(e) => setParkingCharges(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Sinking Fund (₹)</Label>
                <Input
                  type="number"
                  value={sinkingFund}
                  onChange={(e) => setSinkingFund(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Other Charges (₹)</Label>
                <Input
                  type="number"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">House Tax (₹)</Label>
                <Input
                  type="number"
                  value={houseTax}
                  onChange={(e) => setHouseTax(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm">
                  Repair & Maintenance (₹)
                </Label>
                <Input
                  type="number"
                  value={repairMaintenance}
                  onChange={(e) => setRepairMaintenance(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Interest (₹)</Label>
                <Input
                  type="number"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="0"
                  className="font-body"
                />
              </div>
            </div>
          </div>

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

          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: "oklch(0.92 0.06 240)" }}
          >
            <span className="text-sm font-body font-semibold">Grand Total</span>
            <span
              className="font-display font-bold text-lg"
              style={{ color: "oklch(0.35 0.15 243)" }}
            >
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <Button
            className="w-full font-body"
            onClick={handleSave}
            disabled={
              !dueDate || !billMonth || !billYear || totalMaintenance === 0
            }
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Resident Billing View ────────────────────────────────────────────────────

function ResidentBillingView() {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  const allBills = store.getBills();
  const allPayments = store.getPayments();
  const societyInfo = store.getSocietyInfo();

  // Resident only sees their own unit bills (A-101 = Rajesh Kumar demo unit)
  const myBills = allBills.filter((b) => b.unitNumber === "A-101");

  const pendingCount = myBills.filter((b) => b.status !== "Paid").length;
  const paidCount = myBills.filter((b) => b.status === "Paid").length;
  const totalDue = myBills
    .filter((b) => b.status !== "Paid")
    .reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Pending Bills",
            value: pendingCount,
            sub: "requires payment",
            color: "oklch(0.62 0.2 25)",
            bg: "oklch(0.62 0.2 25)",
          },
          {
            label: "Total Due",
            value: `₹${totalDue.toLocaleString("en-IN")}`,
            sub: "outstanding amount",
            color: "oklch(0.45 0.18 30)",
            bg: "oklch(0.62 0.2 30)",
          },
          {
            label: "Paid Bills",
            value: paidCount,
            sub: "this year",
            color: "oklch(0.58 0.16 155)",
            bg: "oklch(0.58 0.16 155)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                  {stat.label}
                </p>
                <p
                  className="font-display text-2xl font-bold mb-0.5"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bills list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Receipt
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            My Maintenance Bills — Unit A-101
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Period
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
                  <TableHead className="font-body font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-14 font-body text-muted-foreground"
                    >
                      No bills found for your unit yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  myBills.map((bill) => {
                    const payment = allPayments.find(
                      (p) => p.billId === bill.id,
                    );
                    const isPaid = bill.status === "Paid";
                    const isUnpaid = !isPaid;

                    return (
                      <TableRow key={bill.id.toString()}>
                        <TableCell className="font-body font-medium">
                          {months[bill.month - 1]?.slice(0, 3)} {bill.year}
                        </TableCell>
                        <TableCell className="font-body">
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
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Pay Bill button — only for unpaid/overdue */}
                            {isUnpaid && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-body h-7 gap-1.5 border-emerald-300"
                                style={{
                                  color: "oklch(0.45 0.18 155)",
                                  borderColor: "oklch(0.7 0.12 155)",
                                }}
                                onClick={() => {
                                  setPayingBill(bill);
                                  refresh();
                                }}
                              >
                                <CreditCard className="w-3 h-3" />
                                Pay
                              </Button>
                            )}
                            {/* Download Bill */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-body h-7 gap-1.5"
                              style={{ color: "oklch(0.52 0.18 243)" }}
                              onClick={() => printBillPDF(bill, societyInfo)}
                              title="Download Bill PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Bill
                            </Button>
                            {/* Download Receipt — only for paid bills */}
                            {isPaid && payment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs font-body h-7 gap-1.5"
                                style={{ color: "oklch(0.45 0.18 155)" }}
                                onClick={() =>
                                  printReceiptPDF(bill, payment, societyInfo)
                                }
                                title="Download Receipt PDF"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown info section */}
      {myBills.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm font-semibold text-muted-foreground">
              Latest Bill Breakdown —{" "}
              {months[(myBills[myBills.length - 1].month ?? 1) - 1]}{" "}
              {myBills[myBills.length - 1].year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const latest = myBills[myBills.length - 1];
              const rows = [
                {
                  label: "Service Charges",
                  value: latest.breakdown.serviceCharges,
                },
                {
                  label: "Non-Occupancy Charges",
                  value: latest.breakdown.nonOccupancyCharges,
                },
                {
                  label: "Lift Maintenance",
                  value: latest.breakdown.liftMaintenance,
                },
                {
                  label: "Parking Charges",
                  value: latest.breakdown.parkingCharges,
                },
                { label: "Sinking Fund", value: latest.breakdown.sinkingFund },
                {
                  label: "Other Charges",
                  value: latest.breakdown.otherCharges,
                },
                ...(latest.breakdown.houseTax
                  ? [{ label: "House Tax", value: latest.breakdown.houseTax }]
                  : []),
                ...(latest.breakdown.repairMaintenance
                  ? [
                      {
                        label: "Repair & Maintenance",
                        value: latest.breakdown.repairMaintenance,
                      },
                    ]
                  : []),
                ...(latest.breakdown.interest
                  ? [{ label: "Interest", value: latest.breakdown.interest }]
                  : []),
              ];
              return (
                <div className="space-y-2">
                  {rows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-body text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-sm font-body font-medium">
                        ₹{value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body font-semibold">
                      Total Maintenance
                    </span>
                    <span className="font-body font-semibold">
                      ₹{latest.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {latest.previousDue > 0 && (
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-body"
                        style={{ color: "oklch(0.55 0.18 45)" }}
                      >
                        Previous Due
                      </span>
                      <span
                        className="font-body"
                        style={{ color: "oklch(0.55 0.18 45)" }}
                      >
                        ₹{latest.previousDue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "oklch(0.92 0.06 240)" }}
                  >
                    <span className="font-body font-bold text-sm">
                      Grand Total
                    </span>
                    <span
                      className="font-display font-bold"
                      style={{ color: "oklch(0.35 0.15 243)" }}
                    >
                      ₹{latest.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <PayBillDialog
        bill={payingBill}
        societyInfo={societyInfo}
        onClose={() => {
          setPayingBill(null);
          refresh();
        }}
      />
    </div>
  );
}

// ─── Main Billing Component ───────────────────────────────────────────────────

interface BillingProps {
  role: AppRole;
}

export default function Billing({ role }: BillingProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<(typeof bills)[0] | null>(
    null,
  );

  // Generate bill form — unit selector
  const [billUnitId, setBillUnitId] = useState("");
  const [billUnitNumber, setBillUnitNumber] = useState("");
  const [billMonth, setBillMonth] = useState("");
  const [billYear, setBillYear] = useState(new Date().getFullYear().toString());
  const [billDueDate, setBillDueDate] = useState("");

  // Breakdown fields
  const [serviceCharges, setServiceCharges] = useState("");
  const [nonOccupancyCharges, setWaterCharges] = useState("");
  const [liftMaintenance, setLiftMaintenance] = useState("");
  const [parkingCharges, setParkingCharges] = useState("");
  const [sinkingFund, setSinkingFund] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  const [houseTax, setHouseTax] = useState("");
  const [repairMaintenance, setRepairMaintenance] = useState("");
  const [interest, setInterest] = useState("");
  const [previousDue, setPreviousDue] = useState("0");

  // Reactive totals
  const totalMaintenance = [
    serviceCharges,
    nonOccupancyCharges,
    liftMaintenance,
    parkingCharges,
    sinkingFund,
    otherCharges,
    houseTax,
    repairMaintenance,
    interest,
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
    setServiceCharges("");
    setWaterCharges("");
    setLiftMaintenance("");
    setParkingCharges("");
    setSinkingFund("");
    setOtherCharges("");
    setHouseTax("");
    setRepairMaintenance("");
    setInterest("");
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
        serviceCharges: Number(serviceCharges) || 0,
        nonOccupancyCharges: Number(nonOccupancyCharges) || 0,
        liftMaintenance: Number(liftMaintenance) || 0,
        parkingCharges: Number(parkingCharges) || 0,
        sinkingFund: Number(sinkingFund) || 0,
        otherCharges: Number(otherCharges) || 0,
        houseTax: Number(houseTax) || 0,
        repairMaintenance: Number(repairMaintenance) || 0,
        interest: Number(interest) || 0,
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

  // Resident gets their own filtered view
  if (role === "Resident") {
    return <ResidentBillingView />;
  }

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
                            const bd = u.maintenanceBreakdown;
                            setServiceCharges(
                              bd
                                ? bd.serviceCharges.toString()
                                : u.monthlyMaintenance.toString(),
                            );
                            setWaterCharges(
                              bd ? bd.nonOccupancyCharges.toString() : "0",
                            );
                            setLiftMaintenance(
                              bd ? bd.liftMaintenance.toString() : "0",
                            );
                            setParkingCharges(
                              bd ? bd.parkingCharges.toString() : "0",
                            );
                            setSinkingFund(
                              bd ? bd.sinkingFund.toString() : "0",
                            );
                            setOtherCharges(
                              bd ? bd.otherCharges.toString() : "0",
                            );
                            setHouseTax(
                              bd ? (bd.houseTax ?? 0).toString() : "0",
                            );
                            setRepairMaintenance(
                              bd ? (bd.repairMaintenance ?? 0).toString() : "0",
                            );
                            setInterest(
                              bd ? (bd.interest ?? 0).toString() : "0",
                            );
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
                              Service Charges (₹)
                            </Label>
                            <Input
                              type="number"
                              value={serviceCharges}
                              onChange={(e) =>
                                setServiceCharges(e.target.value)
                              }
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Non-Occupancy Charges (₹)
                            </Label>
                            <Input
                              type="number"
                              value={nonOccupancyCharges}
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              House Tax (₹)
                            </Label>
                            <Input
                              type="number"
                              value={houseTax}
                              onChange={(e) => setHouseTax(e.target.value)}
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Repair & Maintenance (₹)
                            </Label>
                            <Input
                              type="number"
                              value={repairMaintenance}
                              onChange={(e) =>
                                setRepairMaintenance(e.target.value)
                              }
                              placeholder="0"
                              className="font-body"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="font-body text-sm">
                              Interest (₹)
                            </Label>
                            <Input
                              type="number"
                              value={interest}
                              onChange={(e) => setInterest(e.target.value)}
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
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                style={{ color: "oklch(0.52 0.18 243)" }}
                                onClick={() => setEditingBill(bill)}
                                title="Edit bill"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
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
                            </div>
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

      {/* Edit Bill Dialog */}
      <EditBillDialog
        bill={editingBill}
        onClose={() => {
          setEditingBill(null);
          refresh();
        }}
      />
    </div>
  );
}

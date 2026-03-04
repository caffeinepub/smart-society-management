import type {
  Bill as BackendBill,
  BillBreakdown as BackendBillBreakdown,
  SocietyInfo as BackendSocietyInfo,
  Unit as BackendUnit,
} from "@/backend";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Trash2,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
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
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../store/AuthContext";
import type { AppRole } from "../store/societyStore";
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

function generateBillNumber(billId: number, year: number): string {
  return `${year}-${String(billId).padStart(4, "0")}`;
}

function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100)
      return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
    if (n < 1000)
      return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convert(n % 100)}` : ""}`;
    if (n < 100000)
      return `${convert(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${convert(n % 1000)}` : ""}`;
    if (n < 10000000)
      return `${convert(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${convert(n % 100000)}` : ""}`;
    return `${convert(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${convert(n % 10000000)}` : ""}`;
  }
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = `Rupees ${convert(rupees)}`;
  if (paise > 0) result += ` and ${convert(paise)} Paise`;
  return `${result} Only`;
}

function downloadHTMLasPDF(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// ─── Edit Bill Dialog ─────────────────────────────────────────────────────────

function EditBillDialog({
  bill,
  onClose,
}: {
  bill: BackendBill | null;
  onClose: () => void;
}) {
  const { actor } = useActor();
  const open = bill !== null;
  const [saving, setSaving] = useState(false);

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
      setServiceCharges(Number(bill.breakdown.serviceCharges).toString());
      setWaterCharges(Number(bill.breakdown.nonOccupancyCharges).toString());
      setLiftMaintenance(Number(bill.breakdown.liftMaintenance).toString());
      setParkingCharges(Number(bill.breakdown.parkingCharges).toString());
      setSinkingFund(Number(bill.breakdown.sinkingFund).toString());
      setOtherCharges(Number(bill.breakdown.otherCharges).toString());
      setHouseTax(Number(bill.breakdown.houseTax ?? 0n).toString());
      setRepairMaintenance(
        Number(bill.breakdown.repairMaintenance ?? 0n).toString(),
      );
      setInterest(Number(bill.breakdown.interest ?? 0n).toString());
      setPreviousDue(Number(bill.previousDue).toString());
      setDueDate(bill.dueDate);
      setBillMonth(Number(bill.month).toString());
      setBillYear(Number(bill.year).toString());
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

  const handleSave = async () => {
    if (
      !bill ||
      !actor ||
      !dueDate ||
      !billMonth ||
      !billYear ||
      totalMaintenance === 0
    )
      return;
    setSaving(true);
    try {
      const breakdown: BackendBillBreakdown = {
        serviceCharges: BigInt(Math.round(Number(serviceCharges) || 0)),
        nonOccupancyCharges: BigInt(
          Math.round(Number(nonOccupancyCharges) || 0),
        ),
        liftMaintenance: BigInt(Math.round(Number(liftMaintenance) || 0)),
        parkingCharges: BigInt(Math.round(Number(parkingCharges) || 0)),
        sinkingFund: BigInt(Math.round(Number(sinkingFund) || 0)),
        otherCharges: BigInt(Math.round(Number(otherCharges) || 0)),
        houseTax: BigInt(Math.round(Number(houseTax) || 0)),
        repairMaintenance: BigInt(Math.round(Number(repairMaintenance) || 0)),
        interest: BigInt(Math.round(Number(interest) || 0)),
      };
      await actor.updateBill(
        bill.id,
        bill.unitId,
        bill.unitNumber,
        BigInt(Math.round(totalMaintenance)),
        dueDate,
        BigInt(Number(billMonth)),
        BigInt(Number(billYear)),
        BigInt(Math.round(Number(previousDue) || 0)),
        BigInt(Math.round(grandTotal)),
        bill.societyId,
        breakdown,
        bill.status,
      );
      toast.success("Bill updated successfully");
      onClose();
    } catch {
      toast.error("Failed to update bill. Please try again.");
    } finally {
      setSaving(false);
    }
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
              saving ||
              !dueDate ||
              !billMonth ||
              !billYear ||
              totalMaintenance === 0
            }
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Resident PDF helpers (backend Bill has no breakdown) ────────────────────

function buildResidentBillHTML(
  bill: BackendBill,
  societyInfo: BackendSocietyInfo,
  ownerName: string,
  isReceipt: boolean,
  paymentDate?: string,
  paymentMethod?: string,
): string {
  const billAmount = Number(bill.amount);
  const billMonth = Number(bill.month);
  const billYear = Number(bill.year);
  const monthName = months[billMonth - 1] ?? "";
  const billNo = generateBillNumber(Number(bill.id), billYear);
  const billingDate = paymentDate ?? bill.dueDate;

  if (isReceipt) {
    const isPaid = bill.status === "Paid";
    const pmDisplay = paymentMethod ?? (isPaid ? "Bank Transfer" : "");
    const isCheque = pmDisplay.toLowerCase().includes("cheque");
    const paymentLineHTML = `
      <div class="payment-line">
        <span>${numberToWords(billAmount)}</span>
      </div>
      <div class="payment-method-line">
        in Cash&nbsp;/&nbsp;By Cheque No <span class="underline-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        drawn at (Bank/Branch) <span class="underline-blank">&nbsp;${isCheque ? pmDisplay : pmDisplay}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        &nbsp;&nbsp;&nbsp;&nbsp; dated <span class="underline-blank">&nbsp;${billingDate}&nbsp;</span>
      </div>`;
    const statusClass = isPaid ? "status-paid" : "status-unpaid";
    const statusText = isPaid ? "PAID" : "UNPAID";

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Receipt – ${bill.unitNumber} – ${monthName} ${billYear}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px 32px; background: #fff; max-width: 680px; margin: 0 auto; }
  .receipt-label { font-size: 20px; font-weight: 900; letter-spacing: 3px; text-align: center; width: 100%; display: block; margin-bottom: 6px; }
  .sr-date-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  .sr-date { font-size: 12px; }
  .srno { font-size: 13px; font-weight: 900; }
  .society-name { font-size: 17px; font-weight: 900; text-transform: uppercase; color: #cc0000; letter-spacing: 0.5px; margin-top: 2px; text-align: center; }
  .society-sub { font-size: 10.5px; font-weight: 700; color: #111; margin-top: 1px; text-align: center; }
  .society-address { font-size: 10.5px; font-weight: 700; color: #111; margin-top: 1px; text-align: center; }
  .system-note { font-size: 10px; margin-top: 10px; text-align: center; font-style: italic; border-top: 1px solid #bbb; padding-top: 6px; }
  .divider { border: none; border-top: 1px solid #555; margin: 8px 0 4px; }
  .received-line { font-size: 12px; margin-bottom: 3px; }
  .flat-line { font-size: 12px; margin-bottom: 6px; }
  table.breakdown { width: 100%; border-collapse: collapse; margin-top: 2px; border: 1px solid #333; }
  table.breakdown th { border: 1px solid #333; padding: 4px 6px; text-align: left; font-size: 11px; font-weight: 700; background: #f5f5f5; }
  table.breakdown th.amount-rs, table.breakdown td.amount-rs { text-align: right; width: 70px; }
  table.breakdown th.amount-p, table.breakdown td.amount-p { text-align: right; width: 40px; }
  table.breakdown td { border: 1px solid #aaa; padding: 3px 6px; font-size: 12px; }
  td.sr { width: 30px; border-right: 1px solid #aaa; }
  .total-row td { border-top: 2px solid #333; font-weight: 700; font-size: 12px; background: #f9f9f9; }
  .words-section { margin-top: 8px; font-size: 12px; }
  .words-label { font-weight: 600; }
  .payment-line { margin-top: 4px; font-size: 11px; font-style: italic; }
  .payment-method-line { margin-top: 3px; font-size: 11px; }
  .underline-blank { border-bottom: 1px solid #333; display: inline-block; min-width: 60px; }
  .status-badge { display: inline-block; margin-top: 6px; padding: 2px 12px; font-size: 12px; font-weight: 800; letter-spacing: 2px; border-radius: 3px; text-transform: uppercase; }
  .status-paid { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .status-unpaid { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  .nb-note { font-size: 10px; margin-top: 10px; border-top: 1px solid #bbb; padding-top: 6px; }
  .signatory { margin-top: 20px; text-align: right; font-size: 11px; font-weight: 600; }
</style>
</head>
<body>
  <div class="receipt-label">RECEIPT</div>
  <div class="sr-date-row">
    <span class="srno">Sr. No. : ${billNo}</span>
    <span class="sr-date">Date : ${billingDate}</span>
  </div>
  <div class="society-name">${societyInfo.name || "SOCIETY NAME"}</div>
  ${societyInfo.registrationNumber ? `<div class="society-sub">${societyInfo.registrationNumber}</div>` : ""}
  <div class="society-address">${societyInfo.address}${societyInfo.city ? `, ${societyInfo.city}` : ""}</div>
  <hr class="divider"/>
  <div class="received-line">Received from Shri/Shrimati/M/s. <strong>${ownerName}</strong></div>
  <div class="flat-line">Flat/Shop/ No. <strong>${bill.unitNumber}</strong> in <strong>${societyInfo.name || "HSG. SOC. LTD."}</strong>. On account of maintenance charges.</div>
  <table class="breakdown">
    <thead>
      <tr>
        <th class="sr" colspan="2">P a r t i c u l a r s</th>
        <th colspan="2" style="text-align:center; vertical-align:middle;">
          <div style="text-align:center; font-weight:700; letter-spacing:1px;">AMOUNT</div>
          <div style="display:flex;justify-content:flex-end;gap:20px; margin-top:2px;"><span>Rs.</span><span style="margin-right:4px">P.</span></div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="sr">1.</td>
        <td>Maintenance Charges — ${monthName} ${billYear}</td>
        <td class="amount-rs">${billAmount.toLocaleString("en-IN")}</td>
        <td class="amount-p"></td>
      </tr>
      <tr class="total-row">
        <td class="sr"></td>
        <td style="font-weight:700">TOTAL</td>
        <td class="amount-rs" style="font-weight:700">${billAmount.toLocaleString("en-IN")}</td>
        <td class="amount-p"></td>
      </tr>
    </tbody>
  </table>
  <div class="words-section">
    <span class="words-label">Rupees (in words) </span>
    ${paymentLineHTML}
  </div>
  <div class="status-badge ${statusClass}">${statusText}</div>
  <div class="nb-note">N.B. 1. Receipts is valid subject to realisation of the cheque.</div>
  <div class="signatory">Chairman/Secretary/Treasure/Authorised Signatory</div>
  <div class="system-note">This is a system generated receipt, no signature required.</div>
</body>
</html>`;
  }

  // Maintenance Bill format
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Maintenance Bill – ${bill.unitNumber} – ${monthName} ${billYear}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 28px 36px; background: #fff; max-width: 720px; margin: 0 auto; }
  .doc-header { font-size: 14px; font-weight: 700; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; color: #111; border-bottom: 2px solid #111; padding-bottom: 4px; }
  .society-name { font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #000; text-align: center; }
  .society-reg { font-size: 11px; margin-top: 2px; font-weight: 700; text-align: center; }
  .society-address { font-size: 11px; margin-top: 1px; font-weight: 700; text-align: center; }
  .divider { border: none; border-top: 1px dashed #888; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .info-table td { padding: 3px 0; font-size: 12px; vertical-align: top; }
  .info-label { font-weight: normal; width: 120px; }
  .info-value { font-weight: 600; }
  .info-right { text-align: right; }
  table.breakdown { width: 100%; border-collapse: collapse; margin-top: 2px; }
  table.breakdown th { border-bottom: 1px solid #333; border-top: 1px solid #333; padding: 5px 8px; text-align: left; font-size: 11px; font-weight: 700; }
  table.breakdown th.amount, table.breakdown td.amount { text-align: right; }
  table.breakdown td { padding: 4px 8px; font-size: 12px; border: none; }
  td.sr { width: 40px; }
  td.amount { width: 100px; text-align: right; }
  .total-row td { padding-top: 5px; }
  .grandtotal-divider td { border-top: 1px dashed #888; padding-top: 2px; }
  .grandtotal-row td { font-weight: 700; font-size: 13px; padding-top: 4px; }
  .note { font-size: 11px; margin-top: 12px; border-top: 1px dashed #888; padding-top: 8px; }
  .signatory { margin-top: 24px; text-align: right; font-size: 12px; font-weight: 600; }
</style>
</head>
<body>
  <div class="doc-header">Maintenance Bill</div>
  <div class="society-name">${societyInfo.name}</div>
  <div class="society-reg">${societyInfo.registrationNumber}</div>
  <div class="society-address">${societyInfo.address}${societyInfo.city ? `, ${societyInfo.city}` : ""}</div>
  <hr class="divider"/>
  <table class="info-table">
    <tr>
      <td class="info-label">Name</td>
      <td class="info-value">${bill.unitNumber} &nbsp;&nbsp; ${ownerName}</td>
      <td class="info-right"><span style="font-weight:normal">Bill no :</span> &nbsp;<strong>${billNo}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Bill Month:</td>
      <td class="info-value">${monthName.slice(0, 3)}-${String(billYear).slice(-2)}</td>
      <td class="info-right"><span style="font-weight:normal">Billing Date :</span> &nbsp;<strong>${bill.dueDate}</strong></td>
    </tr>
  </table>
  <hr class="divider"/>
  <table class="breakdown">
    <thead>
      <tr>
        <th class="sr">Sr No</th>
        <th class="particular">Particulars</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="sr">1</td>
        <td>Maintenance Charges</td>
        <td class="amount">${billAmount.toLocaleString("en-IN")}</td>
      </tr>
      <tr class="grandtotal-divider"><td colspan="3" style="border-top:1px dashed #888;padding-top:0;height:6px;"></td></tr>
      <tr class="total-row">
        <td colspan="2"><strong>Total</strong></td>
        <td class="amount"><strong>${billAmount.toLocaleString("en-IN")}</strong></td>
      </tr>
      <tr class="grandtotal-divider"><td colspan="3" style="border-top:1px dashed #888;padding-top:0;height:6px;"></td></tr>
      <tr class="grandtotal-row">
        <td colspan="2">Grand Total</td>
        <td class="amount">${billAmount.toLocaleString("en-IN")}</td>
      </tr>
    </tbody>
  </table>
  <div class="note">
    Note : This is a system generated bill, does not require signature.<br/>
    Bill to be paid by 20th of every month.
  </div>
  <div class="signatory">Chairman / Secretary / Treasurer</div>
</body>
</html>`;
}

// ─── Resident Pay Bill Dialog (uses backend) ──────────────────────────────────

function ResidentPayBillDialog({
  bill,
  societyInfo,
  onClose,
  onSuccess,
}: {
  bill: BackendBill | null;
  societyInfo: BackendSocietyInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { actor } = useActor();
  const open = bill !== null;
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!bill || !societyInfo) return null;

  const billAmount = Number(bill.amount);
  const monthName = months[(Number(bill.month) ?? 1) - 1] ?? "";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("societypay@upi").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async (method: string) => {
    if (!actor) {
      toast.error("Not connected. Please try again.");
      return;
    }
    setPaying(true);
    try {
      await actor.recordPayment(bill.id, bill.amount, method);
      toast.success("Payment recorded. Thank you!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setPaying(false);
    }
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
                {monthName} {Number(bill.year)}
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
                ₹{billAmount.toLocaleString("en-IN")}
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
              <div
                className="w-44 h-44 rounded-lg flex flex-col items-center justify-center gap-2"
                style={{
                  background: "#fff",
                  border: "2px solid oklch(0.78 0.06 280)",
                }}
              >
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
                  ₹{billAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Button
              className="w-full font-body gap-2"
              style={{ background: "oklch(0.52 0.18 155)", color: "#fff" }}
              onClick={() => handlePay("UPI")}
              disabled={paying}
              data-ocid="billing.pay.primary_button"
            >
              <CreditCard className="w-4 h-4" />
              {paying ? "Recording payment..." : "I have paid via UPI"}
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
                  ₹{billAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Button
              className="w-full font-body gap-2"
              style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
              onClick={() => handlePay("Bank Transfer")}
              disabled={paying}
              data-ocid="billing.bank.primary_button"
            >
              <CreditCard className="w-4 h-4" />
              {paying
                ? "Recording payment..."
                : "I have paid via Bank Transfer"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Resident Billing View ────────────────────────────────────────────────────

function ResidentBillingView() {
  const { currentUser } = useAuth();
  const { actor, isFetching: actorFetching } = useActor();
  const [payingBill, setPayingBill] = useState<BackendBill | null>(null);
  const [myBills, setMyBills] = useState<BackendBill[]>([]);
  const [societyInfo, setSocietyInfo] = useState<BackendSocietyInfo | null>(
    null,
  );
  const [allUnits, setAllUnits] = useState<BackendUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const residentUnitNumber = currentUser?.unitNumber ?? "";

  const fetchData = useCallback(async () => {
    if (!actor) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [bills, info, units] = await Promise.all([
        actor.getBills(),
        actor.getSocietyInfo(),
        actor.getUnits(),
      ]);
      setMyBills(bills);
      setSocietyInfo(info ?? null);
      setAllUnits(units);
    } catch {
      setLoadError("Failed to load billing data. Please refresh.");
      toast.error("Failed to load billing data.");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actorFetching && actor) {
      fetchData();
    }
  }, [actor, actorFetching, fetchData]);

  const pendingCount = myBills.filter((b) => b.status !== "Paid").length;
  const paidCount = myBills.filter((b) => b.status === "Paid").length;
  const totalDue = myBills
    .filter((b) => b.status !== "Paid")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl" data-ocid="billing.loading_state">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 max-w-5xl" data-ocid="billing.error_state">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-display font-semibold text-destructive mb-2">
              {loadError}
            </p>
            <Button
              variant="outline"
              onClick={fetchData}
              className="font-body mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultSociety: BackendSocietyInfo = {
    name: "Society",
    address: "",
    city: "",
    registrationNumber: "",
    contactPhone: "",
  };

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
          },
          {
            label: "Total Due",
            value: `₹${totalDue.toLocaleString("en-IN")}`,
            sub: "outstanding amount",
            color: "oklch(0.45 0.18 30)",
          },
          {
            label: "Paid Bills",
            value: paidCount,
            sub: "this year",
            color: "oklch(0.58 0.16 155)",
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
            My Maintenance Bills
            {residentUnitNumber ? ` — Unit ${residentUnitNumber}` : ""}
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
                      colSpan={5}
                      className="text-center py-14 font-body text-muted-foreground"
                      data-ocid="billing.bills.empty_state"
                    >
                      No bills found for your unit yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  myBills.map((bill, idx) => {
                    const isPaid = bill.status === "Paid";
                    const isUnpaid = !isPaid;
                    const billAmount = Number(bill.amount);
                    const billMonth = Number(bill.month);
                    const billYear = Number(bill.year);
                    const matchedUnit = allUnits.find(
                      (u) => u.unitNumber === bill.unitNumber,
                    );
                    const ownerName = matchedUnit?.ownerName ?? bill.unitNumber;
                    const si = societyInfo ?? defaultSociety;

                    return (
                      <TableRow
                        key={bill.id.toString()}
                        data-ocid={`billing.bills.item.${idx + 1}`}
                      >
                        <TableCell className="font-body font-medium">
                          {months[billMonth - 1]?.slice(0, 3)} {billYear}
                        </TableCell>
                        <TableCell
                          className="font-body font-semibold"
                          style={{ color: "oklch(0.35 0.15 243)" }}
                        >
                          ₹{billAmount.toLocaleString("en-IN")}
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
                                className="text-xs font-body h-7 gap-1.5"
                                style={{
                                  color: "oklch(0.45 0.18 155)",
                                  borderColor: "oklch(0.7 0.12 155)",
                                }}
                                onClick={() => setPayingBill(bill)}
                                data-ocid={`billing.bills.button.${idx + 1}`}
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
                              onClick={() => {
                                const html = buildResidentBillHTML(
                                  bill,
                                  si,
                                  ownerName,
                                  false,
                                );
                                const billNo = generateBillNumber(
                                  Number(bill.id),
                                  billYear,
                                );
                                downloadHTMLasPDF(
                                  html,
                                  `Bill_${billNo}_${bill.unitNumber}_${months[billMonth - 1]}${billYear}.html`,
                                );
                              }}
                              title="Download Bill PDF"
                              data-ocid={`billing.bills.secondary_button.${idx + 1}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Bill
                            </Button>
                            {/* Download Receipt */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-body h-7 gap-1.5"
                              style={{
                                color: isPaid
                                  ? "oklch(0.45 0.18 155)"
                                  : "oklch(0.52 0.18 243)",
                              }}
                              onClick={() => {
                                const html = buildResidentBillHTML(
                                  bill,
                                  si,
                                  ownerName,
                                  true,
                                  undefined,
                                  isPaid ? "Bank Transfer" : undefined,
                                );
                                const billNo = generateBillNumber(
                                  Number(bill.id),
                                  billYear,
                                );
                                downloadHTMLasPDF(
                                  html,
                                  `Receipt_${billNo}_${bill.unitNumber}_${months[billMonth - 1]}${billYear}.html`,
                                );
                              }}
                              title="Download Receipt PDF"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Receipt
                            </Button>
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

      <ResidentPayBillDialog
        bill={payingBill}
        societyInfo={societyInfo ?? defaultSociety}
        onClose={() => setPayingBill(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}

// ─── Main Billing Component ───────────────────────────────────────────────────

interface BillingProps {
  role: AppRole;
  societyId?: number | null;
}

export default function Billing({ role, societyId }: BillingProps) {
  const store = useSocietyStore();
  const { actor, isFetching: actorFetching } = useActor();

  // Backend bills state
  const [bills, setBills] = useState<BackendBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsError, setBillsError] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BackendBill | null>(null);
  const [creating, setCreating] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

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

  // Units still come from localStorage (Properties migration is next)
  const units = store.getUnits(societyId);

  // ── Fetch bills from backend ──────────────────────────────────────────────
  const refreshBills = useCallback(async () => {
    if (!actor) return;
    setBillsLoading(true);
    setBillsError(null);
    try {
      const fetchedBills = await actor.getBills();
      // Filter by societyId if provided
      const filtered =
        societyId != null
          ? fetchedBills.filter((b) => Number(b.societyId) === societyId)
          : fetchedBills;
      setBills(filtered);
    } catch {
      setBillsError("Failed to load bills. Please try again.");
      toast.error("Failed to load billing data.");
    } finally {
      setBillsLoading(false);
    }
  }, [actor, societyId]);

  useEffect(() => {
    if (!actorFetching && actor) {
      refreshBills();
    }
  }, [actor, actorFetching, refreshBills]);

  // ── Derived financial summary from bills state ────────────────────────────
  const financialSummary = {
    totalBilled: bills.reduce((sum, b) => sum + Number(b.grandTotal), 0),
    totalCollected: bills
      .filter((b) => b.status === "Paid")
      .reduce((sum, b) => sum + Number(b.grandTotal), 0),
    pendingDues: bills
      .filter((b) => b.status !== "Paid")
      .reduce((sum, b) => sum + Number(b.grandTotal), 0),
  };

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

  const handleCreateBill = async () => {
    if (
      !actor ||
      !billUnitId ||
      !billMonth ||
      !billYear ||
      !billDueDate ||
      totalMaintenance === 0
    )
      return;
    setCreating(true);
    try {
      const breakdown: BackendBillBreakdown = {
        serviceCharges: BigInt(Math.round(Number(serviceCharges) || 0)),
        nonOccupancyCharges: BigInt(
          Math.round(Number(nonOccupancyCharges) || 0),
        ),
        liftMaintenance: BigInt(Math.round(Number(liftMaintenance) || 0)),
        parkingCharges: BigInt(Math.round(Number(parkingCharges) || 0)),
        sinkingFund: BigInt(Math.round(Number(sinkingFund) || 0)),
        otherCharges: BigInt(Math.round(Number(otherCharges) || 0)),
        houseTax: BigInt(Math.round(Number(houseTax) || 0)),
        repairMaintenance: BigInt(Math.round(Number(repairMaintenance) || 0)),
        interest: BigInt(Math.round(Number(interest) || 0)),
      };
      await actor.createBill(
        BigInt(Number(billUnitId)),
        billUnitNumber,
        BigInt(Math.round(totalMaintenance)),
        billDueDate,
        BigInt(Number(billMonth)),
        BigInt(Number(billYear)),
        BigInt(Math.round(Number(previousDue) || 0)),
        BigInt(Math.round(grandTotal)),
        BigInt(societyId ?? 0),
        breakdown,
      );
      toast.success("Bill generated successfully");
      setGenerateOpen(false);
      resetGenerateForm();
      await refreshBills();
    } catch {
      toast.error("Failed to generate bill. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!actor || !payBillId || !payAmount) return;
    setRecordingPayment(true);
    try {
      await actor.recordPayment(
        BigInt(Number(payBillId)),
        BigInt(Math.round(Number(payAmount))),
        payMethod,
      );
      toast.success("Payment recorded successfully");
      setPaymentOpen(false);
      setPayBillId("");
      setPayAmount("");
      setPayMethod("Online");
      await refreshBills();
    } catch {
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setRecordingPayment(false);
    }
  };

  // Chart data: group bills by month
  const chartData = months.slice(0, 6).map((m, idx) => {
    const monthBills = bills.filter(
      (b) =>
        Number(b.month) === idx + 1 &&
        Number(b.year) === new Date().getFullYear(),
    );
    return {
      month: m.slice(0, 3),
      billed: monthBills.reduce((sum, b) => sum + Number(b.grandTotal), 0),
      collected: monthBills
        .filter((b) => b.status === "Paid")
        .reduce((sum, b) => sum + Number(b.grandTotal), 0),
    };
  });

  const isAdmin =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  // Resident gets their own filtered view
  if (role === "Resident") {
    return <ResidentBillingView />;
  }

  // Loading state for admin view
  if (billsLoading) {
    return (
      <div
        className="space-y-6 max-w-7xl"
        data-ocid="admin.billing.loading_state"
      >
        <div className="flex justify-end mb-4">
          <Skeleton className="h-9 w-36" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for admin view
  if (billsError) {
    return (
      <div
        className="space-y-4 max-w-7xl"
        data-ocid="admin.billing.error_state"
      >
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-display font-semibold text-destructive mb-2">
              {billsError}
            </p>
            <Button
              variant="outline"
              onClick={refreshBills}
              className="font-body mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
          <div className="flex justify-end mb-4 gap-2 flex-wrap">
            {isAdmin && bills.length > 0 && (
              <DeleteAllDialog
                label="Delete All Bills"
                description="Are you sure you want to delete all bills? This will also remove all associated payment records. This action cannot be undone."
                onConfirm={async () => {
                  if (!actor) return;
                  try {
                    await actor.deleteAllBills();
                    toast.success("All bills deleted");
                    await refreshBills();
                  } catch {
                    toast.error("Failed to delete bills. Please try again.");
                  }
                }}
                ocidScope="bills"
              />
            )}
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
                        creating ||
                        !billUnitId ||
                        !billMonth ||
                        !billYear ||
                        !billDueDate ||
                        totalMaintenance === 0
                      }
                    >
                      {creating ? "Generating..." : "Generate Bill"}
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
                        data-ocid="admin.billing.bills.empty_state"
                      >
                        No bills generated yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map((bill) => {
                      const billAmount = Number(bill.amount);
                      const billPrevDue = Number(bill.previousDue);
                      const billGrandTotal = Number(bill.grandTotal);
                      const billMonth = Number(bill.month);
                      const billYear = Number(bill.year);
                      return (
                        <TableRow key={bill.id.toString()}>
                          <TableCell className="font-display font-semibold">
                            {bill.unitNumber}
                          </TableCell>
                          <TableCell className="font-body">
                            {months[billMonth - 1]?.slice(0, 3)} {billYear}
                          </TableCell>
                          <TableCell className="font-body font-medium">
                            ₹{billAmount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {billPrevDue > 0
                              ? `₹${billPrevDue.toLocaleString("en-IN")}`
                              : "—"}
                          </TableCell>
                          <TableCell
                            className="font-body font-semibold"
                            style={{ color: "oklch(0.35 0.15 243)" }}
                          >
                            ₹{billGrandTotal.toLocaleString("en-IN")}
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
                                  data-ocid="billing.bill.edit_button"
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
                                      setPayAmount(billGrandTotal.toString());
                                      setPaymentOpen(true);
                                    }}
                                  >
                                    Record Pay
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  style={{ color: "oklch(0.55 0.18 25)" }}
                                  onClick={async () => {
                                    if (!actor) return;
                                    if (
                                      window.confirm(
                                        `Delete bill for ${bill.unitNumber} (${months[billMonth - 1]?.slice(0, 3)} ${billYear})? This cannot be undone.`,
                                      )
                                    ) {
                                      try {
                                        await actor.deleteBill(bill.id);
                                        toast.success("Bill deleted");
                                        await refreshBills();
                                      } catch {
                                        toast.error("Failed to delete bill.");
                                      }
                                    }
                                  }}
                                  title="Delete bill"
                                  data-ocid="billing.bill.delete_button"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
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
                      if (b) setPayAmount(Number(b.grandTotal).toString());
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
                            {b.unitNumber} —{" "}
                            {months[Number(b.month) - 1]?.slice(0, 3)}{" "}
                            {Number(b.year)} — ₹
                            {Number(b.grandTotal).toLocaleString("en-IN")}
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
                  disabled={recordingPayment || !payBillId || !payAmount}
                >
                  {recordingPayment ? "Recording..." : "Record Payment"}
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
                    disabled={recordingPayment || !payBillId || !payAmount}
                  >
                    {recordingPayment ? "Recording..." : "Confirm Payment"}
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
          refreshBills();
        }}
      />
    </div>
  );
}

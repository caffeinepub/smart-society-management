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

interface PdfUnitInfo {
  ownerName: string;
  area?: number;
}

function buildBillHTML(
  bill: Bill,
  societyInfo: SocietyInfo,
  unitInfo: PdfUnitInfo,
  isReceipt: boolean,
  billingDateOverride?: string,
  paymentMethod?: string,
): string {
  const monthName = months[bill.month - 1] ?? "";
  const billNo = generateBillNumber(bill.id, bill.year);
  const billingDate = billingDateOverride ?? bill.dueDate;
  const areaDisplay = unitInfo.area ? `${unitInfo.area} Sq.Ft.` : "—";

  if (isReceipt) {
    // ── RECEIPT FORMAT (matches physical receipt sample) ──────────────────────
    const isPaid = bill.status === "Paid";

    // Map bill breakdown to the 12 receipt rows in the sample order
    const receiptRows = [
      { label: "Entrance Fees", value: 0 },
      { label: "Shares", value: 0 },
      { label: "Maintenance Dues", value: bill.breakdown.serviceCharges },
      { label: "Interest", value: bill.breakdown.interest ?? 0 },
      { label: "Municipal Taxes", value: bill.breakdown.houseTax ?? 0 },
      { label: "Water Charges", value: bill.breakdown.nonOccupancyCharges },
      { label: "Parking Charges", value: bill.breakdown.parkingCharges },
      { label: "Sinking Fund", value: bill.breakdown.sinkingFund },
      { label: "Service Charges", value: bill.breakdown.liftMaintenance },
      { label: "Insurance", value: bill.breakdown.repairMaintenance ?? 0 },
      { label: "Transfer Fees", value: 0 },
      { label: "Miscellaneous", value: bill.breakdown.otherCharges },
    ];

    const receiptRowsHTML = receiptRows
      .map(
        (row, i) =>
          `<tr>
            <td class="sr">${i + 1}.</td>
            <td class="particular">${row.label}</td>
            <td class="amount-rs">${row.value > 0 ? row.value.toLocaleString("en-IN") : ""}</td>
            <td class="amount-p"></td>
          </tr>`,
      )
      .join("");

    const pmDisplay = paymentMethod ?? (isPaid ? "Bank Transfer" : "");
    const isCheque = pmDisplay.toLowerCase().includes("cheque");
    const paymentLineHTML = `
      <div class="payment-line">
        <span>${numberToWords(bill.grandTotal)}</span>
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
<title>Receipt – ${bill.unitNumber} – ${monthName} ${bill.year}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px 32px; background: #fff; max-width: 680px; margin: 0 auto; }
  .top-row { display: block; margin-bottom: 4px; }
  .sr-date-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  .receipt-label { font-size: 20px; font-weight: 900; letter-spacing: 3px; text-align: center; width: 100%; display: block; margin-bottom: 6px; }
  .sr-date { font-size: 12px; }
  .srno { font-size: 13px; font-weight: 900; }
  .society-name { font-size: 17px; font-weight: 900; text-transform: uppercase; color: #cc0000; letter-spacing: 0.5px; margin-top: 2px; text-align: center; font-style: normal; }
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
  td.particular { }
  .total-row td { border-top: 2px solid #333; font-weight: 700; font-size: 12px; background: #f9f9f9; }
  /* eoe-note removed */
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

  <div class="received-line">Received from Shri/Shrimati/M/s. <strong>${unitInfo.ownerName}</strong></div>
  <div class="flat-line">Flat/Shop/ No. <strong>${bill.unitNumber}</strong> in <strong>${societyInfo.name || "HSG. SOC. LTD."}</strong>. On account of the particulars as stated below.</div>

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
      ${receiptRowsHTML}
      <tr class="total-row">
        <td class="sr"></td>
        <td class="particular" style="font-weight:700">TOTAL</td>
        <td class="amount-rs" style="font-weight:700">${bill.grandTotal.toLocaleString("en-IN")}</td>
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

  // ── MAINTENANCE BILL FORMAT ──────────────────────────────────────────────────
  const breakdownRows = [
    { label: "Service Charges", value: bill.breakdown.serviceCharges },
    {
      label: "Non-Occupancy Charges",
      value: bill.breakdown.nonOccupancyCharges,
    },
    { label: "Lift Maintenance", value: bill.breakdown.liftMaintenance },
    { label: "Parking Charges", value: bill.breakdown.parkingCharges },
    { label: "Sinking Fund", value: bill.breakdown.sinkingFund },
    { label: "Other Charges", value: bill.breakdown.otherCharges },
    { label: "House Tax", value: bill.breakdown.houseTax ?? 0 },
    {
      label: "Repair &amp; Maintenance Fund",
      value: bill.breakdown.repairMaintenance ?? 0,
    },
    { label: "Interest", value: bill.breakdown.interest ?? 0 },
  ];

  const breakdownRowsHTML = breakdownRows
    .map(
      (row, i) =>
        `<tr>
          <td class="sr">${i + 1}</td>
          <td class="particular">${row.label}</td>
          <td class="amount">${row.value > 0 ? row.value.toLocaleString("en-IN") : "-"}</td>
        </tr>`,
    )
    .join("");

  const noteHTML = `<div class="note">
    Note : This is a system generated bill, does not require signature.<br/>
    Bill to be paid by 20th of every month.
  </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Maintenance Bill – ${bill.unitNumber} – ${monthName} ${bill.year}</title>
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
  .prevdue-row td { padding-top: 2px; }
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
      <td class="info-value">${bill.unitNumber} &nbsp;&nbsp; ${unitInfo.ownerName}</td>
      <td class="info-right"><span style="font-weight:normal">Bill no :</span> &nbsp;<strong>${billNo}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Area in Sq. Ft.</td>
      <td class="info-value">${areaDisplay}</td>
      <td></td>
    </tr>
    <tr>
      <td class="info-label">Bill Month:</td>
      <td class="info-value">${monthName.slice(0, 3)}-${String(bill.year).slice(-2)}</td>
      <td class="info-right"><span style="font-weight:normal">Billing Date :</span> &nbsp;<strong>${billingDate}</strong></td>
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
      ${breakdownRowsHTML}
      <tr class="grandtotal-divider"><td colspan="3" style="border-top:1px dashed #888;padding-top:0;height:6px;"></td></tr>
      <tr class="total-row">
        <td colspan="2"><strong>Total</strong></td>
        <td class="amount"><strong>${bill.amount.toLocaleString("en-IN")}</strong></td>
      </tr>
      <tr class="prevdue-row">
        <td colspan="2">Previous Dues</td>
        <td class="amount">${bill.previousDue > 0 ? bill.previousDue.toLocaleString("en-IN") : "-"}</td>
      </tr>
      <tr class="grandtotal-divider"><td colspan="3" style="border-top:1px dashed #888;padding-top:0;height:6px;"></td></tr>
      <tr class="grandtotal-row">
        <td colspan="2">Grand Total</td>
        <td class="amount">${bill.grandTotal.toLocaleString("en-IN")}</td>
      </tr>
    </tbody>
  </table>

  ${noteHTML}
  <div class="signatory">Chairman / Secretary / Treasurer</div>
</body>
</html>`;
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

function printBillPDF(
  bill: Bill,
  societyInfo: SocietyInfo,
  unitInfo: PdfUnitInfo,
) {
  const monthName = months[bill.month - 1] ?? "";
  const billNo = generateBillNumber(bill.id, bill.year);
  const html = buildBillHTML(bill, societyInfo, unitInfo, false);
  const filename = `Bill_${billNo}_${bill.unitNumber}_${monthName}${bill.year}.html`;
  downloadHTMLasPDF(html, filename);
}

function printReceiptPDF(
  bill: Bill,
  payment: Payment,
  societyInfo: SocietyInfo,
  unitInfo: PdfUnitInfo,
) {
  const monthName = months[bill.month - 1] ?? "";
  const billNo = generateBillNumber(bill.id, bill.year);
  const paymentDate = formatDate(payment.paidAt);
  const html = buildBillHTML(
    bill,
    societyInfo,
    unitInfo,
    true,
    paymentDate,
    payment.paymentMethod,
  );
  const filename = `Receipt_${billNo}_${bill.unitNumber}_${monthName}${bill.year}.html`;
  downloadHTMLasPDF(html, filename);
}

function printUnpaidReceiptPDF(
  bill: Bill,
  societyInfo: SocietyInfo,
  unitInfo: PdfUnitInfo,
) {
  const monthName = months[bill.month - 1] ?? "";
  const billNo = generateBillNumber(bill.id, bill.year);
  const html = buildBillHTML(
    bill,
    societyInfo,
    unitInfo,
    true,
    undefined,
    undefined,
  );
  const filename = `Receipt_${billNo}_${bill.unitNumber}_${monthName}${bill.year}.html`;
  downloadHTMLasPDF(html, filename);
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
  const allUnits = store.getUnits();

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
                              onClick={() => {
                                const u = allUnits.find(
                                  (u) => u.unitNumber === bill.unitNumber,
                                );
                                printBillPDF(bill, societyInfo, {
                                  ownerName: u?.ownerName ?? bill.unitNumber,
                                  area: u?.area,
                                });
                              }}
                              title="Download Bill PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Bill
                            </Button>
                            {/* Download Receipt — always available, shows PAID or UNPAID */}
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
                                const u = allUnits.find(
                                  (u) => u.unitNumber === bill.unitNumber,
                                );
                                if (isPaid && payment) {
                                  printReceiptPDF(bill, payment, societyInfo, {
                                    ownerName: u?.ownerName ?? bill.unitNumber,
                                    area: u?.area,
                                  });
                                } else {
                                  printUnpaidReceiptPDF(bill, societyInfo, {
                                    ownerName: u?.ownerName ?? bill.unitNumber,
                                    area: u?.area,
                                  });
                                }
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

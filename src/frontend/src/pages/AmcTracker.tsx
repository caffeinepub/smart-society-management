import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  IndianRupee,
  Plus,
  RefreshCw,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import type { AppRole } from "../store/societyStore";
import type { AmcContract } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const PAYMENT_METHODS = ["Cash", "Cheque", "Bank Transfer", "UPI"];

function computeAmcStatus(
  contractEnd: string,
): "Active" | "Expiring Soon" | "Expired" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(contractEnd);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) return "Expiring Soon";
  return "Active";
}

function getAmcStatusStyle(status: string): React.CSSProperties {
  if (status === "Active")
    return {
      background: "oklch(0.9 0.08 155)",
      color: "oklch(0.3 0.1 155)",
      border: "1px solid oklch(0.82 0.1 155)",
    };
  if (status === "Expiring Soon")
    return {
      background: "oklch(0.95 0.08 75)",
      color: "oklch(0.4 0.12 65)",
      border: "1px solid oklch(0.88 0.1 70)",
    };
  return {
    background: "oklch(0.95 0.07 25)",
    color: "oklch(0.4 0.15 25)",
    border: "1px solid oklch(0.88 0.1 25)",
  };
}

function getAmcStatusIcon(status: string) {
  if (status === "Active") return <CheckCircle2 className="w-3 h-3" />;
  if (status === "Expiring Soon") return <AlertTriangle className="w-3 h-3" />;
  return <XCircle className="w-3 h-3" />;
}

interface AmcFormData {
  equipmentName: string;
  vendor: string;
  contactPerson: string;
  contactPhone: string;
  contractStart: string;
  contractEnd: string;
  amount: string;
  paymentMethod: string;
  notes: string;
}

const defaultForm: AmcFormData = {
  equipmentName: "",
  vendor: "",
  contactPerson: "",
  contactPhone: "",
  contractStart: new Date().toISOString().slice(0, 10),
  contractEnd: "",
  amount: "",
  paymentMethod: "Bank Transfer",
  notes: "",
};

interface AmcDialogProps {
  open: boolean;
  editingContract: AmcContract | null;
  onClose: () => void;
  onRefresh: () => void;
  societyId?: number | null;
}

function AmcDialog({
  open,
  editingContract,
  onClose,
  onRefresh,
  societyId: propSocietyId,
}: AmcDialogProps) {
  const store = useSocietyStore();
  const societyId = propSocietyId ?? store.getActiveSocietyId();

  const [form, setFormState] = useState<AmcFormData>(() =>
    editingContract
      ? {
          equipmentName: editingContract.equipmentName,
          vendor: editingContract.vendor,
          contactPerson: editingContract.contactPerson,
          contactPhone: editingContract.contactPhone,
          contractStart: editingContract.contractStart,
          contractEnd: editingContract.contractEnd,
          amount: editingContract.amount.toString(),
          paymentMethod: editingContract.paymentMethod,
          notes: editingContract.notes,
        }
      : defaultForm,
  );

  const [lastEditingId, setLastEditingId] = useState<number | null>(null);
  if (editingContract && editingContract.id !== lastEditingId) {
    setLastEditingId(editingContract.id);
    setFormState({
      equipmentName: editingContract.equipmentName,
      vendor: editingContract.vendor,
      contactPerson: editingContract.contactPerson,
      contactPhone: editingContract.contactPhone,
      contractStart: editingContract.contractStart,
      contractEnd: editingContract.contractEnd,
      amount: editingContract.amount.toString(),
      paymentMethod: editingContract.paymentMethod,
      notes: editingContract.notes,
    });
  }
  if (!editingContract && lastEditingId !== null) {
    setLastEditingId(null);
    setFormState(defaultForm);
  }

  const set = (key: keyof AmcFormData, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.equipmentName.trim() &&
    form.vendor.trim() &&
    form.contractStart &&
    form.contractEnd &&
    Number(form.amount) > 0;

  const handleSave = () => {
    if (!isValid) return;
    const status = computeAmcStatus(form.contractEnd);
    if (editingContract) {
      store.updateAmcContract(
        editingContract.id,
        form.equipmentName.trim(),
        form.vendor.trim(),
        form.contactPerson.trim(),
        form.contactPhone.trim(),
        form.contractStart,
        form.contractEnd,
        Number(form.amount),
        form.paymentMethod,
        form.notes.trim(),
        status,
        societyId,
      );
      toast.success("AMC contract updated");
    } else {
      store.createAmcContract(
        form.equipmentName.trim(),
        form.vendor.trim(),
        form.contactPerson.trim(),
        form.contactPhone.trim(),
        form.contractStart,
        form.contractEnd,
        Number(form.amount),
        form.paymentMethod,
        form.notes.trim(),
        status,
        societyId,
      );
      toast.success("AMC contract added");
    }
    setFormState(defaultForm);
    onRefresh();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wrench
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            {editingContract ? "Edit AMC Contract" : "Add AMC Contract"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body">Equipment Name *</Label>
            <Input
              value={form.equipmentName}
              onChange={(e) => set("equipmentName", e.target.value)}
              placeholder="e.g. Lift Tower A, CCTV System"
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Vendor / Company *</Label>
            <Input
              value={form.vendor}
              onChange={(e) => set("vendor", e.target.value)}
              placeholder="e.g. Otis Elevators Pvt Ltd"
              className="font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="Name"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Contact Phone</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="+91 98..."
                className="font-body"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Contract Start *</Label>
              <Input
                type="date"
                value={form.contractStart}
                onChange={(e) => set("contractStart", e.target.value)}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Contract End *</Label>
              <Input
                type="date"
                value={form.contractEnd}
                onChange={(e) => set("contractEnd", e.target.value)}
                className="font-body"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
                className="font-body"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => set("paymentMethod", v)}
              >
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="font-body">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Additional details about the contract..."
              className="font-body resize-none"
              rows={3}
            />
          </div>

          <Button
            className="w-full font-body"
            onClick={handleSave}
            disabled={!isValid}
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
          >
            {editingContract ? "Save Changes" : "Add Contract"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AmcTrackerProps {
  role: AppRole;
  societyId?: number | null;
}

export default function AmcTracker({ role, societyId }: AmcTrackerProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<AmcContract | null>(
    null,
  );

  const canEdit =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Wrench
            className="w-12 h-12 mx-auto"
            style={{ color: "oklch(0.65 0.08 240)" }}
          />
          <p className="font-display text-lg font-semibold">
            Access Restricted
          </p>
          <p className="text-sm font-body text-muted-foreground">
            Only Admin and SuperAdmin can view AMC contracts.
          </p>
        </div>
      </div>
    );
  }

  const allContracts =
    societyId != null
      ? store.getAmcContracts().filter((c) => c.societyId === societyId)
      : store.getAmcContracts();

  // Compute live status for each contract
  const contractsWithStatus = allContracts.map((c) => ({
    ...c,
    liveStatus: computeAmcStatus(c.contractEnd),
  }));

  const activeCount = contractsWithStatus.filter(
    (c) => c.liveStatus === "Active",
  ).length;
  const expiringSoonCount = contractsWithStatus.filter(
    (c) => c.liveStatus === "Expiring Soon",
  ).length;
  const expiredCount = contractsWithStatus.filter(
    (c) => c.liveStatus === "Expired",
  ).length;
  const totalAmount = allContracts.reduce((sum, c) => sum + c.amount, 0);

  const handleDelete = (id: number) => {
    store.deleteAmcContract(id);
    toast.success("Contract deleted");
    refresh();
  };

  const openEdit = (contract: AmcContract) => {
    setEditingContract(contract);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">AMC Tracker</h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Annual Maintenance Contracts — track expiry and renewals
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allContracts.length > 0 && (
            <DeleteAllDialog
              label="Delete All AMC Records"
              description="Are you sure you want to delete all AMC contracts? This action cannot be undone."
              onConfirm={() => {
                store.deleteAllAmcContracts(societyId);
                toast.success("All AMC contracts deleted");
                refresh();
              }}
              ocidScope="amc"
            />
          )}
          <Button
            className="gap-2 font-body"
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            onClick={() => {
              setEditingContract(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Contract
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Contracts",
            value: allContracts.length,
            sub: `₹${totalAmount.toLocaleString("en-IN")} total value`,
            color: "oklch(0.52 0.18 243)",
            icon: Wrench,
          },
          {
            label: "Active",
            value: activeCount,
            sub: "running contracts",
            color: "oklch(0.45 0.18 155)",
            icon: CheckCircle2,
          },
          {
            label: "Expiring Soon",
            value: expiringSoonCount,
            sub: "within 30 days",
            color: "oklch(0.55 0.16 75)",
            icon: AlertTriangle,
          },
          {
            label: "Expired",
            value: expiredCount,
            sub: "need renewal",
            color: "oklch(0.55 0.2 25)",
            icon: XCircle,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{
                    background: `oklch(from ${stat.color} l c h / 0.1)`,
                  }}
                >
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                    {stat.label}
                  </p>
                  <p
                    className="font-display text-xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    {stat.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <IndianRupee
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            AMC Contracts
            <span className="text-sm font-body text-muted-foreground font-normal ml-1">
              ({contractsWithStatus.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Equipment
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Vendor
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Contract Period
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Amount (₹)
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Contact
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
                {contractsWithStatus.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 font-body text-muted-foreground"
                    >
                      No AMC contracts yet. Click &quot;Add Contract&quot; to
                      get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  contractsWithStatus
                    .sort((a, b) => {
                      const order = {
                        Expired: 0,
                        "Expiring Soon": 1,
                        Active: 2,
                      };
                      return (
                        (order[a.liveStatus] ?? 3) - (order[b.liveStatus] ?? 3)
                      );
                    })
                    .map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-display font-semibold text-sm">
                          <div>{contract.equipmentName}</div>
                          {contract.notes && (
                            <div className="text-xs font-body text-muted-foreground mt-0.5 max-w-[180px] truncate">
                              {contract.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {contract.vendor}
                        </TableCell>
                        <TableCell className="font-body text-sm whitespace-nowrap">
                          <div>
                            {new Date(
                              contract.contractStart,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            to{" "}
                            {new Date(contract.contractEnd).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className="font-display font-bold text-right"
                          style={{ color: "oklch(0.52 0.18 243)" }}
                        >
                          ₹{contract.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          <div>{contract.contactPerson || "—"}</div>
                          {contract.contactPhone && (
                            <div className="text-xs text-muted-foreground">
                              {contract.contactPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs gap-1"
                            style={getAmcStatusStyle(contract.liveStatus)}
                          >
                            {getAmcStatusIcon(contract.liveStatus)}
                            {contract.liveStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(contract.liveStatus === "Expired" ||
                              contract.liveStatus === "Expiring Soon") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-body h-7 gap-1"
                                title="Renew Contract"
                                onClick={() => openEdit(contract)}
                              >
                                <RefreshCw className="w-3 h-3" />
                                Renew
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Edit"
                              onClick={() => openEdit(contract)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Delete"
                              style={{ color: "oklch(0.55 0.2 25)" }}
                              onClick={() => handleDelete(contract.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AmcDialog
        open={dialogOpen}
        editingContract={editingContract}
        onClose={() => {
          setDialogOpen(false);
          setEditingContract(null);
        }}
        onRefresh={refresh}
        societyId={societyId}
      />
    </div>
  );
}

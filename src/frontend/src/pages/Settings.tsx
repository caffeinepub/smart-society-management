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
  Building2,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../store/AuthContext";
import type { AppRole, Society } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const roleLabels: Record<AppRole, string> = {
  SuperAdmin: "Super Admin",
  Admin: "Committee Admin",
  Chairman: "Chairman",
  Secretary: "Secretary",
  Treasurer: "Treasurer",
  SecurityGuard: "Security Guard",
  Resident: "Resident",
  Staff: "Society Staff",
};

const roleColors: Record<AppRole, React.CSSProperties> = {
  SuperAdmin: {
    background: "oklch(0.92 0.06 240)",
    color: "oklch(0.35 0.15 243)",
    border: "1px solid oklch(0.84 0.1 240)",
  },
  Admin: {
    background: "oklch(0.93 0.07 280)",
    color: "oklch(0.35 0.15 280)",
    border: "1px solid oklch(0.84 0.1 280)",
  },
  Chairman: {
    background: "oklch(0.95 0.1 85)",
    color: "oklch(0.38 0.14 75)",
    border: "1px solid oklch(0.87 0.12 80)",
  },
  Secretary: {
    background: "oklch(0.93 0.08 195)",
    color: "oklch(0.32 0.12 195)",
    border: "1px solid oklch(0.84 0.1 190)",
  },
  Treasurer: {
    background: "oklch(0.92 0.1 145)",
    color: "oklch(0.3 0.13 148)",
    border: "1px solid oklch(0.83 0.1 145)",
  },
  SecurityGuard: {
    background: "oklch(0.95 0.08 75)",
    color: "oklch(0.4 0.12 65)",
    border: "1px solid oklch(0.88 0.1 70)",
  },
  Resident: {
    background: "oklch(0.9 0.08 155)",
    color: "oklch(0.3 0.1 155)",
    border: "1px solid oklch(0.82 0.1 155)",
  },
  Staff: {
    background: "oklch(0.92 0.015 245)",
    color: "oklch(0.45 0.03 248)",
    border: "1px solid oklch(0.84 0.02 245)",
  },
};

interface SettingsProps {
  role: AppRole;
  onRoleChange: () => void;
  societyId?: number | null;
}

// ─── Register Society Dialog ──────────────────────────────────────────────────

function RegisterSocietyDialog({ onSuccess }: { onSuccess: () => void }) {
  const store = useSocietyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const handleRegister = () => {
    if (!name) return;
    store.registerSociety(
      name,
      address,
      city,
      registrationNumber,
      contactPhone,
    );
    toast.success(`Society "${name}" registered successfully`);
    setOpen(false);
    setName("");
    setAddress("");
    setCity("");
    setRegistrationNumber("");
    setContactPhone("");
    onSuccess();
  };

  return (
    <>
      <Button
        size="sm"
        className="gap-2 font-body"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" /> Register Society
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Register New Society
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-body">Society Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Green Valley Residency"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
                className="font-body"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Contact Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="font-body"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Registration Number</Label>
              <Input
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. CHS/MH/2024/001234"
                className="font-body"
              />
            </div>
            <Button
              className="w-full font-body"
              onClick={handleRegister}
              disabled={!name}
            >
              Register Society
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Society Card ─────────────────────────────────────────────────────────────

function SocietyCard({
  society,
  isActive,
  onSetActive,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  society: Society;
  isActive: boolean;
  onSetActive: (id: number) => void;
  onEdit: () => void;
  onToggleEnabled: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const isEnabled = society.isEnabled !== false; // default true for legacy data
  return (
    <Card
      className="transition-all"
      style={
        isActive
          ? {
              border: "2px solid oklch(0.52 0.18 243)",
              boxShadow: "0 0 0 3px oklch(0.52 0.18 243 / 0.12)",
            }
          : !isEnabled
            ? { border: "1px solid oklch(0.88 0.015 245)", opacity: 0.7 }
            : { border: "1px solid oklch(0.88 0.015 245)" }
      }
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: isActive
                  ? "oklch(0.92 0.06 240)"
                  : "oklch(0.94 0.008 240)",
              }}
            >
              <Building2
                className="w-5 h-5"
                style={{
                  color: isActive
                    ? "oklch(0.52 0.18 243)"
                    : "oklch(0.65 0.03 245)",
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-sm truncate">
                  {society.name}
                </h3>
                {isActive && (
                  <Badge
                    className="font-body text-xs shrink-0"
                    style={{
                      background: "oklch(0.92 0.06 240)",
                      color: "oklch(0.35 0.15 243)",
                      border: "1px solid oklch(0.84 0.1 240)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Context
                  </Badge>
                )}
                {/* Enabled / Disabled status badge */}
                <Badge
                  className="font-body text-xs shrink-0"
                  style={
                    isEnabled
                      ? {
                          background: "oklch(0.92 0.1 155)",
                          color: "oklch(0.3 0.12 155)",
                          border: "1px solid oklch(0.82 0.1 155)",
                        }
                      : {
                          background: "oklch(0.93 0.06 25)",
                          color: "oklch(0.45 0.15 25)",
                          border: "1px solid oklch(0.84 0.08 25)",
                        }
                  }
                >
                  {isEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {society.city}
                {society.city && society.registrationNumber ? " · " : ""}
                {society.registrationNumber}
              </p>
              {society.contactPhone && (
                <p className="text-xs font-body text-muted-foreground mt-0.5">
                  {society.contactPhone}
                </p>
              )}
              {society.address && (
                <p className="text-xs font-body text-muted-foreground mt-0.5 truncate max-w-xs">
                  {society.address}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              style={{ color: "oklch(0.52 0.18 243)" }}
              onClick={onEdit}
              title="Edit Society"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            {/* Enable / Disable toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              style={{
                color: isEnabled
                  ? "oklch(0.45 0.15 25)"
                  : "oklch(0.3 0.12 155)",
              }}
              onClick={() => onToggleEnabled(society.id)}
              title={isEnabled ? "Disable Society" : "Enable Society"}
            >
              {isEnabled ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </Button>
            {/* Set Context button (not shown for active context society) */}
            {!isActive && isEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="font-body text-xs"
                onClick={() => onSetActive(society.id)}
              >
                Set Active
              </Button>
            )}
            {/* Delete only visible when disabled */}
            {!isEnabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onDelete(society.id)}
                title="Delete Society (permanent)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Society Card Wrapper (card + inline edit dialog) ─────────────────────────

function SocietyCardWrapper({
  society,
  isActive,
  onSetActive,
  onEditSuccess,
  onToggleEnabled,
  onDelete,
}: {
  society: Society;
  isActive: boolean;
  onSetActive: (id: number) => void;
  onEditSuccess: () => void;
  onToggleEnabled: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <SocietyCard
        society={society}
        isActive={isActive}
        onSetActive={onSetActive}
        onEdit={() => setEditOpen(true)}
        onToggleEnabled={onToggleEnabled}
        onDelete={onDelete}
      />
      <EditSocietyInlineDialog
        society={society}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onEditSuccess}
      />
    </>
  );
}

function EditSocietyInlineDialog({
  society,
  open,
  onOpenChange,
  onSuccess,
}: {
  society: Society;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const store = useSocietyStore();
  const [name, setName] = useState(society.name);
  const [address, setAddress] = useState(society.address);
  const [city, setCity] = useState(society.city);
  const [registrationNumber, setRegistrationNumber] = useState(
    society.registrationNumber,
  );
  const [contactPhone, setContactPhone] = useState(society.contactPhone);

  // sync when dialog opens
  useEffect(() => {
    if (open) {
      setName(society.name);
      setAddress(society.address);
      setCity(society.city);
      setRegistrationNumber(society.registrationNumber);
      setContactPhone(society.contactPhone);
    }
  }, [open, society]);

  const handleSave = () => {
    if (!name) return;
    store.updateSociety(
      society.id,
      name,
      address,
      city,
      registrationNumber,
      contactPhone,
    );
    toast.success(`Society "${name}" updated`);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Society</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body">Society Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Green Valley Residency"
              className="font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body">Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              className="font-body"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Contact Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="font-body"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body">Registration Number</Label>
            <Input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. CHS/MH/2024/001234"
              className="font-body"
            />
          </div>
          <Button
            className="w-full font-body"
            onClick={handleSave}
            disabled={!name}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── User Management Tab ──────────────────────────────────────────────────────

const roleOptionsForAdmin: { value: AppRole; label: string }[] = [
  { value: "Admin", label: "Committee Admin" },
  { value: "Chairman", label: "Chairman" },
  { value: "Secretary", label: "Secretary" },
  { value: "Treasurer", label: "Treasurer" },
  { value: "SecurityGuard", label: "Security Guard" },
  { value: "Resident", label: "Resident" },
  { value: "Staff", label: "Society Staff" },
];

function UserManagementTab({
  currentUserId,
  refresh,
}: {
  currentUserId: number;
  refresh: () => void;
}) {
  const store = useSocietyStore();
  const societies = store.getSocieties();
  const users = store.getUsers();
  const allUnits = store.getUnits();

  // ── Add user state ───────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [newSocietyId, setNewSocietyId] = useState(
    societies.length === 1 ? societies[0].id.toString() : "",
  );
  const [newUnitId, setNewUnitId] = useState("");
  const [addError, setAddError] = useState("");

  // ── Edit user state ──────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<AppRole | "">("");
  const [editSocietyId, setEditSocietyId] = useState("");
  const [editUnitId, setEditUnitId] = useState("");
  const [editError, setEditError] = useState("");

  const societyUnitsForSelected = newSocietyId
    ? allUnits.filter((u) => u.societyId === Number(newSocietyId))
    : allUnits;

  const editSocietyUnits = editSocietyId
    ? allUnits.filter((u) => u.societyId === Number(editSocietyId))
    : allUnits;

  const getSocietyName = (sid?: number) =>
    societies.find((s) => s.id === sid)?.name ?? "—";

  const handleAddUser = () => {
    setAddError("");
    if (!newName || !newEmail || !newPassword || !newRole || !newSocietyId) {
      setAddError("Please fill in all required fields");
      return;
    }
    if (newRole === "Resident" && !newUnitId) {
      setAddError("Please select a unit for the Resident");
      return;
    }
    const unit = newUnitId
      ? allUnits.find((u) => u.id === Number(newUnitId))
      : undefined;
    const result = store.createAdminUser(
      newName,
      newEmail,
      newPassword,
      newRole as AppRole,
      Number(newSocietyId),
      unit?.id,
      unit?.unitNumber,
    );
    if (result.success) {
      toast.success(`User "${newName}" created successfully`);
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("");
      setNewUnitId("");
      refresh();
    } else {
      setAddError(result.error ?? "Failed to create user");
    }
  };

  const handleDeleteUser = (id: number) => {
    if (id === currentUserId) return;
    store.deleteUser(id);
    toast.success("User removed");
    refresh();
  };

  const handleOpenEdit = (u: (typeof users)[0]) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditSocietyId(u.societyId?.toString() ?? "");
    setEditUnitId(u.unitId?.toString() ?? "");
    setEditError("");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    setEditError("");
    if (!editingUser) return;
    if (!editName || !editEmail || !editRole) {
      setEditError("Name, email, and role are required");
      return;
    }
    if (editRole !== "SuperAdmin" && !editSocietyId) {
      setEditError("Please select a society");
      return;
    }
    if (editRole === "Resident" && !editUnitId) {
      setEditError("Please select a unit for the Resident");
      return;
    }
    const unit = editUnitId
      ? allUnits.find((u) => u.id === Number(editUnitId))
      : undefined;
    const result = store.updateAdminUser(
      editingUser.id,
      editName,
      editEmail,
      editRole as AppRole,
      editSocietyId ? Number(editSocietyId) : undefined,
      unit?.id,
      unit?.unitNumber,
    );
    if (result.success) {
      toast.success(`User "${editName}" updated successfully`);
      setEditOpen(false);
      setEditingUser(null);
      refresh();
    } else {
      setEditError(result.error ?? "Failed to update user");
    }
  };

  const roleLabel: Record<AppRole, string> = {
    SuperAdmin: "Super Admin",
    Admin: "Committee Admin",
    Chairman: "Chairman",
    Secretary: "Secretary",
    Treasurer: "Treasurer",
    SecurityGuard: "Security Guard",
    Resident: "Resident",
    Staff: "Society Staff",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-base">
            User Management
          </h2>
          <p className="text-sm font-body text-muted-foreground">
            Create and manage user accounts across all societies
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 font-body"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body font-semibold">Name</TableHead>
                <TableHead className="font-body font-semibold">Email</TableHead>
                <TableHead className="font-body font-semibold">Role</TableHead>
                <TableHead className="font-body font-semibold">
                  Society
                </TableHead>
                <TableHead className="font-body font-semibold">Unit</TableHead>
                <TableHead className="font-body font-semibold w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id.toString()}>
                  <TableCell className="font-body font-medium">
                    {u.name}
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="font-body text-xs"
                      style={roleColors[u.role]}
                    >
                      {roleLabel[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-sm">
                    {u.role === "SuperAdmin" ? (
                      <span className="text-muted-foreground italic">
                        Global
                      </span>
                    ) : (
                      getSocietyName(u.societyId)
                    )}
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">
                    {u.unitNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        style={{ color: "oklch(0.52 0.18 243)" }}
                        disabled={u.id === currentUserId}
                        onClick={() => handleOpenEdit(u)}
                        title={
                          u.id === currentUserId
                            ? "Cannot edit yourself here"
                            : "Edit user"
                        }
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={u.id === currentUserId}
                        onClick={() => handleDeleteUser(u.id)}
                        title={
                          u.id === currentUserId
                            ? "Cannot delete yourself"
                            : "Delete user"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-body">Full Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Email *</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@society.com"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Password *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Role *</Label>
              <Select
                value={newRole}
                onValueChange={(v) => {
                  setNewRole(v as AppRole);
                  setNewUnitId("");
                }}
              >
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptionsForAdmin.map((r) => (
                    <SelectItem
                      key={r.value}
                      value={r.value}
                      className="font-body"
                    >
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Society *</Label>
              <Select
                value={newSocietyId}
                onValueChange={(v) => {
                  setNewSocietyId(v);
                  setNewUnitId("");
                }}
              >
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select society" />
                </SelectTrigger>
                <SelectContent>
                  {societies.map((s) => (
                    <SelectItem
                      key={s.id.toString()}
                      value={s.id.toString()}
                      className="font-body"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newRole === "Resident" && (
              <div className="space-y-1.5">
                <Label className="font-body">Unit *</Label>
                <Select value={newUnitId} onValueChange={setNewUnitId}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-52">
                    {societyUnitsForSelected.map((u) => (
                      <SelectItem
                        key={u.id.toString()}
                        value={u.id.toString()}
                        className="font-body"
                      >
                        {u.unitNumber}
                        {u.ownerName ? ` – ${u.ownerName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {addError && (
              <p className="text-sm font-body text-destructive">{addError}</p>
            )}
            <Button
              className="w-full font-body"
              onClick={handleAddUser}
              disabled={
                !newName ||
                !newEmail ||
                !newPassword ||
                !newRole ||
                !newSocietyId
              }
            >
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-body">Full Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Email *</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="user@society.com"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Role *</Label>
              {editingUser?.role === "SuperAdmin" ? (
                <div
                  className="px-3 py-2 rounded-md border font-body text-sm"
                  style={{
                    background: "oklch(0.97 0.005 245)",
                    borderColor: "oklch(0.88 0.015 245)",
                    color: "oklch(0.5 0.03 248)",
                  }}
                >
                  Super Admin (cannot be changed)
                </div>
              ) : (
                <Select
                  value={editRole}
                  onValueChange={(v) => {
                    setEditRole(v as AppRole);
                    setEditUnitId("");
                  }}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptionsForAdmin.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="font-body"
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {editingUser?.role !== "SuperAdmin" && (
              <div className="space-y-1.5">
                <Label className="font-body">Society *</Label>
                <Select
                  value={editSocietyId}
                  onValueChange={(v) => {
                    setEditSocietyId(v);
                    setEditUnitId("");
                  }}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select society" />
                  </SelectTrigger>
                  <SelectContent>
                    {societies.map((s) => (
                      <SelectItem
                        key={s.id.toString()}
                        value={s.id.toString()}
                        className="font-body"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editRole === "Resident" && (
              <div className="space-y-1.5">
                <Label className="font-body">Unit *</Label>
                <Select value={editUnitId} onValueChange={setEditUnitId}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-52">
                    {editSocietyUnits.map((u) => (
                      <SelectItem
                        key={u.id.toString()}
                        value={u.id.toString()}
                        className="font-body"
                      >
                        {u.unitNumber}
                        {u.ownerName ? ` – ${u.ownerName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editError && (
              <p className="text-sm font-body text-destructive">{editError}</p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 font-body"
                onClick={handleSaveEdit}
                disabled={!editName || !editEmail || !editRole}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="font-body"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────

export default function Settings({ role, onRoleChange }: SettingsProps) {
  // societyId prop accepted but Settings uses activeSociety directly
  const store = useSocietyStore();
  const { currentUser, updateProfile, updatePassword } = useAuth();
  const isAdmin =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";
  const isSuperAdmin = role === "SuperAdmin";
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  // Profile edit state
  const [profileName, setProfileName] = useState(currentUser?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email ?? "");
  const [profileEditing, setProfileEditing] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleSaveProfile = () => {
    if (!profileName) return;
    updateProfile(profileName, profileEmail);
    toast.success("Profile updated successfully");
    setProfileEditing(false);
  };

  const handleChangePassword = () => {
    setPwError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    const result = updatePassword(currentPassword, newPassword);
    if (result.success) {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPwError(result.error ?? "Failed to change password");
    }
  };

  // Society info form — driven by active society
  const [societyName, setSocietyName] = useState("");
  const [societyAddress, setSocietyAddress] = useState("");
  const [societyCity, setSocietyCity] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const societyInfo = store.getSocietyInfo();
  const societies = store.getSocieties();
  const activeSocietyId = store.getActiveSocietyId();

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync form from societyInfo object
  useEffect(() => {
    if (societyInfo) {
      setSocietyName(societyInfo.name || "");
      setSocietyAddress(societyInfo.address || "");
      setSocietyCity(societyInfo.city || "");
      setRegistrationNumber(societyInfo.registrationNumber || "");
      setContactPhone(societyInfo.contactPhone || "");
    }
  }, [
    societyInfo.name,
    societyInfo.address,
    societyInfo.city,
    societyInfo.registrationNumber,
    societyInfo.contactPhone,
  ]);

  const handleSave = () => {
    if (!societyName) return;
    store.updateActiveSociety(
      societyName,
      societyAddress,
      societyCity,
      registrationNumber,
      contactPhone,
    );
    toast.success("Society information updated");
  };

  const handleSetActive = (id: number) => {
    store.setActiveSociety(id);
    const soc = societies.find((s) => s.id === id);
    toast.success(`Switched to "${soc?.name ?? "society"}"`);
    refresh();
  };

  const handleToggleEnabled = (id: number) => {
    const soc = societies.find((s) => s.id === id);
    if (!soc) return;
    store.toggleSocietyEnabled(id);
    const willBeEnabled = soc.isEnabled === false;
    toast.success(
      willBeEnabled
        ? `Society "${soc.name}" has been enabled`
        : `Society "${soc.name}" has been disabled`,
    );
    refresh();
  };

  const handleDeleteSociety = (id: number) => {
    const soc = societies.find((s) => s.id === id);
    if (!soc) return;
    store.deleteSociety(id);
    toast.success(`Society "${soc.name}" deleted`);
    refresh();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Tabs defaultValue={isAdmin ? "societies" : "profile"}>
        <TabsList className="font-body mb-6 flex-wrap h-auto gap-1">
          {isAdmin && (
            <TabsTrigger value="societies" className="gap-2">
              <Building2 className="w-3.5 h-3.5" /> Societies
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="society" className="gap-2">
              <Building2 className="w-3.5 h-3.5" /> Society Info
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-3.5 h-3.5" /> User Management
            </TabsTrigger>
          )}
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-3.5 h-3.5" /> My Profile
          </TabsTrigger>
        </TabsList>

        {/* Societies Tab */}
        {isAdmin && (
          <TabsContent value="societies" className="mt-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-base">
                  Registered Societies
                </h2>
                <p className="text-sm font-body text-muted-foreground">
                  {societies.length} society
                  {societies.length !== 1 ? "ies" : ""} registered
                </p>
              </div>
              <RegisterSocietyDialog onSuccess={refresh} />
            </div>
            {societies.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2
                    className="w-10 h-10 mx-auto mb-3"
                    style={{ color: "oklch(0.75 0.015 245)" }}
                  />
                  <p className="font-display font-semibold text-foreground mb-1">
                    No societies registered
                  </p>
                  <p className="text-sm font-body text-muted-foreground">
                    Register your first society to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {societies.map((soc) => (
                  <SocietyCardWrapper
                    key={soc.id}
                    society={soc}
                    isActive={soc.id === activeSocietyId}
                    onSetActive={handleSetActive}
                    onEditSuccess={refresh}
                    onToggleEnabled={handleToggleEnabled}
                    onDelete={handleDeleteSociety}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Society Info Tab */}
        {isAdmin && (
          <TabsContent value="society" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">
                  Society Information
                </CardTitle>
                <p className="text-sm font-body text-muted-foreground">
                  Update the active society&apos;s basic details and contact
                  information
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="font-body">Society Name</Label>
                  <Input
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    placeholder="e.g. Prestige Lakeside Habitat"
                    className="font-body"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-body">Address</Label>
                  <Input
                    value={societyAddress}
                    onChange={(e) => setSocietyAddress(e.target.value)}
                    placeholder="Full address"
                    className="font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-body">City</Label>
                    <Input
                      value={societyCity}
                      onChange={(e) => setSocietyCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Contact Phone</Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-body">Registration Number</Label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. CHS/MH/2024/001234"
                    className="font-body"
                  />
                </div>

                <Separator />

                <Button
                  className="gap-2 font-body"
                  onClick={handleSave}
                  disabled={!societyName}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* User Management — SuperAdmin only */}
        {isSuperAdmin && (
          <TabsContent value="users" className="mt-0">
            <UserManagementTab
              currentUserId={currentUser?.id ?? -1}
              refresh={refresh}
            />
          </TabsContent>
        )}

        {/* Profile */}
        <TabsContent value="profile" className="mt-0 space-y-4">
          {/* Identity card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <User
                  className="w-4 h-4"
                  style={{ color: "oklch(0.52 0.18 243)" }}
                />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: "oklch(0.94 0.012 245)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0"
                  style={{ background: "oklch(0.52 0.18 243)" }}
                >
                  {(currentUser?.name ?? roleLabels[role])
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-base truncate">
                    {currentUser?.name ?? roleLabels[role]}
                  </h3>
                  <p className="text-sm font-body text-muted-foreground truncate">
                    {currentUser?.email ?? "—"}
                  </p>
                  <Badge
                    className="font-body text-xs mt-1.5"
                    style={roleColors[role]}
                  >
                    {roleLabels[role]}
                  </Badge>
                </div>
                {!profileEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto flex-shrink-0 h-8 w-8"
                    style={{ color: "oklch(0.52 0.18 243)" }}
                    onClick={() => {
                      setProfileName(currentUser?.name ?? "");
                      setProfileEmail(currentUser?.email ?? "");
                      setProfileEditing(true);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Edit form */}
              {profileEditing && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="font-body">Full Name</Label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="font-body"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Email</Label>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="font-body"
                      placeholder="you@society.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="gap-2 font-body"
                      onClick={handleSaveProfile}
                      disabled={!profileName}
                    >
                      <Save className="w-4 h-4" />
                      Save Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="font-body"
                      onClick={() => setProfileEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {currentUser?.unitNumber && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                      Assigned Unit
                    </p>
                    <p className="font-body font-semibold text-sm">
                      {currentUser.unitNumber}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Password change */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-body">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPwError("");
                    }}
                    className="font-body pr-10"
                    placeholder="Your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                  >
                    {showCurrentPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwError("");
                    }}
                    className="font-body pr-10"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
                  >
                    {showNewPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPwError("");
                  }}
                  className="font-body"
                  placeholder="Repeat new password"
                />
              </div>

              {pwError && (
                <p
                  className="text-sm font-body rounded-lg px-3 py-2"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.08)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.2)",
                    color: "oklch(0.45 0.18 25)",
                  }}
                >
                  {pwError}
                </p>
              )}

              <Button
                className="gap-2 font-body"
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                <Save className="w-4 h-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Session */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-3">
              <p className="text-sm font-body text-muted-foreground">
                Signed in as{" "}
                <strong>{currentUser?.name ?? roleLabels[role]}</strong>. Click
                below to sign out of your account.
              </p>
              <Button
                variant="outline"
                className="gap-2 font-body w-full sm:w-auto"
                onClick={onRoleChange}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <Separator />
              <div className="text-xs font-body text-muted-foreground">
                <p>SmartSociety Management Platform</p>
                <p className="mt-0.5">
                  &copy; {new Date().getFullYear()}. Built with love using{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: "oklch(0.52 0.18 243)" }}
                  >
                    caffeine.ai
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
import { Bike, Car, Edit2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "../components/RoleSelection";
import type { Vehicle } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const VEHICLE_TYPES = ["Car", "Bike", "Scooter", "Other"];

function getVehicleTypeStyle(type: string): React.CSSProperties {
  if (type === "Car")
    return {
      background: "oklch(0.92 0.06 240)",
      color: "oklch(0.35 0.15 243)",
      border: "1px solid oklch(0.84 0.1 240)",
    };
  if (type === "Bike" || type === "Scooter")
    return {
      background: "oklch(0.95 0.08 75)",
      color: "oklch(0.4 0.12 65)",
      border: "1px solid oklch(0.88 0.1 70)",
    };
  return {
    background: "oklch(0.92 0.015 245)",
    color: "oklch(0.45 0.03 248)",
  };
}

interface VehicleFormData {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  vehicleNumber: string;
  vehicleType: string;
  brand: string;
  color: string;
}

const defaultForm: VehicleFormData = {
  unitId: "",
  unitNumber: "",
  ownerName: "",
  vehicleNumber: "",
  vehicleType: "Car",
  brand: "",
  color: "",
};

interface VehicleDialogProps {
  open: boolean;
  editingVehicle: Vehicle | null;
  onClose: () => void;
  onRefresh: () => void;
}

function VehicleDialog({
  open,
  editingVehicle,
  onClose,
  onRefresh,
}: VehicleDialogProps) {
  const store = useSocietyStore();
  const societyId = store.getActiveSocietyId();
  const allUnits = store.getUnits();

  const [form, setFormState] = useState<VehicleFormData>(() =>
    editingVehicle
      ? {
          unitId: editingVehicle.unitId.toString(),
          unitNumber: editingVehicle.unitNumber,
          ownerName: editingVehicle.ownerName,
          vehicleNumber: editingVehicle.vehicleNumber,
          vehicleType: editingVehicle.vehicleType,
          brand: editingVehicle.brand,
          color: editingVehicle.color,
        }
      : defaultForm,
  );

  const [lastEditingId, setLastEditingId] = useState<number | null>(null);
  if (editingVehicle && editingVehicle.id !== lastEditingId) {
    setLastEditingId(editingVehicle.id);
    setFormState({
      unitId: editingVehicle.unitId.toString(),
      unitNumber: editingVehicle.unitNumber,
      ownerName: editingVehicle.ownerName,
      vehicleNumber: editingVehicle.vehicleNumber,
      vehicleType: editingVehicle.vehicleType,
      brand: editingVehicle.brand,
      color: editingVehicle.color,
    });
  }
  if (!editingVehicle && lastEditingId !== null) {
    setLastEditingId(null);
    setFormState(defaultForm);
  }

  const set = (key: keyof VehicleFormData, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const handleUnitChange = (unitId: string) => {
    const unit = allUnits.find((u) => u.id.toString() === unitId);
    setFormState((prev) => ({
      ...prev,
      unitId,
      unitNumber: unit?.unitNumber ?? "",
      ownerName: unit?.ownerName ?? prev.ownerName,
    }));
  };

  const isValid =
    form.unitId &&
    form.vehicleNumber.trim() &&
    form.vehicleType &&
    form.ownerName.trim();

  const handleSave = () => {
    if (!isValid) return;
    const unitId = Number(form.unitId);
    if (editingVehicle) {
      store.updateVehicle(
        editingVehicle.id,
        unitId,
        form.unitNumber,
        form.ownerName.trim(),
        form.vehicleNumber.trim().toUpperCase(),
        form.vehicleType,
        form.brand.trim(),
        form.color.trim(),
        societyId,
      );
      toast.success("Vehicle updated");
    } else {
      store.createVehicle(
        unitId,
        form.unitNumber,
        form.ownerName.trim(),
        form.vehicleNumber.trim().toUpperCase(),
        form.vehicleType,
        form.brand.trim(),
        form.color.trim(),
        societyId,
      );
      toast.success("Vehicle registered");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Car
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            {editingVehicle ? "Edit Vehicle" : "Register Vehicle"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body">Flat No. *</Label>
            <Select value={form.unitId} onValueChange={handleUnitChange}>
              <SelectTrigger className="font-body">
                <SelectValue placeholder="Select flat" />
              </SelectTrigger>
              <SelectContent>
                {allUnits
                  .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
                  .map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id.toString()}
                      className="font-body"
                    >
                      {u.unitNumber} — {u.ownerName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Owner Name *</Label>
            <Input
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="Owner name"
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Vehicle Number *</Label>
            <Input
              value={form.vehicleNumber}
              onChange={(e) => set("vehicleNumber", e.target.value)}
              placeholder="e.g. KA 01 AB 1234"
              className="font-body uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Vehicle Type *</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(v) => set("vehicleType", v)}
              >
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="font-body">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Color</Label>
              <Input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="e.g. White"
                className="font-body"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Brand / Model</Label>
            <Input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Maruti Swift, Honda City"
              className="font-body"
            />
          </div>

          <Button
            className="w-full font-body"
            onClick={handleSave}
            disabled={!isValid}
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
          >
            {editingVehicle ? "Save Changes" : "Register Vehicle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VehicleRegistrationProps {
  role: AppRole;
}

export default function VehicleRegistration({
  role,
}: VehicleRegistrationProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const canEdit = role === "SuperAdmin" || role === "Admin";
  const isSecurityGuard = role === "SecurityGuard";
  const isResident = role === "Resident";
  const canAdd = canEdit || isResident;

  const allVehicles = store.getVehicles();

  const filtered = allVehicles.filter((v) => {
    const matchSearch =
      !search ||
      v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || v.vehicleType === filterType;
    return matchSearch && matchType;
  });

  const totalCars = allVehicles.filter((v) => v.vehicleType === "Car").length;
  const totalBikeScooter = allVehicles.filter(
    (v) => v.vehicleType === "Bike" || v.vehicleType === "Scooter",
  ).length;

  const handleDelete = (id: number) => {
    store.deleteVehicle(id);
    toast.success("Vehicle removed");
    refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">
            Vehicle Registration
          </h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            {isSecurityGuard
              ? "Registered vehicles in the society"
              : "Manage registered vehicles for all units"}
          </p>
        </div>
        {canAdd && (
          <Button
            className="gap-2 font-body"
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            onClick={() => {
              setEditingVehicle(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Register Vehicle
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Vehicles",
            value: allVehicles.length,
            sub: "all registered",
            color: "oklch(0.52 0.18 243)",
            icon: Car,
          },
          {
            label: "Cars",
            value: totalCars,
            sub: "registered cars",
            color: "oklch(0.45 0.18 155)",
            icon: Car,
          },
          {
            label: "Bikes / Scooters",
            value: totalBikeScooter,
            sub: "two-wheelers",
            color: "oklch(0.55 0.16 75)",
            icon: Bike,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{
                    background: `oklch(from ${stat.color} l c h / 0.1)`,
                  }}
                >
                  <stat.icon
                    className="w-5 h-5"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                    {stat.label}
                  </p>
                  <p
                    className="font-display text-2xl font-bold"
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search vehicle no., flat, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="font-body max-w-xs"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="font-body w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="font-body">
                  All Types
                </SelectItem>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="font-body">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterType !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setFilterType("All");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Car
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Registered Vehicles
            <span className="text-sm font-body text-muted-foreground font-normal ml-1">
              ({filtered.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Vehicle No.
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Flat No.
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Owner
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Type
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Brand / Model
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Color
                  </TableHead>
                  {canEdit && (
                    <TableHead className="font-body font-semibold">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canEdit ? 7 : 6}
                      className="text-center py-12 font-body text-muted-foreground"
                    >
                      {allVehicles.length === 0
                        ? 'No vehicles registered yet. Click "Register Vehicle" to add one.'
                        : "No vehicles match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filtered]
                    .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
                    .map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-display font-semibold text-sm tracking-wider">
                          {vehicle.vehicleNumber}
                        </TableCell>
                        <TableCell className="font-display font-medium text-sm">
                          {vehicle.unitNumber}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {vehicle.ownerName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={getVehicleTypeStyle(vehicle.vehicleType)}
                          >
                            {vehicle.vehicleType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {vehicle.brand || "—"}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {vehicle.color || "—"}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Edit"
                                onClick={() => {
                                  setEditingVehicle(vehicle);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Delete"
                                style={{ color: "oklch(0.55 0.2 25)" }}
                                onClick={() => handleDelete(vehicle.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VehicleDialog
        open={dialogOpen}
        editingVehicle={editingVehicle}
        onClose={() => {
          setDialogOpen(false);
          setEditingVehicle(null);
        }}
        onRefresh={refresh}
      />
    </div>
  );
}

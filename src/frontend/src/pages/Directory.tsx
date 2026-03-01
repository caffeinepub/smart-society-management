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
import { BookUser, Mail, Phone, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AppRole } from "../components/RoleSelection";
import type { Unit } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const UNIT_TYPES = [
  "1RK",
  "1BHK",
  "2BHK",
  "3BHK",
  "4BHK",
  "Studio",
  "Penthouse",
  "Other",
];
const OWNERSHIP_TYPES = ["Owner", "Tenant", "Co-owner"];

function getOwnershipStyle(type: string): React.CSSProperties {
  if (type === "Owner")
    return {
      background: "oklch(0.9 0.08 155)",
      color: "oklch(0.3 0.1 155)",
      border: "1px solid oklch(0.82 0.1 155)",
    };
  if (type === "Tenant")
    return {
      background: "oklch(0.95 0.08 75)",
      color: "oklch(0.4 0.12 65)",
      border: "1px solid oklch(0.88 0.1 70)",
    };
  return {
    background: "oklch(0.92 0.06 240)",
    color: "oklch(0.35 0.15 243)",
    border: "1px solid oklch(0.84 0.1 240)",
  };
}

interface UnitDetailDialogProps {
  unit: Unit | null;
  open: boolean;
  onClose: () => void;
}

function UnitDetailDialog({ unit, open, onClose }: UnitDetailDialogProps) {
  if (!unit) return null;
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
            <BookUser
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Unit {unit.unitNumber} — Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Owner Name
              </Label>
              <p className="font-display font-semibold mt-0.5">
                {unit.ownerName}
              </p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Unit No.
              </Label>
              <p className="font-display font-semibold mt-0.5">
                {unit.unitNumber}
              </p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Unit Type
              </Label>
              <p className="font-body mt-0.5">{unit.unitType ?? "—"}</p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Ownership
              </Label>
              <p className="font-body mt-0.5">{unit.ownershipType ?? "—"}</p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Floor
              </Label>
              <p className="font-body mt-0.5">{unit.floor}</p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Area
              </Label>
              <p className="font-body mt-0.5">
                {unit.area ? `${unit.area} sqft` : "—"}
              </p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Member Count
              </Label>
              <p className="font-body mt-0.5">{unit.memberCount ?? "—"}</p>
            </div>
            <div>
              <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                Occupancy
              </Label>
              <p className="font-body mt-0.5">
                {unit.isOccupied ? "Occupied" : "Vacant"}
              </p>
            </div>
          </div>
          <div
            className="border rounded-lg p-3 space-y-2"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">
              Contact
            </p>
            <div className="flex items-center gap-2 text-sm font-body">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              {unit.phone ?? "—"}
            </div>
            <div className="flex items-center gap-2 text-sm font-body">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              {unit.email ?? "—"}
            </div>
          </div>
          <div>
            <Label className="font-body text-xs text-muted-foreground uppercase tracking-wide">
              Monthly Maintenance
            </Label>
            <p
              className="font-display font-bold text-lg mt-0.5"
              style={{ color: "oklch(0.52 0.18 243)" }}
            >
              ₹{unit.monthlyMaintenance.toLocaleString("en-IN")}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full font-body"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DirectoryProps {
  role: AppRole;
}

export default function Directory({ role }: DirectoryProps) {
  const store = useSocietyStore();
  const isAdmin = role === "SuperAdmin" || role === "Admin";

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterOwnership, setFilterOwnership] = useState("All");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const allUnits = store.getUnits();

  const filtered = allUnits.filter((u) => {
    const matchSearch =
      !search ||
      u.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      u.unitNumber.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || u.unitType === filterType;
    const matchOwnership =
      filterOwnership === "All" || u.ownershipType === filterOwnership;
    return matchSearch && matchType && matchOwnership;
  });

  const occupiedCount = allUnits.filter((u) => u.isOccupied).length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold">Resident Directory</h2>
        <p className="text-sm font-body text-muted-foreground mt-0.5">
          All registered units and resident contact information
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Units",
            value: allUnits.length,
            sub: "registered in system",
            color: "oklch(0.52 0.18 243)",
            icon: BookUser,
          },
          {
            label: "Occupied",
            value: occupiedCount,
            sub: "currently occupied",
            color: "oklch(0.45 0.18 155)",
            icon: Users,
          },
          {
            label: "Vacant",
            value: allUnits.length - occupiedCount,
            sub: "currently vacant",
            color: "oklch(0.55 0.08 75)",
            icon: BookUser,
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
              placeholder="Search by name or flat number..."
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
                  All Unit Types
                </SelectItem>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="font-body">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOwnership} onValueChange={setFilterOwnership}>
              <SelectTrigger className="font-body w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="font-body">
                  All Ownership
                </SelectItem>
                {OWNERSHIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="font-body">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterType !== "All" || filterOwnership !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setFilterType("All");
                  setFilterOwnership("All");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <BookUser
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Directory
            <span className="text-sm font-body text-muted-foreground font-normal ml-1">
              ({filtered.length} units)
            </span>
            {!isAdmin && (
              <span className="text-xs font-body text-muted-foreground ml-auto">
                Read-only view
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Flat No.
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Phone
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Unit Type
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Ownership
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="text-center py-12 font-body text-muted-foreground"
                    >
                      {allUnits.length === 0
                        ? "No units registered yet."
                        : "No units match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filtered]
                    .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
                    .map((unit) => (
                      <TableRow
                        key={unit.id}
                        className={
                          isAdmin
                            ? "cursor-pointer hover:bg-muted/40 transition-colors"
                            : ""
                        }
                        onClick={() => {
                          if (isAdmin) {
                            setSelectedUnit(unit);
                            setDetailOpen(true);
                          }
                        }}
                      >
                        <TableCell className="font-display font-semibold text-sm">
                          {unit.unitNumber}
                        </TableCell>
                        <TableCell className="font-body font-medium text-sm">
                          {unit.ownerName}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            {unit.phone ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-sm max-w-[180px]">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {unit.email ?? "—"}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {unit.unitType ?? "—"}
                        </TableCell>
                        <TableCell>
                          {unit.ownershipType ? (
                            <Badge
                              className="font-body text-xs"
                              style={getOwnershipStyle(unit.ownershipType)}
                            >
                              {unit.ownershipType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={
                              unit.isOccupied
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
                            {unit.isOccupied ? "Occupied" : "Vacant"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-body h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnit(unit);
                                setDetailOpen(true);
                              }}
                            >
                              View
                            </Button>
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

      <UnitDetailDialog
        unit={selectedUnit}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUnit(null);
        }}
      />
    </div>
  );
}

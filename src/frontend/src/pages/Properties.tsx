import type { Tower as BackendTower, Unit as BackendUnit } from "@/backend";
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
import { Building2, Edit2, Home, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import type {
  AppRole,
  MaintenanceBreakdown,
  Society,
} from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

// ─── Extended types (merged backend + localStorage extended data) ──────────────

interface TowerExt {
  id: number; // converted from bigint
  name: string;
  totalFloors: number; // converted from bigint
  societyId: number; // from localStorage extended data
}

interface UnitExt {
  id: number;
  towerId: number;
  unitNumber: string;
  floor: number;
  ownerName: string;
  isOccupied: boolean;
  monthlyMaintenance: number; // grand total
  maintenanceBreakdown?: MaintenanceBreakdown;
  previousDue?: number;
  societyId: number;
  // Extended
  area?: number;
  ownershipType?: string;
  phone?: string;
  email?: string;
  memberCount?: number;
  unitType?: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const TOWER_EXT_KEY = "ssm_tower_ext";

interface TowerExtData {
  societyId: number;
}

function getTowerExtData(): Record<string, TowerExtData> {
  try {
    const raw = localStorage.getItem(TOWER_EXT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setTowerExtData(data: Record<string, TowerExtData>): void {
  try {
    localStorage.setItem(TOWER_EXT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

function mergeTowers(
  backendTowers: BackendTower[],
  extData: Record<string, TowerExtData>,
  activeSocietyId: number,
): TowerExt[] {
  return backendTowers.map((t) => ({
    id: Number(t.id),
    name: t.name,
    totalFloors: Number(t.totalFloors),
    societyId: extData[t.id.toString()]?.societyId ?? activeSocietyId,
  }));
}

function mergeUnits(
  backendUnits: BackendUnit[],
  towerExtData: Record<string, TowerExtData>,
  activeSocietyId: number,
): UnitExt[] {
  return backendUnits.map((u) => {
    // societyId is derived from the tower's localStorage ext data
    const towerSocietyId =
      towerExtData[u.towerId.toString()]?.societyId ?? activeSocietyId;
    // Convert backend UnitBreakdown (bigint) to local MaintenanceBreakdown (number)
    const bd = u.maintenanceBreakdown;
    const maintenanceBreakdown: MaintenanceBreakdown | undefined = bd
      ? {
          serviceCharges: Number(bd.serviceCharges),
          nonOccupancyCharges: Number(bd.nonOccupancyCharges),
          liftMaintenance: Number(bd.liftMaintenance),
          parkingCharges: Number(bd.parkingCharges),
          sinkingFund: Number(bd.sinkingFund),
          otherCharges: Number(bd.otherCharges),
          houseTax: Number(bd.houseTax),
          repairMaintenance: Number(bd.repairMaintenance),
          interest: Number(bd.interest),
        }
      : undefined;
    return {
      id: Number(u.id),
      towerId: Number(u.towerId),
      unitNumber: u.unitNumber,
      floor: Number(u.floor),
      ownerName: u.ownerName,
      isOccupied: u.isOccupied,
      monthlyMaintenance: Number(u.monthlyMaintenance),
      maintenanceBreakdown,
      previousDue: Number(u.previousDue),
      societyId: towerSocietyId,
      area: u.area != null ? Number(u.area) : undefined,
      ownershipType: u.ownershipType,
      phone: u.phone,
      email: u.email,
      memberCount: u.memberCount != null ? Number(u.memberCount) : undefined,
      unitType: u.unitType,
    };
  });
}

// ─── Maintenance Breakdown Fields ────────────────────────────────────────────

function MaintenanceBreakdownFields({
  serviceCharges,
  setServiceCharges,
  nonOccupancyCharges,
  setWaterCharges,
  liftMaintenance,
  setLiftMaintenance,
  parkingCharges,
  setParkingCharges,
  sinkingFund,
  setSinkingFund,
  otherCharges,
  setOtherCharges,
  houseTax,
  setHouseTax,
  repairMaintenance,
  setRepairMaintenance,
  interest,
  setInterest,
  previousDue,
  setPreviousDue,
}: {
  serviceCharges: string;
  setServiceCharges: (v: string) => void;
  nonOccupancyCharges: string;
  setWaterCharges: (v: string) => void;
  liftMaintenance: string;
  setLiftMaintenance: (v: string) => void;
  parkingCharges: string;
  setParkingCharges: (v: string) => void;
  sinkingFund: string;
  setSinkingFund: (v: string) => void;
  otherCharges: string;
  setOtherCharges: (v: string) => void;
  houseTax: string;
  setHouseTax: (v: string) => void;
  repairMaintenance: string;
  setRepairMaintenance: (v: string) => void;
  interest: string;
  setInterest: (v: string) => void;
  previousDue: string;
  setPreviousDue: (v: string) => void;
}) {
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

  return (
    <div className="space-y-3">
      <Separator />
      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
        Maintenance Breakdown
      </p>
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
          <Label className="font-body text-sm">Non-Occupancy Charges (₹)</Label>
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
          <Label className="font-body text-sm">Lift Maintenance (₹)</Label>
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
          <Label className="font-body text-sm">Repair & Maintenance (₹)</Label>
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
        <Label className="font-body text-sm">Previous Due (₹)</Label>
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
          className="font-display font-bold text-base"
          style={{ color: "oklch(0.35 0.15 243)" }}
        >
          ₹{grandTotal.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

// ─── Add Tower Dialog ─────────────────────────────────────────────────────────

function AddTowerDialog({
  societies,
  defaultSocietyId,
  canSelectSociety,
  onSuccess,
}: {
  societies: Society[];
  defaultSocietyId: number;
  canSelectSociety: boolean;
  onSuccess: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [societyId, setSocietyId] = useState(defaultSocietyId.toString());
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!actor || !name || !totalFloors || !societyId) return;
    setSaving(true);
    try {
      const newId = await actor.createTower(name, BigInt(Number(totalFloors)));
      const ext = getTowerExtData();
      ext[newId.toString()] = { societyId: Number(societyId) };
      setTowerExtData(ext);
      toast.success("Tower added successfully");
      setOpen(false);
      setName("");
      setTotalFloors("");
      setSocietyId(defaultSocietyId.toString());
      onSuccess();
    } catch {
      toast.error("Failed to add tower");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 font-body"
          data-ocid="properties.tower.open_modal_button"
        >
          <Plus className="w-4 h-4" /> Add Tower
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="properties.tower.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Tower</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {canSelectSociety && societies.length > 0 && (
            <div className="space-y-1.5">
              <Label className="font-body">Society</Label>
              <Select value={societyId} onValueChange={setSocietyId}>
                <SelectTrigger
                  className="font-body"
                  data-ocid="properties.tower.select"
                >
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
          <div className="space-y-1.5">
            <Label className="font-body">Tower Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tower A"
              className="font-body"
              data-ocid="properties.tower.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body">Total Floors</Label>
            <Input
              type="number"
              value={totalFloors}
              onChange={(e) => setTotalFloors(e.target.value)}
              placeholder="e.g. 12"
              className="font-body"
            />
          </div>
          <Button
            className="w-full font-body"
            onClick={handleCreate}
            disabled={!name || !totalFloors || !societyId || saving || !actor}
            data-ocid="properties.tower.submit_button"
          >
            {saving ? "Creating..." : "Create Tower"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Tower Dialog ────────────────────────────────────────────────────────

function EditTowerDialog({
  tower,
  societies,
  canSelectSociety,
  onSuccess,
}: {
  tower: TowerExt;
  societies: Society[];
  canSelectSociety: boolean;
  onSuccess: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tower.name);
  const [totalFloors, setTotalFloors] = useState(tower.totalFloors.toString());
  const [societyId, setSocietyId] = useState(tower.societyId.toString());
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setName(tower.name);
    setTotalFloors(tower.totalFloors.toString());
    setSocietyId(tower.societyId.toString());
    setOpen(true);
  };

  const handleSave = async () => {
    if (!actor || !name || !totalFloors || !societyId) return;
    setSaving(true);
    try {
      await actor.updateTower(
        BigInt(tower.id),
        name,
        BigInt(Number(totalFloors)),
      );
      // update societyId in localStorage extended data
      const ext = getTowerExtData();
      ext[tower.id.toString()] = { societyId: Number(societyId) };
      setTowerExtData(ext);
      toast.success("Tower updated successfully");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Failed to update tower");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-7 w-7"
        style={{ color: "oklch(0.52 0.18 243)" }}
        onClick={handleOpen}
        data-ocid="properties.tower.edit_button"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="properties.tower.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Tower</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {canSelectSociety && societies.length > 0 && (
              <div className="space-y-1.5">
                <Label className="font-body">Society</Label>
                <Select value={societyId} onValueChange={setSocietyId}>
                  <SelectTrigger
                    className="font-body"
                    data-ocid="properties.tower.select"
                  >
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
            <div className="space-y-1.5">
              <Label className="font-body">Tower Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tower A"
                className="font-body"
                data-ocid="properties.tower.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Total Floors</Label>
              <Input
                type="number"
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                placeholder="e.g. 12"
                className="font-body"
              />
            </div>
            <Button
              className="w-full font-body"
              onClick={handleSave}
              disabled={!name || !totalFloors || !societyId || saving || !actor}
              data-ocid="properties.tower.save_button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add Unit Dialog ──────────────────────────────────────────────────────────

function AddUnitDialog({
  towers,
  onSuccess,
}: {
  towers: TowerExt[];
  onSuccess: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [towerId, setTowerId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isOccupied, setIsOccupied] = useState("true");
  const [saving, setSaving] = useState(false);

  // Extended unit fields
  const [area, setArea] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [unitType, setUnitType] = useState("");

  // Breakdown
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

  const resetForm = () => {
    setTowerId("");
    setUnitNumber("");
    setFloor("");
    setOwnerName("");
    setIsOccupied("true");
    setArea("");
    setOwnershipType("");
    setPhone("");
    setEmail("");
    setMemberCount("");
    setUnitType("");
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

  const handleCreate = async () => {
    if (
      !actor ||
      !towerId ||
      !unitNumber ||
      !floor ||
      !ownerName ||
      totalMaintenance === 0
    )
      return;
    setSaving(true);
    try {
      const backendBreakdown = {
        serviceCharges: BigInt(Number(serviceCharges) || 0),
        nonOccupancyCharges: BigInt(Number(nonOccupancyCharges) || 0),
        liftMaintenance: BigInt(Number(liftMaintenance) || 0),
        parkingCharges: BigInt(Number(parkingCharges) || 0),
        sinkingFund: BigInt(Number(sinkingFund) || 0),
        otherCharges: BigInt(Number(otherCharges) || 0),
        houseTax: BigInt(Number(houseTax) || 0),
        repairMaintenance: BigInt(Number(repairMaintenance) || 0),
        interest: BigInt(Number(interest) || 0),
      };

      await actor.createUnit(
        BigInt(Number(towerId)),
        unitNumber,
        BigInt(Number(floor)),
        ownerName,
        null,
        isOccupied === "true",
        BigInt(grandTotal),
        area ? BigInt(Number(area)) : null,
        unitType || null,
        ownershipType || null,
        phone || null,
        email || null,
        memberCount ? BigInt(Number(memberCount)) : null,
        backendBreakdown,
        BigInt(Number(previousDue) || 0),
      );

      toast.success("Unit added successfully");
      setOpen(false);
      resetForm();
      onSuccess();
    } catch {
      toast.error("Failed to add unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 font-body"
          data-ocid="properties.unit.open_modal_button"
        >
          <Plus className="w-4 h-4" /> Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        data-ocid="properties.unit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Add New Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Tower</Label>
              <Select value={towerId} onValueChange={setTowerId}>
                <SelectTrigger
                  className="font-body"
                  data-ocid="properties.unit.select"
                >
                  <SelectValue placeholder="Select tower" />
                </SelectTrigger>
                <SelectContent>
                  {towers.map((t) => (
                    <SelectItem
                      key={t.id.toString()}
                      value={t.id.toString()}
                      className="font-body"
                    >
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Unit Number</Label>
              <Input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. A-101"
                className="font-body"
                data-ocid="properties.unit.input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Floor</Label>
              <Input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 1"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Occupancy Status</Label>
              <Select value={isOccupied} onValueChange={setIsOccupied}>
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="font-body">
                    Occupied
                  </SelectItem>
                  <SelectItem value="false" className="font-body">
                    Vacant
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body">Owner Name</Label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="font-body"
            />
          </div>

          {/* Extended Unit Fields */}
          <Separator />
          <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
            Unit Details
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Area (Sqft)</Label>
              <Input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 1200"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Unit Type</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "1RK",
                    "Studio",
                    "1BHK",
                    "2BHK",
                    "3BHK",
                    "4BHK",
                    "Penthouse",
                    "Duplex",
                    "Other",
                  ].map((t) => (
                    <SelectItem key={t} value={t} className="font-body">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Ownership Type</Label>
              <Select value={ownershipType} onValueChange={setOwnershipType}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Owner", "Tenant", "Co-owner", "Sub-tenant"].map((t) => (
                    <SelectItem key={t} value={t} className="font-body">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Member Count</Label>
              <Input
                type="number"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                placeholder="e.g. 4"
                className="font-body"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@email.com"
                className="font-body"
              />
            </div>
          </div>

          <MaintenanceBreakdownFields
            serviceCharges={serviceCharges}
            setServiceCharges={setServiceCharges}
            nonOccupancyCharges={nonOccupancyCharges}
            setWaterCharges={setWaterCharges}
            liftMaintenance={liftMaintenance}
            setLiftMaintenance={setLiftMaintenance}
            parkingCharges={parkingCharges}
            setParkingCharges={setParkingCharges}
            sinkingFund={sinkingFund}
            setSinkingFund={setSinkingFund}
            otherCharges={otherCharges}
            setOtherCharges={setOtherCharges}
            houseTax={houseTax}
            setHouseTax={setHouseTax}
            repairMaintenance={repairMaintenance}
            setRepairMaintenance={setRepairMaintenance}
            interest={interest}
            setInterest={setInterest}
            previousDue={previousDue}
            setPreviousDue={setPreviousDue}
          />
          <Button
            className="w-full font-body"
            onClick={handleCreate}
            disabled={
              !towerId ||
              !unitNumber ||
              !floor ||
              !ownerName ||
              totalMaintenance === 0 ||
              saving ||
              !actor
            }
            data-ocid="properties.unit.submit_button"
          >
            {saving ? "Creating..." : "Create Unit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Unit Dialog ─────────────────────────────────────────────────────────

function EditUnitDialog({
  unit,
  towers,
  onSuccess,
}: {
  unit: UnitExt;
  towers: TowerExt[];
  onSuccess: () => void;
}) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [towerId, setTowerId] = useState(unit.towerId.toString());
  const [unitNumber, setUnitNumber] = useState(unit.unitNumber);
  const [floor, setFloor] = useState(unit.floor.toString());
  const [ownerName, setOwnerName] = useState(unit.ownerName);
  const [isOccupied, setIsOccupied] = useState(
    unit.isOccupied ? "true" : "false",
  );
  const [saving, setSaving] = useState(false);

  // Extended unit fields
  const [area, setArea] = useState((unit.area ?? "").toString());
  const [ownershipType, setOwnershipType] = useState(unit.ownershipType ?? "");
  const [phone, setPhone] = useState(unit.phone ?? "");
  const [email, setEmail] = useState(unit.email ?? "");
  const [memberCount, setMemberCount] = useState(
    (unit.memberCount ?? "").toString(),
  );
  const [unitType, setUnitType] = useState(unit.unitType ?? "");

  // Breakdown - pre-fill from existing breakdown if available
  const bd = unit.maintenanceBreakdown;
  const [serviceCharges, setServiceCharges] = useState(
    bd ? bd.serviceCharges.toString() : unit.monthlyMaintenance.toString(),
  );
  const [nonOccupancyCharges, setWaterCharges] = useState(
    bd ? bd.nonOccupancyCharges.toString() : "0",
  );
  const [liftMaintenance, setLiftMaintenance] = useState(
    bd ? bd.liftMaintenance.toString() : "0",
  );
  const [parkingCharges, setParkingCharges] = useState(
    bd ? bd.parkingCharges.toString() : "0",
  );
  const [sinkingFund, setSinkingFund] = useState(
    bd ? bd.sinkingFund.toString() : "0",
  );
  const [otherCharges, setOtherCharges] = useState(
    bd ? bd.otherCharges.toString() : "0",
  );
  const [houseTax, setHouseTax] = useState(
    bd ? (bd.houseTax ?? 0).toString() : "0",
  );
  const [repairMaintenance, setRepairMaintenance] = useState(
    bd ? (bd.repairMaintenance ?? 0).toString() : "0",
  );
  const [interest, setInterest] = useState(
    bd ? (bd.interest ?? 0).toString() : "0",
  );
  const [previousDue, setPreviousDue] = useState(
    (unit.previousDue ?? 0).toString(),
  );

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

  const handleOpen = () => {
    setTowerId(unit.towerId.toString());
    setUnitNumber(unit.unitNumber);
    setFloor(unit.floor.toString());
    setOwnerName(unit.ownerName);
    setIsOccupied(unit.isOccupied ? "true" : "false");
    setArea((unit.area ?? "").toString());
    setOwnershipType(unit.ownershipType ?? "");
    setPhone(unit.phone ?? "");
    setEmail(unit.email ?? "");
    setMemberCount((unit.memberCount ?? "").toString());
    setUnitType(unit.unitType ?? "");
    const b = unit.maintenanceBreakdown;
    setServiceCharges(
      b ? b.serviceCharges.toString() : unit.monthlyMaintenance.toString(),
    );
    setWaterCharges(b ? b.nonOccupancyCharges.toString() : "0");
    setLiftMaintenance(b ? b.liftMaintenance.toString() : "0");
    setParkingCharges(b ? b.parkingCharges.toString() : "0");
    setSinkingFund(b ? b.sinkingFund.toString() : "0");
    setOtherCharges(b ? b.otherCharges.toString() : "0");
    setHouseTax(b ? (b.houseTax ?? 0).toString() : "0");
    setRepairMaintenance(b ? (b.repairMaintenance ?? 0).toString() : "0");
    setInterest(b ? (b.interest ?? 0).toString() : "0");
    setPreviousDue((unit.previousDue ?? 0).toString());
    setOpen(true);
  };

  const handleSave = async () => {
    if (
      !actor ||
      !towerId ||
      !unitNumber ||
      !floor ||
      !ownerName ||
      totalMaintenance === 0
    )
      return;
    setSaving(true);
    try {
      const backendBreakdown = {
        serviceCharges: BigInt(Number(serviceCharges) || 0),
        nonOccupancyCharges: BigInt(Number(nonOccupancyCharges) || 0),
        liftMaintenance: BigInt(Number(liftMaintenance) || 0),
        parkingCharges: BigInt(Number(parkingCharges) || 0),
        sinkingFund: BigInt(Number(sinkingFund) || 0),
        otherCharges: BigInt(Number(otherCharges) || 0),
        houseTax: BigInt(Number(houseTax) || 0),
        repairMaintenance: BigInt(Number(repairMaintenance) || 0),
        interest: BigInt(Number(interest) || 0),
      };

      await actor.updateUnit(
        BigInt(unit.id),
        BigInt(Number(towerId)),
        unitNumber,
        BigInt(Number(floor)),
        ownerName,
        null,
        isOccupied === "true",
        BigInt(grandTotal),
        area ? BigInt(Number(area)) : null,
        unitType || null,
        ownershipType || null,
        phone || null,
        email || null,
        memberCount ? BigInt(Number(memberCount)) : null,
        backendBreakdown,
        BigInt(Number(previousDue) || 0),
      );

      toast.success("Unit updated successfully");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Failed to update unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        style={{ color: "oklch(0.52 0.18 243)" }}
        onClick={handleOpen}
        data-ocid="properties.unit.edit_button"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          data-ocid="properties.unit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Edit Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">Tower</Label>
                <Select value={towerId} onValueChange={setTowerId}>
                  <SelectTrigger
                    className="font-body"
                    data-ocid="properties.unit.select"
                  >
                    <SelectValue placeholder="Select tower" />
                  </SelectTrigger>
                  <SelectContent>
                    {towers.map((t) => (
                      <SelectItem
                        key={t.id.toString()}
                        value={t.id.toString()}
                        className="font-body"
                      >
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Unit Number</Label>
                <Input
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. A-101"
                  className="font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">Floor</Label>
                <Input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 1"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Occupancy Status</Label>
                <Select value={isOccupied} onValueChange={setIsOccupied}>
                  <SelectTrigger className="font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="font-body">
                      Occupied
                    </SelectItem>
                    <SelectItem value="false" className="font-body">
                      Vacant
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Owner Name</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="font-body"
              />
            </div>

            {/* Extended Unit Fields */}
            <Separator />
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
              Unit Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">Area (Sqft)</Label>
                <Input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. 1200"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Unit Type</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "1RK",
                      "Studio",
                      "1BHK",
                      "2BHK",
                      "3BHK",
                      "4BHK",
                      "Penthouse",
                      "Duplex",
                      "Other",
                    ].map((t) => (
                      <SelectItem key={t} value={t} className="font-body">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">Ownership Type</Label>
                <Select value={ownershipType} onValueChange={setOwnershipType}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Owner", "Tenant", "Co-owner", "Sub-tenant"].map((t) => (
                      <SelectItem key={t} value={t} className="font-body">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Member Count</Label>
                <Input
                  type="number"
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                  placeholder="e.g. 4"
                  className="font-body"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-body">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="font-body"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@email.com"
                  className="font-body"
                />
              </div>
            </div>

            <MaintenanceBreakdownFields
              serviceCharges={serviceCharges}
              setServiceCharges={setServiceCharges}
              nonOccupancyCharges={nonOccupancyCharges}
              setWaterCharges={setWaterCharges}
              liftMaintenance={liftMaintenance}
              setLiftMaintenance={setLiftMaintenance}
              parkingCharges={parkingCharges}
              setParkingCharges={setParkingCharges}
              sinkingFund={sinkingFund}
              setSinkingFund={setSinkingFund}
              otherCharges={otherCharges}
              setOtherCharges={setOtherCharges}
              houseTax={houseTax}
              setHouseTax={setHouseTax}
              repairMaintenance={repairMaintenance}
              setRepairMaintenance={setRepairMaintenance}
              interest={interest}
              setInterest={setInterest}
              previousDue={previousDue}
              setPreviousDue={setPreviousDue}
            />
            <Button
              className="w-full font-body"
              onClick={handleSave}
              disabled={
                !towerId ||
                !unitNumber ||
                !floor ||
                !ownerName ||
                totalMaintenance === 0 ||
                saving ||
                !actor
              }
              data-ocid="properties.unit.save_button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function PropertiesSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="flex justify-end mb-4">
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-14 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Properties Component ────────────────────────────────────────────────

export default function Properties({
  role,
  societyId: filterSocietyId,
}: { role?: AppRole; societyId?: number | null }) {
  const { actor, isFetching } = useActor();
  const store = useSocietyStore();

  const [towers, setTowers] = useState<TowerExt[]>([]);
  const [units, setUnits] = useState<UnitExt[]>([]);
  const [loading, setLoading] = useState(true);

  const societies = store.getSocieties();
  const activeSocietyId = filterSocietyId ?? store.getActiveSocietyId();

  // Only committee roles can select society
  const isCommitteeRole =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";
  const canSelectSociety = isCommitteeRole ? societies.length > 1 : false;

  const getSocietyName = (sid: number) =>
    societies.find((s) => s.id === sid)?.name ?? "—";

  const loadData = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [backendTowers, backendUnits] = await Promise.all([
        actor.getTowers(),
        actor.getUnits(),
      ]);

      const towerExt = getTowerExtData();

      const mergedTowers = mergeTowers(
        backendTowers,
        towerExt,
        activeSocietyId,
      );
      const mergedUnits = mergeUnits(backendUnits, towerExt, activeSocietyId);

      // Filter by societyId when provided
      const filteredTowers =
        filterSocietyId != null
          ? mergedTowers.filter((t) => t.societyId === filterSocietyId)
          : mergedTowers;
      const filteredUnits =
        filterSocietyId != null
          ? mergedUnits.filter((u) => u.societyId === filterSocietyId)
          : mergedUnits;

      setTowers(filteredTowers);
      setUnits(filteredUnits);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [actor, activeSocietyId, filterSocietyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteTower = async (id: number) => {
    if (!actor) return;
    try {
      await actor.deleteTower(BigInt(id));
      // Remove from localStorage extended data
      const ext = getTowerExtData();
      delete ext[id.toString()];
      setTowerExtData(ext);
      toast.success("Tower deleted");
      loadData();
    } catch {
      toast.error("Failed to delete tower");
    }
  };

  const deleteUnit = async (id: number) => {
    if (!actor) return;
    try {
      await actor.deleteUnit(BigInt(id));
      toast.success("Unit deleted");
      loadData();
    } catch {
      toast.error("Failed to delete unit");
    }
  };

  const getUnitsForTower = (towerId: number) =>
    units.filter((u) => u.towerId === towerId);

  const getTowerName = (towerId: number) =>
    towers.find((t) => t.id === towerId)?.name ?? "—";

  // Show skeleton while actor is loading or data is being fetched
  if (isFetching || (loading && towers.length === 0 && units.length === 0)) {
    return <PropertiesSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <Tabs defaultValue="towers">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="font-body">
            <TabsTrigger
              value="towers"
              className="gap-2"
              data-ocid="properties.towers.tab"
            >
              <Building2 className="w-3.5 h-3.5" /> Towers ({towers.length})
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="gap-2"
              data-ocid="properties.units.tab"
            >
              <Home className="w-3.5 h-3.5" /> Units ({units.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="towers" className="mt-0">
          <div className="flex justify-end mb-4">
            <AddTowerDialog
              societies={societies}
              defaultSocietyId={activeSocietyId}
              canSelectSociety={canSelectSociety}
              onSuccess={loadData}
            />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="py-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : towers.length === 0 ? (
            <Card data-ocid="properties.towers.empty_state">
              <CardContent className="py-16 text-center">
                <Building2
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.75 0.015 245)" }}
                />
                <p className="font-display font-semibold text-foreground mb-1">
                  No towers yet
                </p>
                <p className="text-sm font-body text-muted-foreground">
                  Add your first tower to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {towers.map((tower, i) => {
                const towerUnits = getUnitsForTower(tower.id);
                const occupied = towerUnits.filter((u) => u.isOccupied).length;
                return (
                  <motion.div
                    key={tower.id.toString()}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    data-ocid={`properties.towers.item.${i + 1}`}
                  >
                    <Card className="group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{
                                background: "oklch(0.92 0.06 240)",
                              }}
                            >
                              <Building2
                                className="w-5 h-5"
                                style={{ color: "oklch(0.52 0.18 243)" }}
                              />
                            </div>
                            <div>
                              <CardTitle className="font-display text-base">
                                {tower.name}
                              </CardTitle>
                              {societies.length > 1 && (
                                <p
                                  className="text-xs font-body mt-0.5"
                                  style={{ color: "oklch(0.52 0.18 243)" }}
                                >
                                  {getSocietyName(tower.societyId)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <EditTowerDialog
                              tower={tower}
                              societies={societies}
                              canSelectSociety={canSelectSociety}
                              onSuccess={loadData}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 h-7 w-7 text-destructive"
                              onClick={() => deleteTower(tower.id)}
                              data-ocid="properties.tower.delete_button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div
                            className="rounded-lg p-2"
                            style={{ background: "oklch(0.94 0.008 240)" }}
                          >
                            <p className="font-display font-bold text-lg">
                              {tower.totalFloors}
                            </p>
                            <p className="text-xs font-body text-muted-foreground">
                              Floors
                            </p>
                          </div>
                          <div
                            className="rounded-lg p-2"
                            style={{ background: "oklch(0.94 0.008 240)" }}
                          >
                            <p className="font-display font-bold text-lg">
                              {towerUnits.length}
                            </p>
                            <p className="text-xs font-body text-muted-foreground">
                              Units
                            </p>
                          </div>
                          <div
                            className="rounded-lg p-2"
                            style={{ background: "oklch(0.94 0.008 240)" }}
                          >
                            <p className="font-display font-bold text-lg">
                              {occupied}
                            </p>
                            <p className="text-xs font-body text-muted-foreground">
                              Occupied
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="mt-0">
          <div className="flex justify-end mb-4">
            <AddUnitDialog towers={towers} onSuccess={loadData} />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table data-ocid="properties.units.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body font-semibold">
                      Unit No.
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Tower
                    </TableHead>
                    {societies.length > 1 && (
                      <TableHead className="font-body font-semibold">
                        Society
                      </TableHead>
                    )}
                    <TableHead className="font-body font-semibold">
                      Floor
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Owner
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Maintenance
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="font-body font-semibold w-20">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={societies.length > 1 ? 8 : 7}
                        className="py-8"
                      >
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : units.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={societies.length > 1 ? 8 : 7}
                        className="text-center py-12 font-body text-muted-foreground"
                        data-ocid="properties.units.empty_state"
                      >
                        No units found. Add a tower and then add units.
                      </TableCell>
                    </TableRow>
                  ) : (
                    units.map((unit, idx) => {
                      const tower = towers.find((t) => t.id === unit.towerId);
                      return (
                        <TableRow
                          key={unit.id.toString()}
                          data-ocid={`properties.units.row.${idx + 1}`}
                        >
                          <TableCell className="font-display font-semibold">
                            {unit.unitNumber}
                          </TableCell>
                          <TableCell className="font-body">
                            {getTowerName(unit.towerId)}
                          </TableCell>
                          {societies.length > 1 && (
                            <TableCell
                              className="font-body text-xs"
                              style={{ color: "oklch(0.52 0.18 243)" }}
                            >
                              {tower ? getSocietyName(tower.societyId) : "—"}
                            </TableCell>
                          )}
                          <TableCell className="font-body">
                            {unit.floor}
                          </TableCell>
                          <TableCell className="font-body">
                            {unit.ownerName || "—"}
                          </TableCell>
                          <TableCell className="font-body font-medium">
                            ₹{unit.monthlyMaintenance.toLocaleString("en-IN")}
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
                                      border: "1px solid oklch(0.84 0.02 245)",
                                    }
                              }
                            >
                              {unit.isOccupied ? "Occupied" : "Vacant"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <EditUnitDialog
                                unit={unit}
                                towers={towers}
                                onSuccess={loadData}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteUnit(unit.id)}
                                data-ocid="properties.unit.delete_button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

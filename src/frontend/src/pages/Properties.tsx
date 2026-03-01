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
import { Building2, Home, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Tower } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

function AddTowerDialog({ onSuccess }: { onSuccess: () => void }) {
  const store = useSocietyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalFloors, setTotalFloors] = useState("");

  const handleCreate = () => {
    if (!name || !totalFloors) return;
    store.createTower(name, Number(totalFloors));
    toast.success("Tower added successfully");
    setOpen(false);
    setName("");
    setTotalFloors("");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-body">
          <Plus className="w-4 h-4" /> Add Tower
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add New Tower</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body">Tower Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tower A"
              className="font-body"
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
            disabled={!name || !totalFloors}
          >
            Create Tower
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddUnitDialog({
  towers,
  onSuccess,
}: {
  towers: Tower[];
  onSuccess: () => void;
}) {
  const store = useSocietyStore();
  const [open, setOpen] = useState(false);
  const [towerId, setTowerId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isOccupied, setIsOccupied] = useState("true");
  const [monthlyMaintenance, setMonthlyMaintenance] = useState("");

  const handleCreate = () => {
    if (!towerId || !unitNumber || !floor || !ownerName || !monthlyMaintenance)
      return;
    store.createUnit(
      Number(towerId),
      unitNumber,
      Number(floor),
      ownerName,
      isOccupied === "true",
      Number(monthlyMaintenance),
    );
    toast.success("Unit added successfully");
    setOpen(false);
    setTowerId("");
    setUnitNumber("");
    setFloor("");
    setOwnerName("");
    setIsOccupied("true");
    setMonthlyMaintenance("");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 font-body">
          <Plus className="w-4 h-4" /> Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add New Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Tower</Label>
              <Select value={towerId} onValueChange={setTowerId}>
                <SelectTrigger className="font-body">
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
              <Label className="font-body">Monthly Maintenance (₹)</Label>
              <Input
                type="number"
                value={monthlyMaintenance}
                onChange={(e) => setMonthlyMaintenance(e.target.value)}
                placeholder="e.g. 2500"
                className="font-body"
              />
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
          <Button
            className="w-full font-body"
            onClick={handleCreate}
            disabled={
              !towerId ||
              !unitNumber ||
              !floor ||
              !ownerName ||
              !monthlyMaintenance
            }
          >
            Create Unit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Properties() {
  const store = useSocietyStore();
  // version counter to force re-render after mutations
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const towers = store.getTowers();
  const units = store.getUnits();

  const deleteTower = (id: number) => {
    store.deleteTower(id);
    toast.success("Tower deleted");
    refresh();
  };

  const deleteUnit = (id: number) => {
    store.deleteUnit(id);
    toast.success("Unit deleted");
    refresh();
  };

  const getUnitsForTower = (towerId: number) =>
    units.filter((u) => u.towerId === towerId);

  const getTowerName = (towerId: number) =>
    towers.find((t) => t.id === towerId)?.name ?? "—";

  return (
    <div className="space-y-6 max-w-7xl">
      <Tabs defaultValue="towers">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="font-body">
            <TabsTrigger value="towers" className="gap-2">
              <Building2 className="w-3.5 h-3.5" /> Towers ({towers.length})
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-2">
              <Home className="w-3.5 h-3.5" /> Units ({units.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="towers" className="mt-0">
          <div className="flex justify-end mb-4">
            <AddTowerDialog onSuccess={refresh} />
          </div>
          {towers.length === 0 ? (
            <Card>
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
                            <CardTitle className="font-display text-base">
                              {tower.name}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 text-destructive"
                            onClick={() => deleteTower(tower.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
            <AddUnitDialog towers={towers} onSuccess={refresh} />
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body font-semibold">
                      Unit No.
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Tower
                    </TableHead>
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
                    <TableHead className="font-body font-semibold w-16">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 font-body text-muted-foreground"
                      >
                        No units found. Add a tower and then add units.
                      </TableCell>
                    </TableRow>
                  ) : (
                    units.map((unit) => (
                      <TableRow key={unit.id.toString()}>
                        <TableCell className="font-display font-semibold">
                          {unit.unitNumber}
                        </TableCell>
                        <TableCell className="font-body">
                          {getTowerName(unit.towerId)}
                        </TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteUnit(unit.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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

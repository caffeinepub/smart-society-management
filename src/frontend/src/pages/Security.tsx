import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  CheckCircle2,
  Clock,
  LogOut,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import type { AppRole } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const VEHICLE_LOG_KEY = "smart_society_vehicle_log";

interface VehicleLogEntry {
  id: number;
  vehicleNo: string;
  type: string;
  owner: string;
  unit: string;
  entryTime: string;
  exitTime: string;
  status: string;
}

function loadVehicleLog(): VehicleLogEntry[] {
  try {
    const raw = localStorage.getItem(VEHICLE_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveVehicleLog(log: VehicleLogEntry[]) {
  localStorage.setItem(VEHICLE_LOG_KEY, JSON.stringify(log));
}

const isAdminRole = (role: AppRole) =>
  role === "SuperAdmin" ||
  role === "Admin" ||
  role === "Chairman" ||
  role === "Secretary" ||
  role === "Treasurer";

interface SecurityProps {
  role: AppRole;
  societyId?: number | null;
}

export default function Security({ role, societyId }: SecurityProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  const [vehicleLog, setVehicleLog] = useState<VehicleLogEntry[]>(() =>
    loadVehicleLog(),
  );

  const canDeleteAll = isAdminRole(role);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hostUnit, setHostUnit] = useState("");

  const visitors = store.getVisitors(societyId);
  const units = store.getUnits(societyId);

  const handleRegister = () => {
    if (!visitorName || !visitorPhone || !purpose || !hostUnit) return;
    store.registerVisitor(
      visitorName,
      visitorPhone,
      purpose,
      hostUnit,
      0,
      new Date().toISOString(),
      societyId ?? undefined,
    );
    toast.success("Visitor registered successfully");
    setRegisterOpen(false);
    setVisitorName("");
    setVisitorPhone("");
    setPurpose("");
    setHostUnit("");
    refresh();
  };

  const handleCheckOut = (id: number) => {
    store.checkOutVisitor(id, new Date().toISOString());
    toast.success("Visitor checked out");
    refresh();
  };

  const activeCount = visitors.filter((v) => v.status === "Active").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Visitors",
            value: visitors.length,
            icon: <UserCheck className="w-4 h-4" />,
            color: "oklch(0.52 0.18 243)",
          },
          {
            label: "Active Inside",
            value: activeCount,
            icon: <Clock className="w-4 h-4" />,
            color: "oklch(0.58 0.16 155)",
          },
          {
            label: "Checked Out",
            value: visitors.length - activeCount,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: "oklch(0.65 0.15 195)",
          },
          {
            label: "Vehicles Inside",
            value: vehicleLog.filter((v) => v.status === "Inside").length,
            icon: <Car className="w-4 h-4" />,
            color: "oklch(0.72 0.12 95)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}18` }}
                >
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <p className="font-display font-bold text-xl leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="visitors">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="font-body">
            <TabsTrigger value="visitors" className="gap-2">
              <UserCheck className="w-3.5 h-3.5" /> Visitor Log
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="w-3.5 h-3.5" /> Vehicle Log
            </TabsTrigger>
          </TabsList>

          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 font-body">
                <Plus className="w-4 h-4" /> Register Visitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Register Visitor
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-body">Visitor Name</Label>
                    <Input
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Full name"
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Phone Number</Label>
                    <Input
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="font-body"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Purpose of Visit</Label>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Personal visit, Delivery, Maintenance"
                    className="font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Host Unit</Label>
                  <Input
                    value={hostUnit}
                    onChange={(e) => setHostUnit(e.target.value)}
                    placeholder="e.g. A-401"
                    list="units-list"
                    className="font-body"
                  />
                  <datalist id="units-list">
                    {units.map((u) => (
                      <option key={u.id.toString()} value={u.unitNumber} />
                    ))}
                  </datalist>
                </div>
                <Button
                  className="w-full font-body"
                  onClick={handleRegister}
                  disabled={
                    !visitorName || !visitorPhone || !purpose || !hostUnit
                  }
                >
                  Register &amp; Check In
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Visitor Log */}
        <TabsContent value="visitors" className="mt-0">
          {canDeleteAll && visitors.length > 0 && (
            <div className="flex justify-end mb-3">
              <DeleteAllDialog
                label="Delete All Visitors"
                description="Are you sure you want to delete all visitor records? This action cannot be undone."
                onConfirm={() => {
                  store.deleteAllVisitors(societyId);
                  toast.success("All visitor records deleted");
                  refresh();
                }}
                ocidScope="visitors"
              />
            </div>
          )}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body font-semibold">
                      Visitor
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Phone
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Purpose
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Host Unit
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Check In
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Check Out
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
                  {visitors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 font-body text-muted-foreground"
                      >
                        No visitors logged yet. Register the first visitor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visitors.map((visitor) => {
                      const isActive = visitor.status === "Active";
                      const checkInDate = new Date(visitor.checkInTime);
                      return (
                        <TableRow
                          key={visitor.id.toString()}
                          className={isActive ? "bg-emerald-50/50" : ""}
                        >
                          <TableCell className="font-display font-semibold">
                            {visitor.name}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {visitor.phone}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {visitor.purpose}
                          </TableCell>
                          <TableCell className="font-display font-medium">
                            {visitor.hostUnit}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {checkInDate.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="font-body text-sm">
                            {visitor.checkOutTime
                              ? new Date(
                                  visitor.checkOutTime,
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="font-body text-xs"
                              style={
                                isActive
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
                              {isActive ? "Inside" : "Left"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-body h-7 gap-1"
                                onClick={() => handleCheckOut(visitor.id)}
                              >
                                <LogOut className="w-3 h-3" />
                                Check Out
                              </Button>
                            )}
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

        {/* Vehicle Log */}
        <TabsContent value="vehicles" className="mt-0">
          {canDeleteAll && vehicleLog.length > 0 && (
            <div className="flex justify-end mb-3">
              <DeleteAllDialog
                label="Delete All Vehicle Log"
                description="Are you sure you want to delete all vehicle log entries? This action cannot be undone."
                onConfirm={() => {
                  setVehicleLog([]);
                  saveVehicleLog([]);
                  toast.success("All vehicle log entries deleted");
                }}
                ocidScope="vehicle_log"
              />
            </div>
          )}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body font-semibold">
                      Vehicle No.
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Owner/Purpose
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Unit
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Entry
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Exit
                    </TableHead>
                    <TableHead className="font-body font-semibold">
                      Status
                    </TableHead>
                    {canDeleteAll && (
                      <TableHead className="font-body font-semibold">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleLog.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canDeleteAll ? 8 : 7}
                        className="text-center py-12 font-body text-muted-foreground"
                      >
                        No vehicle log entries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicleLog.map((v) => (
                      <TableRow
                        key={v.id}
                        className={v.status === "Inside" ? "bg-blue-50/50" : ""}
                      >
                        <TableCell className="font-display font-semibold text-sm">
                          {v.vehicleNo}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {v.type}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {v.owner}
                        </TableCell>
                        <TableCell className="font-display font-medium text-sm">
                          {v.unit}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {v.entryTime}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {v.exitTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs"
                            style={
                              v.status === "Inside"
                                ? {
                                    background: "oklch(0.92 0.06 240)",
                                    color: "oklch(0.35 0.15 243)",
                                    border: "1px solid oklch(0.84 0.1 240)",
                                  }
                                : {
                                    background: "oklch(0.92 0.015 245)",
                                    color: "oklch(0.45 0.03 248)",
                                    border: "1px solid oklch(0.84 0.02 245)",
                                  }
                            }
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                        {canDeleteAll && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              data-ocid="vehicle_log.delete_button"
                              onClick={() => {
                                const updated = vehicleLog.filter(
                                  (x) => x.id !== v.id,
                                );
                                setVehicleLog(updated);
                                saveVehicleLog(updated);
                                toast.success("Vehicle log entry deleted");
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
      </Tabs>
    </div>
  );
}

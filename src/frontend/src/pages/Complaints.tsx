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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "../components/RoleSelection";
import { useSocietyStore } from "../store/societyStore";

const complaintCategories = [
  "Plumbing",
  "Electrical",
  "Cleanliness",
  "Security",
  "Noise",
  "Parking",
  "Lift",
  "Other",
];

function getComplaintStatusStyle(status: string): React.CSSProperties {
  if (status === "Resolved")
    return {
      background: "oklch(0.9 0.08 155)",
      color: "oklch(0.3 0.1 155)",
      border: "1px solid oklch(0.82 0.1 155)",
    };
  if (status === "InProgress")
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

function getComplaintStatusIcon(status: string) {
  if (status === "Resolved") return <CheckCircle2 className="w-3 h-3" />;
  if (status === "InProgress") return <Clock className="w-3 h-3" />;
  return <AlertCircle className="w-3 h-3" />;
}

interface ComplaintsProps {
  role: AppRole;
}

export default function Complaints({ role }: ComplaintsProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const isAdmin = role === "SuperAdmin" || role === "Admin";

  // File complaint form
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("Plumbing");
  const [complaintUnit, setComplaintUnit] = useState("");
  const [complaintName, setComplaintName] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("Medium");

  // Status update form
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("InProgress");
  const [resolution, setResolution] = useState("");
  const [updateOpen, setUpdateOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  const allComplaints = store.getComplaints();

  const filtered = allComplaints.filter((c) => {
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchCat = filterCategory === "All" || c.category === filterCategory;
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.residentName.toLowerCase().includes(search.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCat && matchSearch;
  });

  const openCount = allComplaints.filter((c) => c.status === "Open").length;
  const inProgressCount = allComplaints.filter(
    (c) => c.status === "InProgress",
  ).length;
  const resolvedCount = allComplaints.filter(
    (c) => c.status === "Resolved",
  ).length;

  const handleCreateComplaint = () => {
    if (!complaintTitle || !complaintUnit || !complaintName) return;
    store.createComplaint(
      complaintTitle,
      complaintDesc,
      complaintCategory,
      complaintUnit,
      complaintName,
      complaintPriority,
      new Date().toISOString(),
    );
    toast.success("Complaint filed");
    setComplaintOpen(false);
    setComplaintTitle("");
    setComplaintDesc("");
    setComplaintUnit("");
    setComplaintName("");
    refresh();
  };

  const handleUpdateComplaint = () => {
    if (updateId === null) return;
    store.updateComplaintStatus(updateId, newStatus, resolution || null);
    toast.success("Complaint status updated");
    setUpdateOpen(false);
    setUpdateId(null);
    setResolution("");
    refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">Complaints</h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Resident complaints and issue tracking
          </p>
        </div>
        <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 font-body"
              style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" />
              File Complaint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <MessageSquare
                  className="w-5 h-5"
                  style={{ color: "oklch(0.52 0.18 243)" }}
                />
                File a Complaint
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="font-body">Title *</Label>
                <Input
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="font-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body">Category</Label>
                  <Select
                    value={complaintCategory}
                    onValueChange={setComplaintCategory}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintCategories.map((c) => (
                        <SelectItem key={c} value={c} className="font-body">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Priority</Label>
                  <Select
                    value={complaintPriority}
                    onValueChange={setComplaintPriority}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High", "Critical"].map((p) => (
                        <SelectItem key={p} value={p} className="font-body">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body">Your Name *</Label>
                  <Input
                    value={complaintName}
                    onChange={(e) => setComplaintName(e.target.value)}
                    placeholder="Full name"
                    className="font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Unit Number *</Label>
                  <Input
                    value={complaintUnit}
                    onChange={(e) => setComplaintUnit(e.target.value)}
                    placeholder="e.g. A-301"
                    className="font-body"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body">Description</Label>
                <Textarea
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={3}
                  className="font-body"
                />
              </div>
              <Button
                className="w-full font-body"
                onClick={handleCreateComplaint}
                disabled={!complaintTitle || !complaintUnit || !complaintName}
                style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
              >
                Submit Complaint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Open",
            value: openCount,
            color: "oklch(0.55 0.2 25)",
            icon: AlertCircle,
            status: "Open",
          },
          {
            label: "In Progress",
            value: inProgressCount,
            color: "oklch(0.55 0.16 75)",
            icon: Clock,
            status: "InProgress",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            color: "oklch(0.45 0.18 155)",
            icon: CheckCircle2,
            status: "Resolved",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                setFilterStatus(
                  filterStatus === stat.status ? "All" : stat.status,
                )
              }
              style={
                filterStatus === stat.status
                  ? { outline: `2px solid ${stat.color}` }
                  : {}
              }
            >
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
                    Click to filter
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
              placeholder="Search title, name, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="font-body max-w-xs"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="font-body w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="font-body">
                  All Categories
                </SelectItem>
                {complaintCategories.map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="font-body w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="font-body">
                  All Status
                </SelectItem>
                {["Open", "InProgress", "Resolved", "Closed"].map((s) => (
                  <SelectItem key={s} value={s} className="font-body">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterStatus !== "All" || filterCategory !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setFilterStatus("All");
                  setFilterCategory("All");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <MessageSquare
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Complaint Records
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
                    Title
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Resident
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Unit
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Priority
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Date
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
                      {allComplaints.length === 0
                        ? "No complaints filed yet"
                        : "No complaints match the current filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filtered]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((c) => (
                      <TableRow key={c.id.toString()}>
                        <TableCell className="font-display font-semibold text-sm max-w-48">
                          <div className="truncate">{c.title}</div>
                          {c.resolution && (
                            <div className="text-xs font-body text-muted-foreground mt-0.5 truncate max-w-[180px]">
                              ✓ {c.resolution}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {c.category}
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {c.residentName}
                        </TableCell>
                        <TableCell className="font-display font-medium text-sm">
                          {c.unitNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-body text-xs"
                            style={
                              c.priority === "Critical" || c.priority === "High"
                                ? {
                                    background: "oklch(0.95 0.07 25)",
                                    color: "oklch(0.4 0.15 25)",
                                    border: "1px solid oklch(0.88 0.1 25)",
                                  }
                                : c.priority === "Medium"
                                  ? {
                                      background: "oklch(0.95 0.08 75)",
                                      color: "oklch(0.4 0.12 65)",
                                      border: "1px solid oklch(0.88 0.1 70)",
                                    }
                                  : {
                                      background: "oklch(0.92 0.015 245)",
                                      color: "oklch(0.45 0.03 248)",
                                    }
                            }
                          >
                            {c.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs gap-1"
                            style={getComplaintStatusStyle(c.status)}
                          >
                            {getComplaintStatusIcon(c.status)}
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-sm whitespace-nowrap text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {c.status !== "Resolved" &&
                              c.status !== "Closed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-body h-7"
                                  onClick={() => {
                                    setUpdateId(c.id);
                                    setNewStatus("InProgress");
                                    setResolution("");
                                    setUpdateOpen(true);
                                  }}
                                >
                                  Update
                                </Button>
                              )}
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

      {/* Update Complaint Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Update Complaint Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-body">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["InProgress", "Resolved", "Closed"].map((s) => (
                    <SelectItem key={s} value={s} className="font-body">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newStatus === "Resolved" && (
              <div className="space-y-1.5">
                <Label className="font-body">Resolution Note</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={3}
                  className="font-body"
                />
              </div>
            )}
            <Button
              className="w-full font-body"
              onClick={handleUpdateComplaint}
              style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

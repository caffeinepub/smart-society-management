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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Vote,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import { useAuth } from "../store/AuthContext";
import type { AppRole } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

interface CommunicationProps {
  role: AppRole;
  societyId?: number | null;
}

const noticeCategories = [
  "General",
  "Maintenance",
  "Emergency",
  "Event",
  "Financial",
  "Security",
];

function getNoticeCategoryStyle(cat: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    Emergency: {
      background: "oklch(0.95 0.07 25)",
      color: "oklch(0.4 0.15 25)",
      border: "1px solid oklch(0.88 0.1 25)",
    },
    Maintenance: {
      background: "oklch(0.95 0.08 75)",
      color: "oklch(0.4 0.12 65)",
      border: "1px solid oklch(0.88 0.1 70)",
    },
    Financial: {
      background: "oklch(0.9 0.08 155)",
      color: "oklch(0.3 0.1 155)",
      border: "1px solid oklch(0.82 0.1 155)",
    },
    Security: {
      background: "oklch(0.95 0.07 25)",
      color: "oklch(0.4 0.15 25)",
      border: "1px solid oklch(0.88 0.1 25)",
    },
    Event: {
      background: "oklch(0.92 0.06 280)",
      color: "oklch(0.35 0.15 275)",
      border: "1px solid oklch(0.84 0.1 278)",
    },
  };
  return (
    styles[cat] ?? {
      background: "oklch(0.92 0.06 240)",
      color: "oklch(0.35 0.15 243)",
      border: "1px solid oklch(0.84 0.1 240)",
    }
  );
}

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

export default function Communication({ role, societyId }: CommunicationProps) {
  const store = useSocietyStore();
  const { currentUser } = useAuth();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const isSuperAdminOrAdmin =
    currentUser?.role === "SuperAdmin" ||
    currentUser?.role === "Admin" ||
    role === "SuperAdmin" ||
    role === "Admin";

  const isAdmin =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  // --- Notices state ---
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("General");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [filterNoticeCategory, setFilterNoticeCategory] = useState("All");

  const allNotices = store.getNotices(societyId);
  const filteredNotices = allNotices.filter((n) => {
    const matchSearch =
      !noticeSearch ||
      n.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noticeSearch.toLowerCase());
    const matchCat =
      filterNoticeCategory === "All" || n.category === filterNoticeCategory;
    return matchSearch && matchCat;
  });

  const handleCreateNotice = () => {
    if (!noticeTitle || !noticeContent) return;
    store.createNotice(
      noticeTitle,
      noticeContent,
      noticeCategory,
      "Admin",
      new Date().toISOString(),
      societyId ?? undefined,
    );
    toast.success("Notice posted");
    setNoticeOpen(false);
    setNoticeTitle("");
    setNoticeContent("");
    refresh();
  };

  // --- Complaints state ---
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("Plumbing");
  const [complaintUnit, setComplaintUnit] = useState("");
  const [complaintName, setComplaintName] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("Medium");
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("InProgress");
  const [resolution, setResolution] = useState("");
  const [updateOpen, setUpdateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterComplaintCategory, setFilterComplaintCategory] = useState("All");
  const [complaintSearch, setComplaintSearch] = useState("");

  const allComplaints = store.getComplaints(societyId);
  const filteredComplaints = allComplaints.filter((c) => {
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchCat =
      filterComplaintCategory === "All" ||
      c.category === filterComplaintCategory;
    const matchSearch =
      !complaintSearch ||
      c.title.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.residentName.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(complaintSearch.toLowerCase());
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
      societyId ?? undefined,
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

  // --- Poll state ---
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const polls = store.getPolls(societyId);

  const handleCreatePoll = () => {
    const opts = pollOptions.filter((o) => o.trim());
    if (!pollQuestion || opts.length < 2) return;
    store.createPoll(
      pollQuestion,
      opts,
      "Admin",
      new Date().toISOString(),
      societyId ?? undefined,
    );
    toast.success("Poll created");
    setPollOpen(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    refresh();
  };

  const handleVote = (pollId: number, optionId: number) => {
    store.voteOnPoll(pollId, optionId);
    toast.success("Vote recorded");
    refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <Tabs defaultValue="notices">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList className="font-body">
            <TabsTrigger value="notices" className="gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Notices ({allNotices.length})
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Complaints (
              {allComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-1.5">
              <Vote className="w-3.5 h-3.5" /> Polls ({polls.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Notices */}
        <TabsContent value="notices" className="mt-0 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-xl font-bold">Notice Board</h2>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                Society announcements and important notices
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdminOrAdmin && allNotices.length > 0 && (
                  <DeleteAllDialog
                    label="Delete All Notices"
                    description="Are you sure you want to delete all notices? This action cannot be undone."
                    onConfirm={() => {
                      store.deleteAllNotices(societyId);
                      toast.success("All notices deleted");
                      refresh();
                    }}
                    ocidScope="notices"
                  />
                )}
                <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 font-body"
                      style={{
                        background: "oklch(0.52 0.18 243)",
                        color: "#fff",
                      }}
                    >
                      <Plus className="w-4 h-4" /> Post Notice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display flex items-center gap-2">
                        <Bell
                          className="w-5 h-5"
                          style={{ color: "oklch(0.52 0.18 243)" }}
                        />
                        Post New Notice
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="font-body">Title</Label>
                        <Input
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder="Notice title"
                          className="font-body"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Category</Label>
                        <Select
                          value={noticeCategory}
                          onValueChange={setNoticeCategory}
                        >
                          <SelectTrigger className="font-body">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {noticeCategories.map((c) => (
                              <SelectItem
                                key={c}
                                value={c}
                                className="font-body"
                              >
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-body">Content</Label>
                        <Textarea
                          value={noticeContent}
                          onChange={(e) => setNoticeContent(e.target.value)}
                          placeholder="Notice content..."
                          rows={4}
                          className="font-body"
                        />
                      </div>
                      <Button
                        className="w-full font-body"
                        onClick={handleCreateNotice}
                        disabled={!noticeTitle || !noticeContent}
                        style={{
                          background: "oklch(0.52 0.18 243)",
                          color: "#fff",
                        }}
                      >
                        Post Notice
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Notice category pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <Card className="flex-shrink-0">
              <CardContent className="p-3 flex items-center gap-2">
                <Bell
                  className="w-4 h-4"
                  style={{ color: "oklch(0.35 0.15 243)" }}
                />
                <span className="text-sm font-body font-medium">
                  {allNotices.length} total
                </span>
              </CardContent>
            </Card>
            {noticeCategories.map((cat) => {
              const count = allNotices.filter((n) => n.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  type="button"
                  key={cat}
                  className="px-3 py-1.5 rounded-full text-xs font-body cursor-pointer border-0"
                  style={{
                    ...getNoticeCategoryStyle(cat),
                    opacity: filterNoticeCategory === cat ? 1 : 0.7,
                  }}
                  onClick={() =>
                    setFilterNoticeCategory(
                      filterNoticeCategory === cat ? "All" : cat,
                    )
                  }
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Notice search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search notices..."
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    className="font-body pl-8"
                  />
                </div>
                <Select
                  value={filterNoticeCategory}
                  onValueChange={setFilterNoticeCategory}
                >
                  <SelectTrigger className="font-body w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All" className="font-body">
                      All Categories
                    </SelectItem>
                    {noticeCategories.map((c) => (
                      <SelectItem key={c} value={c} className="font-body">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterNoticeCategory !== "All" || noticeSearch) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-body text-xs"
                    onClick={() => {
                      setFilterNoticeCategory("All");
                      setNoticeSearch("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredNotices.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-display font-semibold">
                  {allNotices.length === 0
                    ? "No notices posted yet"
                    : "No notices match the filters"}
                </p>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  {isAdmin && allNotices.length === 0
                    ? 'Click "Post Notice" to inform residents'
                    : "Try adjusting your search or category filter"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...filteredNotices]
                .sort(
                  (a, b) =>
                    new Date(b.postedAt).getTime() -
                    new Date(a.postedAt).getTime(),
                )
                .map((notice, i) => (
                  <motion.div
                    key={notice.id.toString()}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            className="font-body text-xs flex-shrink-0"
                            style={getNoticeCategoryStyle(notice.category)}
                          >
                            {notice.category}
                          </Badge>
                          <Pin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        <CardTitle className="font-display text-base leading-snug mt-1">
                          {notice.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm font-body text-muted-foreground leading-relaxed line-clamp-3">
                          {notice.content}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs font-body text-muted-foreground">
                            By {notice.postedBy}
                          </span>
                          <span className="text-xs font-body text-muted-foreground">
                            {new Date(notice.postedAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints" className="mt-0 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-xl font-bold">Complaints</h2>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                Resident complaints and issue tracking
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isSuperAdminOrAdmin && allComplaints.length > 0 && (
                <DeleteAllDialog
                  label="Delete All Complaints"
                  description="Are you sure you want to delete all complaints? This action cannot be undone."
                  onConfirm={() => {
                    store.deleteAllComplaints(societyId);
                    toast.success("All complaints deleted");
                    refresh();
                  }}
                  ocidScope="complaints"
                />
              )}
              <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 font-body"
                    style={{
                      background: "oklch(0.52 0.18 243)",
                      color: "#fff",
                    }}
                  >
                    <Plus className="w-4 h-4" /> File Complaint
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
                              <SelectItem
                                key={c}
                                value={c}
                                className="font-body"
                              >
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
                              <SelectItem
                                key={p}
                                value={p}
                                className="font-body"
                              >
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
                      disabled={
                        !complaintTitle || !complaintUnit || !complaintName
                      }
                      style={{
                        background: "oklch(0.52 0.18 243)",
                        color: "#fff",
                      }}
                    >
                      Submit Complaint
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Complaint KPIs */}
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

          {/* Complaint Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Search title, name, unit..."
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  className="font-body max-w-xs"
                />
                <Select
                  value={filterComplaintCategory}
                  onValueChange={setFilterComplaintCategory}
                >
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
                {(filterStatus !== "All" ||
                  filterComplaintCategory !== "All" ||
                  complaintSearch) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-body text-xs"
                    onClick={() => {
                      setFilterStatus("All");
                      setFilterComplaintCategory("All");
                      setComplaintSearch("");
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
                  ({filteredComplaints.length})
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
                    {filteredComplaints.length === 0 ? (
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
                      [...filteredComplaints]
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
                                  c.priority === "Critical" ||
                                  c.priority === "High"
                                    ? {
                                        background: "oklch(0.95 0.07 25)",
                                        color: "oklch(0.4 0.15 25)",
                                        border: "1px solid oklch(0.88 0.1 25)",
                                      }
                                    : c.priority === "Medium"
                                      ? {
                                          background: "oklch(0.95 0.08 75)",
                                          color: "oklch(0.4 0.12 65)",
                                          border:
                                            "1px solid oklch(0.88 0.1 70)",
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
                              {new Date(c.createdAt).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short" },
                              )}
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
        </TabsContent>

        {/* Polls */}
        <TabsContent value="polls" className="mt-0">
          <div className="flex justify-end mb-4 gap-2 flex-wrap">
            {isSuperAdminOrAdmin && polls.length > 0 && (
              <DeleteAllDialog
                label="Delete All Polls"
                description="Are you sure you want to delete all polls? This action cannot be undone."
                onConfirm={() => {
                  store.deleteAllPolls(societyId);
                  toast.success("All polls deleted");
                  refresh();
                }}
                ocidScope="polls"
              />
            )}
            {isAdmin && (
              <Dialog open={pollOpen} onOpenChange={setPollOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 font-body">
                    <Plus className="w-4 h-4" /> Create Poll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Create Community Poll
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="font-body">Poll Question</Label>
                      <Input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="What do you want to ask?"
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Options</Label>
                      {pollOptions.map((opt, i) => (
                        <Input
                          // biome-ignore lint/suspicious/noArrayIndexKey: poll options are ordered by position
                          key={`poll-opt-${i}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[i] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="font-body"
                        />
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full font-body"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                      </Button>
                    </div>
                    <Button
                      className="w-full font-body"
                      onClick={handleCreatePoll}
                      disabled={
                        !pollQuestion ||
                        pollOptions.filter((o) => o.trim()).length < 2
                      }
                    >
                      Create Poll
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {polls.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Vote className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-display font-semibold">No active polls</p>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Create a poll to gather resident opinions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {polls.map((poll, i) => {
                const totalVotes = poll.options.reduce(
                  (sum, o) => sum + o.votes,
                  0,
                );
                return (
                  <motion.div
                    key={poll.id.toString()}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="font-display text-base leading-snug pr-2">
                            {poll.question}
                          </CardTitle>
                          <Badge
                            className="font-body text-xs flex-shrink-0"
                            style={
                              poll.isActive
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
                            {poll.isActive ? "Active" : "Closed"}
                          </Badge>
                        </div>
                        <p className="text-xs font-body text-muted-foreground">
                          {totalVotes} total votes
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {poll.options.map((option) => {
                          const pct =
                            totalVotes > 0
                              ? Math.round((option.votes / totalVotes) * 100)
                              : 0;
                          return (
                            <div
                              key={option.id.toString()}
                              className="space-y-1"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-body">{option.text}</span>
                                <span className="text-xs font-body text-muted-foreground">
                                  {option.votes} ({pct}%)
                                </span>
                              </div>
                              <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: "oklch(0.92 0.015 245)" }}
                              >
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: "oklch(0.52 0.18 243)" }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {poll.isActive && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-body text-muted-foreground mb-2">
                              Cast your vote:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {poll.options.map((option) => (
                                <Button
                                  key={option.id.toString()}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-body h-7"
                                  onClick={() => handleVote(poll.id, option.id)}
                                >
                                  {option.text}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

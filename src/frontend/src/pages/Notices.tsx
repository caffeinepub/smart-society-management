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
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Pin,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import type { AppRole } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

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

interface NoticesProps {
  role: AppRole;
}

export default function Notices({ role }: NoticesProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const isAdmin =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const allNotices = store.getNotices();

  const filtered = allNotices.filter((n) => {
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || n.category === filterCategory;
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
    );
    toast.success("Notice posted");
    setNoticeOpen(false);
    setNoticeTitle("");
    setNoticeContent("");
    refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">Notice Board</h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Society announcements and important notices
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {allNotices.length > 0 && (
              <DeleteAllDialog
                label="Delete All Notices"
                description="Are you sure you want to delete all notices? This action cannot be undone."
                onConfirm={() => {
                  store.deleteAllNotices();
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
                  style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
                >
                  <Plus className="w-4 h-4" />
                  Post Notice
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
                          <SelectItem key={c} value={c} className="font-body">
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

      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "oklch(0.92 0.06 240)" }}
            >
              <Bell
                className="w-4 h-4"
                style={{ color: "oklch(0.35 0.15 243)" }}
              />
            </div>
            <div>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">
                Total Notices
              </p>
              <p
                className="font-display text-xl font-bold"
                style={{ color: "oklch(0.35 0.15 243)" }}
              >
                {allNotices.length}
              </p>
            </div>
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
                opacity: filterCategory === cat ? 1 : 0.7,
              }}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? "All" : cat)
              }
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="font-body pl-8"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
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
            {(filterCategory !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setFilterCategory("All");
                  setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notices Grid */}
      {filtered.length === 0 ? (
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
          {[...filtered]
            .sort(
              (a, b) =>
                new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
            )
            .map((notice, i) => (
              <motion.div
                key={notice.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card
                  className={`h-full hover:shadow-md transition-shadow ${!notice.isActive ? "opacity-60 border-dashed" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          className="font-body text-xs flex-shrink-0"
                          style={getNoticeCategoryStyle(notice.category)}
                        >
                          {notice.category}
                        </Badge>
                        {!notice.isActive && (
                          <Badge
                            className="font-body text-xs flex-shrink-0"
                            style={{
                              background: "oklch(0.93 0.015 245)",
                              color: "oklch(0.5 0.03 248)",
                              border: "1px solid oklch(0.85 0.02 245)",
                            }}
                          >
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              title={
                                notice.isActive
                                  ? "Disable notice"
                                  : "Enable notice"
                              }
                              data-ocid={`notices.toggle.${i + 1}`}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              onClick={() => {
                                store.toggleNoticeActive(notice.id);
                                toast.success(
                                  notice.isActive
                                    ? "Notice disabled"
                                    : "Notice enabled",
                                );
                                refresh();
                              }}
                            >
                              {notice.isActive ? (
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <button
                              type="button"
                              title="Delete notice"
                              data-ocid={`notices.delete_button.${i + 1}`}
                              className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                              onClick={() => {
                                store.deleteNotice(notice.id);
                                toast.success("Notice deleted");
                                refresh();
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Pin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      </div>
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
                        {new Date(notice.postedAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}

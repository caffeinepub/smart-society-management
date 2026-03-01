import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookUser,
  Building2,
  Car,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Receipt,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { AppRole } from "./RoleSelection";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "SecurityGuard", "Resident", "Staff"],
  },
  {
    id: "properties",
    label: "Properties",
    icon: <Building2 className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    id: "billing",
    label: "Billing",
    icon: <Receipt className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident"],
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "SecurityGuard"],
  },
  {
    id: "communication",
    label: "Communication",
    icon: <MessageSquare className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident"],
  },
  {
    id: "staff",
    label: "Staff",
    icon: <Users className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Staff"],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: <TrendingDown className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    id: "pnl",
    label: "P&L Statement",
    icon: <TrendingUp className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    id: "directory",
    label: "Directory",
    icon: <BookUser className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident", "Staff", "SecurityGuard"],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: <Car className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "SecurityGuard", "Resident"],
  },
  {
    id: "amc",
    label: "AMC Tracker",
    icon: <Wrench className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    id: "notices",
    label: "Notices",
    icon: <Bell className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident"],
  },
  {
    id: "complaints",
    label: "Complaints",
    icon: <AlertCircle className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident", "SecurityGuard"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4.5 h-4.5" />,
    roles: ["SuperAdmin", "Admin", "Resident", "Staff"],
  },
];

const roleLabels: Record<AppRole, string> = {
  SuperAdmin: "Super Admin",
  Admin: "Committee Admin",
  SecurityGuard: "Security Guard",
  Resident: "Resident",
  Staff: "Society Staff",
};

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  role: AppRole;
  onRoleChange: () => void;
  children: React.ReactNode;
}

export default function Layout({
  currentPage,
  onNavigate,
  role,
  onRoleChange,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center gap-3 border-b"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(var(--sidebar-primary))" }}
        >
          <Building2
            className="w-5 h-5"
            style={{ color: "oklch(var(--sidebar-primary-foreground))" }}
          />
        </div>
        <div>
          <div
            className="font-display font-bold text-base leading-tight"
            style={{ color: "oklch(var(--sidebar-foreground))" }}
          >
            SmartSociety
          </div>
          <div
            className="text-xs font-body"
            style={{ color: "oklch(0.58 0.025 248)" }}
          >
            Management Platform
          </div>
        </div>
      </div>

      {/* Role indicator */}
      <div
        className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-lg"
        style={{ background: "oklch(var(--sidebar-accent))" }}
      >
        <p
          className="text-xs font-body uppercase tracking-wider mb-0.5"
          style={{ color: "oklch(0.55 0.025 248)" }}
        >
          Signed in as
        </p>
        <p
          className="font-display font-semibold text-sm"
          style={{ color: "oklch(var(--sidebar-primary))" }}
        >
          {roleLabels[role]}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-150 ${
                isActive ? "sidebar-active" : ""
              }`}
              style={
                isActive
                  ? { color: "oklch(var(--sidebar-primary))" }
                  : { color: "oklch(0.65 0.025 248)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(var(--sidebar-accent))";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.88 0.015 245)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.65 0.025 248)";
                }
              }}
            >
              <span
                style={
                  isActive
                    ? { color: "oklch(var(--sidebar-primary))" }
                    : { color: "oklch(0.55 0.03 248)" }
                }
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(var(--sidebar-primary))" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-body"
          style={{ color: "oklch(0.5 0.025 248)" }}
          onClick={onRoleChange}
        >
          <LogOut className="w-3.5 h-3.5" />
          Switch Role
        </Button>
        <p
          className="text-xs font-body text-center mt-3"
          style={{ color: "oklch(0.4 0.02 248)" }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(0.52 0.04 243)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-60 flex-col flex-shrink-0"
        style={{ background: "oklch(var(--sidebar))" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "oklch(0 0 0 / 0.5)" }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 flex flex-col lg:hidden"
              style={{ background: "oklch(var(--sidebar))" }}
            >
              <button
                type="button"
                className="absolute top-4 right-4 p-1.5 rounded-lg"
                style={{
                  background: "oklch(var(--sidebar-accent))",
                  color: "oklch(var(--sidebar-foreground))",
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 flex items-center gap-4 px-4 lg:px-6 border-b flex-shrink-0"
          style={{
            borderColor: "oklch(var(--border))",
            background: "oklch(var(--card))",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <h1 className="font-display font-semibold text-base capitalize">
              {visibleItems.find((i) => i.id === currentPage)?.label ??
                "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4.5 h-4.5" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
                style={{
                  background: "oklch(0.62 0.2 25)",
                  borderColor: "oklch(var(--card))",
                }}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 font-body">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-display font-bold"
                    style={{ background: "oklch(var(--primary))" }}
                  >
                    {roleLabels[role].slice(0, 1)}
                  </div>
                  <span className="hidden sm:block text-sm">
                    {roleLabels[role]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRoleChange}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Switch Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

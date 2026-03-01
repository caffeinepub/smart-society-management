import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Home,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { AppRole } from "../components/RoleSelection";
import { useSocietyStore } from "../store/societyStore";

interface DashboardProps {
  role: AppRole;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: string;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-body font-medium text-muted-foreground">
              {title}
            </p>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <span style={{ color }}>{icon}</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display text-2xl font-bold text-foreground">
              {value}
            </span>
            {trend && trendValue && (
              <span
                className={`flex items-center gap-0.5 text-xs font-body font-medium mb-0.5 ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-body text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const activityFeed = [
  {
    id: 1,
    type: "visitor",
    message: "Rajesh Kumar registered as visitor for A-401",
    time: "5 min ago",
    icon: <UserCheck className="w-3.5 h-3.5" />,
    color: "oklch(0.52 0.18 243)",
  },
  {
    id: 2,
    type: "payment",
    message: "Maintenance bill paid by Priya Singh (B-203)",
    time: "23 min ago",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "oklch(0.58 0.16 155)",
  },
  {
    id: 3,
    type: "complaint",
    message: "Water leakage complaint filed by unit C-105",
    time: "1 hr ago",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    color: "oklch(0.62 0.2 25)",
  },
  {
    id: 4,
    type: "notice",
    message: "General body meeting notice posted by admin",
    time: "2 hr ago",
    icon: <Activity className="w-3.5 h-3.5" />,
    color: "oklch(0.65 0.15 195)",
  },
  {
    id: 5,
    type: "staff",
    message: "Attendance marked for 8 staff members",
    time: "3 hr ago",
    icon: <Users className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.12 95)",
  },
];

export default function Dashboard({ role }: DashboardProps) {
  const store = useSocietyStore();

  const towers = store.getTowers();
  const units = store.getUnits();
  const activeVisitors = store.getActiveVisitors();
  const complaints = store.getComplaints();
  const financialSummary = store.getFinancialSummary();

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.isOccupied).length;
  const openComplaints = complaints.filter((c) => c.status === "Open").length;
  const pendingDues = financialSummary.pendingDues;

  const isAdmin = role === "SuperAdmin" || role === "Admin";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome bar */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Good morning 👋
          </h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening in your society today
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            <KpiCard
              title="Total Towers"
              value={towers.length}
              subtitle="Residential blocks"
              icon={<Building2 className="w-4.5 h-4.5" />}
              color="oklch(0.52 0.18 243)"
            />
            <KpiCard
              title="Total Units"
              value={totalUnits}
              subtitle={`${occupiedUnits} occupied`}
              icon={<Home className="w-4.5 h-4.5" />}
              trend="up"
              trendValue={`${totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}% occupied`}
              color="oklch(0.58 0.16 155)"
            />
            <KpiCard
              title="Pending Dues"
              value={`₹${pendingDues.toLocaleString("en-IN")}`}
              subtitle="Outstanding maintenance"
              icon={<Receipt className="w-4.5 h-4.5" />}
              trend={pendingDues > 0 ? "down" : "neutral"}
              trendValue={pendingDues > 0 ? "Needs attention" : "All clear"}
              color="oklch(0.62 0.2 25)"
            />
            <KpiCard
              title="Open Complaints"
              value={openComplaints}
              subtitle="Pending resolution"
              icon={<AlertCircle className="w-4.5 h-4.5" />}
              color="oklch(0.65 0.15 195)"
            />
          </>
        )}
        {role === "SecurityGuard" && (
          <KpiCard
            title="Active Visitors"
            value={activeVisitors.length}
            subtitle="Currently inside"
            icon={<UserCheck className="w-4.5 h-4.5" />}
            color="oklch(0.52 0.18 243)"
          />
        )}
        {role === "Resident" && (
          <KpiCard
            title="Open Complaints"
            value={openComplaints}
            subtitle="My pending complaints"
            icon={<AlertCircle className="w-4.5 h-4.5" />}
            color="oklch(0.62 0.2 25)"
          />
        )}
        {role === "Staff" && (
          <KpiCard
            title="My Attendance"
            value="Present"
            subtitle="Today's status"
            icon={<UserCheck className="w-4.5 h-4.5" />}
            color="oklch(0.58 0.16 155)"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Activity
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-4">
            {activityFeed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-foreground leading-snug">
                    {item.message}
                  </p>
                </div>
                <span className="text-xs font-body text-muted-foreground flex-shrink-0 mt-0.5">
                  {item.time}
                </span>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {isAdmin && (
              <>
                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Occupancy Rate
                    </span>
                    <span className="font-semibold">
                      {totalUnits > 0
                        ? Math.round((occupiedUnits / totalUnits) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.92 0.015 245)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "oklch(0.58 0.16 155)" }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Bill Collection
                    </span>
                    <span className="font-semibold">
                      {financialSummary.totalBilled > 0
                        ? Math.round(
                            (financialSummary.totalCollected /
                              financialSummary.totalBilled) *
                              100,
                          )
                        : 0}
                      %
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
                      animate={{
                        width: `${financialSummary.totalBilled > 0 ? Math.round((financialSummary.totalCollected / financialSummary.totalBilled) * 100) : 0}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Complaint Resolution
                    </span>
                    <span className="font-semibold">
                      {complaints.length > 0
                        ? Math.round(
                            (complaints.filter((c) => c.status === "Resolved")
                              .length /
                              complaints.length) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.92 0.015 245)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "oklch(0.65 0.15 195)" }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${complaints.length > 0 ? Math.round((complaints.filter((c) => c.status === "Resolved").length / complaints.length) * 100) : 0}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Visitor count for security */}
            <div
              className="rounded-xl p-4"
              style={{ background: "oklch(0.94 0.012 245)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                    Active Visitors
                  </p>
                  <p className="font-display text-2xl font-bold">
                    {activeVisitors.length}
                  </p>
                </div>
                <Badge
                  className="font-body text-xs"
                  style={
                    activeVisitors.length > 0
                      ? {
                          background: "oklch(0.9 0.08 155)",
                          color: "oklch(0.3 0.1 155)",
                          border: "1px solid oklch(0.82 0.1 155)",
                        }
                      : {}
                  }
                >
                  {activeVisitors.length > 0 ? "Inside" : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

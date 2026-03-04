import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertCircle,
  Building2,
  Clock,
  Home,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import type { AppRole } from "../store/societyStore";

interface DashboardProps {
  role: AppRole;
  societyId?: number | null;
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

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

const activityFeed: {
  id: number;
  type: string;
  message: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}[] = [];

interface DashboardData {
  towersCount: number;
  totalUnits: number;
  occupiedUnits: number;
  openComplaints: number;
  totalComplaints: number;
  resolvedComplaints: number;
  activeVisitorsCount: number;
  pendingDues: number;
  totalBilled: number;
  totalCollected: number;
}

export default function Dashboard({ role }: DashboardProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const [data, setData] = useState<DashboardData>({
    towersCount: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    openComplaints: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    activeVisitorsCount: 0,
    pendingDues: 0,
    totalBilled: 0,
    totalCollected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  useEffect(() => {
    if (!actor || actorFetching) return;

    async function fetchDashboardData() {
      if (!actor) return;
      setIsLoading(true);
      try {
        if (isAdmin) {
          // Run all admin queries in parallel
          const [towers, units, visitors, complaints, financialSummary] =
            await Promise.all([
              actor.getTowers().catch(() => []),
              actor.getUnits().catch(() => []),
              actor.getActiveVisitors().catch(() => []),
              actor.getComplaints().catch(() => []),
              actor.getFinancialSummary().catch(() => ({
                pendingDues: BigInt(0),
                totalBilled: BigInt(0),
                totalCollected: BigInt(0),
              })),
            ]);

          setData({
            towersCount: towers.length,
            totalUnits: units.length,
            occupiedUnits: units.filter((u) => u.isOccupied).length,
            openComplaints: complaints.filter((c) => c.status === "Open")
              .length,
            totalComplaints: complaints.length,
            resolvedComplaints: complaints.filter(
              (c) => c.status === "Resolved",
            ).length,
            activeVisitorsCount: visitors.length,
            pendingDues: Number(financialSummary.pendingDues),
            totalBilled: Number(financialSummary.totalBilled),
            totalCollected: Number(financialSummary.totalCollected),
          });
        } else if (role === "SecurityGuard") {
          const visitors = await actor.getActiveVisitors().catch(() => []);
          setData((prev) => ({
            ...prev,
            activeVisitorsCount: visitors.length,
          }));
        } else if (role === "Resident") {
          const complaints = await actor.getComplaints().catch(() => []);
          setData((prev) => ({
            ...prev,
            openComplaints: complaints.filter((c) => c.status === "Open")
              .length,
            totalComplaints: complaints.length,
            resolvedComplaints: complaints.filter(
              (c) => c.status === "Resolved",
            ).length,
          }));
        }
      } catch {
        // Silently fail — show zeros
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [actor, actorFetching, isAdmin, role]);

  const occupancyPct =
    data.totalUnits > 0
      ? Math.round((data.occupiedUnits / data.totalUnits) * 100)
      : 0;
  const collectionPct =
    data.totalBilled > 0
      ? Math.round((data.totalCollected / data.totalBilled) * 100)
      : 0;
  const resolutionPct =
    data.totalComplaints > 0
      ? Math.round((data.resolvedComplaints / data.totalComplaints) * 100)
      : 0;

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
        {isLoading ? (
          <>
            {isAdmin ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <KpiCardSkeleton />
            )}
          </>
        ) : (
          <>
            {isAdmin && (
              <>
                <KpiCard
                  title="Total Towers"
                  value={data.towersCount}
                  subtitle="Residential blocks"
                  icon={<Building2 className="w-4.5 h-4.5" />}
                  color="oklch(0.52 0.18 243)"
                />
                <KpiCard
                  title="Total Units"
                  value={data.totalUnits}
                  subtitle={`${data.occupiedUnits} occupied`}
                  icon={<Home className="w-4.5 h-4.5" />}
                  trend="up"
                  trendValue={`${occupancyPct}% occupied`}
                  color="oklch(0.58 0.16 155)"
                />
                <KpiCard
                  title="Pending Dues"
                  value={`₹${data.pendingDues.toLocaleString("en-IN")}`}
                  subtitle="Outstanding maintenance"
                  icon={<Receipt className="w-4.5 h-4.5" />}
                  trend={data.pendingDues > 0 ? "down" : "neutral"}
                  trendValue={
                    data.pendingDues > 0 ? "Needs attention" : "All clear"
                  }
                  color="oklch(0.62 0.2 25)"
                />
                <KpiCard
                  title="Open Complaints"
                  value={data.openComplaints}
                  subtitle="Pending resolution"
                  icon={<AlertCircle className="w-4.5 h-4.5" />}
                  color="oklch(0.65 0.15 195)"
                />
              </>
            )}
            {role === "SecurityGuard" && (
              <KpiCard
                title="Active Visitors"
                value={data.activeVisitorsCount}
                subtitle="Currently inside"
                icon={<UserCheck className="w-4.5 h-4.5" />}
                color="oklch(0.52 0.18 243)"
              />
            )}
            {role === "Resident" && (
              <KpiCard
                title="Open Complaints"
                value={data.openComplaints}
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
          </>
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
            {activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-body text-muted-foreground">
                  No recent activity
                </p>
                <p className="text-xs font-body text-muted-foreground/60 mt-0.5">
                  Activity will appear here as events occur
                </p>
              </div>
            ) : (
              activityFeed.map((item, index) => (
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
              ))
            )}
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
            {isAdmin && !isLoading && (
              <>
                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Occupancy Rate
                    </span>
                    <span className="font-semibold">{occupancyPct}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.92 0.015 245)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "oklch(0.58 0.16 155)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Bill Collection
                    </span>
                    <span className="font-semibold">{collectionPct}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.92 0.015 245)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "oklch(0.52 0.18 243)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${collectionPct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-body mb-1.5">
                    <span className="text-muted-foreground">
                      Complaint Resolution
                    </span>
                    <span className="font-semibold">{resolutionPct}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.92 0.015 245)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "oklch(0.65 0.15 195)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${resolutionPct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>
              </>
            )}

            {isAdmin && isLoading && (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </>
            )}

            {/* Visitor count */}
            <div
              className="rounded-xl p-4"
              style={{ background: "oklch(0.94 0.012 245)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                    Active Visitors
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-10" />
                  ) : (
                    <p className="font-display text-2xl font-bold">
                      {data.activeVisitorsCount}
                    </p>
                  )}
                </div>
                {!isLoading && (
                  <Badge
                    className="font-body text-xs"
                    style={
                      data.activeVisitorsCount > 0
                        ? {
                            background: "oklch(0.9 0.08 155)",
                            color: "oklch(0.3 0.1 155)",
                            border: "1px solid oklch(0.82 0.1 155)",
                          }
                        : {}
                    }
                  >
                    {data.activeVisitorsCount > 0 ? "Inside" : "None"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

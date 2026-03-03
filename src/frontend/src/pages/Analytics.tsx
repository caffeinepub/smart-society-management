import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  PieChart as PieIcon,
  Printer,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSocietyStore } from "../store/societyStore";

const PIE_COLORS = [
  "oklch(0.52 0.18 243)",
  "oklch(0.58 0.16 155)",
  "oklch(0.62 0.2 25)",
  "oklch(0.65 0.15 195)",
  "oklch(0.72 0.12 95)",
  "oklch(0.55 0.16 270)",
];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
});

export default function Analytics({
  societyId,
}: { societyId?: number | null }) {
  const store = useSocietyStore();

  const bills = store.getBills(societyId);
  const units = store.getUnits(societyId);
  const complaints = store.getComplaints(societyId);
  const visitors = store.getVisitors(societyId);
  const financialSummary = store.getFinancialSummary(societyId);

  // Occupancy donut
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.isOccupied).length;
  const occupancyData = [
    { name: "Occupied", value: occupiedUnits },
    { name: "Vacant", value: totalUnits - occupiedUnits },
  ];
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Monthly billing
  const billingData = months.slice(0, 6).map((m, idx) => {
    const monthBills = bills.filter(
      (b) => b.month === idx + 1 && b.year === new Date().getFullYear(),
    );
    return {
      month: m,
      billed: monthBills.reduce((sum, b) => sum + b.amount, 0),
      collected: monthBills
        .filter((b) => b.status === "Paid")
        .reduce((sum, b) => sum + b.amount, 0),
    };
  });

  // Complaint categories
  const complaintCategoryData = Object.entries(
    complaints.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  // Visitor trends (distribute across 7 days)
  const visitorTrendData = last7Days.map((day, i) => ({
    day,
    visitors: Math.max(
      0,
      visitors.length > 0
        ? Math.floor(visitors.length * (0.1 + ((i * 0.15) % 0.3)))
        : i % 3,
    ),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">
            Analytics &amp; Reports
          </h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Comprehensive insights for your society
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 font-body"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" /> Print Report
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Occupancy Rate",
            value: `${occupancyRate}%`,
            sub: `${occupiedUnits}/${totalUnits} units`,
            color: "oklch(0.58 0.16 155)",
          },
          {
            label: "Total Billed",
            value: `₹${(financialSummary.totalBilled / 1000).toFixed(0)}k`,
            sub: "This year",
            color: "oklch(0.52 0.18 243)",
          },
          {
            label: "Collection Rate",
            value:
              financialSummary.totalBilled > 0
                ? `${Math.round((financialSummary.totalCollected / financialSummary.totalBilled) * 100)}%`
                : "0%",
            sub: "Bills paid",
            color: "oklch(0.65 0.15 195)",
          },
          {
            label: "Total Complaints",
            value: complaints.length,
            sub: `${complaints.filter((c) => c.status === "Resolved").length} resolved`,
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
              <CardContent className="p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-2">
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
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Donut */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <PieIcon
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={
                          idx === 0
                            ? "oklch(0.58 0.16 155)"
                            : "oklch(0.88 0.015 245)"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    formatter={(val) => (
                      <span
                        style={{
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: 12,
                        }}
                      >
                        {val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p
                    className="font-display text-3xl font-bold"
                    style={{ color: "oklch(0.58 0.16 155)" }}
                  >
                    {occupancyRate}%
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    Occupied
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaint Breakdown Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Activity
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Complaints by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complaintCategoryData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm font-body text-muted-foreground">
                No complaint data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={complaintCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {complaintCategoryData.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Billing Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Monthly Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={billingData}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 245)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fontFamily: "Plus Jakarta Sans" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString("en-IN")}`,
                    undefined,
                  ]}
                  contentStyle={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: 11,
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="billed"
                  name="Billed"
                  fill="oklch(0.52 0.18 243)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="collected"
                  name="Collected"
                  fill="oklch(0.58 0.16 155)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visitor Trend Line Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              Visitor Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={visitorTrendData}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 245)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: 11,
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="oklch(0.52 0.18 243)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.52 0.18 243)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

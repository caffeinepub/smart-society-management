import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppRole } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const MONTH_NAMES = [
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

interface PnLProps {
  role: AppRole;
  societyId?: number | null;
}

export default function PnL({ role, societyId }: PnLProps) {
  const store = useSocietyStore();
  const canView =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <TrendingUp
            className="w-12 h-12 mx-auto"
            style={{ color: "oklch(0.65 0.08 240)" }}
          />
          <p className="font-display text-lg font-semibold">
            Access Restricted
          </p>
          <p className="text-sm font-body text-muted-foreground">
            Only Admin and SuperAdmin can view the P&L Statement.
          </p>
        </div>
      </div>
    );
  }

  const bills = store.getBills(societyId);
  const expenses = store.getExpenses(societyId);
  const currentYear = new Date().getFullYear();

  // Build monthly data for current year
  const monthlyData = MONTH_NAMES.map((name, idx) => {
    const monthNum = idx + 1; // 1-indexed

    // Income: sum grandTotal of paid bills for this month/year
    const income = bills
      .filter(
        (b) =>
          b.status === "Paid" && b.month === monthNum && b.year === currentYear,
      )
      .reduce((sum, b) => sum + b.grandTotal, 0);

    // Expenses: sum expense.amount where date's month matches
    const expenseTotal = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month: name,
      income,
      expenses: expenseTotal,
      net: income - expenseTotal,
    };
  });

  // All-time totals (across all years)
  const totalIncome = bills
    .filter((b) => b.status === "Paid")
    .reduce((sum, b) => sum + b.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSurplus = totalIncome - totalExpenses;

  const kpis = [
    {
      label: "Total Income",
      value: `₹${totalIncome.toLocaleString("en-IN")}`,
      sub: "all paid bills",
      color: "oklch(0.52 0.18 155)",
      icon: ArrowUpRight,
    },
    {
      label: "Total Expenses",
      value: `₹${totalExpenses.toLocaleString("en-IN")}`,
      sub: "all recorded expenses",
      color: "oklch(0.55 0.2 25)",
      icon: ArrowDownRight,
    },
    {
      label: netSurplus >= 0 ? "Net Surplus" : "Net Deficit",
      value: `₹${Math.abs(netSurplus).toLocaleString("en-IN")}`,
      sub: netSurplus >= 0 ? "positive balance" : "negative balance",
      color: netSurplus >= 0 ? "oklch(0.45 0.18 155)" : "oklch(0.45 0.2 25)",
      icon: netSurplus >= 0 ? TrendingUp : TrendingDown,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold">P&amp;L Statement</h2>
        <p className="text-sm font-body text-muted-foreground mt-0.5">
          Profit &amp; Loss overview for {currentYear} — Income vs Expenses
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{
                    background: `oklch(from ${kpi.color} l c h / 0.1)`,
                  }}
                >
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                    {kpi.label}
                  </p>
                  <p
                    className="font-display text-2xl font-bold"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                  </p>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    {kpi.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <IndianRupee
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Monthly Income vs Expenses — {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={monthlyData}
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
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString("en-IN")}`,
                  name === "income"
                    ? "Income"
                    : name === "expenses"
                      ? "Expenses"
                      : "Net",
                ]}
                contentStyle={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: 11,
                  borderRadius: 8,
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: "Plus Jakarta Sans", fontSize: 11 }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="oklch(0.52 0.18 155)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="oklch(0.55 0.2 25)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly P&L Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Monthly Breakdown — {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">
                    Month
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Income (₹)
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Expenses (₹)
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Net (₹)
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((row, i) => {
                  const hasActivity = row.income > 0 || row.expenses > 0;
                  return (
                    <motion.tr
                      key={row.month}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-body font-medium py-3">
                        {row.month} {currentYear}
                      </TableCell>
                      <TableCell
                        className="font-body text-right"
                        style={
                          row.income > 0
                            ? { color: "oklch(0.45 0.18 155)" }
                            : {}
                        }
                      >
                        {row.income > 0
                          ? `₹${row.income.toLocaleString("en-IN")}`
                          : "—"}
                      </TableCell>
                      <TableCell
                        className="font-body text-right"
                        style={
                          row.expenses > 0
                            ? { color: "oklch(0.45 0.2 25)" }
                            : {}
                        }
                      >
                        {row.expenses > 0
                          ? `₹${row.expenses.toLocaleString("en-IN")}`
                          : "—"}
                      </TableCell>
                      <TableCell
                        className="font-display font-bold text-right"
                        style={
                          hasActivity
                            ? {
                                color:
                                  row.net >= 0
                                    ? "oklch(0.42 0.18 155)"
                                    : "oklch(0.45 0.2 25)",
                              }
                            : { color: "oklch(0.65 0.03 248)" }
                        }
                      >
                        {hasActivity
                          ? `${row.net >= 0 ? "+" : ""}₹${Math.abs(row.net).toLocaleString("en-IN")}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {!hasActivity ? (
                          <span className="text-xs font-body text-muted-foreground flex items-center gap-1">
                            <Minus className="w-3 h-3" /> No activity
                          </span>
                        ) : row.net >= 0 ? (
                          <Badge
                            className="font-body text-xs"
                            style={{
                              background: "oklch(0.9 0.08 155)",
                              color: "oklch(0.3 0.1 155)",
                              border: "1px solid oklch(0.82 0.1 155)",
                            }}
                          >
                            Surplus
                          </Badge>
                        ) : (
                          <Badge
                            className="font-body text-xs"
                            style={{
                              background: "oklch(0.95 0.07 25)",
                              color: "oklch(0.4 0.15 25)",
                              border: "1px solid oklch(0.88 0.1 25)",
                            }}
                          >
                            Deficit
                          </Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Year total row */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <span className="font-display font-semibold text-sm">
              Year Total
            </span>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs font-body text-muted-foreground">
                  Income
                </p>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(0.42 0.18 155)" }}
                >
                  ₹
                  {monthlyData
                    .reduce((s, r) => s + r.income, 0)
                    .toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-body text-muted-foreground">
                  Expenses
                </p>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(0.45 0.2 25)" }}
                >
                  ₹
                  {monthlyData
                    .reduce((s, r) => s + r.expenses, 0)
                    .toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-body text-muted-foreground">Net</p>
                {(() => {
                  const yearNet = monthlyData.reduce((s, r) => s + r.net, 0);
                  return (
                    <p
                      className="font-display font-bold text-sm"
                      style={{
                        color:
                          yearNet >= 0
                            ? "oklch(0.42 0.18 155)"
                            : "oklch(0.45 0.2 25)",
                      }}
                    >
                      {yearNet >= 0 ? "+" : ""}₹
                      {Math.abs(yearNet).toLocaleString("en-IN")}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

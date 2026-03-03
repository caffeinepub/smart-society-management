import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
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
  Edit2,
  IndianRupee,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { DeleteAllDialog } from "../components/DeleteAllDialog";
import type { AppRole } from "../store/societyStore";
import type { Expense } from "../store/societyStore";
import { useSocietyStore } from "../store/societyStore";

const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Utilities",
  "Staff Salary",
  "Security",
  "Cleaning",
  "Repairs",
  "Administrative",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "UPI"];

const CATEGORY_COLORS: Record<string, string> = {
  Maintenance: "oklch(0.52 0.18 243)",
  Utilities: "oklch(0.58 0.16 155)",
  "Staff Salary": "oklch(0.62 0.2 25)",
  Security: "oklch(0.65 0.15 195)",
  Cleaning: "oklch(0.72 0.12 95)",
  Repairs: "oklch(0.55 0.16 270)",
  Administrative: "oklch(0.6 0.14 340)",
  Other: "oklch(0.65 0.08 240)",
};

function getCategoryStyle(category: string) {
  const color = CATEGORY_COLORS[category] ?? "oklch(0.65 0.08 240)";
  return {
    background: `oklch(from ${color} l c h / 0.12)`,
    color,
    border: `1px solid oklch(from ${color} l c h / 0.35)`,
  };
}

interface ExpenseFormData {
  title: string;
  category: string;
  amount: string;
  description: string;
  paidTo: string;
  date: string;
  paymentMethod: string;
  receiptNumber: string;
}

const defaultForm: ExpenseFormData = {
  title: "",
  category: "",
  amount: "",
  description: "",
  paidTo: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "Bank Transfer",
  receiptNumber: "",
};

interface ExpenseDialogProps {
  open: boolean;
  editingExpense: Expense | null;
  onClose: () => void;
  societyId?: number | null;
}

function ExpenseDialog({
  open,
  editingExpense,
  onClose,
  societyId: propSocietyId,
}: ExpenseDialogProps) {
  const store = useSocietyStore();
  const societyId = propSocietyId ?? store.getActiveSocietyId();

  const [form, setFormState] = useState<ExpenseFormData>(() =>
    editingExpense
      ? {
          title: editingExpense.title,
          category: editingExpense.category,
          amount: editingExpense.amount.toString(),
          description: editingExpense.description,
          paidTo: editingExpense.paidTo,
          date: editingExpense.date,
          paymentMethod: editingExpense.paymentMethod,
          receiptNumber: editingExpense.receiptNumber,
        }
      : defaultForm,
  );

  // Re-init when editingExpense changes
  const [lastEditing, setLastEditing] = useState<number | null>(null);
  if (editingExpense && editingExpense.id !== lastEditing) {
    setLastEditing(editingExpense.id);
    setFormState({
      title: editingExpense.title,
      category: editingExpense.category,
      amount: editingExpense.amount.toString(),
      description: editingExpense.description,
      paidTo: editingExpense.paidTo,
      date: editingExpense.date,
      paymentMethod: editingExpense.paymentMethod,
      receiptNumber: editingExpense.receiptNumber,
    });
  }
  if (!editingExpense && lastEditing !== null) {
    setLastEditing(null);
    setFormState(defaultForm);
  }

  const set = (key: keyof ExpenseFormData, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.title.trim() &&
    form.category &&
    Number(form.amount) > 0 &&
    form.paidTo.trim() &&
    form.date;

  const handleSave = () => {
    if (!isValid) return;
    if (editingExpense) {
      store.updateExpense(
        editingExpense.id,
        form.title.trim(),
        form.category,
        Number(form.amount),
        form.description.trim(),
        form.paidTo.trim(),
        editingExpense.paidBy,
        form.date,
        form.paymentMethod,
        form.receiptNumber.trim(),
        societyId,
      );
      toast.success("Expense updated");
    } else {
      store.createExpense(
        form.title.trim(),
        form.category,
        Number(form.amount),
        form.description.trim(),
        form.paidTo.trim(),
        "Admin",
        form.date,
        form.paymentMethod,
        form.receiptNumber.trim(),
        societyId,
      );
      toast.success("Expense recorded");
    }
    setFormState(defaultForm);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wallet
              className="w-5 h-5"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            {editingExpense ? "Edit Expense" : "Record New Expense"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Lift Maintenance, Electricity Bill"
              className="font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="font-body">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
                className="font-body"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Paid To (Vendor / Payee) *</Label>
            <Input
              value={form.paidTo}
              onChange={(e) => set("paidTo", e.target.value)}
              placeholder="e.g. Otis Elevators, BESCOM"
              className="font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body">Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => set("paymentMethod", v)}
              >
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="font-body">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Receipt / Reference No.</Label>
            <Input
              value={form.receiptNumber}
              onChange={(e) => set("receiptNumber", e.target.value)}
              placeholder="Optional bill or receipt number"
              className="font-body"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief details about this expense..."
              className="font-body resize-none"
              rows={3}
            />
          </div>

          <Button
            className="w-full font-body"
            onClick={handleSave}
            disabled={!isValid}
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
          >
            {editingExpense ? "Save Changes" : "Record Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ExpensesProps {
  role: AppRole;
  societyId?: number | null;
}

export default function Expenses({ role, societyId }: ExpensesProps) {
  const store = useSocietyStore();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMethod, setFilterMethod] = useState("All");
  const [search, setSearch] = useState("");

  const canEdit =
    role === "SuperAdmin" ||
    role === "Admin" ||
    role === "Chairman" ||
    role === "Secretary" ||
    role === "Treasurer";

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Wallet
            className="w-12 h-12 mx-auto"
            style={{ color: "oklch(0.65 0.08 240)" }}
          />
          <p className="font-display text-lg font-semibold">
            Access Restricted
          </p>
          <p className="text-sm font-body text-muted-foreground">
            Only Admin and SuperAdmin can view expense records.
          </p>
        </div>
      </div>
    );
  }

  const allExpenses = store.getExpenses(societyId);

  // Filter
  const filtered = allExpenses.filter((e) => {
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    const matchMethod =
      filterMethod === "All" || e.paymentMethod === filterMethod;
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchMethod && matchSearch;
  });

  // Summaries
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthExpenses = allExpenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown for chart
  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    amount: allExpenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((d) => d.amount > 0);

  const handleDelete = (id: number) => {
    store.deleteExpense(id);
    toast.success("Expense deleted");
    refresh();
  };

  const openAdd = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold">Expenses</h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Record and track all society expenditures
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allExpenses.length > 0 && (
            <DeleteAllDialog
              label="Delete All Expenses"
              description="Are you sure you want to delete all expense records? This action cannot be undone."
              onConfirm={() => {
                store.deleteAllExpenses(societyId);
                toast.success("All expenses deleted");
                refresh();
              }}
              ocidScope="expenses"
            />
          )}
          <Button
            className="gap-2 font-body"
            style={{ background: "oklch(0.52 0.18 243)", color: "#fff" }}
            onClick={openAdd}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Expenses",
            value: `₹${totalExpenses.toLocaleString("en-IN")}`,
            sub: `${allExpenses.length} records`,
            color: "oklch(0.55 0.2 25)",
            icon: TrendingDown,
          },
          {
            label: "This Month",
            value: `₹${thisMonthExpenses.toLocaleString("en-IN")}`,
            sub: "current month spend",
            color: "oklch(0.52 0.18 243)",
            icon: Wallet,
          },
          {
            label: "Categories",
            value: categoryBreakdown.length,
            sub: "active expense types",
            color: "oklch(0.58 0.16 155)",
            icon: Receipt,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
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
                    {stat.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Spend Chart */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <IndianRupee
                className="w-4 h-4"
                style={{ color: "oklch(0.52 0.18 243)" }}
              />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={categoryBreakdown}
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 245)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
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
                    "Amount",
                  ]}
                  contentStyle={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: 11,
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="amount"
                  name="Amount"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        CATEGORY_COLORS[entry.name] ?? "oklch(0.65 0.08 240)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search title, vendor..."
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
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="font-body w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="font-body">
                  All Methods
                </SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="font-body">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterCategory !== "All" || filterMethod !== "All" || search) && (
              <Button
                variant="ghost"
                size="sm"
                className="font-body text-xs"
                onClick={() => {
                  setFilterCategory("All");
                  setFilterMethod("All");
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Receipt
              className="w-4 h-4"
              style={{ color: "oklch(0.52 0.18 243)" }}
            />
            Expense Records
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
                    Date
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Title
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Paid To
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Method
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Receipt No.
                  </TableHead>
                  <TableHead className="font-body font-semibold text-right">
                    Amount (₹)
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-14 font-body text-muted-foreground"
                    >
                      {allExpenses.length === 0
                        ? 'No expenses recorded yet. Click "Add Expense" to get started.'
                        : "No expenses match the current filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filtered]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-body text-sm whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-body font-medium max-w-[180px]">
                          <div>{expense.title}</div>
                          {expense.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                              {expense.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="font-body text-xs whitespace-nowrap"
                            style={getCategoryStyle(expense.category)}
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-sm">
                          {expense.paidTo}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {expense.paymentMethod}
                        </TableCell>
                        <TableCell className="font-body text-sm text-muted-foreground">
                          {expense.receiptNumber || "—"}
                        </TableCell>
                        <TableCell
                          className="font-body font-semibold text-right"
                          style={{ color: "oklch(0.45 0.18 25)" }}
                        >
                          ₹{expense.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Edit"
                              onClick={() => openEdit(expense)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Delete"
                              style={{ color: "oklch(0.55 0.2 25)" }}
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer total */}
          {filtered.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-3 px-4 py-3">
                <span className="text-sm font-body text-muted-foreground">
                  Total ({filtered.length} records):
                </span>
                <span
                  className="font-display font-bold text-base"
                  style={{ color: "oklch(0.45 0.18 25)" }}
                >
                  ₹
                  {filtered
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        editingExpense={editingExpense}
        onClose={() => {
          setDialogOpen(false);
          setEditingExpense(null);
          refresh();
        }}
        societyId={societyId}
      />
    </div>
  );
}

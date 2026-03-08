import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useExpenses, getStaffStats, getExpensesByCategory } from "@/lib/store";
import { generateMonthlyReport } from "@/lib/pdf-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, IndianRupee, TrendingDown, TrendingUp, Users, FileBarChart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

const COLORS = [
  "hsl(262, 60%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(152, 58%, 38%)",
  "hsl(38, 92%, 50%)",
  "hsl(210, 80%, 52%)",
  "hsl(20, 80%, 52%)",
];

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Reports() {
  const { transactions } = useTransactions();
  const { expenses } = useExpenses();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const monthTx = useMemo(() => transactions.filter((t) => t.date.startsWith(month)), [transactions, month]);
  const monthExp = useMemo(() => expenses.filter((e) => e.date.startsWith(month)), [expenses, month]);

  const totalRevenue = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const staffStats = useMemo(() => getStaffStats(monthTx), [monthTx]);
  const expenseBreakdown = useMemo(() => getExpensesByCategory(monthExp), [monthExp]);

  const handleExport = () => {
    generateMonthlyReport(month, transactions, expenses);
    toast.success("PDF report downloaded!");
  };

  const label = new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader
        title="Monthly Reports"
        description="Review and export monthly performance data"
        icon={FileBarChart}
        actions={
          <Button onClick={handleExport} className="gap-2 rounded-xl">
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
        }
      />

      <div className="mb-6">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Select Month</Label>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1.5 w-48 rounded-xl" />
      </div>

      <div className="page-grid mb-6">
        <StatCard title={`${label} Revenue`} value={fmt(totalRevenue)} icon={IndianRupee} />
        <StatCard title="Expenses" value={fmt(totalExpenses)} icon={TrendingDown} />
        <StatCard title="Net Profit" value={fmt(profit)} icon={TrendingUp} trend={profit >= 0 ? "Profitable" : "Loss"} trendUp={profit >= 0} />
        <StatCard title="Transactions" value={String(monthTx.length)} icon={Users} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated">
          <h3 className="section-title mb-5">Staff Performance</h3>
          {staffStats.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No data for this month.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220,10%,46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220,10%,46%)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(220,13%,91%)', fontSize: 13 }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {staffStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card-elevated">
          <h3 className="section-title mb-5">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No expenses this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseBreakdown.map((e, i) => {
                const maxAmount = Math.max(...expenseBreakdown.map(x => x.amount));
                const pct = maxAmount > 0 ? (e.amount / maxAmount) * 100 : 0;
                return (
                  <div key={e.category}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground">{e.category}</span>
                      </div>
                      <span className="font-semibold text-foreground">{fmt(e.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-3 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>{fmt(totalExpenses)}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

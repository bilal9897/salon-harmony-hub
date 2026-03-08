import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useExpenses, getStaffStats, getExpensesByCategory } from "@/lib/store";
import { generateMonthlyReport } from "@/lib/pdf-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, IndianRupee, TrendingDown, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

const COLORS = [
  "hsl(350, 45%, 55%)",
  "hsl(35, 60%, 60%)",
  "hsl(152, 60%, 42%)",
  "hsl(210, 80%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(20, 70%, 50%)",
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

  const label = new Date(month + "-01").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader title="Monthly Reports" description="Review and export monthly performance data" />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <Label>Select Month</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 w-48" />
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FileDown className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title={`${label} Revenue`} value={fmt(totalRevenue)} icon={IndianRupee} />
        <StatCard title="Expenses" value={fmt(totalExpenses)} icon={TrendingDown} />
        <StatCard
          title="Net Profit"
          value={fmt(profit)}
          icon={TrendingUp}
          trend={profit >= 0 ? "Profitable" : "Loss"}
          trendUp={profit >= 0}
        />
        <StatCard title="Transactions" value={String(monthTx.length)} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card">
          <h3 className="mb-4 font-display text-lg font-semibold">Staff Performance</h3>
          {staffStats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No data for this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={staffStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,15%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {staffStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="mb-4 font-display text-lg font-semibold">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">No expenses this month.</p>
          ) : (
            <div className="space-y-3">
              {expenseBreakdown.map((e, i) => (
                <div key={e.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-foreground">{e.category}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{fmt(e.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
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

import { IndianRupee, TrendingUp, TrendingDown, Users, Star } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useExpenses, getToday, getStaffStats, getExpensesByCategory, Transaction, Expense } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import { useMemo } from "react";

const CHART_COLORS = [
  "hsl(350, 45%, 55%)",
  "hsl(35, 60%, 60%)",
  "hsl(152, 60%, 42%)",
  "hsl(210, 80%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(20, 70%, 50%)",
];

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { expenses } = useExpenses();
  const today = getToday();

  const todayTx = useMemo(() => transactions.filter(t => t.date === today), [transactions, today]);
  const todayExp = useMemo(() => expenses.filter(e => e.date === today), [expenses, today]);

  const todayRevenue = todayTx.reduce((s, t) => s + t.amount, 0);
  const todayExpenses = todayExp.reduce((s, e) => s + e.amount, 0);
  const todayProfit = todayRevenue - todayExpenses;

  const staffStats = useMemo(() => getStaffStats(transactions), [transactions]);
  const expenseBreakdown = useMemo(() => getExpensesByCategory(expenses), [expenses]);
  const topStaff = staffStats[0];

  // Last 7 days revenue trend
  const revenueTrend = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = 0;
    }
    transactions.forEach(t => {
      if (days[t.date] !== undefined) days[t.date] += t.amount;
    });
    return Object.entries(days).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue,
    }));
  }, [transactions]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Your salon at a glance" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Revenue" value={fmt(todayRevenue)} icon={IndianRupee} />
        <StatCard title="Today's Expenses" value={fmt(todayExpenses)} icon={TrendingDown} />
        <StatCard
          title="Today's Profit"
          value={fmt(todayProfit)}
          icon={TrendingUp}
          trend={todayProfit >= 0 ? "Profitable" : "Loss"}
          trendUp={todayProfit >= 0}
        />
        <StatCard
          title="Top Performer"
          value={topStaff ? topStaff.name : "—"}
          icon={Star}
          trend={topStaff ? `${fmt(topStaff.revenue)} total` : undefined}
          trendUp
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stat-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Revenue Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,15%,90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(350,45%,55%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Staff Performance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Staff Revenue</h3>
          {staffStats.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No data yet. Record some payments!</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={staffStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30,15%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(20,10%,50%)" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {staffStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="stat-card lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="amount"
                    nameKey="category"
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3">
                {expenseBreakdown.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{e.category}</span>
                    <span className="font-medium text-foreground">{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

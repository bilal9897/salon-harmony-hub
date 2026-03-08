import { IndianRupee, TrendingUp, TrendingDown, Star, LayoutDashboard, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useExpenses, getToday, getStaffStats, getExpensesByCategory } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CHART_COLORS = [
  "hsl(174, 60%, 36%)",
  "hsl(38, 85%, 52%)",
  "hsl(152, 58%, 38%)",
  "hsl(0, 65%, 55%)",
  "hsl(210, 70%, 50%)",
  "hsl(28, 80%, 52%)",
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

  const revenueTrend = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    transactions.forEach(t => {
      if (days[t.date] !== undefined) days[t.date] += t.amount;
    });
    return Object.entries(days).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      revenue,
    }));
  }, [transactions]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your salon's performance"
        icon={LayoutDashboard}
        actions={
          <Link to="/payments">
            <Button size="sm" className="gap-2 rounded-xl">
              New Payment <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      <div className="page-grid">
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
          trend={topStaff ? fmt(topStaff.revenue) : undefined}
          trendUp
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated">
          <h3 className="section-title mb-5">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(174, 60%, 36%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(174, 60%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,13%,89%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(30,8%,46%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(30,8%,46%)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(40,13%,89%)', fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(174,60%,36%)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: 'hsl(174,60%,36%)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-elevated">
          <h3 className="section-title mb-5">Staff Revenue</h3>
          {staffStats.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No data yet — record some payments!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={staffStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,13%,89%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(30,8%,46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(30,8%,46%)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(40,13%,89%)', fontSize: 13 }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {staffStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated lg:col-span-2">
          <h3 className="section-title mb-5">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <ResponsiveContainer width={280} height={220}>
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="amount" nameKey="category" paddingAngle={4} strokeWidth={0}>
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(40,13%,89%)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {expenseBreakdown.map((e, i) => (
                  <div key={e.category} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{e.category}</span>
                    <span className="text-sm font-semibold text-foreground">{fmt(e.amount)}</span>
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

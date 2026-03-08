import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useExpenses, useDailyCash, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Wallet, ArrowDownRight, ArrowUpRight, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DailyCash() {
  const { transactions } = useTransactions();
  const { expenses } = useExpenses();
  const { dailyCashEntries, setDailyCash } = useDailyCash();
  const [date, setDate] = useState(getToday());
  const [actualCash, setActualCash] = useState("");

  const dayTx = useMemo(() => transactions.filter(t => t.date === date), [transactions, date]);
  const dayExp = useMemo(() => expenses.filter(e => e.date === date), [expenses, date]);

  const totalRevenue = dayTx.reduce((s, t) => s + t.amount, 0);
  const cashRevenue = dayTx.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = dayExp.reduce((s, e) => s + e.amount, 0);
  const expectedCash = cashRevenue - totalExpenses;

  const entry = dailyCashEntries.find(e => e.date === date);
  const difference = entry ? entry.actualCash - expectedCash : null;

  const handleSave = () => {
    if (!actualCash || Number(actualCash) < 0) {
      toast.error("Enter a valid cash amount.");
      return;
    }
    setDailyCash({ date, actualCash: Number(actualCash) });
    toast.success("Daily cash recorded!");
  };

  const cards = [
    { label: "Total Revenue", value: fmt(totalRevenue), sub: `Cash: ${fmt(cashRevenue)}`, icon: ArrowUpRight, iconClass: "text-success" },
    { label: "Total Expenses", value: fmt(totalExpenses), icon: ArrowDownRight, iconClass: "text-destructive" },
    { label: "Expected Cash", value: fmt(expectedCash), sub: "Cash revenue − expenses", icon: Wallet, iconClass: "text-primary" },
  ];

  return (
    <div>
      <PageHeader title="Daily Cash" description="Compare expected vs actual cash at end of day" icon={Wallet} />

      <div className="mb-6">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Select Date</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1.5 w-48 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card-elevated">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
              <c.icon className={`h-3.5 w-3.5 ${c.iconClass}`} /> {c.label}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{c.value}</p>
            {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <Scale className="h-3.5 w-3.5 text-accent-foreground" /> Difference
          </div>
          {difference !== null ? (
            <>
              <p className={`text-2xl font-display font-bold ${difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                {difference >= 0 ? '+' : ''}{fmt(difference)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {difference >= 0 ? (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {difference === 0 ? "Perfect match!" : difference > 0 ? "Surplus" : "Shortage"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">—</p>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated max-w-md">
        <h3 className="section-title mb-4">Enter Actual Cash</h3>
        <div className="flex gap-3">
          <Input
            type="number"
            min="0"
            placeholder="Enter cash in hand"
            value={actualCash}
            onChange={e => setActualCash(e.target.value)}
            className="rounded-xl"
          />
          <Button onClick={handleSave} className="rounded-xl">Save</Button>
        </div>
        {entry && (
          <p className="mt-3 text-sm text-muted-foreground">
            Recorded: <span className="font-medium text-foreground">{fmt(entry.actualCash)}</span>
          </p>
        )}
      </motion.div>
    </div>
  );
}

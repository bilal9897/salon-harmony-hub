import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useStaffMembers, useServiceTypes, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CreditCard, IndianRupee, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function ChipSelect({ items, value, onChange, label }: { items: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item === value ? "" : item)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 border ${
              value === item
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent/50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Payments() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { staff } = useStaffMembers();
  const { services } = useServiceTypes();
  const [serviceType, setServiceType] = useState("");
  const [staffMember, setStaffMember] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !staffMember || !amount || Number(amount) <= 0) {
      toast.error("Please select service, staff, and enter amount.");
      return;
    }
    addTransaction({
      clientName: "Walk-in",
      serviceType,
      staffMember,
      amount: Number(amount),
      paymentMethod,
      date,
      time,
    });
    toast.success("✅ Payment recorded!");
    setAmount("");
    setServiceType("");
  };

  const lastTx = transactions[0];
  const handleRepeat = () => {
    if (!lastTx) return;
    setServiceType(lastTx.serviceType);
    setStaffMember(lastTx.staffMember);
    setAmount(String(lastTx.amount));
    setPaymentMethod(lastTx.paymentMethod);
    toast.info("Last payment loaded — tap Add to confirm");
  };

  return (
    <div>
      <PageHeader title="Payments" description="Quick-add client payments" icon={CreditCard} />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="form-section space-y-5"
      >
        <ChipSelect items={services} value={serviceType} onChange={setServiceType} label="Service" />
        <ChipSelect items={staff} value={staffMember} onChange={setStaffMember} label="Staff" />

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
          <div className="flex flex-wrap gap-2">
            {[200, 500, 1000, 1500, 2000].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 border ${
                  amount === String(preset)
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                    : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent/50"
                }`}
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="number" min="1" placeholder="Custom amount" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl h-12 text-lg pl-9 font-semibold" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Method</Label>
            <div className="flex rounded-xl border overflow-hidden h-12">
              {(["cash", "online"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 text-sm font-medium transition-colors ${
                    paymentMethod === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m === "cash" ? "💵 Cash" : "📱 Online"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="space-y-2 flex-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl h-10" />
            </div>
            <div className="space-y-2 w-24">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl h-10" />
            </div>
          </div>

          <div className="flex gap-2">
            {lastTx && (
              <Button type="button" variant="outline" onClick={handleRepeat} className="gap-2 rounded-xl h-12 text-base">
                <RotateCcw className="h-4 w-4" /> Repeat Last
              </Button>
            )}
            <Button type="submit" className="gap-2 rounded-xl h-12 text-base flex-1">
              <Plus className="h-4 w-4" /> Add Payment
            </Button>
          </div>
        </div>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated overflow-hidden">
        <h3 className="section-title px-6 pt-5 pb-3">Recent Payments</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Service</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Staff</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Method</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Date & Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                    <div className="space-y-2">
                      <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p>No payments yet — add one above!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.slice(0, 50).map(t => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium">{t.serviceType}</TableCell>
                    <TableCell>{t.staffMember}</TableCell>
                    <TableCell className="font-semibold">₹{t.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <span className={`badge-soft ${t.paymentMethod === 'cash' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                        {t.paymentMethod === 'cash' ? '💵 Cash' : '📱 Online'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.date} · {t.time}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => { deleteTransaction(t.id); toast.info("Deleted"); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}

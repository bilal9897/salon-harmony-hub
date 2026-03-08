import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useStaffMembers, useServiceTypes, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CreditCard, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  return (
    <div>
      <PageHeader title="Payments" description="Quick-add client payments" icon={CreditCard} />

      {/* Quick Entry Form — big tap targets, minimal fields */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="form-section"
      >
        {/* Row 1: The 3 essential fields */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="rounded-xl h-12 text-base">
                <SelectValue placeholder="Choose service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff</Label>
            <Select value={staffMember} onValueChange={setStaffMember}>
              <SelectTrigger className="rounded-xl h-12 text-base">
                <SelectValue placeholder="Choose staff" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                placeholder="500"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="rounded-xl h-12 text-base pl-9"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Payment method toggle + date/time + submit */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {/* Payment toggle buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Method</Label>
            <div className="flex rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                  paymentMethod === "cash"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                  paymentMethod === "online"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                📱 Online
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl h-10 w-40" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</Label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl h-10 w-32" />
          </div>

          <Button type="submit" className="gap-2 rounded-xl h-10 px-6 ml-auto">
            <Plus className="h-4 w-4" /> Add Payment
          </Button>
        </div>
      </motion.form>

      {/* Recent Payments */}
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
                    <TableCell className="text-muted-foreground text-sm">
                      {t.date} · {t.time}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => { deleteTransaction(t.id); toast.info("Deleted"); }}
                      >
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

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useStaffMembers, useServiceTypes, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Payments() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { staff } = useStaffMembers();
  const { services } = useServiceTypes();
  const [clientName, setClientName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [staffMember, setStaffMember] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !staffMember || !amount || Number(amount) <= 0) {
      toast.error("Please fill in service, staff, and a valid amount.");
      return;
    }
    addTransaction({
      clientName: clientName.trim() || "Walk-in",
      serviceType,
      staffMember,
      amount: Number(amount),
      paymentMethod,
      date,
      time,
    });
    toast.success("Payment recorded!");
    setClientName("");
    setAmount("");
    setServiceType("");
  };

  return (
    <div>
      <PageHeader title="Client Payments" description="Record and manage client transactions" icon={CreditCard} />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="form-section"
      >
        <h3 className="section-title mb-5">New Transaction</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client Name</Label>
            <Input placeholder="Walk-in" value={clientName} onChange={e => setClientName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Service *</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Staff *</Label>
            <Select value={staffMember} onValueChange={setStaffMember}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>
                {staff.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹) *</Label>
            <Input type="number" min="1" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as "cash" | "online")}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="online">📱 Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</Label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full gap-2 rounded-xl h-10">
              <Plus className="h-4 w-4" /> Record
            </Button>
          </div>
        </div>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Service</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Staff</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Method</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Time</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                    <div className="space-y-2">
                      <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p>No payments recorded yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.slice(0, 50).map(t => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium">{t.clientName}</TableCell>
                    <TableCell>{t.serviceType}</TableCell>
                    <TableCell>{t.staffMember}</TableCell>
                    <TableCell className="font-semibold">₹{t.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <span className={`badge-soft ${t.paymentMethod === 'cash' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                        {t.paymentMethod === 'cash' ? '💵 Cash' : '📱 Online'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="text-muted-foreground">{t.time}</TableCell>
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

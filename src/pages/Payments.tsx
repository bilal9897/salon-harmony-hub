import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, SERVICE_TYPES, STAFF_MEMBERS, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Payments() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
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
      <PageHeader title="Client Payments" description="Record and manage client transactions" />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="stat-card mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-1.5">
          <Label>Client Name</Label>
          <Input placeholder="Walk-in" value={clientName} onChange={e => setClientName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Service Type *</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Staff Member *</Label>
          <Select value={staffMember} onValueChange={setStaffMember}>
            <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
            <SelectContent>
              {STAFF_MEMBERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹) *</Label>
          <Input type="number" min="1" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as "cash" | "online")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Time</Label>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full gap-2">
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </div>
      </motion.form>

      <div className="stat-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.slice(0, 50).map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.clientName}</TableCell>
                  <TableCell>{t.serviceType}</TableCell>
                  <TableCell>{t.staffMember}</TableCell>
                  <TableCell>₹{t.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.paymentMethod === 'cash' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                      {t.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.time}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { deleteTransaction(t.id); toast.info("Deleted"); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

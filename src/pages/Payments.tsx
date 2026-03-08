import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTransactions, useStaffMembers, useExpenses, useReportContacts, useAmountPresets, useServiceTypes, EXPENSE_CATEGORIES, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, CreditCard, IndianRupee, RotateCcw, Receipt, FileDown, MessageCircle, Mail } from "lucide-react";
import { generateDailyReport } from "@/lib/pdf-report";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ActiveTab = "payment" | "expense";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("payment");

  // Payment state
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { staff } = useStaffMembers();
  const { services } = useServiceTypes();
  const [staffMember, setStaffMember] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [payDate, setPayDate] = useState(getToday());
  const [payTime, setPayTime] = useState(new Date().toTimeString().slice(0, 5));

  // Report contacts
  const { whatsapp, gmail, salonName } = useReportContacts();
  const { paymentPresets, expensePresets } = useAmountPresets();

  // Expense state
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState(getToday());

  const today = getToday();
  const dayTx = transactions.filter(t => t.date === today);
  const dayExp = expenses.filter(e => e.date === today);
  const totalRevenue = dayTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = dayExp.reduce((s, e) => s + e.amount, 0);
  const cashRevenue = dayTx.filter(t => t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0);
  const onlineRevenue = totalRevenue - cashRevenue;

  const buildReportText = () => {
    const dateLabel = new Date(today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    let text = `✂️ *${salonName} — Daily Report*\n📅 ${dateLabel}\n\n`;
    text += `💰 Revenue: ₹${totalRevenue.toLocaleString("en-IN")}\n`;
    text += `💵 Cash: ₹${cashRevenue.toLocaleString("en-IN")}\n`;
    text += `📱 Online: ₹${onlineRevenue.toLocaleString("en-IN")}\n`;
    text += `🔴 Expenses: ₹${totalExpenses.toLocaleString("en-IN")}\n`;
    text += `✅ Net Profit: ₹${(totalRevenue - totalExpenses).toLocaleString("en-IN")}\n`;
    text += `📊 Transactions: ${dayTx.length}\n`;

    if (dayTx.length > 0) {
      text += `\n📋 *Payments*\n`;
      text += `━━━━━━━━━━━━━━━━━━━\n`;
      dayTx.forEach((t, i) => {
        text += `${i + 1}. ${t.staffMember} — ₹${t.amount.toLocaleString("en-IN")} (${t.paymentMethod === "cash" ? "💵" : "📱"})\n`;
      });
    }

    if (dayExp.length > 0) {
      text += `\n🔴 *Expenses*\n`;
      text += `━━━━━━━━━━━━━━━━━━━\n`;
      dayExp.forEach((e, i) => {
        text += `${i + 1}. ${e.category}${e.description ? ` - ${e.description}` : ""} — ₹${e.amount.toLocaleString("en-IN")}\n`;
      });
    }

    return text;
  };

  const shareWhatsApp = () => {
    const text = buildReportText();
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareGmail = () => {
    const text = buildReportText().replace(/\*/g, "");
    const subject = `Fresh Saloon — Daily Report ${today}`;
    const mailtoLink = `mailto:${encodeURIComponent(gmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = mailtoLink;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMember || !payAmount || Number(payAmount) <= 0) {
      toast.error("Please select staff and enter amount.");
      return;
    }
    addTransaction({
      clientName: "Walk-in",
      serviceType: serviceType || "General",
      staffMember,
      amount: Number(payAmount),
      paymentMethod,
      date: payDate,
      time: payTime,
    });
    toast.success("✅ Payment recorded!");
    setPayAmount("");
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCategory || !expAmount || Number(expAmount) <= 0) {
      toast.error("Please select category and enter amount.");
      return;
    }
    addExpense({
      category: expCategory,
      amount: Number(expAmount),
      description: expDescription.trim(),
      date: expDate,
    });
    toast.success("Expense recorded!");
    setExpAmount("");
    setExpDescription("");
    setExpCategory("");
  };

  const lastTx = transactions[0];
  const handleRepeat = () => {
    if (!lastTx) return;
    setStaffMember(lastTx.staffMember);
    setPayAmount(String(lastTx.amount));
    setPaymentMethod(lastTx.paymentMethod);
    toast.info("Last payment loaded — tap Add to confirm");
  };

  return (
    <div>
      <PageHeader
        title="Payments & Expenses"
        description="Record income and expenses in one place"
        icon={CreditCard}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={shareWhatsApp}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={shareGmail}
            >
              <Mail className="h-4 w-4" /> Gmail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => {
                generateDailyReport(getToday(), transactions, expenses);
                toast.success("Daily report downloaded!");
              }}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-150 border ${
            activeTab === "payment"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent/50"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Payment
        </button>
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-150 border ${
            activeTab === "expense"
              ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
              : "bg-card text-foreground border-border hover:border-destructive/40 hover:bg-destructive/5"
          }`}
        >
          <Receipt className="h-4 w-4" /> Expense
        </button>
      </div>

      {/* PAYMENT FORM */}
      {activeTab === "payment" && (
        <motion.form
          key="payment"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handlePaymentSubmit}
          className="form-section space-y-5"
        >
          <ChipSelect items={staff} value={staffMember} onChange={setStaffMember} label="Staff" />

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
            <div className="flex flex-wrap gap-2">
              {paymentPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPayAmount(String(preset))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 border ${
                    payAmount === String(preset)
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
              <Input type="number" min="1" placeholder="Custom amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="rounded-xl h-12 text-lg pl-9 font-semibold" />
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
                <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="rounded-xl h-10" />
              </div>
              <div className="space-y-2 w-24">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</Label>
                <Input type="time" value={payTime} onChange={e => setPayTime(e.target.value)} className="rounded-xl h-10" />
              </div>
            </div>

            <div className="flex gap-2">
              {lastTx && (
                <Button type="button" variant="outline" onClick={handleRepeat} className="gap-2 rounded-xl h-12 text-base">
                  <RotateCcw className="h-4 w-4" /> Repeat
                </Button>
              )}
              <Button type="submit" className="gap-2 rounded-xl h-12 text-base flex-1">
                <Plus className="h-4 w-4" /> Add Payment
              </Button>
            </div>
          </div>
        </motion.form>
      )}

      {/* EXPENSE FORM */}
      {activeTab === "expense" && (
        <motion.form
          key="expense"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleExpenseSubmit}
          className="form-section space-y-5"
        >
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category *</Label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setExpCategory(c === expCategory ? "" : c)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 border ${
                    expCategory === c
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-sm scale-[1.02]"
                      : "bg-card text-foreground border-border hover:border-destructive/40 hover:bg-destructive/5"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹) *</Label>
            <div className="flex flex-wrap gap-2">
              {expensePresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setExpAmount(String(preset))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 border ${
                    expAmount === String(preset)
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-sm scale-[1.02]"
                      : "bg-card text-foreground border-border hover:border-destructive/40 hover:bg-destructive/5"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <Input type="number" min="1" placeholder="Custom amount" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="rounded-xl" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input placeholder="e.g. Tea for staff" value={expDescription} onChange={e => setExpDescription(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <Button type="submit" variant="destructive" className="gap-2 rounded-xl h-12 text-base">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </motion.form>
      )}

      {/* RECENT ENTRIES */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated overflow-hidden">
        <h3 className="section-title px-6 pt-5 pb-3">
          {activeTab === "payment" ? "Recent Payments" : "Recent Expenses"}
        </h3>
        <div className="overflow-x-auto">
          {activeTab === "payment" ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                      <div className="space-y-2">
                        <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p>No payments yet — add one above!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 50).map(t => (
                    <TableRow key={t.id} className="group">
                      <TableCell className="font-medium">{t.staffMember}</TableCell>
                      <TableCell className="font-semibold">₹{t.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <span className={`badge-soft ${t.paymentMethod === 'cash' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                          {t.paymentMethod === 'cash' ? '💵 Cash' : '📱 Online'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.date} · {t.time}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => { deleteTransaction(t.id); toast.info("Deleted"); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {transactions.length > 0 && (
                  <TableRow className="bg-muted/30 font-semibold border-t-2 border-border">
                    <TableCell>Total ({transactions.slice(0, 50).length})</TableCell>
                    <TableCell className="font-bold text-primary">₹{transactions.slice(0, 50).reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                      <div className="space-y-2">
                        <Receipt className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p>No expenses recorded yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.slice(0, 50).map(e => (
                    <TableRow key={e.id} className="group">
                      <TableCell>
                        <span className="badge-soft bg-destructive/10 text-destructive">{e.category}</span>
                      </TableCell>
                      <TableCell className="font-semibold">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{e.description || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{e.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => { deleteExpense(e.id); toast.info("Deleted"); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {expenses.length > 0 && (
                  <TableRow className="bg-muted/30 font-semibold border-t-2 border-border">
                    <TableCell>Total ({expenses.slice(0, 50).length})</TableCell>
                    <TableCell className="font-bold text-destructive">₹{expenses.slice(0, 50).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>
    </div>
  );
}

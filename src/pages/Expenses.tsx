import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useExpenses, EXPENSE_CATEGORIES, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Expenses() {
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getToday());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || Number(amount) <= 0) {
      toast.error("Please select a category and enter a valid amount.");
      return;
    }
    addExpense({
      category,
      amount: Number(amount),
      description: description.trim(),
      date,
    });
    toast.success("Expense recorded!");
    setAmount("");
    setDescription("");
    setCategory("");
  };

  return (
    <div>
      <PageHeader title="Expenses" description="Track your salon's daily operational costs" icon={Receipt} />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="form-section"
      >
        <h3 className="section-title mb-5">New Expense</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category *</Label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c === category ? "" : c)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 border ${
                    category === c
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (₹) *</Label>
            <Input type="number" min="1" placeholder="1000" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
            <Input placeholder="e.g. Shampoo purchase" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
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
                      <span className="badge-soft bg-accent text-accent-foreground">
                        {e.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{e.description || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.date}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => { deleteExpense(e.id); toast.info("Deleted"); }}
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

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useExpenses, EXPENSE_CATEGORIES, getToday } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
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
      <PageHeader title="Expenses" description="Track your salon's daily operational costs" />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="stat-card mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₹) *</Label>
          <Input type="number" min="1" placeholder="1000" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input placeholder="e.g. Shampoo purchase" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </motion.form>

      <div className="stat-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No expenses recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              expenses.slice(0, 50).map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {e.category}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-muted-foreground">{e.description || "—"}</TableCell>
                  <TableCell>{e.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { deleteExpense(e.id); toast.info("Deleted"); }}>
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

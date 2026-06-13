import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMenu } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Menu() {
  const { items, addItem, updateItem, removeItem } = useMenu();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const handleAdd = () => {
    const p = Number(price);
    if (!name.trim() || !category.trim() || !p) {
      toast.error("Fill name, category and price");
      return;
    }
    addItem({ name: name.trim(), category: category.trim(), price: p });
    setName(""); setPrice("");
    toast.success("Item added");
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="space-y-6">
      <PageHeader title="Cafe Menu" description="Manage menu items and prices" />

      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Add new item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Cappuccino" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Beverages" list="cat-list" />
            <datalist id="cat-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-xs">Price (Rs.)</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="80" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleAdd}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
          <div className="rounded-2xl border bg-card divide-y">
            {items.filter(i => i.category === cat).map(item => (
              <div key={item.id} className="flex items-center gap-2 p-3">
                <Input
                  defaultValue={item.name}
                  onBlur={e => e.target.value !== item.name && updateItem(item.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  defaultValue={item.category}
                  onBlur={e => e.target.value !== item.category && updateItem(item.id, { category: e.target.value })}
                  className="w-32"
                />
                <Input
                  type="number"
                  defaultValue={item.price}
                  onBlur={e => Number(e.target.value) !== item.price && updateItem(item.id, { price: Number(e.target.value) })}
                  className="w-24"
                />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
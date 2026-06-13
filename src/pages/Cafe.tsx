import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMenu, useTables, useOpenOrders, useTransactions, useStaffMembers, getToday, type OpenOrder, type OrderLine, type MenuItem } from "@/lib/store";
import { Plus, Minus, Trash2, Receipt, ShoppingBag, Bike, Utensils, X } from "lucide-react";
import { toast } from "sonner";

type OrderType = "dine-in" | "takeaway" | "delivery";

export default function Cafe() {
  const { items: menu } = useMenu();
  const { tables, addTable, removeTable } = useTables();
  const { orders, upsertOrder, closeOrder } = useOpenOrders();
  const { addTransaction } = useTransactions();
  const { staff } = useStaffMembers();

  const [activeOrder, setActiveOrder] = useState<OpenOrder | null>(null);
  const [newTableName, setNewTableName] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");

  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map(m => m.category)))], [menu]);
  const [cat, setCat] = useState("All");

  const openTable = (tableName: string) => {
    const existing = orders.find(o => o.tableName === tableName);
    if (existing) {
      setActiveOrder(existing);
    } else {
      setActiveOrder({
        id: crypto.randomUUID(),
        tableName,
        orderType: "dine-in",
        lines: [],
        createdAt: new Date().toISOString(),
      });
    }
  };

  const startQuickOrder = (type: OrderType) => {
    const label = type === "takeaway" ? `Takeaway #${orders.filter(o => o.orderType === "takeaway").length + 1}` : `Delivery #${orders.filter(o => o.orderType === "delivery").length + 1}`;
    setActiveOrder({
      id: crypto.randomUUID(),
      tableName: label,
      orderType: type,
      lines: [],
      createdAt: new Date().toISOString(),
    });
  };

  const addLine = (item: MenuItem) => {
    if (!activeOrder) return;
    const existing = activeOrder.lines.find(l => l.itemId === item.id);
    const lines = existing
      ? activeOrder.lines.map(l => l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l)
      : [...activeOrder.lines, { itemId: item.id, name: item.name, price: item.price, qty: 1 }];
    const next = { ...activeOrder, lines };
    setActiveOrder(next);
    upsertOrder(next);
  };

  const changeQty = (itemId: string, delta: number) => {
    if (!activeOrder) return;
    const lines = activeOrder.lines
      .map(l => l.itemId === itemId ? { ...l, qty: l.qty + delta } : l)
      .filter(l => l.qty > 0);
    const next = { ...activeOrder, lines };
    setActiveOrder(next);
    upsertOrder(next);
  };

  const removeLine = (itemId: string) => {
    if (!activeOrder) return;
    const next = { ...activeOrder, lines: activeOrder.lines.filter(l => l.itemId !== itemId) };
    setActiveOrder(next);
    upsertOrder(next);
  };

  const setStaff = (s: string) => {
    if (!activeOrder) return;
    const next = { ...activeOrder, staffMember: s };
    setActiveOrder(next);
    upsertOrder(next);
  };

  const orderTotal = (o: OpenOrder) => o.lines.reduce((s, l) => s + l.price * l.qty, 0);

  const completePayment = () => {
    if (!activeOrder) return;
    const subtotal = orderTotal(activeOrder);
    const tip = Number(tipAmount) || 0;
    const total = subtotal + tip;
    if (total <= 0) {
      toast.error("Add items to the order first");
      return;
    }
    const summary = activeOrder.lines.map(l => `${l.name} x${l.qty}`).join(", ");
    addTransaction({
      clientName: activeOrder.tableName,
      serviceType: `${activeOrder.orderType.toUpperCase()} — ${summary}${tip ? ` (Tip Rs.${tip})` : ""}`,
      staffMember: activeOrder.staffMember || (staff[0] ?? ""),
      amount: total,
      paymentMethod,
      date: getToday(),
      time: new Date().toTimeString().slice(0, 5),
    });
    closeOrder(activeOrder.id);
    toast.success(`Order closed • Rs.${total}`);
    setActiveOrder(null);
    setPayOpen(false);
    setTipAmount("");
  };

  const filteredMenu = cat === "All" ? menu : menu.filter(m => m.category === cat);

  const tableStatus = (t: string) => orders.find(o => o.tableName === t);

  return (
    <div className="space-y-6">
      <PageHeader title="Cafe — Tables & Orders" description="Take orders, manage tables, and close bills" />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => startQuickOrder("takeaway")} variant="outline" size="sm" className="rounded-xl">
          <ShoppingBag className="h-4 w-4 mr-1.5" /> Takeaway
        </Button>
        <Button onClick={() => startQuickOrder("delivery")} variant="outline" size="sm" className="rounded-xl">
          <Bike className="h-4 w-4 mr-1.5" /> Delivery
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            placeholder="New table (e.g. T7)"
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
            className="w-36 h-9 rounded-xl"
          />
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => { if (newTableName.trim()) { addTable(newTableName.trim()); setNewTableName(""); } }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tables.map(t => {
          const order = tableStatus(t);
          const occupied = !!order;
          return (
            <button
              key={t}
              onClick={() => openTable(t)}
              className={`relative rounded-2xl border p-4 text-left transition-all ${
                occupied
                  ? "bg-primary/10 border-primary/40 hover:bg-primary/15"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${occupied ? "text-primary" : "text-muted-foreground"}`}>
                  {occupied ? "Occupied" : "Free"}
                </span>
              </div>
              <div className="mt-2 font-display text-xl font-bold">{t}</div>
              {order ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {order.lines.length} items • Rs.{orderTotal(order)}
                </div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">Tap to open</div>
              )}
              {!occupied && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeTable(t); }}
                  className="absolute top-1 right-1 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {orders.filter(o => o.orderType !== "dine-in").length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Open Takeaway / Delivery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {orders.filter(o => o.orderType !== "dine-in").map(o => (
              <button
                key={o.id}
                onClick={() => setActiveOrder(o)}
                className="rounded-xl border bg-card p-3 text-left hover:border-primary/40"
              >
                <div className="text-sm font-semibold">{o.tableName}</div>
                <div className="text-xs text-muted-foreground">{o.lines.length} items • Rs.{orderTotal(o)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={!!activeOrder} onOpenChange={(v) => !v && setActiveOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeOrder?.tableName} — {activeOrder?.orderType}</DialogTitle>
          </DialogHeader>

          {activeOrder && (
            <div className="grid md:grid-cols-[1fr_320px] gap-4">
              {/* Menu */}
              <div className="space-y-3">
                <Tabs value={cat} onValueChange={setCat}>
                  <TabsList className="flex-wrap h-auto">
                    {categories.map(c => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
                  </TabsList>
                </Tabs>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredMenu.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addLine(item)}
                      className="rounded-xl border bg-card p-3 text-left hover:border-primary/40 hover:bg-accent/30 transition-all"
                    >
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                      <div className="mt-1 text-sm font-bold text-primary">Rs.{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div className="rounded-2xl border bg-card/50 p-3 flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Order</div>
                <div className="flex-1 space-y-2 max-h-[40vh] overflow-y-auto">
                  {activeOrder.lines.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No items yet — tap menu to add</p>
                  )}
                  {activeOrder.lines.map(l => (
                    <div key={l.itemId} className="flex items-center gap-2 rounded-lg bg-background p-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{l.name}</div>
                        <div className="text-xs text-muted-foreground">Rs.{l.price} × {l.qty}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeQty(l.itemId, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-sm font-semibold w-5 text-center">{l.qty}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeQty(l.itemId, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLine(l.itemId)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>

                {staff.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Waiter</Label>
                    <div className="flex flex-wrap gap-1">
                      {staff.map(s => (
                        <button
                          key={s}
                          onClick={() => setStaff(s)}
                          className={`text-xs rounded-lg px-2 py-1 border ${activeOrder.staffMember === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-xl font-bold">Rs.{orderTotal(activeOrder)}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => { if (activeOrder) { closeOrder(activeOrder.id); setActiveOrder(null); toast.success("Order discarded"); } }}>
                    Discard
                  </Button>
                  <Button onClick={() => setPayOpen(true)} disabled={activeOrder.lines.length === 0}>
                    <Receipt className="h-4 w-4 mr-1.5" /> Bill
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Bill</DialogTitle>
          </DialogHeader>
          {activeOrder && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-3 space-y-1 text-sm">
                {activeOrder.lines.map(l => (
                  <div key={l.itemId} className="flex justify-between">
                    <span>{l.name} × {l.qty}</span>
                    <span>Rs.{l.price * l.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Subtotal</span><span>Rs.{orderTotal(activeOrder)}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">Tip (optional)</Label>
                <Input type="number" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <div className="flex gap-2 mt-1">
                  {(["cash", "online"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium border ${paymentMethod === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                    >{m === "cash" ? "Cash" : "Online"}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>Rs.{orderTotal(activeOrder) + (Number(tipAmount) || 0)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={completePayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
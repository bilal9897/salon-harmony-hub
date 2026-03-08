import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useStaffMembers } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Plus, Trash2, Pencil, Check, X, Users, Download, Upload, Smartphone, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function EditableList({
  title,
  icon: Icon,
  items,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onUpdate: (oldName: string, newName: string) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error("Already exists!");
      return;
    }
    onAdd(trimmed);
    setNewItem("");
    toast.success(`Added "${trimmed}"`);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditing(null);
      return;
    }
    if (items.includes(trimmed)) {
      toast.error("Already exists!");
      return;
    }
    onUpdate(oldName, trimmed);
    setEditing(null);
    toast.success("Updated!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="text-xs text-muted-foreground">{items.length} items</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="rounded-xl"
        />
        <Button onClick={handleAdd} size="icon" className="rounded-xl shrink-0 h-10 w-10">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item}
            className="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
          >
            {editing === item ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item)}
                  className="h-8 rounded-lg text-sm flex-1"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveEdit(item)}>
                  <Check className="h-3.5 w-3.5 text-success" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-foreground">{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setEditing(item); setEditValue(item); }}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { onRemove(item); toast.info(`Removed "${item}"`); }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("Open this app in Chrome/Edge browser, then try again");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("App installed successfully!");
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8">
          <Smartphone className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="section-title">Install App</h3>
          <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
        </div>
      </div>
      {isInstalled ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" /> App is already installed
        </p>
      ) : (
        <Button onClick={handleInstall} className="w-full rounded-xl gap-2">
          <Download className="h-4 w-4" />
          Install Fresh Saloon
        </Button>
      )}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { staff, addStaff, removeStaff, updateStaff } = useStaffMembers();

  return (
    <div>
      <PageHeader title="Settings" description="Personal salon management" icon={SettingsIcon} />

      <div className="max-w-lg space-y-6">
        <InstallPWA />

        <EditableList
          title="Staff Members"
          icon={Users}
          items={staff}
          onAdd={addStaff}
          onRemove={removeStaff}
          onUpdate={updateStaff}
          placeholder="Add new staff member..."
        />
      </div>
    </div>
  );
}

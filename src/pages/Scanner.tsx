import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, ScanLine, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Scanner() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    toast.info("AI Scanner requires Lovable Cloud to be enabled. This feature will use OCR to extract text from handwritten records and auto-fill payment forms.");
  };

  return (
    <div>
      <PageHeader title="AI Record Scanner" description="Upload a photo of handwritten records to extract data" />

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Upload Record
          </h3>

          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg object-contain" />
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Click or drag to upload a photo</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, HEIC</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <Button
            onClick={handleScan}
            disabled={!imagePreview}
            className="mt-4 w-full gap-2"
          >
            <Sparkles className="h-4 w-4" /> Scan with AI
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-accent" />
            How It Works
          </h3>

          <div className="space-y-4">
            {[
              { step: "1", title: "Upload Photo", desc: "Take or upload a photo of your handwritten daily records" },
              { step: "2", title: "AI Extracts Data", desc: "Our AI reads the handwriting and identifies services, staff names, and amounts" },
              { step: "3", title: "Review & Confirm", desc: "Check the extracted data, make edits if needed, then save" },
              { step: "4", title: "Auto-Fill Forms", desc: "Transactions are automatically added to your payment records" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> To enable AI scanning, Lovable Cloud needs to be connected. This will provide OCR capabilities to read handwritten notes and extract transaction data automatically.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

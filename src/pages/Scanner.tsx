import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ScanLine, Sparkles, ArrowRight } from "lucide-react";
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
    toast.info("AI Scanner requires Lovable Cloud to be enabled for OCR processing.");
  };

  const steps = [
    { step: "1", title: "Upload Photo", desc: "Take or upload a photo of your handwritten daily records" },
    { step: "2", title: "AI Extracts Data", desc: "Our AI reads the handwriting and identifies services, staff names, and amounts" },
    { step: "3", title: "Review & Confirm", desc: "Check the extracted data, make edits if needed, then save" },
    { step: "4", title: "Auto-Fill Forms", desc: "Transactions are automatically added to your payment records" },
  ];

  return (
    <div>
      <PageHeader title="AI Record Scanner" description="Upload a photo of handwritten records to extract data" icon={ScanLine} />

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
          <h3 className="section-title mb-5 flex items-center gap-2">
            <Camera className="h-4.5 w-4.5 text-primary" />
            Upload Record
          </h3>

          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/20 p-10 text-center transition-all duration-200 hover:border-primary/30 hover:bg-accent/30"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto max-h-56 rounded-xl object-contain" />
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Click to upload a photo</p>
                <p className="text-xs text-muted-foreground">JPG, PNG — max 10MB</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <Button
            onClick={handleScan}
            disabled={!imagePreview}
            className="mt-5 w-full gap-2 rounded-xl"
          >
            <Sparkles className="h-4 w-4" /> Scan with AI
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated">
          <h3 className="section-title mb-5 flex items-center gap-2">
            <ScanLine className="h-4.5 w-4.5 text-accent-foreground" />
            How It Works
          </h3>

          <div className="space-y-5">
            {steps.map((item, i) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-accent/40 p-4">
            <p className="text-sm text-accent-foreground">
              <strong>Note:</strong> Enable Lovable Cloud to activate AI-powered OCR scanning for handwritten records.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

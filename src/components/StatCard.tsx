import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className = "" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`card-elevated group ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${trendUp ? 'bg-success' : 'bg-destructive'}`} />
              <span className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 transition-transform duration-200 group-hover:scale-110">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

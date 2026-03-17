import { useState, useRef, useEffect } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { LogEntry } from "@/lib/api";
import { formatTimestamp } from "@/lib/log-utils";

interface AlertBellProps {
  alerts: LogEntry[];
}

export function AlertBell({ alerts }: AlertBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-log-error px-1 text-[10px] font-bold text-primary-foreground shadow-[0_0_8px_hsl(var(--log-error)/0.4)]">
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[400px] glass-card shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-log-error" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Error Alerts
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground rounded-md bg-secondary/60 px-2 py-0.5">
                {alerts.length} total
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Bell className="h-6 w-6 text-muted/50" />
                  No alerts — system healthy
                </div>
              ) : (
                alerts.slice(0, 20).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 border-b border-border/20 px-4 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-log-error shadow-[0_0_6px_hsl(var(--log-error)/0.5)] pulse-glow" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">{alert.message}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span className="text-primary">{alert.serviceName}</span>
                        <span className="text-border">·</span>
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

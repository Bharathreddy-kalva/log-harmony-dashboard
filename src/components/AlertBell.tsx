import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
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
        className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-log-error px-1 text-[10px] font-bold text-primary-foreground">
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Error Alerts
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {alerts.length} total
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No alerts — system healthy
                </div>
              ) : (
                alerts.slice(0, 20).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 border-b border-border/30 px-4 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-log-error shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{alert.message}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span>{alert.serviceName}</span>
                        <span>·</span>
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

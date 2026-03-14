import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import type { LogEntry } from "@/lib/api";
import { formatTimestamp, getLevelColor, getLevelTextColor } from "@/lib/log-utils";

interface LogDetailDrawerProps {
  log: LogEntry | null;
  onClose: () => void;
}

export function LogDetailDrawer({ log, onClose }: LogDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!log) return;
    navigator.clipboard.writeText(log.traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {log && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border bg-card overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">
                LOG_DETAIL
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Level badge */}
              <div className="flex items-center gap-3">
                <div className={`h-3 w-1 rounded-full ${getLevelColor(log.level)}`} />
                <span className={`font-mono text-sm font-semibold ${getLevelTextColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {log.id}
                </span>
              </div>

              {/* Message */}
              <div className="rounded-md border border-border bg-background p-4">
                <p className="font-mono text-sm text-foreground leading-relaxed">{log.message}</p>
              </div>

              {/* Metadata grid */}
              <dl className="grid grid-cols-3 gap-4 text-sm">
                <MetaItem label="TIMESTAMP" value={formatTimestamp(log.timestamp)} mono />
                <MetaItem label="SERVICE" value={log.serviceName} />
                <MetaItem label="HOST" value={log.host} mono />
                <MetaItem label="ENVIRONMENT" value={log.environment} />
                <div className="col-span-2">
                  <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    TRACE_ID
                  </dt>
                  <dd className="flex items-center gap-2">
                    <code className="font-mono text-sm text-primary">{log.traceId}</code>
                    <button
                      onClick={handleCopy}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-400" strokeWidth={1.5} />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

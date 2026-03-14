import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { LogEntry } from "@/lib/api";

interface ServiceHealthPanelProps {
  logs: LogEntry[];
}

type HealthStatus = "healthy" | "warning" | "critical";

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  errorCount: number;
  warnCount: number;
  total: number;
}

const STATUS_CONFIG: Record<HealthStatus, { icon: typeof CheckCircle2; label: string; dotClass: string; textClass: string; bgClass: string }> = {
  healthy: { icon: CheckCircle2, label: "Healthy", dotClass: "bg-emerald-500", textClass: "text-emerald-400", bgClass: "bg-emerald-500/10" },
  warning: { icon: AlertTriangle, label: "Warning", dotClass: "bg-log-warn", textClass: "text-log-warn", bgClass: "bg-log-warn/10" },
  critical: { icon: XCircle, label: "Critical", dotClass: "bg-log-error", textClass: "text-log-error", bgClass: "bg-log-error/10" },
};

export function ServiceHealthPanel({ logs }: ServiceHealthPanelProps) {
  const services = useMemo<ServiceHealth[]>(() => {
    const map: Record<string, { errors: number; warns: number; total: number }> = {};
    logs.forEach((l) => {
      if (!map[l.serviceName]) map[l.serviceName] = { errors: 0, warns: 0, total: 0 };
      map[l.serviceName].total++;
      if (l.level === "ERROR") map[l.serviceName].errors++;
      if (l.level === "WARN") map[l.serviceName].warns++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        status: (d.errors > 0 ? "critical" : d.warns > 0 ? "warning" : "healthy") as HealthStatus,
        errorCount: d.errors,
        warnCount: d.warns,
        total: d.total,
      }))
      .sort((a, b) => {
        const order = { critical: 0, warning: 1, healthy: 2 };
        return order[a.status] - order[b.status];
      });
  }, [logs]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Service Health
        </h2>
      </div>
      <div className="divide-y divide-border/30">
        {services.map((svc) => {
          const cfg = STATUS_CONFIG[svc.status];
          const Icon = cfg.icon;
          return (
            <div key={svc.name} className="flex items-center justify-between px-5 py-3 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-2 w-2 rounded-full ${cfg.dotClass} ${svc.status === "critical" ? "shadow-[0_0_6px_rgba(239,68,68,0.5)]" : ""}`} />
                <span className="text-sm font-mono text-foreground truncate">{svc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{svc.total} logs</span>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No services detected</div>
        )}
      </div>
    </div>
  );
}

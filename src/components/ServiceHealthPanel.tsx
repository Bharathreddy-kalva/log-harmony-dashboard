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
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Service Health
        </h2>
        <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-log-warn" /> Warning</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-log-error" /> Critical</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border/30">
        {services.map((svc) => {
          const cfg = STATUS_CONFIG[svc.status];
          const Icon = cfg.icon;
          const errorPercent = svc.total > 0 ? (svc.errorCount / svc.total) * 100 : 0;
          return (
            <div key={svc.name} className="bg-card p-4 hover:bg-surface-hover transition-all duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-foreground truncate mr-2">{svc.name}</span>
                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
              {/* Mini health bar */}
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    svc.status === "critical" ? "bg-log-error" : svc.status === "warning" ? "bg-log-warn" : "bg-emerald-500"
                  }`}
                  style={{ width: `${svc.status === "healthy" ? 100 : svc.status === "warning" ? 70 : Math.max(100 - errorPercent, 10)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{svc.total} logs</span>
                {svc.errorCount > 0 && <span className="text-log-error">{svc.errorCount} errors</span>}
                {svc.warnCount > 0 && svc.errorCount === 0 && <span className="text-log-warn">{svc.warnCount} warns</span>}
              </div>
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground bg-card">No services detected</div>
        )}
      </div>
    </div>
  );
}

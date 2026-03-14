import { useState, useMemo } from "react";
import { useLogs } from "@/hooks/use-logs";
import type { LogEntry } from "@/lib/api";
import { LogDetailDrawer } from "@/components/LogDetailDrawer";
import { LoadingBar } from "@/components/LoadingBar";
import { ServiceHealthPanel } from "@/components/ServiceHealthPanel";
import { formatTimestamp, getLevelColor } from "@/lib/log-utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Info,
  XCircle,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
} from "lucide-react";

const LEVEL_COLORS = {
  INFO: "hsl(210 80% 55%)",
  WARN: "hsl(38 92% 50%)",
  ERROR: "hsl(0 72% 51%)",
};

export default function Dashboard() {
  const { data: logs = [], isLoading, isError, refetch } = useLogs();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [levelFilter, setLevelFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const services = useMemo(() => [...new Set(logs.map((l) => l.serviceName))].sort(), [logs]);
  const environments = useMemo(() => [...new Set(logs.map((l) => l.environment))].sort(), [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (levelFilter && l.level !== levelFilter) return false;
      if (serviceFilter && l.serviceName !== serviceFilter) return false;
      if (envFilter && l.environment !== envFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!l.message.toLowerCase().includes(q) && !l.traceId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, levelFilter, serviceFilter, envFilter, searchQuery]);

  const stats = useMemo(() => {
    const info = filtered.filter((l) => l.level === "INFO").length;
    const warn = filtered.filter((l) => l.level === "WARN").length;
    const error = filtered.filter((l) => l.level === "ERROR").length;
    return { total: filtered.length, info, warn, error };
  }, [filtered]);

  // Error rate alert
  const errorRate = stats.total > 0 ? (stats.error / stats.total) * 100 : 0;
  const highErrorRate = errorRate > 10;

  // Error trend: compare first half vs second half of sorted logs
  const errorTrend = useMemo(() => {
    if (filtered.length < 2) return "flat" as const;
    const sorted = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const mid = Math.floor(sorted.length / 2);
    const firstHalfErrors = sorted.slice(0, mid).filter((l) => l.level === "ERROR").length;
    const secondHalfErrors = sorted.slice(mid).filter((l) => l.level === "ERROR").length;
    if (secondHalfErrors > firstHalfErrors) return "up" as const;
    if (secondHalfErrors < firstHalfErrors) return "down" as const;
    return "flat" as const;
  }, [filtered]);

  const timeData = useMemo(() => {
    const buckets: Record<string, { time: string; INFO: number; WARN: number; ERROR: number }> = {};
    filtered.forEach((l) => {
      const d = new Date(l.timestamp);
      const key = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      if (!buckets[key]) buckets[key] = { time: key, INFO: 0, WARN: 0, ERROR: 0 };
      if (l.level in buckets[key]) buckets[key][l.level as "INFO" | "WARN" | "ERROR"]++;
    });
    return Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time));
  }, [filtered]);

  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((l) => { counts[l.serviceName] = (counts[l.serviceName] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const pieData = useMemo(() => {
    return [
      { name: "INFO", value: stats.info, color: LEVEL_COLORS.INFO },
      { name: "WARN", value: stats.warn, color: LEVEL_COLORS.WARN },
      { name: "ERROR", value: stats.error, color: LEVEL_COLORS.ERROR },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const TrendIcon = errorTrend === "up" ? TrendingUp : errorTrend === "down" ? TrendingDown : Minus;
  const trendColor = errorTrend === "up" ? "text-log-error" : errorTrend === "down" ? "text-emerald-400" : "text-muted-foreground";
  const trendLabel = errorTrend === "up" ? "Increasing" : errorTrend === "down" ? "Decreasing" : "Stable";

  const statCards = [
    {
      label: "Total Logs", value: stats.total,
      icon: <Activity className="h-5 w-5" />, iconBg: "bg-primary/15", iconColor: "text-primary", borderColor: "border-primary/20",
    },
    {
      label: "Info", value: stats.info,
      icon: <Info className="h-5 w-5" />, iconBg: "bg-log-info/15", iconColor: "text-log-info", borderColor: "border-log-info/20",
    },
    {
      label: "Warnings", value: stats.warn,
      icon: <AlertTriangle className="h-5 w-5" />, iconBg: "bg-log-warn/15", iconColor: "text-log-warn", borderColor: "border-log-warn/20",
    },
    {
      label: "Errors", value: stats.error,
      icon: <XCircle className="h-5 w-5" />, iconBg: "bg-log-error/15", iconColor: "text-log-error", borderColor: "border-log-error/30",
      glow: stats.error > 0,
      extra: (
        <div className={`flex items-center gap-1 mt-1 text-xs font-mono ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trendLabel}</span>
          <span className="text-muted-foreground ml-1">({errorRate.toFixed(1)}%)</span>
        </div>
      ),
    },
  ];

  const selectClass =
    "h-9 rounded-lg border border-border bg-card px-3 text-sm font-mono text-foreground outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      <LoadingBar isLoading={isLoading} />

      {/* Error rate alert banner */}
      {highErrorRate && (
        <div className="flex items-center gap-3 rounded-lg border border-log-error/40 bg-log-error/[0.07] px-5 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="h-5 w-5 text-log-error shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-log-error">High error rate detected in system logs</p>
            <p className="text-xs text-log-error/70 mt-0.5 font-mono">
              Error rate: {errorRate.toFixed(1)}% — {stats.error} of {stats.total} logs are errors
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-log-error/20 px-2.5 py-1 text-[11px] font-bold font-mono text-log-error uppercase tracking-wider">
            Alert
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">System Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time log monitoring dashboard</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="rounded-lg border border-log-error/30 bg-log-error/5 p-4 font-mono text-sm text-log-error">
          ⚠ Connection failed — retrying automatically...
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages or trace IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={selectClass}>
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={selectClass}>
          <option value="">All Services</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} className={selectClass}>
          <option value="">All Environments</option>
          {environments.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative rounded-lg border ${card.borderColor} bg-card p-5 transition-all hover:border-opacity-60 overflow-hidden`}
            style={card.glow ? { boxShadow: "0 0 20px -4px hsl(0 72% 51% / 0.15)" } : undefined}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</span>
              <div className={`rounded-lg p-2 ${card.iconBg} ${card.iconColor}`}>{card.icon}</div>
            </div>
            <span className="text-3xl font-semibold font-mono tabular-nums text-foreground">{card.value.toLocaleString()}</span>
            {"extra" in card && card.extra}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Log Volume Over Time</h2>
          <div className="h-72">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="gradInfo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWarn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.WARN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.WARN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradError" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.ERROR} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.ERROR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: "hsl(220 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "hsl(230 10% 22%)" }} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230 12% 16%)", border: "1px solid hsl(230 10% 22%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }} itemStyle={{ color: "hsl(220 10% 90%)" }} />
                  <Area type="monotone" dataKey="ERROR" stackId="1" stroke={LEVEL_COLORS.ERROR} fill="url(#gradError)" strokeWidth={2} />
                  <Area type="monotone" dataKey="WARN" stackId="1" stroke={LEVEL_COLORS.WARN} fill="url(#gradWarn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="INFO" stackId="1" stroke={LEVEL_COLORS.INFO} fill="url(#gradInfo)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Level Distribution</h2>
          <div className="h-72 flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(230 12% 16%)", border: "1px solid hsl(230 10% 22%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-mono">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState />}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Top Services</h2>
          {topServices.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "hsl(220 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230 12% 16%)", border: "1px solid hsl(230 10% 22%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: 12 }} />
                  <Bar dataKey="count" fill={LEVEL_COLORS.INFO} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72"><EmptyState /></div>}
        </div>
      </div>

      {/* Service Health Panel */}
      <ServiceHealthPanel logs={filtered} />

      {/* Recent logs */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent Logs</h2>
          <span className="text-xs font-mono text-muted-foreground">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] font-mono">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2.5 px-5 text-left font-medium">Timestamp</th>
                <th className="py-2.5 px-4 text-left font-medium">Service</th>
                <th className="py-2.5 px-4 text-left font-medium">Host</th>
                <th className="py-2.5 px-4 text-left font-medium">Level</th>
                <th className="py-2.5 px-4 text-left font-medium">Message</th>
                <th className="py-2.5 px-4 text-left font-medium">Environment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No matching logs found</td></tr>
              ) : (
                filtered.slice(0, 30).map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`group border-b border-border/30 cursor-pointer transition-colors duration-100 ${
                      log.level === "ERROR" ? "bg-log-error/[0.04] hover:bg-log-error/[0.08]" : "hover:bg-surface-hover"
                    }`}
                  >
                    <td className="py-2.5 px-5 text-muted-foreground tabular-nums whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="py-2.5 px-4 font-medium text-primary whitespace-nowrap">{log.serviceName}</td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">{log.host}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        log.level === "ERROR" ? "bg-log-error/15 text-log-error" : log.level === "WARN" ? "bg-log-warn/15 text-log-warn" : "bg-log-info/15 text-log-info"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${getLevelColor(log.level)}`} />
                        {log.level}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs truncate text-foreground">{log.message}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{log.environment}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-full text-sm text-muted-foreground font-mono">No data available</div>;
}

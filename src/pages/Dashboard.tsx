import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Legend,
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
  Filter,
  Clock,
  Server,
  PieChart as PieIcon,
} from "lucide-react";

const LEVEL_COLORS = {
  INFO: "hsl(210 100% 60%)",
  WARN: "hsl(38 92% 50%)",
  ERROR: "hsl(0 84% 60%)",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const } },
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

  const errorRate = stats.total > 0 ? (stats.error / stats.total) * 100 : 0;
  const highErrorRate = errorRate > 10;

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
      icon: <Activity className="h-5 w-5" />,
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      borderAccent: "group-hover:border-primary/30",
    },
    {
      label: "Info", value: stats.info,
      icon: <Info className="h-5 w-5" />,
      gradient: "from-log-info/20 to-log-info/5",
      iconColor: "text-log-info",
      borderAccent: "group-hover:border-log-info/30",
    },
    {
      label: "Warnings", value: stats.warn,
      icon: <AlertTriangle className="h-5 w-5" />,
      gradient: "from-log-warn/20 to-log-warn/5",
      iconColor: "text-log-warn",
      borderAccent: "group-hover:border-log-warn/30",
    },
    {
      label: "Errors", value: stats.error,
      icon: <XCircle className="h-5 w-5" />,
      gradient: "from-log-error/20 to-log-error/5",
      iconColor: "text-log-error",
      borderAccent: "group-hover:border-log-error/30",
      isError: true,
      extra: (
        <div className={`flex items-center gap-1.5 mt-2 text-xs font-mono ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trendLabel}</span>
          <span className="text-muted-foreground ml-1">({errorRate.toFixed(1)}%)</span>
        </div>
      ),
    },
  ];

  const selectClass =
    "h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all appearance-none cursor-pointer hover:bg-secondary";

  const tooltipStyle = {
    backgroundColor: "hsl(228 14% 12%)",
    border: "1px solid hsl(228 10% 20%)",
    borderRadius: "10px",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 12,
    boxShadow: "0 12px 40px -8px rgba(0,0,0,0.5)",
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <LoadingBar isLoading={isLoading} />

      {/* Error rate alert banner */}
      <AnimatePresence>
        {highErrorRate && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="flex items-center gap-3 rounded-xl border border-log-error/30 bg-gradient-to-r from-log-error/[0.08] to-transparent px-5 py-4"
            style={{ boxShadow: "0 0 30px -8px hsl(0 84% 60% / 0.1)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-log-error/15">
              <ShieldAlert className="h-5 w-5 text-log-error" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-log-error">High error rate detected in system logs</p>
              <p className="text-xs text-log-error/60 mt-0.5 font-mono">
                Error rate: {errorRate.toFixed(1)}% — {stats.error} of {stats.total} logs are errors
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-log-error/15 px-3 py-1.5 text-[11px] font-bold font-mono text-log-error uppercase tracking-wider pulse-glow">
              Critical
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Overview</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time log monitoring
            {logs.length > 0 && <span className="font-mono text-xs">· {logs.length} total events</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/20 transition-all duration-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {isError && (
        <motion.div variants={item} className="rounded-xl border border-log-error/20 bg-log-error/5 p-4 font-mono text-sm text-log-error">
          ⚠ Connection failed — retrying automatically...
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={item} className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search messages or trace IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background/60 pl-9 pr-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
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
          {(levelFilter || serviceFilter || envFilter || searchQuery) && (
            <button
              onClick={() => { setLevelFilter(""); setServiceFilter(""); setEnvFilter(""); setSearchQuery(""); }}
              className="h-9 px-3 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-all"
            >
              Clear all
            </button>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`group relative glass-card-hover p-5 overflow-hidden ${card.isError && stats.error > 0 ? "stat-card-glow-error" : ""}`}
          >
            {/* Gradient background accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</span>
                <div className={`rounded-lg p-2 bg-secondary/60 ${card.iconColor} transition-colors group-hover:bg-secondary`}>
                  {card.icon}
                </div>
              </div>
              <span className="text-3xl font-semibold font-mono tabular-nums text-foreground">{card.value.toLocaleString()}</span>
              {"extra" in card && card.extra}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-7 glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Log Volume Over Time</h2>
          </div>
          <div className="h-72">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="gradInfo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWarn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.WARN} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.WARN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradError" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LEVEL_COLORS.ERROR} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.ERROR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: "hsl(220 8% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "hsl(228 10% 18%)" }} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 8% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "hsl(220 14% 92%)" }} />
                  <Area type="monotone" dataKey="ERROR" stackId="1" stroke={LEVEL_COLORS.ERROR} fill="url(#gradError)" strokeWidth={2} />
                  <Area type="monotone" dataKey="WARN" stackId="1" stroke={LEVEL_COLORS.WARN} fill="url(#gradWarn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="INFO" stackId="1" stroke={LEVEL_COLORS.INFO} fill="url(#gradInfo)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <PieIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Levels</h2>
          </div>
          <div className="h-72 flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-mono">{d.name}</span>
                      <span className="font-mono text-foreground/60">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState />}
          </div>
        </div>

        {/* Bar chart */}
        <div className="lg:col-span-3 glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Services</h2>
          </div>
          {topServices.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={LEVEL_COLORS.INFO} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "hsl(220 8% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-72"><EmptyState /></div>}
        </div>
      </motion.div>

      {/* Service Health Panel */}
      <motion.div variants={item}>
        <ServiceHealthPanel logs={filtered} />
      </motion.div>

      {/* Recent logs */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent Logs</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-md bg-secondary/50">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] font-mono">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground bg-secondary/20">
                <th className="py-3 px-5 text-left font-medium">Timestamp</th>
                <th className="py-3 px-4 text-left font-medium">Service</th>
                <th className="py-3 px-4 text-left font-medium">Host</th>
                <th className="py-3 px-4 text-left font-medium">Level</th>
                <th className="py-3 px-4 text-left font-medium">Message</th>
                <th className="py-3 px-4 text-left font-medium">Environment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">No matching logs found</td></tr>
              ) : (
                filtered.slice(0, 30).map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`group border-b border-border/20 cursor-pointer transition-all duration-150 ${
                      log.level === "ERROR" ? "log-row-error" : "hover:bg-surface-hover"
                    }`}
                  >
                    <td className="py-3 px-5 text-muted-foreground tabular-nums whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="py-3 px-4 font-medium text-primary whitespace-nowrap">{log.serviceName}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{log.host}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                        log.level === "ERROR" ? "bg-log-error/15 text-log-error" : log.level === "WARN" ? "bg-log-warn/15 text-log-warn" : "bg-log-info/15 text-log-info"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${getLevelColor(log.level)} ${log.level === "ERROR" ? "animate-pulse" : ""}`} />
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-foreground group-hover:text-foreground/90">{log.message}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="rounded-md bg-secondary/50 px-2 py-0.5">{log.environment}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground font-mono gap-2">
      <Activity className="h-8 w-8 text-muted/60" />
      <span>No data available</span>
    </div>
  );
}

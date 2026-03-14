import { useState, useMemo } from "react";
import { useLogs } from "@/hooks/use-logs";
import type { LogEntry } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { LogTable } from "@/components/LogTable";
import { LogDetailDrawer } from "@/components/LogDetailDrawer";
import { LoadingBar } from "@/components/LoadingBar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const { data: logs = [], isLoading, isError } = useLogs();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const stats = useMemo(() => {
    const info = logs.filter((l) => l.level === "INFO").length;
    const warn = logs.filter((l) => l.level === "WARN").length;
    const error = logs.filter((l) => l.level === "ERROR").length;
    return { total: logs.length, info, warn, error };
  }, [logs]);

  const timeData = useMemo(() => {
    const buckets: Record<string, { time: string; INFO: number; WARN: number; ERROR: number }> = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp);
      const key = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`;
      if (!buckets[key]) buckets[key] = { time: key, INFO: 0, WARN: 0, ERROR: 0 };
      if (l.level in buckets[key]) buckets[key][l.level as "INFO" | "WARN" | "ERROR"]++;
    });
    return Object.values(buckets).slice(-24);
  }, [logs]);

  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.serviceName] = (counts[l.serviceName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <LoadingBar isLoading={isLoading} />

      {/* Header */}
      <div>
        <h1 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
          SYSTEM_OVERVIEW
        </h1>
      </div>

      {isError && (
        <div className="rounded-md border border-log-error/30 bg-log-error/5 p-4 font-mono text-sm text-log-error">
          CONNECTION_FAILED: RETRYING_IN_5S...
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="TOTAL_LOGS" value={stats.total} />
        <StatCard label="INFO" value={stats.info} dotColor="bg-log-info" />
        <StatCard label="WARN" value={stats.warn} dotColor="bg-log-warn" />
        <StatCard label="ERROR" value={stats.error} dotColor="bg-log-error shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Log volume chart */}
        <div className="lg:col-span-2 rounded-md border border-border bg-card p-4">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
            LOG_VOLUME
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: "hsl(220 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "hsl(230 10% 22%)" }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230 12% 18%)",
                    border: "1px solid hsl(230 10% 22%)",
                    borderRadius: "6px",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "hsl(220 10% 90%)" }}
                />
                <Area
                  type="monotone"
                  dataKey="ERROR"
                  stackId="1"
                  stroke="hsl(0 72% 51%)"
                  fill="hsl(0 72% 51%)"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="WARN"
                  stackId="1"
                  stroke="hsl(38 92% 50%)"
                  fill="hsl(38 92% 50%)"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="INFO"
                  stackId="1"
                  stroke="hsl(210 80% 55%)"
                  fill="hsl(210 80% 55%)"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top services */}
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
            TOP_SERVICES
          </h2>
          {topServices.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "hsl(220 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230 12% 18%)",
                      border: "1px solid hsl(230 10% 22%)",
                      borderRadius: "6px",
                      fontFamily: "JetBrains Mono",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(210 80% 55%)" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 font-mono text-sm text-muted-foreground">
              NO_DATA
            </div>
          )}
        </div>
      </div>

      {/* Recent logs */}
      <div className="rounded-md border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            RECENT_LOGS
          </h2>
        </div>
        <LogTable logs={logs.slice(0, 20)} onRowClick={setSelectedLog} compact />
      </div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

import { useState, useMemo } from "react";
import { useLogs, useSearchLogs } from "@/hooks/use-logs";
import type { LogEntry } from "@/lib/api";
import { LogTable } from "@/components/LogTable";
import { LogDetailDrawer } from "@/components/LogDetailDrawer";
import { LoadingBar } from "@/components/LoadingBar";
import { Search, X } from "lucide-react";

export default function LogsExplorer() {
  const [levelFilter, setLevelFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const hasFilters = levelFilter || serviceFilter || envFilter;

  const searchParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (levelFilter) params.level = levelFilter;
    if (serviceFilter) params.serviceName = serviceFilter;
    if (envFilter) params.environment = envFilter;
    return params;
  }, [levelFilter, serviceFilter, envFilter]);

  const { data: allLogs = [], isLoading: allLoading } = useLogs();
  const { data: filteredLogs, isLoading: searchLoading } = useSearchLogs(searchParams);

  const logs = hasFilters ? (filteredLogs ?? []) : allLogs;
  const isLoading = hasFilters ? searchLoading : allLoading;

  // Client-side text search on top of API results
  const displayLogs = useMemo(() => {
    if (!searchText) return logs;
    const q = searchText.toLowerCase();
    return logs.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        l.serviceName.toLowerCase().includes(q) ||
        l.traceId.toLowerCase().includes(q) ||
        l.host.toLowerCase().includes(q)
    );
  }, [logs, searchText]);

  // Extract unique values for filter dropdowns
  const services = useMemo(() => [...new Set(allLogs.map((l) => l.serviceName))].sort(), [allLogs]);
  const environments = useMemo(() => [...new Set(allLogs.map((l) => l.environment))].sort(), [allLogs]);

  const clearFilters = () => {
    setLevelFilter("");
    setServiceFilter("");
    setEnvFilter("");
    setSearchText("");
  };

  return (
    <div className="space-y-4">
      <LoadingBar isLoading={isLoading} />

      <div className="flex items-center justify-between">
        <h1 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
          LOGS_EXPLORER
        </h1>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {displayLogs.length} ENTRIES
        </span>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-9 rounded-md border border-border bg-card pl-9 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Level */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">ALL LEVELS</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>

        {/* Service */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">ALL SERVICES</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Environment */}
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">ALL ENVS</option>
          {environments.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        {(hasFilters || searchText) && (
          <button
            onClick={clearFilters}
            className="h-9 rounded-md border border-border bg-card px-3 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
          >
            <X className="h-3 w-3" strokeWidth={1.5} />
            CLEAR
          </button>
        )}
      </div>

      {/* Log table */}
      <div className="rounded-md border border-border bg-card">
        <LogTable logs={displayLogs} onRowClick={setSelectedLog} />
      </div>

      <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

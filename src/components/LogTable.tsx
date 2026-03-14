import { type LogEntry } from "@/lib/api";
import { formatTimestamp, getLevelColor } from "@/lib/log-utils";

interface LogTableProps {
  logs: LogEntry[];
  onRowClick: (log: LogEntry) => void;
  compact?: boolean;
}

export function LogTable({ logs, onRowClick, compact }: LogTableProps) {
  if (!logs.length) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground font-mono text-sm">
        0_MATCHING_LOGS_FOUND
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] font-mono">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
            <th className="w-1 py-2" />
            <th className="py-2 px-4 text-left font-medium">Timestamp</th>
            <th className="py-2 px-4 text-left font-medium">Service</th>
            {!compact && <th className="py-2 px-4 text-left font-medium">Host</th>}
            {!compact && <th className="py-2 px-4 text-left font-medium">Level</th>}
            <th className="py-2 px-4 text-left font-medium">Message</th>
            {!compact && <th className="py-2 px-4 text-left font-medium">Trace ID</th>}
            {!compact && <th className="py-2 px-4 text-left font-medium">Env</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log)}
              className="group border-b border-border/40 hover:bg-surface-hover cursor-pointer transition-colors duration-100"
            >
              <td className="w-1 py-2">
                <div className={`h-4 w-1 rounded-full ${getLevelColor(log.level)}`} />
              </td>
              <td className="py-2 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                {formatTimestamp(log.timestamp)}
              </td>
              <td className="py-2 px-4 font-medium text-primary whitespace-nowrap">
                {log.serviceName}
              </td>
              {!compact && (
                <td className="py-2 px-4 text-muted-foreground whitespace-nowrap">{log.host}</td>
              )}
              {!compact && (
                <td className="py-2 px-4">
                  <span className={`text-xs ${getLevelColor(log.level).includes("error") ? "text-log-error" : getLevelColor(log.level).includes("warn") ? "text-log-warn" : "text-log-info"}`}>
                    {log.level}
                  </span>
                </td>
              )}
              <td className="py-2 px-4 max-w-md truncate">{log.message}</td>
              {!compact && (
                <td className="py-2 px-4 text-xs text-muted-foreground/50 whitespace-nowrap">
                  {log.traceId}
                </td>
              )}
              {!compact && (
                <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {log.environment}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

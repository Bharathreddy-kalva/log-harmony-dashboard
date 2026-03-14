export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function getLevelColor(level: string): string {
  switch (level) {
    case "ERROR": return "bg-log-error shadow-[0_0_8px_rgba(239,68,68,0.4)]";
    case "WARN": return "bg-log-warn";
    case "INFO": return "bg-log-info";
    default: return "bg-muted-foreground";
  }
}

export function getLevelTextColor(level: string): string {
  switch (level) {
    case "ERROR": return "text-log-error";
    case "WARN": return "text-log-warn";
    case "INFO": return "text-log-info";
    default: return "text-muted-foreground";
  }
}

import { useQuery } from "@tanstack/react-query";
import { api, type LogEntry } from "@/lib/api";
import { API_CONFIG } from "@/config";

export function useLogs() {
  return useQuery<LogEntry[]>({
    queryKey: ["logs"],
    queryFn: api.getLogs,
    refetchInterval: API_CONFIG.REFRESH_INTERVAL,
  });
}

export function useSearchLogs(params: Record<string, string>) {
  const hasParams = Object.values(params).some(Boolean);
  return useQuery<LogEntry[]>({
    queryKey: ["logs", "search", params],
    queryFn: () => api.searchLogs(params),
    enabled: hasParams,
    refetchInterval: API_CONFIG.REFRESH_INTERVAL,
  });
}

export function useLogById(id: string | number | null) {
  return useQuery<LogEntry>({
    queryKey: ["log", id],
    queryFn: () => api.getLogById(id!),
    enabled: !!id,
  });
}

import { API_CONFIG } from "../config";

export interface LogEntry {
  id: number;
  timestamp: string;
  serviceName: string;
  host: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  traceId: string;
  environment: string;
}

export const api = {
  async getLogs(): Promise<LogEntry[]> {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGS}`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
  },

  async searchLogs(params: Record<string, string>): Promise<LogEntry[]> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}?${query}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  async getLogById(id: string | number): Promise<LogEntry> {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGS}/${id}`);
    if (!res.ok) throw new Error("Log not found");
    return res.json();
  },
};

export const API_CONFIG = {
  BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8083/api",
  ENDPOINTS: {
    LOGS: "/logs",
    SEARCH: "/logs/search",
  },
  REFRESH_INTERVAL: 5000,
};

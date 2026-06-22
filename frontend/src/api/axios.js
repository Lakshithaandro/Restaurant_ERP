import axios from "axios";

// In dev, Vite proxies /api to the backend when VITE_API_URL is empty.
// In production, set VITE_API_URL to the deployed backend origin if needed.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEBUG_API = import.meta.env.VITE_DEBUG_API === "true";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// Attach the saved JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (DEBUG_API) {
    console.debug("[api] request", {
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      params: config.params,
      hasAuthToken: Boolean(token),
    });
  }

  return config;
});

// On 401, clear the stale session immediately instead of leaving a ghost UI.
api.interceptors.response.use(
  (res) => {
    if (DEBUG_API) {
      console.debug("[api] response", {
        status: res.status,
        url: res.config?.url,
        data: res.data,
      });
    }

    return res;
  },
  (err) => {
    if (DEBUG_API) {
      console.error("[api] error", {
        status: err.response?.status,
        url: err.config?.url,
        message: err.message,
        data: err.response?.data,
      });
    }

    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(err);
  }
);

export default api;

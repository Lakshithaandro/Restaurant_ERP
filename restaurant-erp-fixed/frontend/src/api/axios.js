import axios from "axios";

// In dev, Vite proxies /api to the backend (see vite.config.js).
// To point at a deployed backend, set VITE_API_URL in a .env file.
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});

// Attach the saved JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the stale session immediately instead of leaving a ghost UI.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);

export default api;

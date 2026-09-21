import axios from "axios";

// In production, VITE_API_URL points to the Railway backend domain.
// In dev, Vite proxies /api to localhost:8000.
const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
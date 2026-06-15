import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Bearer fallback: si hay session_token en localStorage, adjuntar en cada request.
// Esto cubre el caso de cookies bloqueadas en contexto cross-site.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("emay_session_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    return Promise.reject(err);
  }
);

export default api;

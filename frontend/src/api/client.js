import axios from "axios";

export const AUTH_TOKEN_EVENT = "bl:token-changed";

export const getAuthToken = () => localStorage.getItem("token") || null;
export const setAuthToken = (t) => {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");

  try {
    window.dispatchEvent(
      new CustomEvent(AUTH_TOKEN_EVENT, { detail: { token: t || null } })
    );
  } catch {}
};

const unauthorizedHandlers = new Set();
export function addUnauthorizedHandler(fn) {
  unauthorizedHandlers.add(fn);
  return () => unauthorizedHandlers.delete(fn);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: false,
  paramsSerializer: (params) => new URLSearchParams(params).toString(),
});

api.interceptors.request.use((cfg) => {
  const token = getAuthToken();
  if (token) {
    cfg.headers["x-auth-token"] = token;
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    const t = res?.headers?.["x-auth-token"];
    if (t) setAuthToken(t);
    return res;
  },
  (err) => {
    if (err?.response?.status === 401) {
      setAuthToken(null);

      unauthorizedHandlers.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    }
    return Promise.reject(err);
  }
);

export default api;

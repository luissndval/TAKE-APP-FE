import axios from "axios";
import { createLogger } from "./logger";

const logger = createLogger("API");

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug("Request", {
      method: config.method?.toUpperCase(),
      url:    config.url,
      auth:   !!token,
    });
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    logger.debug("Response", {
      status: response.status,
      url:    response.config.url,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url    = error.config?.url as string | undefined;

    const isAuthEndpoint = url?.includes("/auth/login") || url?.includes("/auth/refresh");
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        logger.warn("Session expired — redirecting to login");
        if (typeof window !== "undefined") {
          // /login funciona en ambos contextos:
          // - tenant subdomain: nginx reescribe a /backoffice/login
          // - dominio base: nginx redirige a /backoffice/platform-login
          window.location.href = "/login";
        }
      }
    } else {
      logger.error("Response error", {
        status,
        url,
        detail: (error.response?.data as { detail?: string })?.detail,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

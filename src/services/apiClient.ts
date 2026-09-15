import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { store, setAuth, clearAuth } from "../store";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken, admin } = store.getState().auth;
  if (!refreshToken || !admin) return null;
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
      token: refreshToken,
    });
    const payload = response.data?.data;
    if (!payload?.accessToken) return null;
    store.dispatch(
      setAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        admin,
      }),
    );
    return payload.accessToken as string;
  } catch {
    return null;
  }
};

const redirectToLogin = () => {
  store.dispatch(clearAuth());
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const requestUrl = String(originalRequest?.url ?? "");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/")
    ) {
      originalRequest._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
};

export default apiClient;

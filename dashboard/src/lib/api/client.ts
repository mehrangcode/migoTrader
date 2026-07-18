import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "@/config";
import { tokenStorage } from "@/lib/tokenStorage";

export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
});

/** Called when refresh fails so the app can drop to the login screen. Set by the auth store. */
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

api.interceptors.request.use((request) => {
  const token = tokenStorage.getAccess();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

// Single-flight refresh: concurrent 401s share one refresh request.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("No refresh token");

  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${config.apiUrl}/api/auth/refresh`,
    { refreshToken },
  );
  tokenStorage.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    const isAuthEndpoint = original?.url?.includes("/auth/");
    if (error.response?.status !== 401 || !original || original._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      refreshPromise = null;
      tokenStorage.clear();
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  },
);

import { api } from "./client";
import type { AuthResponse, User } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }).then(() => undefined),

  me: () => api.get<User>("/users/me").then((r) => r.data),
};

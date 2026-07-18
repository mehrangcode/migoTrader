import { env } from "./env";

export const appConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  marketData: {
    baseUrl: env.MARKET_DATA_BASE_URL,
  },

  scheduler: {
    pollIntervalSeconds: env.POLL_INTERVAL_SECONDS,
  },
} as const;

export type AppConfig = typeof appConfig;

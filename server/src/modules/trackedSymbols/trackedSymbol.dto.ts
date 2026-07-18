import { z } from "zod";

export const TIMEFRAMES = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

const indicatorsConfigSchema = z.record(z.union([z.record(z.unknown()), z.boolean()]));

export const createTrackedSymbolSchema = z.object({
  symbol: z.string().min(3).toUpperCase(),
  label: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateTrackedSymbolSchema = z.object({
  label: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createTimeframeConfigSchema = z.object({
  timeframe: z.enum(TIMEFRAMES),
  indicatorsConfig: indicatorsConfigSchema,
  isActive: z.boolean().optional(),
});

export const updateTimeframeConfigSchema = z.object({
  indicatorsConfig: indicatorsConfigSchema.optional(),
  isActive: z.boolean().optional(),
});

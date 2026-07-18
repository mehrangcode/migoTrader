import { z } from "zod";
import { TIMEFRAMES } from "../trackedSymbols/trackedSymbol.dto";

export const backtestSchema = z.object({
  symbol: z.string().min(3).toUpperCase(),
  timeframe: z.enum(TIMEFRAMES),
  indicatorsConfig: z.record(z.union([z.record(z.unknown()), z.boolean()])),
  /** How many most-recent stored candles to run the backtest over. */
  limit: z.number().int().positive().max(5000).optional(),
  warmupCandles: z.number().int().positive().max(1000).optional(),
  expiryCandles: z.number().int().positive().max(1000).optional(),
});

export type BacktestRequest = z.infer<typeof backtestSchema>;

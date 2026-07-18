import { api } from "./client";
import type { BacktestResult, IndicatorsConfig } from "./types";

export interface BacktestRequest {
  symbol: string;
  timeframe: string;
  indicatorsConfig: IndicatorsConfig;
  limit?: number;
  warmupCandles?: number;
  expiryCandles?: number;
}

export const backtestApi = {
  run: (request: BacktestRequest) => api.post<BacktestResult>("/backtest", request).then((r) => r.data),
};

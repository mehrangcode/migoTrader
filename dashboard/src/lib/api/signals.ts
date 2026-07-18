import { api } from "./client";
import type { Signal, SignalOutcome } from "./types";

export interface SignalHistoryQuery {
  symbol?: string;
  timeframe?: string;
  outcome?: SignalOutcome;
  limit?: number;
}

export const signalsApi = {
  history: (query: SignalHistoryQuery = {}) =>
    api.get<Signal[]>("/signals", { params: query }).then((r) => r.data),

  latest: (symbol: string, timeframe: string) =>
    api.get<Signal | null>("/signals/latest", { params: { symbol, timeframe } }).then((r) => r.data),
};

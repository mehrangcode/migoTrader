import { api } from "./client";
import type { Candle } from "./types";

export const candlesApi = {
  recent: (symbol: string, timeframe: string, limit = 300) =>
    api.get<Candle[]>("/candles", { params: { symbol, timeframe, limit } }).then((r) => r.data),
};

import axios, { AxiosInstance } from "axios";
import { Candle } from "../../domain/entities/Candle";
import { FetchKlinesOptions, MarketDataProvider, SymbolInfo } from "./marketDataProvider.interface";
import { NobitexUdfHistoryResponse, NobitexUdfSymbolInfo } from "./nobitexTypes";

/**
 * Nobitex timeframe resolutions accepted by the UDF history endpoint.
 * Maps internal interval strings to Nobitex resolution values.
 */
const TIMEFRAME_TO_RESOLUTION: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "120",
  "4h": "240",
  "6h": "360",
  "12h": "720",
  "1d": "D",
  "1w": "W",
};

const TIMEFRAME_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "6h": 21_600_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
};

/**
 * Nobitex public market data via their UDF-compatible endpoints.
 * Docs: https://apidocs.nobitex.ir
 *
 * Kline endpoint: GET /market/udf/history?symbol=<SYM>&resolution=<RES>&from=<UNIX_S>&to=<UNIX_S>
 * Symbol info:    GET /market/udf/symbol_info
 */
export class NobitexProvider implements MarketDataProvider {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({ baseURL: baseUrl, timeout: 15_000 });
  }

  async fetchKlines(symbol: string, timeframe: string, options: FetchKlinesOptions = {}): Promise<Candle[]> {
    const resolution = TIMEFRAME_TO_RESOLUTION[timeframe];
    if (!resolution) {
      throw new Error(`Unsupported Nobitex timeframe: ${timeframe}`);
    }

    const limit = options.limit ?? 200;
    const tfMs = TIMEFRAME_MS[timeframe] ?? 60_000;
    const to = Math.floor(Date.now() / 1000);
    const from = options.startTime
      ? Math.floor(options.startTime / 1000)
      : to - Math.ceil(limit * (tfMs / 1000));
      // const { data } = await this.http.get<NobitexUdfHistoryResponse>("/market/udf/history", {
        //   params: { symbol, resolution, from, to },
        // });
        const { data } = await axios.get(`https://apiv2.nobitex.ir/market/udf/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&countback=${limit}`);
        console.log("CALL: ", symbol, resolution)
    if (data.s !== "ok") {
      throw new Error(`Nobitex kline request failed: status=${data.s}`);
    }

    const candles: Candle[] = [];
    const count = data.t?.length ?? 0;
    for (let i = 0; i < count; i++) {
      candles.push({
        openTime: data.t[i] * 1000,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      });
    }

    return candles.sort((a, b) => a.openTime - b.openTime);
  }

  async fetchSymbols(): Promise<SymbolInfo[]> {
    const { data } = await this.http.get<NobitexUdfSymbolInfo>("/market/udf/symbol_info");
    console.log('Data: ', data)
    if (!data.symbol || !Array.isArray(data.symbol)) {
      throw new Error("Nobitex symbol_info request returned unexpected data");
    }

    return data.symbol.map((sym) => ({
      symbol: sym,
      state: "trading",
    }));
  }
}

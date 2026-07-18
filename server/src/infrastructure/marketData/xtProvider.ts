import axios, { AxiosInstance } from "axios";
import { Candle } from "../../domain/entities/Candle";
import { FetchKlinesOptions, MarketDataProvider, SymbolInfo } from "./marketDataProvider.interface";
import { XtApiResponse, XtKlineEntry, XtSymbolEntry } from "./types";

/**
 * XT.com public spot market data (no API key required).
 * Docs: https://doc.xt.com/docs/spot/Market/GetKlineData
 */
export class XtProvider implements MarketDataProvider {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({ baseURL: baseUrl, timeout: 10_000 });
  }

  async fetchKlines(symbol: string, timeframe: string, options: FetchKlinesOptions = {}): Promise<Candle[]> {
    const { data } = await this.http.get<XtApiResponse<XtKlineEntry[]>>("/v4/public/kline", {
      params: {
        symbol,
        interval: timeframe,
        startTime: options.startTime,
        limit: options.limit ?? 200,
      },
    });

    if (data.rc !== 0) {
      throw new Error(`XT.com kline request failed: ${data.mc}`);
    }

    return data.result
      .map((entry) => ({
        openTime: entry.t,
        open: Number(entry.o),
        high: Number(entry.h),
        low: Number(entry.l),
        close: Number(entry.c),
        volume: Number(entry.q),
      }))
      .sort((a, b) => a.openTime - b.openTime);
  }

  async fetchSymbols(): Promise<SymbolInfo[]> {
    const { data } = await this.http.get<XtApiResponse<{ symbols: XtSymbolEntry[] }>>("/v4/public/symbol");

    if (data.rc !== 0) {
      throw new Error(`XT.com symbol request failed: ${data.mc}`);
    }

    return data.result.symbols.map((entry) => ({ symbol: entry.symbol, state: entry.state }));
  }
}

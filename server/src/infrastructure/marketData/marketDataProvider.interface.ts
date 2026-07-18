import { Candle } from "../../domain/entities/Candle";

export interface FetchKlinesOptions {
  /** Only fetch candles opening after this timestamp (ms). */
  startTime?: number;
  limit?: number;
}

export interface SymbolInfo {
  symbol: string;
  state: string;
}

/**
 * Abstraction over a market data source so the scheduler/signal engine never talk
 * to a specific exchange directly. Swap in Binance/CoinGecko by adding another
 * implementation of this interface.
 */
export interface MarketDataProvider {
  fetchKlines(symbol: string, timeframe: string, options?: FetchKlinesOptions): Promise<Candle[]>;
  fetchSymbols(): Promise<SymbolInfo[]>;
}

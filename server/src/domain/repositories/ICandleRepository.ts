import { Candle } from "../entities/Candle";

export interface ICandleRepository {
  upsertMany(symbol: string, timeframe: string, candles: Candle[]): Promise<void>;
  findRecent(symbol: string, timeframe: string, limit: number): Promise<Candle[]>;
  findLatestOpenTime(symbol: string, timeframe: string): Promise<number | null>;
}

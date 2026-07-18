import { Candle } from "../../domain/entities/Candle";
import { Signal } from "../../domain/entities/Signal";

/**
 * Push-style updates to connected frontends (as opposed to NotificationProvider,
 * which handles per-user alert channels like email/Telegram).
 */
export interface RealtimePublisher {
  publishCandles(symbol: string, timeframe: string, candles: Candle[]): void;
  publishSignalResolved(signal: Signal): void;
}

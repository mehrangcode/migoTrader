import { Candle } from "../../domain/entities/Candle";
import { Signal } from "../../domain/entities/Signal";
import { AppSocketServer } from "../../sockets/io";
import { RealtimePublisher } from "./realtimePublisher.interface";

export class SocketRealtimePublisher implements RealtimePublisher {
  constructor(private readonly io: AppSocketServer) {}

  publishCandles(symbol: string, timeframe: string, candles: Candle[]): void {
    this.io.emit("candle:update", { symbol, timeframe, candles });
  }

  publishSignalResolved(signal: Signal): void {
    this.io.emit("signal:resolved", signal);
  }
}

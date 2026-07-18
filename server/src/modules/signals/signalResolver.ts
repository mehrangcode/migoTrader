import { Candle } from "../../domain/entities/Candle";
import { ResolvedOutcome, Signal, SignalDirection } from "../../domain/entities/Signal";
import { timeframeToMs } from "../../domain/timeframes";
import { ICandleRepository } from "../../domain/repositories/ICandleRepository";
import { ISignalRepository } from "../../domain/repositories/ISignalRepository";
import { RealtimePublisher } from "../../infrastructure/realtime/realtimePublisher.interface";

export interface SignalResolverDeps {
  candleRepository: ICandleRepository;
  signalRepository: ISignalRepository;
  realtimePublisher: RealtimePublisher;
}

const CANDLE_WINDOW = 300;
/** A pending signal that hits neither level within this many candles is marked EXPIRED. */
export const EXPIRY_CANDLES = 100;

/**
 * Walks candles that closed after each pending signal and resolves it:
 * WIN when take-profit is touched first, LOSS when stop-loss is touched first.
 * If both levels fall inside the same candle the intra-candle order is unknowable
 * from OHLC data, so it counts as a LOSS (conservative).
 */
export async function resolvePendingSignals(
  symbol: string,
  timeframe: string,
  deps: SignalResolverDeps,
): Promise<void> {
  const pending = await deps.signalRepository.findPending(symbol, timeframe);
  if (pending.length === 0) return;

  const candles = await deps.candleRepository.findRecent(symbol, timeframe, CANDLE_WINDOW);
  const tfMs = timeframeToMs(timeframe);
  const now = Date.now();

  for (const signal of pending) {
    const resolution = resolveSignal(signal, candles, tfMs, now);
    if (!resolution) continue;

    const resolved = await deps.signalRepository.resolve(signal.id, resolution.outcome, resolution.resolvedAt);
    deps.realtimePublisher.publishSignalResolved(resolved);
  }
}

function resolveSignal(
  signal: Signal,
  candles: Candle[],
  tfMs: number,
  now: number,
): { outcome: ResolvedOutcome; resolvedAt: Date } | null {
  const signalTime = signal.createdAt.getTime();

  if (signal.stopLoss !== null && signal.takeProfit !== null) {
    // Skip the candle the signal fired inside — intra-candle ordering before the
    // signal's timestamp is unknowable, so only fully subsequent candles count.
    const laterCandles = candles.filter((c) => c.openTime > signalTime);

    for (const candle of laterCandles) {
      const hit = checkLevels(signal, candle);
      if (hit) return { outcome: hit, resolvedAt: new Date(candle.openTime + tfMs) };
    }
  }

  if (now - signalTime > EXPIRY_CANDLES * tfMs) {
    return { outcome: "EXPIRED", resolvedAt: new Date() };
  }

  return null;
}

function checkLevels(signal: Signal, candle: Candle): ResolvedOutcome | null {
  return evaluateLevels(signal.direction, signal.stopLoss!, signal.takeProfit!, candle);
}

/**
 * Whether a single candle resolves a position, given its levels. Stop-loss is checked
 * before take-profit so that a candle touching both counts as a LOSS (conservative —
 * OHLC data can't tell us which was hit first intra-candle). Shared by the live resolver
 * and the backtester so both classify outcomes identically.
 */
export function evaluateLevels(
  direction: SignalDirection,
  stopLoss: number,
  takeProfit: number,
  candle: Candle,
): ResolvedOutcome | null {
  if (direction === "BUY") {
    if (candle.low <= stopLoss) return "LOSS";
    if (candle.high >= takeProfit) return "WIN";
    return null;
  }

  if (candle.high >= stopLoss) return "LOSS";
  if (candle.low <= takeProfit) return "WIN";
  return null;
}

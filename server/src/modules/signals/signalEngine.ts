import { Candle } from "../../domain/entities/Candle";
import { NewSignal } from "../../domain/entities/Signal";
import { IndicatorsConfig, SymbolTimeframeConfig } from "../../domain/entities/TrackedSymbol";
import { ICandleRepository } from "../../domain/repositories/ICandleRepository";
import { ISignalRepository } from "../../domain/repositories/ISignalRepository";
import { NotificationDispatcher } from "../../infrastructure/notifications/notificationDispatcher";
import { indicatorRegistry, OrderBlock } from "./indicators";

export interface SignalEngineDeps {
  candleRepository: ICandleRepository;
  signalRepository: ISignalRepository;
  notificationDispatcher: NotificationDispatcher;
}

export const CANDLE_WINDOW = 300;
export const MIN_CANDLES_REQUIRED = 20;
/** Take-profit distance as a multiple of the entry→stop-loss risk (2 = 2R). */
const RISK_REWARD_RATIO = 2;

export async function processSymbolTimeframe(
  config: SymbolTimeframeConfig & { symbol: string },
  deps: SignalEngineDeps,
): Promise<void> {
  const candles = await deps.candleRepository.findRecent(config.symbol, config.timeframe, CANDLE_WINDOW);
  const decision = computeSignalDecision(config.symbol, config.timeframe, candles, config.indicatorsConfig);
  if (!decision) return;

  const latestSignal = await deps.signalRepository.findLatest(config.symbol, config.timeframe);
  if (isDuplicateSignal(latestSignal, decision)) return;

  const signal = await deps.signalRepository.create(decision);
  await deps.notificationDispatcher.dispatch(signal);
}

/**
 * Pure end-to-end decision over a candle window: run enabled indicators, apply the
 * decision rule. Shared by the live engine and the backtester so both behave identically.
 */
export function computeSignalDecision(
  symbol: string,
  timeframe: string,
  candles: Candle[],
  indicatorsConfig: IndicatorsConfig,
): NewSignal | null {
  if (candles.length < MIN_CANDLES_REQUIRED) return null;
  const indicatorResults = runIndicators(candles, indicatorsConfig);
  return decideSignal(symbol, timeframe, candles, indicatorResults);
}

export function runIndicators(candles: Candle[], indicatorsConfig: IndicatorsConfig): Record<string, unknown> {
  const results: Record<string, unknown> = {};

  for (const [name, options] of Object.entries(indicatorsConfig)) {
    if (options === false) continue;

    const fn = indicatorRegistry[name];
    if (!fn) continue;

    const params = typeof options === "object" ? options : {};
    results[name] = fn({ candles, params });
  }

  return results;
}

/**
 * Example decision rule: price trading back into the order block that preceded the most
 * recent bullish/bearish structure break => BUY/SELL. This is a placeholder — swap it out
 * once you've defined the exact indicators/rules you want the bot to trade on.
 */
export function decideSignal(
  symbol: string,
  timeframe: string,
  candles: Candle[],
  indicatorResults: Record<string, unknown>,
): NewSignal | null {
  const orderBlocks = indicatorResults.orderBlock as OrderBlock[] | undefined;
  if (!orderBlocks?.length) return null;

  const lastCandle = candles[candles.length - 1];
  const latestBullishOB = [...orderBlocks].reverse().find((ob) => ob.direction === "bullish");
  const latestBearishOB = [...orderBlocks].reverse().find((ob) => ob.direction === "bearish");

  const atrSeries = indicatorResults.atr as (number | null)[] | undefined;
  const lastAtr = atrSeries?.[atrSeries.length - 1] ?? null;

  if (latestBullishOB && withinZone(lastCandle.close, latestBullishOB)) {
    const { stopLoss, takeProfit } = riskLevels("BUY", lastCandle.close, latestBullishOB, lastAtr);
    return {
      symbol,
      timeframe,
      direction: "BUY",
      indicator: "orderBlock",
      price: lastCandle.close,
      stopLoss,
      takeProfit,
      reason: { orderBlock: latestBullishOB },
    };
  }

  if (latestBearishOB && withinZone(lastCandle.close, latestBearishOB)) {
    const { stopLoss, takeProfit } = riskLevels("SELL", lastCandle.close, latestBearishOB, lastAtr);
    return {
      symbol,
      timeframe,
      direction: "SELL",
      indicator: "orderBlock",
      price: lastCandle.close,
      stopLoss,
      takeProfit,
      reason: { orderBlock: latestBearishOB },
    };
  }

  return null;
}

function withinZone(price: number, ob: OrderBlock): boolean {
  return price >= ob.bottom && price <= ob.top;
}

/**
 * Stop-loss goes half an ATR beyond the far edge of the order block (falling back to the
 * zone height when ATR isn't enabled); take-profit is RISK_REWARD_RATIO times the risk.
 */
function riskLevels(
  direction: "BUY" | "SELL",
  entry: number,
  ob: OrderBlock,
  lastAtr: number | null,
): { stopLoss: number; takeProfit: number } {
  const zoneHeight = ob.top - ob.bottom;
  const buffer = 0.5 * (lastAtr ?? zoneHeight) || entry * 0.005;

  if (direction === "BUY") {
    const stopLoss = ob.bottom - buffer;
    return { stopLoss, takeProfit: entry + RISK_REWARD_RATIO * (entry - stopLoss) };
  }

  const stopLoss = ob.top + buffer;
  return { stopLoss, takeProfit: entry - RISK_REWARD_RATIO * (stopLoss - entry) };
}

/**
 * Identity of a signal for dedup: direction + the block candle's openTime. Keyed on
 * openTime (not candleIndex, which is relative to the sliding window and changes every
 * poll) so the same block can't fire twice. Returns null when there's no order block.
 */
export function signalDedupKey(signal: { direction: string; reason: unknown }): string | null {
  const openTime = (signal.reason as { orderBlock?: OrderBlock })?.orderBlock?.openTime;
  return openTime === undefined ? null : `${signal.direction}:${openTime}`;
}

function isDuplicateSignal(
  latestSignal: { direction: string; reason: unknown } | null,
  decision: NewSignal,
): boolean {
  const prevKey = latestSignal ? signalDedupKey(latestSignal) : null;
  const nextKey = signalDedupKey(decision);
  return prevKey !== null && prevKey === nextKey;
}

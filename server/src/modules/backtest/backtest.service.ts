import { Candle } from "../../domain/entities/Candle";
import { NewSignal } from "../../domain/entities/Signal";
import { IndicatorsConfig } from "../../domain/entities/TrackedSymbol";
import { CANDLE_WINDOW, MIN_CANDLES_REQUIRED, computeSignalDecision, signalDedupKey } from "../signals/signalEngine";
import { EXPIRY_CANDLES, evaluateLevels } from "../signals/signalResolver";
import { BacktestOutcome, BacktestParams, BacktestResult, BacktestTrade } from "./backtest.types";

/**
 * The strategy under test. Defaults to the live decision logic; injectable so the engine
 * mechanics can be tested in isolation and so alternative strategies can be backtested.
 */
export type DecideFn = (
  symbol: string,
  timeframe: string,
  candles: Candle[],
  indicatorsConfig: IndicatorsConfig,
) => NewSignal | null;

interface OpenPosition {
  entryIndex: number;
  entryOpenTime: number;
  direction: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  dedupKey: string | null;
}

/**
 * Walks candles oldest→newest holding one position at a time (so the equity curve and
 * drawdown are meaningful). At each candle: if a position is open, check whether it hits a
 * level or expires; otherwise evaluate the strategy on the trailing window and open a trade.
 * Resolution and dedup reuse the exact live functions, so backtest ≈ what the bot would do.
 */
export function runBacktest(
  candles: Candle[],
  params: BacktestParams,
  decide: DecideFn = computeSignalDecision,
): BacktestResult {
  const warmup = Math.max(params.warmupCandles ?? MIN_CANDLES_REQUIRED, 1);
  const expiryCandles = params.expiryCandles ?? EXPIRY_CANDLES;
  const trades: BacktestTrade[] = [];

  let position: OpenPosition | null = null;
  let lastEntryKey: string | null = null;

  for (let i = warmup; i < candles.length; i++) {
    const candle = candles[i];

    if (position) {
      const outcome = evaluateLevels(position.direction, position.stopLoss, position.takeProfit, candle);
      if (outcome) {
        const exitPrice = outcome === "WIN" ? position.takeProfit : position.stopLoss;
        trades.push(closeTrade(position, i, candle.openTime, exitPrice, outcome));
        position = null;
        continue;
      }
      if (i - position.entryIndex >= expiryCandles) {
        trades.push(closeTrade(position, i, candle.openTime, candle.close, "EXPIRED"));
        position = null;
        continue;
      }
      continue; // still holding — one position at a time
    }

    // Mirror the live sliding window exactly (findRecent(symbol, timeframe, CANDLE_WINDOW)).
    const window = candles.slice(Math.max(0, i - CANDLE_WINDOW + 1), i + 1);
    const decision = decide(params.symbol, params.timeframe, window, params.indicatorsConfig);
    if (!decision || decision.stopLoss == null || decision.takeProfit == null) continue;

    const key = signalDedupKey(decision);
    if (key !== null && key === lastEntryKey) continue; // same block already traded

    position = {
      entryIndex: i,
      entryOpenTime: candle.openTime,
      direction: decision.direction,
      entry: decision.price,
      stopLoss: decision.stopLoss,
      takeProfit: decision.takeProfit,
      dedupKey: key,
    };
    lastEntryKey = key;
  }

  return summarize(params, candles.length, trades);
}

function closeTrade(
  position: OpenPosition,
  exitIndex: number,
  exitOpenTime: number,
  exitPrice: number,
  outcome: BacktestOutcome,
): BacktestTrade {
  const returnPct =
    position.direction === "BUY"
      ? (exitPrice - position.entry) / position.entry
      : (position.entry - exitPrice) / position.entry;

  const risk = Math.abs(position.entry - position.stopLoss) / position.entry;
  const rMultiple = risk > 0 ? returnPct / risk : 0;

  return {
    direction: position.direction,
    entryIndex: position.entryIndex,
    entryOpenTime: position.entryOpenTime,
    entryPrice: position.entry,
    stopLoss: position.stopLoss,
    takeProfit: position.takeProfit,
    exitIndex,
    exitOpenTime,
    exitPrice,
    outcome,
    returnPct,
    rMultiple,
  };
}

function summarize(params: BacktestParams, candlesTested: number, trades: BacktestTrade[]): BacktestResult {
  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const losses = trades.filter((t) => t.outcome === "LOSS").length;
  const expired = trades.filter((t) => t.outcome === "EXPIRED").length;
  const resolved = wins + losses;

  let grossProfit = 0;
  let grossLoss = 0;
  let rSum = 0;
  let returnSum = 0;
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  const equityCurve: number[] = [1];

  for (const trade of trades) {
    if (trade.returnPct >= 0) grossProfit += trade.returnPct;
    else grossLoss += -trade.returnPct;

    rSum += trade.rMultiple;
    returnSum += trade.returnPct;
    equity *= 1 + trade.returnPct;
    equityCurve.push(equity);

    if (equity > peak) peak = equity;
    const drawdown = (peak - equity) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    symbol: params.symbol,
    timeframe: params.timeframe,
    candlesTested,
    totalTrades: trades.length,
    wins,
    losses,
    expired,
    winRate: resolved > 0 ? wins / resolved : 0,
    totalReturnPct: equity - 1,
    avgReturnPct: trades.length > 0 ? returnSum / trades.length : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    expectancyR: trades.length > 0 ? rSum / trades.length : 0,
    maxDrawdownPct: maxDrawdown,
    equityCurve,
    trades,
  };
}

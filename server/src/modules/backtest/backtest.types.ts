import { SignalDirection } from "../../domain/entities/Signal";
import { IndicatorsConfig } from "../../domain/entities/TrackedSymbol";

export interface BacktestParams {
  symbol: string;
  timeframe: string;
  indicatorsConfig: IndicatorsConfig;
  /** Candles skipped at the start so indicators have data to warm up. */
  warmupCandles?: number;
  /** A trade open for this many candles without hitting a level is closed as EXPIRED. */
  expiryCandles?: number;
}

export type BacktestOutcome = "WIN" | "LOSS" | "EXPIRED";

export interface BacktestTrade {
  direction: SignalDirection;
  entryIndex: number;
  entryOpenTime: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitIndex: number;
  exitOpenTime: number;
  exitPrice: number;
  outcome: BacktestOutcome;
  /** Signed return on the trade as a fraction of entry price (0.02 = +2%). */
  returnPct: number;
  /** Return expressed in units of initial risk (R). */
  rMultiple: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: string;
  candlesTested: number;
  totalTrades: number;
  wins: number;
  losses: number;
  expired: number;
  /** wins / (wins + losses); expired trades excluded. */
  winRate: number;
  /** Compounded return across all trades, full-equity-per-trade (no position sizing). */
  totalReturnPct: number;
  avgReturnPct: number;
  /** Gross profit / gross loss. null when there were no losing trades. */
  profitFactor: number | null;
  /** Average R-multiple per trade (expectancy). */
  expectancyR: number;
  maxDrawdownPct: number;
  /** Equity multiple after each trade, starting at 1. */
  equityCurve: number[];
  trades: BacktestTrade[];
}

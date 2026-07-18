export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type SignalDirection = "BUY" | "SELL";
export type SignalOutcome = "PENDING" | "WIN" | "LOSS" | "EXPIRED";

export interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  indicator: string;
  price: number;
  stopLoss: number | null;
  takeProfit: number | null;
  outcome: SignalOutcome;
  resolvedAt: string | null;
  reason: Record<string, unknown>;
  createdAt: string;
}

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorsConfig = Record<string, Record<string, unknown> | boolean>;

export interface SymbolTimeframeConfig {
  id: string;
  trackedSymbolId: string;
  timeframe: string;
  indicatorsConfig: IndicatorsConfig;
  isActive: boolean;
  lastPolledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedSymbol {
  id: string;
  symbol: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  timeframes: SymbolTimeframeConfig[];
}

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
  outcome: "WIN" | "LOSS" | "EXPIRED";
  returnPct: number;
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
  winRate: number;
  totalReturnPct: number;
  avgReturnPct: number;
  profitFactor: number | null;
  expectancyR: number;
  maxDrawdownPct: number;
  equityCurve: number[];
  trades: BacktestTrade[];
}

export interface CandleUpdatePayload {
  symbol: string;
  timeframe: string;
  candles: Candle[];
}

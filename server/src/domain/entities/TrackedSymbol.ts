/**
 * Per-indicator options, e.g. { "rsi": { "period": 14 }, "orderBlock": { "lookback": 30 } }.
 * Kept as a free-form record since indicators (and their params) are user-defined and evolving.
 */
export type IndicatorsConfig = Record<string, Record<string, unknown> | boolean>;

export interface TrackedSymbol {
  id: string;
  symbol: string;
  label: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SymbolTimeframeConfig {
  id: string;
  trackedSymbolId: string;
  timeframe: string;
  indicatorsConfig: IndicatorsConfig;
  isActive: boolean;
  lastPolledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackedSymbolWithTimeframes extends TrackedSymbol {
  timeframes: SymbolTimeframeConfig[];
}

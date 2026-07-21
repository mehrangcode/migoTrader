export const TIMEFRAMES = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

/** Indicator keys registered on the server (src/modules/signals/indicators/index.ts). */
export const INDICATORS = [
  { key: "sma", label: "SMA", hasPeriod: true, defaultPeriod: 20 },
  { key: "ema", label: "EMA", hasPeriod: true, defaultPeriod: 20 },
  { key: "rsi", label: "RSI", hasPeriod: true, defaultPeriod: 14 },
  { key: "atr", label: "ATR", hasPeriod: true, defaultPeriod: 14 },
  { key: "swingPoints", label: "Swing Points", hasPeriod: false, defaultPeriod: 0 },
  { key: "structure", label: "Structure (BOS/CHoCH)", hasPeriod: false, defaultPeriod: 0 },
  { key: "structure", label: "Structure (BOS/CHoCH)", hasPeriod: false, defaultPeriod: 0 },
  { key: "orderBlock", label: "Order Blocks", hasPeriod: false, defaultPeriod: 0 },
] as const;

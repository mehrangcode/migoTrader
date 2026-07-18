import { IndicatorContext } from "./types";

/** Exponential Moving Average of close prices, seeded with an SMA of the first `period` candles. */
export function ema({ candles, params }: IndicatorContext): (number | null)[] {
  const period = Number(params.period ?? 20);
  const closes = candles.map((c) => c.close);
  const result: (number | null)[] = new Array(closes.length).fill(null);

  if (closes.length < period) return result;

  const multiplier = 2 / (period + 1);
  const seed = closes.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  result[period - 1] = seed;

  let prevEma = seed;
  for (let i = period; i < closes.length; i++) {
    prevEma = (closes[i] - prevEma) * multiplier + prevEma;
    result[i] = prevEma;
  }

  return result;
}

import { IndicatorContext } from "./types";

/** Simple Moving Average of close prices. Index < period-1 is null (not enough data yet). */
export function sma({ candles, params }: IndicatorContext): (number | null)[] {
  const period = Number(params.period ?? 20);
  const closes = candles.map((c) => c.close);
  const result: (number | null)[] = new Array(closes.length).fill(null);

  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period) sum -= closes[i - period];
    if (i >= period - 1) result[i] = sum / period;
  }

  return result;
}

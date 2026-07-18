import { IndicatorContext } from "./types";

/** Average True Range using Wilder's smoothing. */
export function atr({ candles, params }: IndicatorContext): (number | null)[] {
  const period = Number(params.period ?? 14);
  const result: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length <= period) return result;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  let avgTr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  result[period] = avgTr;

  for (let i = period; i < trueRanges.length; i++) {
    avgTr = (avgTr * (period - 1) + trueRanges[i]) / period;
    result[i + 1] = avgTr;
  }

  return result;
}

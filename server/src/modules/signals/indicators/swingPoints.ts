import { IndicatorContext, SwingPoint } from "./types";

/**
 * Fractal-based swing high/low detection: a candle is a swing high if its high is
 * the strict max within `lookback` candles on both sides (swing low mirrors this on lows).
 */
export function swingPoints({ candles, params }: IndicatorContext): SwingPoint[] {
  const lookback = Number(params.lookback ?? 2);
  const points: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const window = candles.slice(i - lookback, i + lookback + 1);
    const isHigh = window.every((c, idx) => idx === lookback || c.high < candles[i].high);
    const isLow = window.every((c, idx) => idx === lookback || c.low > candles[i].low);

    if (isHigh) points.push({ index: i, type: "high", price: candles[i].high });
    if (isLow) points.push({ index: i, type: "low", price: candles[i].low });
  }

  return points;
}

import { IndicatorContext, StructureEvent, SwingPoint } from "./types";
import { swingPoints } from "./swingPoints";

/**
 * Break of Structure (BOS) and Change of Character (CHoCH) detection.
 *
 * Walks candles left to right, tracking the most recent *confirmed* swing high/low
 * (a fractal at index i is only "confirmed" once `lookback` candles after it exist).
 * A close beyond that swing:
 *  - in the direction of the current trend -> BOS (continuation)
 *  - against the current trend             -> CHoCH (reversal)
 * After a break, that swing is consumed so the same level can't fire twice.
 */
export function structure({ candles, params }: IndicatorContext): StructureEvent[] {
  const lookback = Number(params.lookback ?? 2);
  const swings = swingPoints({ candles, params });

  const byAvailability = swings
    .map((point) => ({ point, availableAt: point.index + lookback }))
    .sort((a, b) => a.availableAt - b.availableAt);

  const events: StructureEvent[] = [];
  let lastHigh: SwingPoint | null = null;
  let lastLow: SwingPoint | null = null;
  let trend: "bullish" | "bearish" | "unknown" = "unknown";
  let swingPtr = 0;

  for (let i = 0; i < candles.length; i++) {
    while (swingPtr < byAvailability.length && byAvailability[swingPtr].availableAt <= i) {
      const { point } = byAvailability[swingPtr];
      if (point.type === "high") lastHigh = point;
      else lastLow = point;
      swingPtr++;
    }

    const close = candles[i].close;

    if (lastHigh && i > lastHigh.index && close > lastHigh.price) {
      events.push({
        type: trend === "bullish" ? "BOS" : "CHoCH",
        direction: "bullish",
        index: i,
        price: close,
        brokenSwing: lastHigh,
      });
      trend = "bullish";
      lastHigh = null;
    } else if (lastLow && i > lastLow.index && close < lastLow.price) {
      events.push({
        type: trend === "bearish" ? "BOS" : "CHoCH",
        direction: "bearish",
        index: i,
        price: close,
        brokenSwing: lastLow,
      });
      trend = "bearish";
      lastLow = null;
    }
  }

  return events;
}

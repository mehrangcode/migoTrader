// fvg.ts
import { IndicatorContext, FairValueGap } from "./types";

const FVG_MIN = 50;  // points ($0.10 each)
const FVG_MAX = 300;

const SESSIONS = {
  london:  { open: 7,  close: 15 },
  newYork: { open: 12, close: 20 },
};

/**
 * FVG detection: a 3-candle imbalance where candle[i-2] and candle[i] don't overlap.
 * Bullish: candle[i].low > candle[i-2].high
 * Bearish: candle[i].high < candle[i-2].low
 * Only gaps between 50–300 points formed during London/NY sessions are returned.
 */
export function fairValueGap({ candles, params }: IndicatorContext): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 2; i < candles.length; i++) {
    const gap = findFVG(candles, i);
    if (gap) gaps.push(gap);
  }

  return gaps;
}

function findFVG(
  candles: IndicatorContext["candles"],
  i: number,
): FairValueGap | null {
  const prev = candles[i - 2];
  const curr = candles[i];
  const utcHour = new Date(curr.openTime).getUTCHours();

  const inLondon  = utcHour >= SESSIONS.london.open  && utcHour < SESSIONS.london.close;
  const inNewYork = utcHour >= SESSIONS.newYork.open && utcHour < SESSIONS.newYork.close;

  if (!inLondon && !inNewYork) return null;

  const bullGap = curr.low - prev.high;
  if (bullGap > 0) {
    const points = Math.round(bullGap * 10);
    if (points >= FVG_MIN && points <= FVG_MAX)
      return {
        direction: "bullish",
        candleIndex: i,
        openTime: curr.openTime,
        top: curr.low,
        bottom: prev.high,
        points,
        session: inLondon && inNewYork ? "overlap" : inLondon ? "london" : "newYork",
        filled: false,
      };
  }

  const bearGap = prev.low - curr.high;
  if (bearGap > 0) {
    const points = Math.round(bearGap * 10);
    if (points >= FVG_MIN && points <= FVG_MAX)
      return {
        direction: "bearish",
        candleIndex: i,
        openTime: curr.openTime,
        top: prev.low,
        bottom: curr.high,
        points,
        session: inLondon && inNewYork ? "overlap" : inLondon ? "london" : "newYork",
        filled: false,
      };
  }

  return null;
}

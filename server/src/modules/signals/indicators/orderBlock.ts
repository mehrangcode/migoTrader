import { IndicatorContext, OrderBlock, StructureEvent } from "./types";
import { structure } from "./structure";

/**
 * Order block detection: for each BOS/CHoCH, the order block is the last opposite-colored
 * candle before the impulsive move that produced the break (bearish candle before a bullish
 * break, bullish candle before a bearish break). Zone spans the candle's full high/low range.
 */
export function orderBlock({ candles, params }: IndicatorContext): OrderBlock[] {
  const events = structure({ candles, params });
  const blocks: OrderBlock[] = [];

  for (const event of events) {
    const block = findOrderBlockCandle(candles, event);
    if (block) blocks.push(block);
  }

  return blocks;
}

function findOrderBlockCandle(
  candles: IndicatorContext["candles"],
  event: StructureEvent,
): OrderBlock | null {
  const wantsBearishCandle = event.direction === "bullish";

  for (let i = event.index - 1; i >= 0; i--) {
    const candle = candles[i];
    const isBearish = candle.close < candle.open;
    const isBullish = candle.close > candle.open;

    if (wantsBearishCandle && isBearish) {
      return {
        direction: "bullish",
        candleIndex: i,
        openTime: candle.openTime,
        top: candle.high,
        bottom: candle.low,
        causedBy: event,
      };
    }
    if (!wantsBearishCandle && isBullish) {
      return {
        direction: "bearish",
        candleIndex: i,
        openTime: candle.openTime,
        top: candle.high,
        bottom: candle.low,
        causedBy: event,
      };
    }
  }

  return null;
}

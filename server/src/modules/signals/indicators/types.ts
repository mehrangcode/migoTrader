import { Candle } from "../../../domain/entities/Candle";

export type { Candle };

export interface IndicatorContext {
  /** Ascending by openTime, oldest first. */
  candles: Candle[];
  params: Record<string, unknown>;
}

export type IndicatorFn<TResult = unknown> = (ctx: IndicatorContext) => TResult;

export type SwingType = "high" | "low";

export interface SwingPoint {
  index: number;
  type: SwingType;
  price: number;
}

export type StructureEventType = "BOS" | "CHoCH";
export type StructureDirection = "bullish" | "bearish";

export interface StructureEvent {
  type: StructureEventType;
  direction: StructureDirection;
  index: number;
  price: number;
  brokenSwing: SwingPoint;
}

export type OrderBlockDirection = "bullish" | "bearish";

export interface OrderBlock {
  direction: OrderBlockDirection;
  candleIndex: number;
  /** openTime of the order block candle — stable identity across sliding candle windows. */
  openTime: number;
  top: number;
  bottom: number;
  /** The structure event (BOS/CHoCH) whose impulsive move this order block preceded. */
  causedBy: StructureEvent;
}

// types.ts — add alongside OrderBlock
export interface FairValueGap {
  direction:   "bullish" | "bearish";
  candleIndex: number;
  openTime:    number;
  top:         number;
  bottom:      number;
  points:      number;
  session:     "london" | "newYork" | "overlap";
  filled:      boolean;
}

import { atr } from "./atr";
import { ema } from "./ema";
import { orderBlock } from "./orderBlock";
import { rsi } from "./rsi";
import { sma } from "./sma";
import { structure } from "./structure";
import { swingPoints } from "./swingPoints";
import { IndicatorFn } from "./types";

/**
 * Central place new indicators get registered. `signalEngine` looks up each key
 * enabled in a symbol/timeframe's `indicatorsConfig` here, so adding an indicator
 * later is just: write the function, add it to this map.
 */
export const indicatorRegistry: Record<string, IndicatorFn> = {
  sma,
  ema,
  rsi,
  atr,
  swingPoints,
  structure,
  orderBlock,
};

export type IndicatorName = keyof typeof indicatorRegistry;

export * from "./types";
export { atr, ema, orderBlock, rsi, sma, structure, swingPoints };

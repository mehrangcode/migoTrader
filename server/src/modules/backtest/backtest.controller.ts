import { NextFunction, Request, Response } from "express";
import { ICandleRepository } from "../../domain/repositories/ICandleRepository";
import { backtestSchema } from "./backtest.dto";
import { runBacktest } from "./backtest.service";

const DEFAULT_LIMIT = 1000;

export class BacktestController {
  constructor(private readonly candleRepository: ICandleRepository) {}

  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = backtestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { symbol, timeframe, indicatorsConfig, limit, warmupCandles, expiryCandles } = parsed.data;

    try {
      const candles = await this.candleRepository.findRecent(symbol, timeframe, limit ?? DEFAULT_LIMIT);
      if (candles.length === 0) {
        res.status(404).json({ error: `No stored candles for ${symbol}/${timeframe}. Let the scheduler poll first.` });
        return;
      }

      const result = runBacktest(candles, { symbol, timeframe, indicatorsConfig, warmupCandles, expiryCandles });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

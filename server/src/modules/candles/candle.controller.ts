import { NextFunction, Request, Response } from "express";
import { ICandleRepository } from "../../domain/repositories/ICandleRepository";

const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 1000;

export class CandleController {
  constructor(private readonly candleRepository: ICandleRepository) {}

  recent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { symbol, timeframe, limit } = req.query;
    if (typeof symbol !== "string" || typeof timeframe !== "string") {
      res.status(400).json({ error: "symbol and timeframe query params are required" });
      return;
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    try {
      res.json(await this.candleRepository.findRecent(symbol, timeframe, parsedLimit));
    } catch (err) {
      next(err);
    }
  };
}

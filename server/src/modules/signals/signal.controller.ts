import { NextFunction, Request, Response } from "express";
import { ISignalRepository } from "../../domain/repositories/ISignalRepository";

export class SignalController {
  constructor(private readonly signalRepository: ISignalRepository) {}

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symbol, timeframe, limit } = req.query;
      const signals = await this.signalRepository.findHistory({
        symbol: typeof symbol === "string" ? symbol : undefined,
        timeframe: typeof timeframe === "string" ? timeframe : undefined,
        limit: typeof limit === "string" ? Number(limit) : undefined,
      });
      res.json(signals);
    } catch (err) {
      next(err);
    }
  };

  latest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { symbol, timeframe } = req.query;
    if (typeof symbol !== "string" || typeof timeframe !== "string") {
      res.status(400).json({ error: "symbol and timeframe query params are required" });
      return;
    }

    try {
      res.json(await this.signalRepository.findLatest(symbol, timeframe));
    } catch (err) {
      next(err);
    }
  };
}

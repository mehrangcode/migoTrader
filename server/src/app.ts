import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { appConfig } from "./config";
import { authRouter } from "./modules/auth/auth.routes";
import { backtestRouter } from "./modules/backtest/backtest.routes";
import { candleRouter } from "./modules/candles/candle.routes";
import { signalRouter } from "./modules/signals/signal.routes";
import { trackedSymbolRouter } from "./modules/trackedSymbols/trackedSymbol.routes";
import { userRouter } from "./modules/users/user.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: appConfig.cors.origin }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/tracked-symbols", trackedSymbolRouter);
  app.use("/api/signals", signalRouter);
  app.use("/api/candles", candleRouter);
  app.use("/api/backtest", backtestRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

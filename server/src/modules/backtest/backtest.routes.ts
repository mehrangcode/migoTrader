import { Router } from "express";
import { candleRepository } from "../../infrastructure/repositories";
import { requireAuth } from "../auth/auth.middleware";
import { BacktestController } from "./backtest.controller";

const controller = new BacktestController(candleRepository);

export const backtestRouter = Router();

backtestRouter.use(requireAuth);

backtestRouter.post("/", controller.run);

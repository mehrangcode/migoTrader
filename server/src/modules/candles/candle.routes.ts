import { Router } from "express";
import { candleRepository } from "../../infrastructure/repositories";
import { requireAuth } from "../auth/auth.middleware";
import { CandleController } from "./candle.controller";

const controller = new CandleController(candleRepository);

export const candleRouter = Router();

candleRouter.use(requireAuth);

candleRouter.get("/", controller.recent);

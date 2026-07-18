import { Router } from "express";
import { trackedSymbolRepository } from "../../infrastructure/repositories";
import { requireAuth } from "../auth/auth.middleware";
import { TrackedSymbolController } from "./trackedSymbol.controller";

const controller = new TrackedSymbolController(trackedSymbolRepository);

export const trackedSymbolRouter = Router();

trackedSymbolRouter.use(requireAuth);

trackedSymbolRouter.get("/", controller.list);
trackedSymbolRouter.post("/", controller.create);
trackedSymbolRouter.patch("/:id", controller.update);
trackedSymbolRouter.delete("/:id", controller.remove);

trackedSymbolRouter.post("/:id/timeframes", controller.addTimeframe);
trackedSymbolRouter.patch("/timeframes/:timeframeId", controller.updateTimeframe);
trackedSymbolRouter.delete("/timeframes/:timeframeId", controller.removeTimeframe);

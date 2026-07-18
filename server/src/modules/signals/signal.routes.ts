import { Router } from "express";
import { signalRepository } from "../../infrastructure/repositories";
import { requireAuth } from "../auth/auth.middleware";
import { SignalController } from "./signal.controller";

const controller = new SignalController(signalRepository);

export const signalRouter = Router();

signalRouter.use(requireAuth);

signalRouter.get("/", controller.history);
signalRouter.get("/latest", controller.latest);

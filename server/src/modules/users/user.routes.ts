import { Router } from "express";
import { userRepository } from "../../infrastructure/repositories";
import { requireAuth } from "../auth/auth.middleware";
import { UserController } from "./user.controller";

const userController = new UserController(userRepository);

export const userRouter = Router();

userRouter.get("/me", requireAuth, userController.me);

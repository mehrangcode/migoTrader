import { Router } from "express";
import { refreshTokenRepository, userRepository } from "../../infrastructure/repositories";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const authService = new AuthService(userRepository, refreshTokenRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

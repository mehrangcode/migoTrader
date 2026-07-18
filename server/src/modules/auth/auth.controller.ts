import { NextFunction, Request, Response } from "express";
import { User } from "../../domain/entities/User";
import { loginSchema, refreshSchema, registerSchema } from "./auth.dto";
import { AuthError, AuthService } from "./auth.service";

function toPublicUser(user: Pick<User, "id" | "email" | "role">) {
  return { id: user.id, email: user.email, role: user.role };
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const { user, tokens } = await this.authService.register(parsed.data.email, parsed.data.password);
      res.status(201).json({ user: toPublicUser(user), ...tokens });
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const { user, tokens } = await this.authService.login(parsed.data.email, parsed.data.password);
      res.json({ user: toPublicUser(user), ...tokens });
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const tokens = await this.authService.refresh(parsed.data.refreshToken);
      res.json(tokens);
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      await this.authService.logout(parsed.data.refreshToken);
      res.status(204).send();
    } catch (err) {
      this.handleError(err, res, next);
    }
  };

  private handleError(err: unknown, res: Response, next: NextFunction): void {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

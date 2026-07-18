import { Request, Response } from "express";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export class UserController {
  constructor(private readonly userRepository: IUserRepository) {}

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userRepository.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
  };
}

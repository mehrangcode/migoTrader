import { User, UserRole } from "../entities/User";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}

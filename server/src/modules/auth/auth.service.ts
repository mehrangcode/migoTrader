import bcrypt from "bcrypt";
import { User } from "../../domain/entities/User";
import { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens";

const SALT_ROUNDS = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async register(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new AuthError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepository.create({ email, passwordHash });
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new AuthError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AuthError("Invalid credentials", 401);

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError("Invalid refresh token", 401);
    }

    const stored = await this.refreshTokenRepository.findByTokenHash(hashToken(refreshToken));
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new AuthError("Invalid refresh token", 401);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) throw new AuthError("Invalid refresh token", 401);

    await this.refreshTokenRepository.revoke(stored.id);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.refreshTokenRepository.findByTokenHash(hashToken(refreshToken));
    if (stored) await this.refreshTokenRepository.revoke(stored.id);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessToken = signAccessToken(user);
    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });
    return { accessToken, refreshToken };
  }
}

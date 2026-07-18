import crypto from "crypto";
import jwt from "jsonwebtoken";
import { appConfig } from "../../config";
import { User } from "../../domain/entities/User";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(user: Pick<User, "id" | "email" | "role">): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, appConfig.jwt.accessSecret, { expiresIn: appConfig.jwt.accessTtl } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, appConfig.jwt.accessSecret) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const token = jwt.sign({ sub: userId }, appConfig.jwt.refreshSecret, {
    expiresIn: appConfig.jwt.refreshTtl,
  } as jwt.SignOptions);
  const decoded = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(decoded.exp * 1000) };
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, appConfig.jwt.refreshSecret) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

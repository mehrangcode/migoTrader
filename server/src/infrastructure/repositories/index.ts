import { prisma } from "../prisma/client";
import { PrismaCandleRepository } from "./PrismaCandleRepository";
import { PrismaNotificationChannelRepository } from "./PrismaNotificationChannelRepository";
import { PrismaRefreshTokenRepository } from "./PrismaRefreshTokenRepository";
import { PrismaSignalRepository } from "./PrismaSignalRepository";
import { PrismaTrackedSymbolRepository } from "./PrismaTrackedSymbolRepository";
import { PrismaUserRepository } from "./PrismaUserRepository";

export const userRepository = new PrismaUserRepository(prisma);
export const refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
export const trackedSymbolRepository = new PrismaTrackedSymbolRepository(prisma);
export const candleRepository = new PrismaCandleRepository(prisma);
export const signalRepository = new PrismaSignalRepository(prisma);
export const notificationChannelRepository = new PrismaNotificationChannelRepository(prisma);

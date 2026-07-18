import { PrismaClient } from "@prisma/client";
import { NotificationChannel } from "../../domain/entities/NotificationChannel";
import {
  CreateNotificationChannelInput,
  INotificationChannelRepository,
} from "../../domain/repositories/INotificationChannelRepository";

export class PrismaNotificationChannelRepository implements INotificationChannelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findEnabled(): Promise<NotificationChannel[]> {
    return this.prisma.notificationChannel.findMany({ where: { isEnabled: true } });
  }

  async findByUser(userId: string): Promise<NotificationChannel[]> {
    return this.prisma.notificationChannel.findMany({ where: { userId } });
  }

  async create(input: CreateNotificationChannelInput): Promise<NotificationChannel> {
    return this.prisma.notificationChannel.create({
      data: {
        userId: input.userId,
        type: input.type,
        target: input.target,
        isEnabled: input.isEnabled ?? false,
      },
    });
  }

  async update(id: string, input: Partial<CreateNotificationChannelInput>): Promise<NotificationChannel> {
    return this.prisma.notificationChannel.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationChannel.delete({ where: { id } });
  }
}

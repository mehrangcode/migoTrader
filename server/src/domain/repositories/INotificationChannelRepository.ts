import { NotificationChannel, NotificationChannelType } from "../entities/NotificationChannel";

export interface CreateNotificationChannelInput {
  userId: string;
  type: NotificationChannelType;
  target: string;
  isEnabled?: boolean;
}

export interface INotificationChannelRepository {
  findEnabled(): Promise<NotificationChannel[]>;
  findByUser(userId: string): Promise<NotificationChannel[]>;
  create(input: CreateNotificationChannelInput): Promise<NotificationChannel>;
  update(id: string, input: Partial<CreateNotificationChannelInput>): Promise<NotificationChannel>;
  delete(id: string): Promise<void>;
}

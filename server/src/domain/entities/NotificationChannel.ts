export type NotificationChannelType = "EMAIL" | "TELEGRAM";

export interface NotificationChannel {
  id: string;
  userId: string;
  type: NotificationChannelType;
  target: string;
  isEnabled: boolean;
  createdAt: Date;
}

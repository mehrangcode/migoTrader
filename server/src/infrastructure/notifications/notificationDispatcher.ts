import { NotificationChannelType } from "../../domain/entities/NotificationChannel";
import { Signal } from "../../domain/entities/Signal";
import { INotificationChannelRepository } from "../../domain/repositories/INotificationChannelRepository";
import { NotificationProvider } from "./notificationProvider.interface";

export class NotificationDispatcher {
  constructor(
    private readonly broadcastProvider: NotificationProvider,
    private readonly providersByType: Record<NotificationChannelType, NotificationProvider>,
    private readonly notificationChannelRepository: INotificationChannelRepository,
  ) {}

  async dispatch(signal: Signal): Promise<void> {
    await this.broadcastProvider.send(signal);

    const enabledChannels = await this.notificationChannelRepository.findEnabled();
    await Promise.all(
      enabledChannels.map((channel) => this.providersByType[channel.type]?.send(signal, channel.target)),
    );
  }
}

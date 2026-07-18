import { Server } from "socket.io";
import { Signal } from "../../domain/entities/Signal";
import { NotificationProvider } from "./notificationProvider.interface";

export class SocketNotificationProvider implements NotificationProvider {
  readonly channel = "socket";

  constructor(private readonly io: Server) {}

  async send(signal: Signal): Promise<void> {
    this.io.emit("signal:new", signal);
  }
}

import { Signal } from "../../domain/entities/Signal";
import { NotificationProvider } from "./notificationProvider.interface";

/**
 * Stub provider: wire up a real transport (e.g. nodemailer + SMTP config) later.
 * Kept behind the same NotificationProvider interface so the dispatcher/config
 * plumbing doesn't need to change once real sending is added.
 */
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel = "email";

  async send(signal: Signal, target?: string): Promise<void> {
    console.log(`[email:stub] would send to ${target ?? "<no target>"}:`, {
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      direction: signal.direction,
      price: signal.price,
    });
  }
}

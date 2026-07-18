import { Signal } from "../../domain/entities/Signal";
import { NotificationProvider } from "./notificationProvider.interface";

/**
 * Stub provider: wire up the Telegram Bot API (e.g. `node-telegram-bot-api` +
 * TELEGRAM_BOT_TOKEN) later. Kept behind the same NotificationProvider interface
 * so the dispatcher/config plumbing doesn't need to change once real sending is added.
 */
export class TelegramNotificationProvider implements NotificationProvider {
  readonly channel = "telegram";

  async send(signal: Signal, target?: string): Promise<void> {
    console.log(`[telegram:stub] would send to chat ${target ?? "<no target>"}:`, {
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      direction: signal.direction,
      price: signal.price,
    });
  }
}

import { Signal } from "../../domain/entities/Signal";

export interface NotificationProvider {
  readonly channel: string;
  /** `target` is the per-user destination (email address, chat id, ...); unused by broadcast-style providers. */
  send(signal: Signal, target?: string): Promise<void>;
}

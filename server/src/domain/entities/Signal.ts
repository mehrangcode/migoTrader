export type SignalDirection = "BUY" | "SELL";
export type SignalOutcome = "PENDING" | "WIN" | "LOSS" | "EXPIRED";
export type ResolvedOutcome = Exclude<SignalOutcome, "PENDING">;

export interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  indicator: string;
  price: number;
  stopLoss: number | null;
  takeProfit: number | null;
  outcome: SignalOutcome;
  resolvedAt: Date | null;
  reason: Record<string, unknown>;
  createdAt: Date;
}

export type NewSignal = Omit<Signal, "id" | "createdAt" | "outcome" | "resolvedAt">;

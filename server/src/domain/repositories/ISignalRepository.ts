import { NewSignal, ResolvedOutcome, Signal, SignalOutcome } from "../entities/Signal";

export interface SignalHistoryFilter {
  symbol?: string;
  timeframe?: string;
  outcome?: SignalOutcome;
  limit?: number;
}

export interface ISignalRepository {
  create(input: NewSignal): Promise<Signal>;
  findLatest(symbol: string, timeframe: string): Promise<Signal | null>;
  findHistory(filter: SignalHistoryFilter): Promise<Signal[]>;
  findPending(symbol: string, timeframe: string): Promise<Signal[]>;
  resolve(id: string, outcome: ResolvedOutcome, resolvedAt: Date): Promise<Signal>;
}

import type { Signal } from "@/lib/api/types";

export interface SignalStats {
  total: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
}

export function computeSignalStats(signals: Signal[]): SignalStats {
  const wins = signals.filter((s) => s.outcome === "WIN").length;
  const losses = signals.filter((s) => s.outcome === "LOSS").length;
  const pending = signals.filter((s) => s.outcome === "PENDING").length;
  const resolved = wins + losses;
  return {
    total: signals.length,
    wins,
    losses,
    pending,
    winRate: resolved > 0 ? wins / resolved : 0,
  };
}

/** Merge live socket signals with fetched history by id (live wins), newest first. */
export function mergeSignals(history: Signal[], live: Signal[]): Signal[] {
  const byId = new Map<string, Signal>();
  for (const s of history) byId.set(s.id, s);
  for (const s of live) byId.set(s.id, s);
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

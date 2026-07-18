import { api } from "./client";
import type { IndicatorsConfig, SymbolTimeframeConfig, TrackedSymbol } from "./types";

export const trackedSymbolsApi = {
  list: () => api.get<TrackedSymbol[]>("/tracked-symbols").then((r) => r.data),

  create: (input: { symbol: string; label?: string }) =>
    api.post<TrackedSymbol>("/tracked-symbols", input).then((r) => r.data),

  update: (id: string, input: { label?: string; isActive?: boolean }) =>
    api.patch<TrackedSymbol>(`/tracked-symbols/${id}`, input).then((r) => r.data),

  remove: (id: string) => api.delete(`/tracked-symbols/${id}`).then(() => undefined),

  addTimeframe: (id: string, input: { timeframe: string; indicatorsConfig: IndicatorsConfig; isActive?: boolean }) =>
    api.post<SymbolTimeframeConfig>(`/tracked-symbols/${id}/timeframes`, input).then((r) => r.data),

  updateTimeframe: (timeframeId: string, input: { indicatorsConfig?: IndicatorsConfig; isActive?: boolean }) =>
    api.patch<SymbolTimeframeConfig>(`/tracked-symbols/timeframes/${timeframeId}`, input).then((r) => r.data),

  removeTimeframe: (timeframeId: string) =>
    api.delete(`/tracked-symbols/timeframes/${timeframeId}`).then(() => undefined),
};

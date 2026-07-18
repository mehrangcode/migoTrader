import {
  IndicatorsConfig,
  SymbolTimeframeConfig,
  TrackedSymbol,
  TrackedSymbolWithTimeframes,
} from "../entities/TrackedSymbol";

export interface CreateTrackedSymbolInput {
  symbol: string;
  label?: string | null;
  isActive?: boolean;
}

export interface CreateTimeframeConfigInput {
  trackedSymbolId: string;
  timeframe: string;
  indicatorsConfig: IndicatorsConfig;
  isActive?: boolean;
}

export interface UpdateTimeframeConfigInput {
  indicatorsConfig?: IndicatorsConfig;
  isActive?: boolean;
  lastPolledAt?: Date;
}

export interface ITrackedSymbolRepository {
  findAll(): Promise<TrackedSymbolWithTimeframes[]>;
  findById(id: string): Promise<TrackedSymbolWithTimeframes | null>;
  findBySymbol(symbol: string): Promise<TrackedSymbol | null>;
  create(input: CreateTrackedSymbolInput): Promise<TrackedSymbol>;
  update(id: string, input: Partial<CreateTrackedSymbolInput>): Promise<TrackedSymbol>;
  delete(id: string): Promise<void>;

  findActiveTimeframeConfigs(): Promise<(SymbolTimeframeConfig & { symbol: string })[]>;
  addTimeframeConfig(input: CreateTimeframeConfigInput): Promise<SymbolTimeframeConfig>;
  updateTimeframeConfig(id: string, input: UpdateTimeframeConfigInput): Promise<SymbolTimeframeConfig>;
  deleteTimeframeConfig(id: string): Promise<void>;
}

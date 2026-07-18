import { Prisma, PrismaClient, SymbolTimeframeConfig as PrismaTimeframeConfig } from "@prisma/client";
import { IndicatorsConfig, SymbolTimeframeConfig, TrackedSymbol, TrackedSymbolWithTimeframes } from "../../domain/entities/TrackedSymbol";
import {
  CreateTimeframeConfigInput,
  CreateTrackedSymbolInput,
  ITrackedSymbolRepository,
  UpdateTimeframeConfigInput,
} from "../../domain/repositories/ITrackedSymbolRepository";

function toDomainTimeframeConfig(row: PrismaTimeframeConfig): SymbolTimeframeConfig {
  return {
    id: row.id,
    trackedSymbolId: row.trackedSymbolId,
    timeframe: row.timeframe,
    indicatorsConfig: row.indicatorsConfig as IndicatorsConfig,
    isActive: row.isActive,
    lastPolledAt: row.lastPolledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTrackedSymbolRepository implements ITrackedSymbolRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<TrackedSymbolWithTimeframes[]> {
    const rows = await this.prisma.trackedSymbol.findMany({ include: { timeframes: true } });
    return rows.map((row) => ({
      ...row,
      timeframes: row.timeframes.map(toDomainTimeframeConfig),
    }));
  }

  async findById(id: string): Promise<TrackedSymbolWithTimeframes | null> {
    const row = await this.prisma.trackedSymbol.findUnique({ where: { id }, include: { timeframes: true } });
    if (!row) return null;
    return { ...row, timeframes: row.timeframes.map(toDomainTimeframeConfig) };
  }

  async findBySymbol(symbol: string): Promise<TrackedSymbol | null> {
    return this.prisma.trackedSymbol.findUnique({ where: { symbol } });
  }

  async create(input: CreateTrackedSymbolInput): Promise<TrackedSymbol> {
    return this.prisma.trackedSymbol.create({
      data: {
        symbol: input.symbol,
        label: input.label ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async update(id: string, input: Partial<CreateTrackedSymbolInput>): Promise<TrackedSymbol> {
    return this.prisma.trackedSymbol.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trackedSymbol.delete({ where: { id } });
  }

  async findActiveTimeframeConfigs(): Promise<(SymbolTimeframeConfig & { symbol: string })[]> {
    const rows = await this.prisma.symbolTimeframeConfig.findMany({
      where: { isActive: true, trackedSymbol: { isActive: true } },
      include: { trackedSymbol: true },
    });
    return rows.map((row) => ({
      ...toDomainTimeframeConfig(row),
      symbol: row.trackedSymbol.symbol,
    }));
  }

  async addTimeframeConfig(input: CreateTimeframeConfigInput): Promise<SymbolTimeframeConfig> {
    const row = await this.prisma.symbolTimeframeConfig.create({
      data: {
        trackedSymbolId: input.trackedSymbolId,
        timeframe: input.timeframe,
        indicatorsConfig: input.indicatorsConfig as Prisma.InputJsonValue,
        isActive: input.isActive ?? true,
      },
    });
    return toDomainTimeframeConfig(row);
  }

  async updateTimeframeConfig(id: string, input: UpdateTimeframeConfigInput): Promise<SymbolTimeframeConfig> {
    const row = await this.prisma.symbolTimeframeConfig.update({
      where: { id },
      data: {
        ...(input.indicatorsConfig !== undefined
          ? { indicatorsConfig: input.indicatorsConfig as Prisma.InputJsonValue }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.lastPolledAt !== undefined ? { lastPolledAt: input.lastPolledAt } : {}),
      },
    });
    return toDomainTimeframeConfig(row);
  }

  async deleteTimeframeConfig(id: string): Promise<void> {
    await this.prisma.symbolTimeframeConfig.delete({ where: { id } });
  }
}

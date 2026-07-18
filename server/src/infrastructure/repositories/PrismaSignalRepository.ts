import { Prisma, PrismaClient, Signal as PrismaSignal } from "@prisma/client";
import { NewSignal, ResolvedOutcome, Signal } from "../../domain/entities/Signal";
import { ISignalRepository, SignalHistoryFilter } from "../../domain/repositories/ISignalRepository";

function toDomainSignal(row: PrismaSignal): Signal {
  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    direction: row.direction,
    indicator: row.indicator,
    price: row.price,
    stopLoss: row.stopLoss,
    takeProfit: row.takeProfit,
    outcome: row.outcome,
    resolvedAt: row.resolvedAt,
    reason: row.reason as Record<string, unknown>,
    createdAt: row.createdAt,
  };
}

export class PrismaSignalRepository implements ISignalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: NewSignal): Promise<Signal> {
    const row = await this.prisma.signal.create({
      data: {
        symbol: input.symbol,
        timeframe: input.timeframe,
        direction: input.direction,
        indicator: input.indicator,
        price: input.price,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        reason: input.reason as Prisma.InputJsonValue,
      },
    });
    return toDomainSignal(row);
  }

  async findLatest(symbol: string, timeframe: string): Promise<Signal | null> {
    const row = await this.prisma.signal.findFirst({
      where: { symbol, timeframe },
      orderBy: { createdAt: "desc" },
    });
    return row ? toDomainSignal(row) : null;
  }

  async findHistory(filter: SignalHistoryFilter): Promise<Signal[]> {
    const rows = await this.prisma.signal.findMany({
      where: {
        symbol: filter.symbol,
        timeframe: filter.timeframe,
        outcome: filter.outcome,
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
    });
    return rows.map(toDomainSignal);
  }

  async findPending(symbol: string, timeframe: string): Promise<Signal[]> {
    const rows = await this.prisma.signal.findMany({
      where: { symbol, timeframe, outcome: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomainSignal);
  }

  async resolve(id: string, outcome: ResolvedOutcome, resolvedAt: Date): Promise<Signal> {
    const row = await this.prisma.signal.update({
      where: { id },
      data: { outcome, resolvedAt },
    });
    return toDomainSignal(row);
  }
}

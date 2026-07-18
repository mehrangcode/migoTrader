import { PrismaClient } from "@prisma/client";
import { Candle } from "../../domain/entities/Candle";
import { ICandleRepository } from "../../domain/repositories/ICandleRepository";

export class PrismaCandleRepository implements ICandleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertMany(symbol: string, timeframe: string, candles: Candle[]): Promise<void> {
    if (candles.length === 0) return;

    // SQLite doesn't support `createMany({ skipDuplicates: true })`, so upsert one by one in a transaction.
    await this.prisma.$transaction(
      candles.map((candle) =>
        this.prisma.candle.upsert({
          where: {
            symbol_timeframe_openTime: {
              symbol,
              timeframe,
              openTime: BigInt(candle.openTime),
            },
          },
          create: {
            symbol,
            timeframe,
            openTime: BigInt(candle.openTime),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
          },
          update: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
          },
        }),
      ),
    );
  }

  async findRecent(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const rows = await this.prisma.candle.findMany({
      where: { symbol, timeframe },
      orderBy: { openTime: "desc" },
      take: limit,
    });
    return rows
      .map((row) => ({
        openTime: Number(row.openTime),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }))
      .reverse();
  }

  async findLatestOpenTime(symbol: string, timeframe: string): Promise<number | null> {
    const row = await this.prisma.candle.findFirst({
      where: { symbol, timeframe },
      orderBy: { openTime: "desc" },
      select: { openTime: true },
    });
    return row ? Number(row.openTime) : null;
  }
}

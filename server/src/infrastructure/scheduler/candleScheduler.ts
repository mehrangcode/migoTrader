import cron, { ScheduledTask } from "node-cron";
import { appConfig } from "../../config";
import { timeframeToMs } from "../../domain/timeframes";
import { processSymbolTimeframe, SignalEngineDeps } from "../../modules/signals/signalEngine";
import { resolvePendingSignals } from "../../modules/signals/signalResolver";
import { forEachWithConcurrency } from "../../utils/concurrency";
import { MarketDataProvider } from "../marketData/marketDataProvider.interface";
import { RealtimePublisher } from "../realtime/realtimePublisher.interface";
import { candleRepository, trackedSymbolRepository } from "../repositories";

const BACKFILL_LIMIT = 300;
const MAX_FETCH_LIMIT = 1000; // XT.com API maximum per request
// XT.com allows 10 req/s per IP; cap concurrent fetches well below that so a large
// symbol list can't trigger the 10-minute rate-limit ban.
const MAX_CONCURRENT_POLLS = 4;

export interface SchedulerDeps extends SignalEngineDeps {
  realtimePublisher: RealtimePublisher;
}

/** Enough to cover every candle since `latestOpenTime` (plus slack), so downtime gaps heal. */
function incrementalLimit(timeframe: string, latestOpenTime: number): number {
  const missed = Math.ceil((Date.now() - latestOpenTime) / timeframeToMs(timeframe));
  return Math.min(MAX_FETCH_LIMIT, Math.max(missed + 2, 5));
}

let pollInFlight = false;

// Cron pattern: seconds-resolution ("*/N * * * * *") for N < 60, minute-resolution otherwise.
function buildCronPattern(pollIntervalSeconds: number): string {
  if (pollIntervalSeconds >= 60 && pollIntervalSeconds % 60 === 0) {
    return `*/${pollIntervalSeconds / 60} * * * *`;
  }
  return `*/${pollIntervalSeconds} * * * * *`;
}

export function startCandleScheduler(marketDataProvider: MarketDataProvider, deps: SchedulerDeps): ScheduledTask {
  const pattern = buildCronPattern(appConfig.scheduler.pollIntervalSeconds);

  const task = cron.schedule(pattern, () => {
    void runPollCycle(marketDataProvider, deps);
  });

  void runPollCycle(marketDataProvider, deps);

  return task;
}

async function runPollCycle(marketDataProvider: MarketDataProvider, deps: SchedulerDeps): Promise<void> {
  // A slow cycle (many symbols, slow API) must not stack on top of the next cron tick.
  if (pollInFlight) return;
  pollInFlight = true;

  try {
    const configs = await trackedSymbolRepository.findActiveTimeframeConfigs();

    await forEachWithConcurrency(configs, MAX_CONCURRENT_POLLS, async (config) => {
      try {
        const latestOpenTime = await candleRepository.findLatestOpenTime(config.symbol, config.timeframe);

        // Fetch from the last stored candle *inclusive*: that candle was stored while still
        // in progress, so it must be re-fetched until finalized (upsert refreshes it).
        const candles = await marketDataProvider.fetchKlines(config.symbol, config.timeframe, {
          startTime: latestOpenTime ?? undefined,
          limit:
            latestOpenTime !== null ? incrementalLimit(config.timeframe, latestOpenTime) : BACKFILL_LIMIT,
        });

        if (candles.length > 0) {
          await candleRepository.upsertMany(config.symbol, config.timeframe, candles);
          deps.realtimePublisher.publishCandles(config.symbol, config.timeframe, candles);
        }

        await trackedSymbolRepository.updateTimeframeConfig(config.id, { lastPolledAt: new Date() });
        await resolvePendingSignals(config.symbol, config.timeframe, deps);
        await processSymbolTimeframe(config, deps);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[scheduler] poll failed for ${config.symbol}/${config.timeframe}: ${message}`);
      }
    });
  } finally {
    pollInFlight = false;
  }
}

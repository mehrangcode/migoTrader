# Trading Bot Server

TypeScript/Express backend that polls market data (XT.com public API), computes technical +
market-structure indicators, generates BUY/SELL signals, and pushes them to a frontend in real
time over Socket.IO. JWT auth, Prisma/SQLite persistence, repository pattern.

## Stack

- Express + TypeScript
- Prisma ORM + SQLite
- Socket.IO (JWT-authenticated)
- JWT access/refresh auth (bcrypt password hashing)
- node-cron scheduled polling of XT.com public REST API

## Setup

```bash
yarn install
cp .env.example .env   # adjust secrets/coins as needed
yarn prisma:migrate    # creates dev.db + applies schema
yarn dev                # starts the server with hot reload
```

Server listens on `PORT` (default `4000`). Health check: `GET /health`.

## Folder structure

```
prisma/schema.prisma        # User, RefreshToken, TrackedSymbol, SymbolTimeframeConfig,
                             # Candle, Signal, NotificationChannel
src/
  config/                   # env validation (zod) + AppConfig
  domain/                   # entities + repository interfaces (ORM-agnostic contracts)
  infrastructure/
    prisma/                 # PrismaClient singleton
    repositories/            # Prisma-backed implementations of the domain interfaces
    marketData/              # MarketDataProvider interface + XtProvider (XT.com)
    notifications/           # NotificationProvider interface + socket/email/telegram
    scheduler/                # candleScheduler: polls XT.com, persists candles, runs signalEngine
  modules/
    auth/                    # register/login/refresh/logout, JWT middleware
    users/                   # GET /api/users/me
    trackedSymbols/           # CRUD for which coins/timeframes/indicators to track
    signals/
      indicators/             # sma, ema, rsi, atr, swingPoints, structure (BOS/CHoCH), orderBlock
      signalEngine.ts          # runs enabled indicators, decides + persists + dispatches signals
  sockets/io.ts               # Socket.IO server, JWT handshake auth
  app.ts / server.ts          # wiring + bootstrap
```

## Auth flow

- `POST /api/auth/register` `{ email, password }` -> user + access/refresh tokens
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/refresh` `{ refreshToken }` -> rotates the refresh token
- `POST /api/auth/logout` `{ refreshToken }`

All other `/api/*` routes require `Authorization: Bearer <accessToken>`.

Socket.IO clients must connect with `auth: { token: accessToken }`; the server rejects the
connection otherwise. Events pushed to connected clients:

- `signal:new` — a signal was generated (includes `stopLoss`/`takeProfit`)
- `signal:resolved` — a pending signal was marked `WIN`/`LOSS`/`EXPIRED`
- `candle:update` — fresh candles were fetched for a tracked symbol/timeframe
  (`{ symbol, timeframe, candles }`)

## Candles & signals REST

- `GET /api/candles?symbol=BTC_USDT&timeframe=1h&limit=300` — stored candle history (for charts)
- `GET /api/signals?symbol&timeframe&outcome&limit` — signal history
- `GET /api/signals/latest?symbol&timeframe` — most recent signal

## Backtesting

`POST /api/backtest` runs the current strategy over stored candles and returns performance stats.
It reuses the *exact* live decision (`computeSignalDecision`) and outcome (`evaluateLevels`)
logic, so results reflect what the bot would actually have done.

Request body:
```json
{
  "symbol": "BTC_USDT",
  "timeframe": "1h",
  "indicatorsConfig": { "structure": true, "orderBlock": true, "atr": { "period": 14 } },
  "limit": 1000,          // optional: most-recent candles to test over (default 1000)
  "warmupCandles": 20,    // optional: candles skipped so indicators warm up
  "expiryCandles": 100    // optional: close a trade unresolved after N candles
}
```

Response includes `winRate`, `totalReturnPct`, `avgReturnPct`, `profitFactor`, `expectancyR`
(average R-multiple), `maxDrawdownPct`, an `equityCurve` array, and the full `trades` list with
entry/exit index, price, levels, outcome, and per-trade return. The backtester holds one position
at a time (so the equity curve and drawdown are meaningful) and needs candles already stored — let
the scheduler poll first, or it returns 404.

The engine (`runBacktest` in `src/modules/backtest/backtest.service.ts`) is a pure function and
accepts an injectable `decide` strategy, so you can unit-test it or backtest alternative strategies
without touching the DB.

## Signal lifecycle

Every signal is created with ATR-based risk levels (stop-loss half an ATR beyond the far edge
of the order block, take-profit at 2R) and starts as `PENDING`. On each poll the resolver walks
candles that closed after the signal: touching take-profit first marks it `WIN`, stop-loss first
marks it `LOSS` (if both fall in one candle it counts as `LOSS`, conservatively). A signal that
hits neither level within 100 candles becomes `EXPIRED`. Resolutions are pushed as
`signal:resolved` events, so win/loss stats can be computed from `GET /api/signals?outcome=WIN`.

## Configuring what the bot tracks

Coins, timeframes, and per-timeframe indicator options are runtime data (not static config), so
they can be changed without redeploying:

- `POST /api/tracked-symbols` `{ symbol: "BTC_USDT", label? }`
- `POST /api/tracked-symbols/:id/timeframes` `{ timeframe: "1h", indicatorsConfig: { "structure": true, "orderBlock": true, "rsi": { "period": 14 } } }`
- `PATCH /api/tracked-symbols/timeframes/:timeframeId` to change `indicatorsConfig`/`isActive`
- `GET /api/tracked-symbols` to list current config

`symbol` must match XT.com's format, e.g. `BTC_USDT`. `timeframe` must be one of XT.com's
supported intervals: `1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M`.

## Adding a new indicator

1. Write a function `(ctx: IndicatorContext) => TResult` in `src/modules/signals/indicators/`.
2. Register it in `indicatorRegistry` in `src/modules/signals/indicators/index.ts`.
3. Enable it per symbol/timeframe via the `indicatorsConfig` REST endpoints above.
4. Adjust the decision rule in `signalEngine.ts` (`decideSignal`) to use its output — the shipped
   rule (order block + structure break) is a placeholder meant to be replaced.

## Adding a real email/Telegram notification channel

`src/infrastructure/notifications/emailNotificationProvider.ts` and
`telegramNotificationProvider.ts` are stubs that log what they'd send. Replace their `send()`
bodies with real SMTP (`nodemailer`) / Telegram Bot API calls — the `NotificationDispatcher` and
`NotificationChannel` DB table (per-user, `isEnabled` toggle) are already wired up.

## Market data provider

`src/infrastructure/marketData/xtProvider.ts` implements the `MarketDataProvider` interface
against XT.com's public REST API (`sapi.xt.com/v4/public/kline`, no API key needed). Swap in
Binance/CoinGecko/etc. by adding another implementation of the same interface and using it in
`src/server.ts`.

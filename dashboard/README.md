# Amigo Dashboard

React + TypeScript frontend for the Amigo trading bot ([`../server`](../server)). Login, live
signal feed (Socket.IO), candlestick charts, tracked-symbol/indicator config, signal history with
win/loss stats, and a backtest runner.

## Stack

- Vite + React 19 + TypeScript
- Tailwind v4 + shadcn (base-ui) components, Raleway font, light/dark theme
- zustand (auth store) · react-router · axios (JWT + refresh interceptor)
- socket.io-client (JWT handshake) · lightweight-charts (candles + equity curve)

## Setup

```bash
yarn install
cp .env .env.local   # optional; defaults to http://localhost:4000
yarn dev              # http://localhost:3000
```

The dev server runs on **port 3000** to match the server's `CORS_ORIGIN` (`../server/.env`). Start
the backend first (`cd ../server && yarn dev`).

`VITE_API_URL` (in `.env`) points at the backend; defaults to `http://localhost:4000`.

## What's wired

| Area | Detail |
|------|--------|
| Auth | `POST /api/auth/login` + `register`; tokens in localStorage; axios auto-refreshes on 401 and drops to `/login` when refresh fails |
| Live | Socket.IO connects with `auth: { token }`; `signal:new`, `signal:resolved`, `candle:update` |
| Overview | Live signal feed + win/loss/pending stat cards |
| Chart | lightweight-charts candlesticks, live-updating, with BUY/SELL markers from signal history |
| Signals | Filterable history (symbol / timeframe / outcome) with win-rate stats |
| Tracked Symbols | CRUD for symbols + per-timeframe indicator config (checkbox + period editor) |
| Backtest | Runs `POST /api/backtest`; shows stat cards, equity curve, and the trades table |

## Structure

```
src/
  config.ts               # VITE_API_URL
  lib/
    api/                  # axios client (JWT + refresh) + typed modules (auth, signals, candles, ...)
    tokenStorage.ts       # localStorage token access
    format.ts, errors.ts, signalStats.ts, constants.ts
  store/authStore.ts      # zustand auth state (login/register/logout/hydrate)
  hooks/
    useSocket.ts          # JWT Socket.IO connection tied to auth
    liveData.tsx          # provider: shared socket + live signal accumulation
    useAsync.ts           # tiny data-fetch hook (data/loading/error/reload)
  components/
    ui/                   # button, card, input, select, badge, table, ... (base-ui + cva)
    chart/                # CandleChart, EquityCurveChart (lightweight-charts)
    layout/               # AppLayout (sidebar), ProtectedRoute, ThemeToggle
    IndicatorConfigEditor.tsx, StatCard.tsx, signals/SignalBadges.tsx
  pages/                  # Login, Overview, Chart, Signals, Symbols, Backtest
  App.tsx                 # router
```

## Scripts

- `yarn dev` — dev server on :3000
- `yarn build` — typecheck (`tsc -b`) + production build
- `yarn preview` — preview the production build
- `yarn lint` — eslint

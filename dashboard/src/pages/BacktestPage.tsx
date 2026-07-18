import { useEffect, useState } from "react";
import { RiFlashlightLine } from "@remixicon/react";
import { EquityCurveChart } from "@/components/chart/EquityCurveChart";
import { IndicatorConfigEditor } from "@/components/IndicatorConfigEditor";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { backtestApi } from "@/lib/api/backtest";
import { trackedSymbolsApi } from "@/lib/api/trackedSymbols";
import type { BacktestResult, IndicatorsConfig } from "@/lib/api/types";
import { TIMEFRAMES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatPct, formatPrice, formatSignedPct } from "@/lib/format";

export function BacktestPage() {
  const { data: symbols } = useAsync(() => trackedSymbolsApi.list(), []);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1h");
  const [limit, setLimit] = useState(1000);
  const [indicatorsConfig, setIndicatorsConfig] = useState<IndicatorsConfig>({
    structure: true,
    orderBlock: true,
    atr: { period: 14 },
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!symbol && symbols && symbols.length > 0) setSymbol(symbols[0].symbol);
  }, [symbols, symbol]);

  const run = async () => {
    setError(null);
    setRunning(true);
    setResult(null);
    try {
      const res = await backtestApi.run({ symbol, timeframe, indicatorsConfig, limit });
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Backtest</h1>
        <p className="text-sm text-muted-foreground">Run the strategy over stored candles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Symbol</Label>
              <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-48">
                {(symbols ?? []).length === 0 ? <option value="">No tracked symbols</option> : null}
                {(symbols ?? []).map((s) => (
                  <option key={s.id} value={s.symbol}>
                    {s.symbol}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Timeframe</Label>
              <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-32">
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Candles</Label>
              <Input
                type="number"
                min={50}
                max={5000}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-28"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Indicators</Label>
            <IndicatorConfigEditor value={indicatorsConfig} onChange={setIndicatorsConfig} />
          </div>

          <div>
            <Button onClick={() => void run()} disabled={running || !symbol}>
              {running ? <Spinner /> : <RiFlashlightLine />}
              Run backtest
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? <BacktestResultView result={result} /> : null}
    </div>
  );
}

function BacktestResultView({ result }: { result: BacktestResult }) {
  const positive = result.totalReturnPct >= 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Trades" value={result.totalTrades} hint={`${result.candlesTested} candles`} />
        <StatCard label="Win rate" value={formatPct(result.winRate)} hint={`${result.wins}W / ${result.losses}L`} />
        <StatCard
          label="Total return"
          value={formatSignedPct(result.totalReturnPct)}
          tone={positive ? "positive" : "negative"}
        />
        <StatCard
          label="Expectancy"
          value={`${result.expectancyR.toFixed(2)}R`}
          tone={result.expectancyR >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Profit factor"
          value={result.profitFactor === null ? "∞" : result.profitFactor.toFixed(2)}
        />
        <StatCard label="Max drawdown" value={formatPct(result.maxDrawdownPct)} tone="negative" />
      </div>

      {result.equityCurve.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Equity curve</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityCurveChart equityCurve={result.equityCurve} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Trades ({result.trades.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {result.trades.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No trades were generated for these parameters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>R</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.trades.map((trade, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{formatDateTime(trade.entryOpenTime)}</TableCell>
                    <TableCell>{trade.direction}</TableCell>
                    <TableCell className="tabular-nums">{formatPrice(trade.entryPrice)}</TableCell>
                    <TableCell className="tabular-nums">{formatPrice(trade.exitPrice)}</TableCell>
                    <TableCell>{trade.outcome}</TableCell>
                    <TableCell
                      className={trade.returnPct >= 0 ? "tabular-nums text-chart-2" : "tabular-nums text-destructive"}
                    >
                      {formatSignedPct(trade.returnPct)}
                    </TableCell>
                    <TableCell className="tabular-nums">{trade.rMultiple.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { DirectionBadge, OutcomeBadge } from "@/components/signals/SignalBadges";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { signalsApi } from "@/lib/api/signals";
import { trackedSymbolsApi } from "@/lib/api/trackedSymbols";
import type { SignalOutcome } from "@/lib/api/types";
import { TIMEFRAMES } from "@/lib/constants";
import { formatDateTime, formatPct, formatPrice } from "@/lib/format";
import { computeSignalStats } from "@/lib/signalStats";

const OUTCOMES: SignalOutcome[] = ["PENDING", "WIN", "LOSS", "EXPIRED"];

export function SignalsPage() {
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [outcome, setOutcome] = useState<SignalOutcome | "">("");

  const { data: symbols } = useAsync(() => trackedSymbolsApi.list(), []);
  const { data: signals, loading } = useAsync(
    () =>
      signalsApi.history({
        symbol: symbol || undefined,
        timeframe: timeframe || undefined,
        outcome: outcome || undefined,
        limit: 200,
      }),
    [symbol, timeframe, outcome],
  );

  const stats = useMemo(() => computeSignalStats(signals ?? []), [signals]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Signals</h1>
        <p className="text-sm text-muted-foreground">Signal history and outcomes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Matched" value={stats.total} />
        <StatCard label="Win rate" value={formatPct(stats.winRate)} hint={`${stats.wins}W / ${stats.losses}L`} />
        <StatCard label="Wins" value={stats.wins} tone="positive" />
        <StatCard label="Losses" value={stats.losses} tone="negative" />
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Symbol</Label>
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-44">
              <option value="">All</option>
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
              <option value="">All</option>
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Outcome</Label>
            <Select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as SignalOutcome | "")}
              className="w-36"
            >
              <option value="">All</option>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          ) : (signals ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No signals match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>TF</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>SL / TP</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(signals ?? []).map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(signal.createdAt)}</TableCell>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>{signal.timeframe}</TableCell>
                    <TableCell>
                      <DirectionBadge direction={signal.direction} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{signal.indicator}</TableCell>
                    <TableCell className="tabular-nums">{formatPrice(signal.price)}</TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {formatPrice(signal.stopLoss)} / {formatPrice(signal.takeProfit)}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={signal.outcome} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(signal.resolvedAt)}</TableCell>
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

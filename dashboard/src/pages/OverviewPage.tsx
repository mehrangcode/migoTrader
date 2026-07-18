import { useMemo } from "react";
import { RiWifiLine, RiWifiOffLine } from "@remixicon/react";
import { StatCard } from "@/components/StatCard";
import { DirectionBadge, OutcomeBadge } from "@/components/signals/SignalBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLiveData } from "@/hooks/liveData";
import { useAsync } from "@/hooks/useAsync";
import { signalsApi } from "@/lib/api/signals";
import { formatPct, formatPrice, formatTime } from "@/lib/format";
import { computeSignalStats, mergeSignals } from "@/lib/signalStats";

export function OverviewPage() {
  const { connected, liveSignals } = useLiveData();
  const { data: history, loading } = useAsync(() => signalsApi.history({ limit: 100 }), []);

  const signals = useMemo(() => mergeSignals(history ?? [], liveSignals), [history, liveSignals]);
  const stats = useMemo(() => computeSignalStats(signals), [signals]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">Live signals and performance at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {connected ? (
            <RiWifiLine className="size-4 text-chart-2" />
          ) : (
            <RiWifiOffLine className="size-4 text-muted-foreground" />
          )}
          {connected ? "Live" : "Disconnected"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total signals" value={stats.total} />
        <StatCard label="Win rate" value={formatPct(stats.winRate)} hint={`${stats.wins}W / ${stats.losses}L`} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Resolved" value={stats.wins + stats.losses} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent signals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          ) : signals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No signals yet. They'll appear here live as the bot generates them.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>TF</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>SL / TP</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.slice(0, 25).map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="text-muted-foreground">{formatTime(signal.createdAt)}</TableCell>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>{signal.timeframe}</TableCell>
                    <TableCell>
                      <DirectionBadge direction={signal.direction} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatPrice(signal.price)}</TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {formatPrice(signal.stopLoss)} / {formatPrice(signal.takeProfit)}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={signal.outcome} />
                    </TableCell>
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

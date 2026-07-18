import { useEffect, useState } from "react";
import { CandleChart } from "@/components/chart/CandleChart";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { trackedSymbolsApi } from "@/lib/api/trackedSymbols";
import { TIMEFRAMES } from "@/lib/constants";

export function ChartPage() {
  const { data: symbols } = useAsync(() => trackedSymbolsApi.list(), []);
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1h");

  // Default to the first tracked symbol / its first configured timeframe once loaded.
  useEffect(() => {
    if (!symbol && symbols && symbols.length > 0) {
      setSymbol(symbols[0].symbol);
      if (symbols[0].timeframes.length > 0) setTimeframe(symbols[0].timeframes[0].timeframe);
    }
  }, [symbols, symbol]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Chart</h1>
        <p className="text-sm text-muted-foreground">Live candles with signal markers</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Symbol</Label>
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-48">
              {(symbols ?? []).length === 0 ? <option value="">No tracked symbols</option> : null}
              {(symbols ?? []).map((s) => (
                <option key={s.id} value={s.symbol}>
                  {s.symbol}
                  {s.label ? ` — ${s.label}` : ""}
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          {symbol ? (
            <CandleChart symbol={symbol} timeframe={timeframe} />
          ) : (
            <div className="flex h-[520px] items-center justify-center text-sm text-muted-foreground">
              Add a tracked symbol to view its chart.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { IndicatorConfigEditor } from "@/components/IndicatorConfigEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAsync } from "@/hooks/useAsync";
import { trackedSymbolsApi } from "@/lib/api/trackedSymbols";
import type { IndicatorsConfig, TrackedSymbol } from "@/lib/api/types";
import { TIMEFRAMES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

export function SymbolsPage() {
  const { data: symbols, loading, error, reload } = useAsync(() => trackedSymbolsApi.list(), []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Tracked Symbols</h1>
        <p className="text-sm text-muted-foreground">Configure which coins, timeframes, and indicators the bot tracks</p>
      </div>

      <AddSymbolForm onAdded={reload} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : (symbols ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No symbols tracked yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {(symbols ?? []).map((s) => (
            <SymbolCard key={s.id} symbol={s} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddSymbolForm({ onAdded }: { onAdded: () => void }) {
  const [symbol, setSymbol] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await trackedSymbolsApi.create({ symbol, label: label || undefined });
      setSymbol("");
      setLabel("");
      onAdded();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add symbol</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Symbol (e.g. BTC_USDT)</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="w-48" />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : <RiAddLine />}
            Add
          </Button>
          {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function SymbolCard({ symbol, onChanged }: { symbol: TrackedSymbol; onChanged: () => void }) {
  const toggleActive = async () => {
    await trackedSymbolsApi.update(symbol.id, { isActive: !symbol.isActive });
    onChanged();
  };

  const remove = async () => {
    await trackedSymbolsApi.remove(symbol.id);
    onChanged();
  };

  const removeTimeframe = async (timeframeId: string) => {
    await trackedSymbolsApi.removeTimeframe(timeframeId);
    onChanged();
  };

  const toggleTimeframe = async (timeframeId: string, isActive: boolean) => {
    await trackedSymbolsApi.updateTimeframe(timeframeId, { isActive });
    onChanged();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{symbol.symbol}</CardTitle>
          {symbol.label ? <span className="text-sm text-muted-foreground">{symbol.label}</span> : null}
          <Badge variant={symbol.isActive ? "success" : "muted"}>{symbol.isActive ? "Active" : "Paused"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void toggleActive()}>
            {symbol.isActive ? "Pause" : "Activate"}
          </Button>
          <Button variant="destructive" size="icon-sm" onClick={() => void remove()} aria-label="Delete symbol">
            <RiDeleteBinLine />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {symbol.timeframes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeframes configured.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {symbol.timeframes.map((tf) => (
              <div
                key={tf.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge>{tf.timeframe}</Badge>
                  <Badge variant={tf.isActive ? "success" : "muted"}>{tf.isActive ? "on" : "off"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(tf.indicatorsConfig).join(", ") || "no indicators"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => void toggleTimeframe(tf.id, !tf.isActive)}>
                    {tf.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void removeTimeframe(tf.id)}
                    aria-label="Remove timeframe"
                  >
                    <RiDeleteBinLine />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddTimeframeForm symbolId={symbol.id} onAdded={onChanged} />
      </CardContent>
    </Card>
  );
}

function AddTimeframeForm({ symbolId, onAdded }: { symbolId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("1h");
  const [indicatorsConfig, setIndicatorsConfig] = useState<IndicatorsConfig>({
    structure: true,
    orderBlock: true,
    atr: { period: 14 },
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <RiAddLine />
        Add timeframe
      </Button>
    );
  }

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await trackedSymbolsApi.addTimeframe(symbolId, { timeframe, indicatorsConfig });
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex items-end gap-3">
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Indicators</Label>
        <IndicatorConfigEditor value={indicatorsConfig} onChange={setIndicatorsConfig} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={busy}>
          {busy ? <Spinner /> : "Save timeframe"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDICATORS } from "@/lib/constants";
import type { IndicatorsConfig } from "@/lib/api/types";

/**
 * Edits an IndicatorsConfig record: a checkbox per indicator, plus a period input for the
 * indicators that take one. Enabled-with-params serialize to `{ period }`; enabled-no-params
 * serialize to `true`; disabled indicators are omitted.
 */
export function IndicatorConfigEditor({
  value,
  onChange,
}: {
  value: IndicatorsConfig;
  onChange: (next: IndicatorsConfig) => void;
}) {
  const isEnabled = (key: string) => value[key] !== undefined && value[key] !== false;
  const getPeriod = (key: string, fallback: number) => {
    const entry = value[key];
    if (entry && typeof entry === "object" && typeof entry.period === "number") return entry.period;
    return fallback;
  };

  const toggle = (key: string, hasPeriod: boolean, defaultPeriod: number) => {
    const next = { ...value };
    if (isEnabled(key)) delete next[key];
    else next[key] = hasPeriod ? { period: defaultPeriod } : true;
    onChange(next);
  };

  const setPeriod = (key: string, period: number) => {
    onChange({ ...value, [key]: { period } });
  };

  return (
    <div className="flex flex-col gap-2">
      {INDICATORS.map((ind) => {
        const enabled = isEnabled(ind.key);
        return (
          <div
            key={ind.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggle(ind.key, ind.hasPeriod, ind.defaultPeriod)}
                className="size-4 accent-primary"
              />
              {ind.label}
            </label>

            {enabled && ind.hasPeriod ? (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">period</Label>
                <Input
                  type="number"
                  min={1}
                  value={getPeriod(ind.key, ind.defaultPeriod)}
                  onChange={(e) => setPeriod(ind.key, Number(e.target.value))}
                  className="h-8 w-20"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

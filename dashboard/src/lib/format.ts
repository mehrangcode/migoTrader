export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function formatPct(fraction: number | null | undefined, digits = 1): string {
  if (fraction === null || fraction === undefined) return "—";
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatSignedPct(fraction: number, digits = 1): string {
  const sign = fraction > 0 ? "+" : "";
  return `${sign}${(fraction * 100).toFixed(digits)}%`;
}

export function formatDateTime(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Date(value).toLocaleString();
}

export function formatTime(value: string | number): string {
  return new Date(value).toLocaleTimeString();
}

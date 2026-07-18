export interface XtApiResponse<T> {
  rc: number;
  mc: string;
  ma: unknown[];
  result: T;
}

export interface XtKlineEntry {
  t: number;
  o: string;
  c: string;
  h: string;
  l: string;
  q: string;
  v: string;
}

export interface XtSymbolEntry {
  symbol: string;
  state: string;
}

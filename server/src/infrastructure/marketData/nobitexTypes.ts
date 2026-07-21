export interface NobitexUdfHistoryResponse {
  /** "ok" on success */
  s: string;
  /** Open times as UNIX seconds */
  t: number[];
  /** Open prices */
  o: number[];
  /** High prices */
  h: number[];
  /** Low prices */
  l: number[];
  /** Close prices */
  c: number[];
  /** Volumes */
  v: number[];
}

export interface NobitexUdfSymbolInfo {
  symbol: string[];
  description: string[];
  "exchange-listed": string[];
  "exchange-traded": string[];
}

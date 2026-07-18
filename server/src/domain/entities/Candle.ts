export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StoredCandle extends Candle {
  id: string;
  symbol: string;
  timeframe: string;
  createdAt: Date;
}

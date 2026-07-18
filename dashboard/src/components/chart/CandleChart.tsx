import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { useLiveData } from "@/hooks/liveData";
import { useAsync } from "@/hooks/useAsync";
import { candlesApi } from "@/lib/api/candles";
import { signalsApi } from "@/lib/api/signals";
import type { Candle, CandleUpdatePayload, Signal } from "@/lib/api/types";

const toBar = (c: Candle): CandlestickData => ({
  time: Math.floor(c.openTime / 1000) as UTCTimestamp,
  open: c.open,
  high: c.high,
  low: c.low,
  close: c.close,
});

function toMarkers(signals: Signal[]): SeriesMarker<Time>[] {
  return signals
    .map((s) => ({
      time: Math.floor(new Date(s.createdAt).getTime() / 1000) as UTCTimestamp,
      position: s.direction === "BUY" ? ("belowBar" as const) : ("aboveBar" as const),
      color: s.direction === "BUY" ? "#26a69a" : "#ef5350",
      shape: s.direction === "BUY" ? ("arrowUp" as const) : ("arrowDown" as const),
      text: s.direction,
    }))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function CandleChart({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const { socket } = useLiveData();

  const { data: candles, loading } = useAsync(() => candlesApi.recent(symbol, timeframe, 500), [symbol, timeframe]);
  const { data: signals } = useAsync(() => signalsApi.history({ symbol, timeframe, limit: 200 }), [symbol, timeframe]);

  // Create the chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart: IChartApi = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a8a8a",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(128,128,128,0.1)" },
        horzLines: { color: "rgba(128,128,128,0.1)" },
      },
      rightPriceScale: { borderColor: "rgba(128,128,128,0.2)" },
      timeScale: { borderColor: "rgba(128,128,128,0.2)", timeVisible: true },
      autoSize: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    return () => {
      chart.remove();
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Load historical candles.
  useEffect(() => {
    if (seriesRef.current && candles) {
      seriesRef.current.setData(candles.map(toBar));
    }
  }, [candles]);

  // Overlay signal markers.
  useEffect(() => {
    if (markersRef.current && signals) {
      markersRef.current.setMarkers(toMarkers(signals));
    }
  }, [signals]);

  // Live candle updates for this symbol/timeframe.
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload: CandleUpdatePayload) => {
      if (payload.symbol !== symbol || payload.timeframe !== timeframe) return;
      for (const candle of payload.candles) seriesRef.current?.update(toBar(candle));
    };
    socket.on("candle:update", onUpdate);
    return () => {
      socket.off("candle:update", onUpdate);
    };
  }, [socket, symbol, timeframe]);

  return (
    <div className="relative h-[520px] w-full">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : (candles ?? []).length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No candles stored for {symbol}/{timeframe} yet.
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

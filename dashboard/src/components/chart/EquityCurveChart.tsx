import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  createChart,
  type AreaData,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

/**
 * Renders the backtest equity curve. The x-axis is trade index (0..N); lightweight-charts
 * needs time values, so we map each trade to a synthetic day so points stay ordered.
 */
export function EquityCurveChart({ equityCurve }: { equityCurve: number[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      timeScale: { borderColor: "rgba(128,128,128,0.2)", visible: false },
      autoSize: true,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#4a86e8",
      topColor: "rgba(74,134,232,0.4)",
      bottomColor: "rgba(74,134,232,0.02)",
      lineWidth: 2,
    });

    const data: AreaData[] = equityCurve.map((value, i) => ({
      time: (i * 86400) as UTCTimestamp,
      value,
    }));
    series.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [equityCurve]);

  return <div ref={containerRef} className="h-64 w-full" />;
}

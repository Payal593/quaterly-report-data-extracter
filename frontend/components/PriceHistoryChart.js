"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "1M", months: 1 },
  { label: "6M", months: 6 },
  { label: "1Y", years: 1 },
  { label: "3Y", years: 3 },
  { label: "5Y", years: 5 },
  { label: "10Y", years: 10 },
  { label: "Max" },
];

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const tooltipDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const axisDateFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "2-digit",
});
const shortAxisDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

function toFiniteNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeDailyData(dailyData) {
  const pointsByDate = new Map();

  dailyData.forEach((item) => {
    const parsedDate = new Date(item.Date);
    const timestamp = parsedDate.getTime();

    if (!Number.isFinite(timestamp)) return;

    const dateKey = parsedDate.toISOString().slice(0, 10);
    pointsByDate.set(dateKey, {
      timestamp,
      dateLabel: tooltipDateFormatter.format(parsedDate),
      price: toFiniteNumber(item.Close),
      volume: toFiniteNumber(item.Volume),
    });
  });

  return Array.from(pointsByDate.values()).sort(
    (first, second) => first.timestamp - second.timestamp,
  );
}

function calculateMovingAverage(data, windowSize) {
  const averages = new Map();
  const priceWindow = [];
  let windowTotal = 0;

  data.forEach((point) => {
    if (point.price == null) {
      averages.set(point.timestamp, null);
      return;
    }

    priceWindow.push(point.price);
    windowTotal += point.price;

    if (priceWindow.length > windowSize) {
      windowTotal -= priceWindow.shift();
    }

    averages.set(
      point.timestamp,
      priceWindow.length === windowSize ? windowTotal / windowSize : null,
    );
  });

  return averages;
}

function addMovingAverages(data) {
  const dma50 = calculateMovingAverage(data, 50);
  const dma200 = calculateMovingAverage(data, 200);

  return data.map((point) => ({
    ...point,
    dma50: dma50.get(point.timestamp),
    dma200: dma200.get(point.timestamp),
  }));
}

function filterByRange(data, selectedRange) {
  if (selectedRange === "Max" || data.length === 0) return data;

  const range = RANGE_OPTIONS.find((option) => option.label === selectedRange);
  const cutoff = new Date(data.at(-1).timestamp);

  if (range.months) cutoff.setMonth(cutoff.getMonth() - range.months);
  if (range.years) cutoff.setFullYear(cutoff.getFullYear() - range.years);

  return data.filter((point) => point.timestamp >= cutoff.getTime());
}

function formatPrice(value) {
  return value == null ? "—" : priceFormatter.format(value);
}

function formatVolume(value) {
  return value == null ? "—" : compactNumberFormatter.format(value);
}

function ChartTooltip({ active, payload, enabledSeries }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="price-chart-tooltip">
      <p>{point.dateLabel}</p>
      {enabledSeries.price && (
        <span><i className="tooltip-key tooltip-key--price" />Price <strong>{formatPrice(point.price)}</strong></span>
      )}
      {enabledSeries.dma50 && (
        <span><i className="tooltip-key tooltip-key--dma50" />50 DMA <strong>{formatPrice(point.dma50)}</strong></span>
      )}
      {enabledSeries.dma200 && (
        <span><i className="tooltip-key tooltip-key--dma200" />200 DMA <strong>{formatPrice(point.dma200)}</strong></span>
      )}
      {enabledSeries.volume && (
        <span><i className="tooltip-key tooltip-key--volume" />Volume <strong>{formatVolume(point.volume)}</strong></span>
      )}
    </div>
  );
}

const SERIES_OPTIONS = [
  { key: "price", label: "Price" },
  { key: "dma50", label: "50 DMA" },
  { key: "dma200", label: "200 DMA" },
  { key: "volume", label: "Volume" },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionPreference() {
  return false;
}

export default function PriceHistoryChart({ dailyData }) {
  const [selectedRange, setSelectedRange] = useState("1Y");
  const [enabledSeries, setEnabledSeries] = useState({
    price: true,
    dma50: false,
    dma200: false,
    volume: true,
  });
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotionPreference,
  );
  const shouldAnimate = !prefersReducedMotion;

  const normalizedData = useMemo(
    () => normalizeDailyData(Array.isArray(dailyData) ? dailyData : []),
    [dailyData],
  );
  const dataWithMovingAverages = useMemo(
    () => addMovingAverages(normalizedData),
    [normalizedData],
  );
  const visibleData = useMemo(
    () => filterByRange(dataWithMovingAverages, selectedRange),
    [dataWithMovingAverages, selectedRange],
  );

  function toggleSeries(seriesKey) {
    setEnabledSeries((current) => ({
      ...current,
      [seriesKey]: !current[seriesKey],
    }));
  }

  if (normalizedData.length === 0) {
    return (
      <p className="price-chart-empty">
        Price history is not available for this company.
      </p>
    );
  }

  return (
    <div className="price-chart-panel">
      <div className="price-chart-ranges" aria-label="Price history range">
        {RANGE_OPTIONS.map((range) => (
          <button
            aria-pressed={selectedRange === range.label}
            className={selectedRange === range.label ? "price-range--active" : ""}
            key={range.label}
            onClick={() => setSelectedRange(range.label)}
            type="button"
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="price-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            accessibilityLayer
            data={visibleData}
            margin={{ top: 12, right: 4, bottom: 2, left: 4 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              domain={["dataMin", "dataMax"]}
              minTickGap={42}
              tickFormatter={(timestamp) =>
                selectedRange === "1M"
                  ? shortAxisDateFormatter.format(new Date(timestamp))
                  : axisDateFormatter.format(new Date(timestamp))
              }
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              hide={!enabledSeries.volume}
              tickFormatter={formatVolume}
              tickLine={false}
              width={50}
              yAxisId="volume"
            />
            <YAxis
              axisLine={false}
              domain={["auto", "auto"]}
              hide={
                !enabledSeries.price &&
                !enabledSeries.dma50 &&
                !enabledSeries.dma200
              }
              orientation="right"
              tickFormatter={(value) => `₹${compactNumberFormatter.format(value)}`}
              tickLine={false}
              width={58}
              yAxisId="price"
            />
            <Tooltip
              content={<ChartTooltip enabledSeries={enabledSeries} />}
              cursor={{ stroke: "var(--chart-cursor)", strokeDasharray: "3 3" }}
            />
            {enabledSeries.volume && (
              <Bar
                animationDuration={500}
                animationEasing="ease-out"
                dataKey="volume"
                fill="var(--chart-volume)"
                isAnimationActive={shouldAnimate}
                maxBarSize={8}
                yAxisId="volume"
              />
            )}
            {enabledSeries.price && (
              <Line
                animationBegin={40}
                animationDuration={650}
                animationEasing="ease-out"
                connectNulls={false}
                dataKey="price"
                dot={false}
                isAnimationActive={shouldAnimate}
                stroke="var(--accent)"
                strokeWidth={2.25}
                type="monotone"
                yAxisId="price"
              />
            )}
            {enabledSeries.dma50 && (
              <Line
                animationBegin={70}
                animationDuration={650}
                animationEasing="ease-out"
                connectNulls={false}
                dataKey="dma50"
                dot={false}
                isAnimationActive={shouldAnimate}
                stroke="var(--chart-dma-50)"
                strokeWidth={1.75}
                type="monotone"
                yAxisId="price"
              />
            )}
            {enabledSeries.dma200 && (
              <Line
                animationBegin={100}
                animationDuration={650}
                animationEasing="ease-out"
                connectNulls={false}
                dataKey="dma200"
                dot={false}
                isAnimationActive={shouldAnimate}
                stroke="var(--chart-dma-200)"
                strokeWidth={1.75}
                type="monotone"
                yAxisId="price"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="price-chart-series" aria-label="Chart series">
        {SERIES_OPTIONS.map((series) => (
          <label className={`series-toggle series-toggle--${series.key}`} key={series.key}>
            <input
              checked={enabledSeries[series.key]}
              onChange={() => toggleSeries(series.key)}
              type="checkbox"
            />
            <span>{series.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

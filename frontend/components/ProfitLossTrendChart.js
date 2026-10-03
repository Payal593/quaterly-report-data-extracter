"use client";

import { useMemo } from "react";
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

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});
const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function findStatementRow(rows, labels) {
  return rows.find((row) => labels.includes(row.particular));
}

function toFiniteNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getPeriodTimestamp(period) {
  const timestamp = Date.parse(`1 ${period}`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildTrendData(rows) {
  const revenueRow = findStatementRow(rows, ["Total Revenue"]);
  const netProfitRow = findStatementRow(rows, [
    "Profit After Tax",
    "Net Profit",
  ]);

  if (!revenueRow || !netProfitRow) return [];

  const netProfitByPeriod = new Map(
    netProfitRow.history?.map((item) => [item.period, item.value]) || [],
  );

  return (revenueRow.history || [])
    .map((item, index) => ({
      period: item.period,
      periodTimestamp: getPeriodTimestamp(item.period),
      originalIndex: index,
      revenue: toFiniteNumber(item.value),
      netProfit: toFiniteNumber(netProfitByPeriod.get(item.period)),
    }))
    .sort((first, second) => {
      if (first.periodTimestamp != null && second.periodTimestamp != null) {
        return first.periodTimestamp - second.periodTimestamp;
      }
      return second.originalIndex - first.originalIndex;
    });
}

function formatValue(value) {
  if (value == null) return "—";
  const formatted = numberFormatter.format(Math.abs(value));
  return value < 0 ? `−${formatted}` : formatted;
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="profit-trend-tooltip">
      <p>{label}</p>
      <span>
        <i className="profit-trend-key profit-trend-key--revenue" />
        Total revenue
        <strong>{formatValue(point.revenue)}</strong>
      </span>
      <span>
        <i className="profit-trend-key profit-trend-key--profit" />
        Net profit
        <strong>{formatValue(point.netProfit)}</strong>
      </span>
    </div>
  );
}

export default function ProfitLossTrendChart({ rows, unit }) {
  const chartData = useMemo(() => buildTrendData(rows), [rows]);

  if (chartData.length === 0) return null;

  const unitLabel = unit === "crore" ? "₹ Cr" : unit;

  return (
    <div className="profit-trend-card">
      <h3>
        Total revenue &amp; net profit trend{unitLabel ? ` (${unitLabel})` : ""}
      </h3>
      <div className="profit-trend-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="period"
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) => compactNumberFormatter.format(value)}
              tickLine={false}
              width={55}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ fill: "var(--accent-soft)" }}
            />
            <Bar
              dataKey="revenue"
              fill="var(--accent)"
              isAnimationActive={false}
              maxBarSize={52}
              radius={[6, 6, 0, 0]}
            />
            <Line
              connectNulls={false}
              dataKey="netProfit"
              dot={{ fill: "var(--surface)", r: 4, stroke: "var(--accent-dark)", strokeWidth: 2.5 }}
              isAnimationActive={false}
              stroke="var(--accent-dark)"
              strokeWidth={2.5}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="profit-trend-legend" aria-label="Chart legend">
        <span><i className="profit-trend-key profit-trend-key--revenue" />Total revenue</span>
        <span><i className="profit-trend-key profit-trend-key--profit" />Net profit</span>
      </div>
    </div>
  );
}

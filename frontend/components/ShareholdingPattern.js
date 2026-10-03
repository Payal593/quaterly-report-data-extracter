"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORY_LABELS = {
  promoters: "Promoters",
  fii: "FIIs",
  other_dii: "Other DIIs",
  retail_and_other: "Retail & Others",
  mutual_funds: "Mutual Funds",
};

const SLICE_COLORS = ["#2563eb", "#1748b5", "#60a5fa", "#93c5fd", "#c4d7f2"];
const percentageFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function getPeriodTimestamp(period) {
  const timestamp = Date.parse(`1 ${period}`);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatCategory(category) {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildLatestShareholding(data) {
  const periods = Array.from(
    new Set(
      data.flatMap((item) =>
        (item.history || []).map((historyItem) => historyItem.period),
      ),
    ),
  ).filter(Boolean);

  periods.sort((first, second) => getPeriodTimestamp(second) - getPeriodTimestamp(first));
  const latestPeriod = periods[0];

  if (!latestPeriod) return { period: "", slices: [] };

  const slices = data
    .map((item, index) => {
      const periodValue = item.history?.find(
        (historyItem) => historyItem.period === latestPeriod,
      )?.value;
      const numericValue = Number(periodValue);

      if (!Number.isFinite(numericValue) || numericValue < 0) return null;

      return {
        category: item.category,
        label: formatCategory(item.category),
        value: numericValue,
        color: SLICE_COLORS[index % SLICE_COLORS.length],
      };
    })
    .filter(Boolean);

  return { period: latestPeriod, slices };
}

function ShareholdingTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;

  return (
    <div className="shareholding-tooltip">
      <span><i style={{ background: slice.color }} />{slice.label}</span>
      <strong>{percentageFormatter.format(slice.value)}%</strong>
    </div>
  );
}

export default function ShareholdingPattern({ data }) {
  const sectionRef = useRef(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const shareholding = useMemo(
    () => buildLatestShareholding(Array.isArray(data) ? data : []),
    [data],
  );

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return undefined;

    if (!("IntersectionObserver" in window)) {
      const frameId = window.requestAnimationFrame(() => setHasEnteredView(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (shareholding.slices.length === 0) {
    return (
      <p className="shareholding-empty">
        Shareholding data is not available for this company.
      </p>
    );
  }

  return (
    <div
      className={`shareholding-panel ${hasEnteredView ? "shareholding-panel--visible" : ""}`}
      ref={sectionRef}
    >
      <div className="shareholding-chart-wrap">
        {hasEnteredView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                animationBegin={80}
                animationDuration={1050}
                animationEasing="ease-out"
                data={shareholding.slices}
                dataKey="value"
                endAngle={-270}
                innerRadius="56%"
                nameKey="label"
                outerRadius="82%"
                paddingAngle={2}
                startAngle={90}
                stroke="var(--chart-slice-border)"
                strokeWidth={2}
              >
                {shareholding.slices.map((slice) => (
                  <Cell fill={slice.color} key={slice.category} />
                ))}
              </Pie>
              <Tooltip content={<ShareholdingTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="shareholding-chart-center" aria-hidden="true">
          <strong>{shareholding.period}</strong>
          <span>Latest period</span>
        </div>
      </div>

      <div className="shareholding-details">
        <p>Ownership distribution</p>
        <ul>
          {shareholding.slices.map((slice) => (
            <li key={slice.category}>
              <span><i style={{ background: slice.color }} />{slice.label}</span>
              <strong>{percentageFormatter.format(slice.value)}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

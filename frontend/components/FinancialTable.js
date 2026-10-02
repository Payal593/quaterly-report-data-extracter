"use client";

import { useMemo } from "react";

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function formatFinancialValue(value) {
  if (value == null || value === "") return "—";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  const formattedValue = numberFormatter.format(Math.abs(numericValue));
  return numericValue < 0 ? `−${formattedValue}` : formattedValue;
}

export default function FinancialTable({ label, rows }) {
  const periods = useMemo(() => {
    const availablePeriods = new Set();

    rows.forEach((row) => {
      row.history?.forEach((item) => {
        if (item.period) availablePeriods.add(item.period);
      });
    });

    return Array.from(availablePeriods);
  }, [rows]);

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        label: row.particular,
        values: new Map(
          row.history?.map((item) => [item.period, item.value]) || [],
        ),
      })),
    [rows],
  );

  return (
    <div className="financial-table-scroll">
      <table className="financial-table">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            <th scope="col">Particulars</th>
            {periods.map((period) => (
              <th key={period} scope="col">{period}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {periods.map((period) => {
                const value = row.values.get(period);
                const isNegative = Number(value) < 0;

                return (
                  <td
                    className={isNegative ? "financial-value--negative" : undefined}
                    key={period}
                  >
                    {formatFinancialValue(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const COMPANY_CACHE_KEY = "finscope:companies:v1";

function findCachedCompany(isin) {
  try {
    const cached = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY));
    return cached?.companies?.find(
      (company) => company["ISIN Code"] === isin,
    );
  } catch {
    return null;
  }
}

function findRatio(data, ratioName) {
  if (data.key_ratios?.status !== "success") return null;

  const ratio = data.key_ratios.data?.find(
    (item) => item.name === ratioName,
  );

  return ratio?.company_value ?? null;
}

function findLatestIncomeMetric(data, category) {
  if (data.income_statement?.status !== "success") return null;

  const metric = data.income_statement.data?.income_statement?.find(
    (item) => item.category === category,
  );
  const latestValue = metric?.history?.[0];

  if (latestValue?.value == null) return null;

  return latestValue;
}

function formatIncomeValue(metric, unit) {
  if (!metric || metric.value == null) return null;

  const formattedValue = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(metric.value);

  if (unit === "crore") return `₹${formattedValue} Cr`;
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

export default function CompanyPage() {
  const params = useParams();
  const isin = Array.isArray(params.isin) ? params.isin[0] : params.isin;
  const [companyData, setCompanyData] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isin) return;

    const controller = new AbortController();

    async function fetchCompanyData() {
      try {
        setIsLoading(true);
        setError("");

        let selectedCompany = findCachedCompany(isin);
        const financialResponse = await fetch(
          `${API_BASE_URL}/get-data/${encodeURIComponent(isin)}`,
          { signal: controller.signal },
        );

        if (!financialResponse.ok) {
          throw new Error(
            `Company data request failed with ${financialResponse.status}`,
          );
        }

        const data = await financialResponse.json();

        if (!selectedCompany) {
          try {
            const directoryResponse = await fetch(`${API_BASE_URL}/companies`, {
              cache: "force-cache",
              signal: controller.signal,
            });

            if (directoryResponse.ok) {
              const directoryData = await directoryResponse.json();
              selectedCompany = directoryData.companies?.find(
                (company) => company["ISIN Code"] === isin,
              );
            }
          } catch (directoryError) {
            if (directoryError.name !== "AbortError") {
              console.warn("Unable to load company name:", directoryError);
            }
          }
        }

        console.log("Company financial data:", data);
        setCompanyData(data);
        setCompanyName(selectedCompany?.["Company Name"] || "");
      } catch (fetchError) {
        if (fetchError.name === "AbortError") return;

        console.error("Unable to fetch company financial data:", fetchError);
        setError("Unable to load company data. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchCompanyData();
    return () => controller.abort();
  }, [isin]);

  const metrics = useMemo(() => {
    if (!companyData) return [];

    const incomeUnit = companyData.income_statement?.data?.units_in;
    const revenue = findLatestIncomeMetric(companyData, "revenue");
    const operatingProfit = findLatestIncomeMetric(
      companyData,
      "operating_profit",
    );
    const netProfit = findLatestIncomeMetric(companyData, "net_profit");

    return [
      { label: "P/E", value: findRatio(companyData, "P/E") },
      { label: "P/B", value: findRatio(companyData, "P/B") },
      { label: "ROE", value: findRatio(companyData, "ROE") },
      { label: "ROCE", value: findRatio(companyData, "ROCE") },
      { label: "EV/EBITDA", value: findRatio(companyData, "EV/EBITDA") },
      {
        label: revenue?.period ? `Revenue · ${revenue.period}` : "Revenue",
        value: formatIncomeValue(revenue, incomeUnit),
      },
      {
        label: operatingProfit?.period
          ? `Operating Profit · ${operatingProfit.period}`
          : "Operating Profit",
        value: formatIncomeValue(operatingProfit, incomeUnit),
      },
      {
        label: netProfit?.period
          ? `Net Profit · ${netProfit.period}`
          : "Net Profit",
        value: formatIncomeValue(netProfit, incomeUnit),
      },
    ].filter((metric) => metric.value != null);
  }, [companyData]);

  const symbol = companyData?.marketdata?.symbol;
  const displayedName = companyName || symbol || "Company";

  return (
    <main className="company-page">
      <Navbar activePage="company" />

      <div className="company-page__content">
        {isLoading && (
          <section className="company-loading" aria-live="polite">
            <div className="loading-line loading-line--short" />
            <div className="loading-line loading-line--title" />
            <div className="loading-line loading-line--medium" />
            <div className="metric-grid metric-grid--loading">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="metric-card metric-card--loading" key={index} />
              ))}
            </div>
            <span className="sr-only">Loading company data…</span>
          </section>
        )}

        {!isLoading && error && (
          <section className="company-error" role="alert">
            <p>{error}</p>
          </section>
        )}

        {!isLoading && !error && companyData && (
          <>
            <header className="company-header">
              <p className="company-header__eyebrow">Company fundamentals</p>
              <h1>{displayedName}</h1>
              <div className="company-identity">
                {symbol && <span className="company-symbol">{symbol}</span>}
                <span>{companyData.isin || isin}</span>
              </div>
            </header>

            <section className="overview-section" aria-labelledby="overview-title">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">At a glance</p>
                  <h2 id="overview-title">Overview / Key Metrics</h2>
                </div>
                {companyData.profile?.status === "success" &&
                  companyData.profile.data?.sector && (
                    <span className="sector-badge">
                      {companyData.profile.data.sector}
                    </span>
                  )}
              </div>

              {metrics.length > 0 ? (
                <div className="metric-grid">
                  {metrics.map((metric) => (
                    <MetricCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
                </div>
              ) : (
                <p className="metrics-empty">Key metrics are currently unavailable.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

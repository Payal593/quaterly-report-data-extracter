"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import FinancialTable from "@/components/FinancialTable";
import CompanyAboutNews from "@/components/CompanyAboutNews";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import ProfitLossTrendChart from "@/components/ProfitLossTrendChart";
import ShareholdingPattern from "@/components/ShareholdingPattern";
import {
  loadCompanyData,
  readCompanyDataCache,
} from "@/lib/companyDataCache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const COMPANY_CACHE_KEY = "finscope:companies:v1";

function readCachedCompanies() {
  try {
    const cached = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY));
    return Array.isArray(cached?.companies) ? cached.companies : [];
  } catch {
    return [];
  }
}

function hasStatementData(section) {
  return (
    section?.status === "success" &&
    Array.isArray(section.data?.full_statement) &&
    section.data.full_statement.length > 0
  );
}

function formatStatementUnit(unit) {
  if (unit === "crore") return "₹ Crores";
  return unit || "Reported values";
}

function getCompetitorIsin(instrumentKey) {
  if (typeof instrumentKey !== "string") return "";
  return instrumentKey.split("|").at(-1) || "";
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
  const [companyData, setCompanyData] = useState(() =>
    readCompanyDataCache(isin),
  );
  const [companyName, setCompanyName] = useState("");
  const [companyDirectory, setCompanyDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(() => !readCompanyDataCache(isin));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isin) return;

    const controller = new AbortController();
    let disposed = false;

    async function fetchCompanyData() {
      try {
        const cachedCompanyData = readCompanyDataCache(isin);
        setIsLoading(!cachedCompanyData);
        setError("");

        let directoryCompanies = readCachedCompanies();
        let selectedCompany = directoryCompanies.find(
          (company) => company["ISIN Code"] === isin,
        );
        const data = cachedCompanyData || await loadCompanyData(isin);
        if (disposed) return;

        if (directoryCompanies.length === 0 || !selectedCompany) {
          try {
            const directoryResponse = await fetch(`${API_BASE_URL}/companies`, {
              cache: "force-cache",
              signal: controller.signal,
            });

            if (directoryResponse.ok) {
              const directoryData = await directoryResponse.json();
              directoryCompanies = Array.isArray(directoryData.companies)
                ? directoryData.companies
                : [];
              selectedCompany = directoryCompanies.find(
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
        if (disposed) return;

        setCompanyData(data);
        setCompanyName(selectedCompany?.["Company Name"] || "");
        setCompanyDirectory(directoryCompanies);
      } catch (fetchError) {
        if (disposed || fetchError.name === "AbortError") return;

        console.error("Unable to fetch company financial data:", fetchError);
        setError("Unable to load company data. Please try again.");
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    fetchCompanyData();
    return () => {
      disposed = true;
      controller.abort();
    };
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

  const statements = useMemo(() => {
    if (!companyData) return [];

    return [
      {
        id: "profit-loss",
        title: "Profit & Loss",
        section: companyData.income_statement,
      },
      {
        id: "balance-sheet",
        title: "Balance Sheet",
        section: companyData.balance_sheet,
      },
      {
        id: "cash-flow",
        title: "Cash Flow",
        section: companyData.cash_flow,
      },
    ].filter((statement) => hasStatementData(statement.section));
  }, [companyData]);

  const ratios =
    companyData?.key_ratios?.status === "success" &&
    Array.isArray(companyData.key_ratios.data)
      ? companyData.key_ratios.data
      : [];
  const competitors =
    companyData?.competitors?.status === "success" &&
    Array.isArray(companyData.competitors.data)
      ? companyData.competitors.data
      : [];
  const shareholdings =
    companyData?.share_holdings?.status === "success" &&
    Array.isArray(companyData.share_holdings.data)
      ? companyData.share_holdings.data
      : [];
  const directoryByIsin = useMemo(
    () =>
      new Map(
        companyDirectory.map((company) => [company["ISIN Code"], company]),
      ),
    [companyDirectory],
  );

  const currentDirectoryCompany = directoryByIsin.get(isin);
  const symbol = companyData?.marketdata?.symbol || currentDirectoryCompany?.Symbol;
  const displayedName =
    companyName || currentDirectoryCompany?.["Company Name"] || symbol || "Company";

  return (
    <main className="company-page">
      <Navbar showSearch />

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
            <div className="price-chart-skeleton" aria-hidden="true">
              <div />
              <div />
              <div />
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
              {companyData.profile?.status === "success" &&
                companyData.profile.data?.sector && (
                  <div className="company-sector-row">
                    <span className="sector-badge">
                      {companyData.profile.data.sector}
                    </span>
                  </div>
                )}
              <h1>{displayedName}</h1>
              <div className="company-identity">
                {symbol && <span className="company-symbol">{symbol}</span>}
                <span aria-hidden="true">•</span>
                <span>{companyData.isin || isin}</span>
              </div>
              <CompanyAboutNews
                about={
                  companyData.profile?.status === "success"
                    ? companyData.profile.data?.company_profile
                    : ""
                }
                companyName={displayedName}
                key={isin}
              />
            </header>

            <nav className="company-section-nav" aria-label="Company data sections">
              <a href="#overview">Overview</a>
              <a href="#price-history">Price History</a>
              {statements.map((statement) => (
                <a href={`#${statement.id}`} key={statement.id}>
                  {statement.title}
                </a>
              ))}
              {ratios.length > 0 && <a href="#ratios">Ratios</a>}
              {shareholdings.length > 0 && <a href="#shareholding">Shareholding</a>}
              {competitors.length > 0 && <a href="#peer-comparison">Peer Comparison</a>}
            </nav>

            <section
              className="overview-section company-data-section"
              id="overview"
              aria-labelledby="overview-title"
            >
              <div className="section-heading">
                <div>
                  <p className="section-kicker">At a glance</p>
                  <h2 id="overview-title">Overview / Key Metrics</h2>
                </div>
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

            <section
              className="financial-section company-data-section"
              id="price-history"
              aria-labelledby="price-history-title"
            >
              <div className="financial-section__heading">
                <div>
                  <p className="section-kicker">Market performance</p>
                  <h2 id="price-history-title">Price History</h2>
                </div>
              </div>
              <PriceHistoryChart dailyData={companyData.marketdata?.max} />
            </section>

            {statements.map(({ id, title, section }) => (
              <section
                className="financial-section company-data-section"
                id={id}
                key={id}
                aria-labelledby={`${id}-title`}
              >
                <div className="financial-section__heading">
                  <div>
                    <p className="section-kicker">Financial statement</p>
                    <h2 id={`${id}-title`}>{title}</h2>
                  </div>
                  <div className="statement-meta" aria-label="Statement details">
                    {section.data.type && <span>{section.data.type}</span>}
                    {section.data.time_period && <span>{section.data.time_period}</span>}
                    <span>{formatStatementUnit(section.data.units_in)}</span>
                  </div>
                </div>
                {id === "profit-loss" && (
                  <ProfitLossTrendChart
                    rows={section.data.full_statement}
                    unit={section.data.units_in}
                  />
                )}
                <FinancialTable
                  label={`${displayedName} ${title}`}
                  rows={section.data.full_statement}
                />
                {section.data.units_in === "crore" && (
                  <p className="financial-table-note">
                    Figures in ₹ crores unless indicated by the metric.
                  </p>
                )}
              </section>
            ))}

            {ratios.length > 0 && (
              <section
                className="financial-section company-data-section"
                id="ratios"
                aria-labelledby="ratios-title"
              >
                <div className="financial-section__heading">
                  <div>
                    <p className="section-kicker">Relative performance</p>
                    <h2 id="ratios-title">Ratios</h2>
                  </div>
                </div>
                <div className="financial-table-scroll">
                  <table className="financial-table ratios-table">
                    <thead>
                      <tr>
                        <th scope="col">Metric</th>
                        <th scope="col">Company</th>
                        <th scope="col">Sector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratios.map((ratio) => (
                        <tr key={ratio.name}>
                          <th scope="row">{ratio.name}</th>
                          <td>{ratio.company_value ?? "—"}</td>
                          <td>{ratio.sector_value ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {shareholdings.length > 0 && (
              <section
                className="financial-section company-data-section"
                id="shareholding"
                aria-labelledby="shareholding-title"
              >
                <div className="financial-section__heading">
                  <div>
                    <p className="section-kicker">Ownership structure</p>
                    <h2 id="shareholding-title">Shareholding Pattern</h2>
                  </div>
                </div>
                <ShareholdingPattern data={shareholdings} />
              </section>
            )}

            {competitors.length > 0 && (
              <section
                className="financial-section company-data-section"
                id="peer-comparison"
                aria-labelledby="peer-comparison-title"
              >
                <div className="financial-section__heading">
                  <div>
                    <p className="section-kicker">Comparable companies</p>
                    <h2 id="peer-comparison-title">Peer Comparison</h2>
                  </div>
                </div>
                <div className="financial-table-scroll">
                  <table className="financial-table peer-table">
                    <thead>
                      <tr>
                        <th scope="col">Company</th>
                        <th scope="col">Sector</th>
                        <th scope="col">Reported Market Cap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitors.map((competitor) => {
                        const competitorIsin = getCompetitorIsin(
                          competitor.instrument_key,
                        );
                        const directoryCompany = directoryByIsin.get(competitorIsin);
                        const competitorName =
                          directoryCompany?.["Company Name"] || competitorIsin || "—";

                        return (
                          <tr key={competitor.instrument_key || competitorName}>
                            <th scope="row">
                              {competitorIsin ? (
                                <Link href={`/company/${encodeURIComponent(competitorIsin)}`}>
                                  {competitorName}
                                </Link>
                              ) : competitorName}
                              {directoryCompany?.Symbol && (
                                <span className="peer-symbol">{directoryCompany.Symbol}</span>
                              )}
                            </th>
                            <td>{competitor.sector || "—"}</td>
                            <td>
                              {competitor.sector_market_cap_inr?.formatted || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

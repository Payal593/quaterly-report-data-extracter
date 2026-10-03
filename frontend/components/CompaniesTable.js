"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const COMPANY_CACHE_KEY = "finscope:companies:v1";
const COMPANY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const PAGE_SIZE = 25;

function readCompanyCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(COMPANY_CACHE_KEY));

    if (
      Array.isArray(cached?.companies) &&
      Date.now() - cached.savedAt < COMPANY_CACHE_TTL_MS
    ) {
      return cached.companies;
    }
  } catch {
    return null;
  }

  return null;
}

function writeCompanyCache(companies) {
  try {
    localStorage.setItem(
      COMPANY_CACHE_KEY,
      JSON.stringify({ companies, savedAt: Date.now() }),
    );
  } catch {
    // The directory remains usable when browser storage is unavailable.
  }
}

function formatCompanyCount(count, includeFound = false) {
  const label = count === 1 ? "company" : "companies";
  return `${count} ${label}${includeFound ? " found" : ""}`;
}

export default function CompaniesTable() {
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [industry, setIndustry] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const cachedCompanies = readCompanyCache();

    if (cachedCompanies) {
      const cacheFrameId = window.requestAnimationFrame(() => {
        setCompanies(cachedCompanies);
        setIsLoading(false);
      });
      return () => window.cancelAnimationFrame(cacheFrameId);
    }

    const controller = new AbortController();
    let disposed = false;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    async function fetchCompanies() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/companies`, {
          cache: "force-cache",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Companies request failed with ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.companies)) {
          throw new Error("The companies API returned an unexpected response.");
        }

        if (!disposed) {
          setCompanies(data.companies);
          writeCompanyCache(data.companies);
        }
      } catch (fetchError) {
        if (disposed) return;

        console.error("Unable to load the companies directory:", fetchError);
        setError("Unable to load companies. Please try again.");
      } finally {
        window.clearTimeout(timeoutId);
        if (!disposed) setIsLoading(false);
      }
    }

    fetchCompanies();

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [requestKey]);

  const industries = useMemo(
    () =>
      Array.from(
        new Set(companies.map((company) => company.Industry).filter(Boolean)),
      ).sort((first, second) => first.localeCompare(second)),
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return companies
      .filter((company) => {
        const matchesIndustry =
          industry === "all" || company.Industry === industry;
        const matchesQuery =
          !normalizedQuery ||
          company["Company Name"]?.toLowerCase().includes(normalizedQuery) ||
          company.Symbol?.toLowerCase().includes(normalizedQuery) ||
          company["ISIN Code"]?.toLowerCase().includes(normalizedQuery);

        return matchesIndustry && matchesQuery;
      })
      .sort((first, second) => {
        const comparison = first["Company Name"].localeCompare(
          second["Company Name"],
          undefined,
          { sensitivity: "base" },
        );

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [companies, industry, query, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleCompanies = filteredCompanies.slice(pageStart, pageStart + PAGE_SIZE);
  const isFiltered = query.trim().length > 0 || industry !== "all";

  function updateQuery(event) {
    setQuery(event.target.value);
    setCurrentPage(1);
  }

  function updateSort(event) {
    setSortDirection(event.target.value);
    setCurrentPage(1);
  }

  function updateIndustry(event) {
    setIndustry(event.target.value);
    setCurrentPage(1);
  }

  return (
    <div className="companies-page__content">
      <header className="directory-header">
        <p className="directory-header__eyebrow">Company directory</p>
        <div className="directory-header__title-row">
          <div>
            <h1>Companies</h1>
            <p>Browse and explore Indian listed companies available on FinScope.</p>
          </div>
          {!isLoading && !error && (
            <span className="company-count">
              {formatCompanyCount(companies.length)}
            </span>
          )}
        </div>
      </header>

      {!error && (
        <section className="directory-controls" aria-label="Company directory controls">
          <div className="directory-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <label className="sr-only" htmlFor="directory-search">Search companies</label>
            <input
              disabled={isLoading}
              id="directory-search"
              onChange={updateQuery}
              placeholder="Search company, symbol or ISIN..."
              type="search"
              value={query}
            />
          </div>

          <div className="directory-selects">
            <label>
              <span>Industry</span>
              <select disabled={isLoading} onChange={updateIndustry} value={industry}>
                <option value="all">All industries</option>
                {industries.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select disabled={isLoading} onChange={updateSort} value={sortDirection}>
                <option value="asc">A → Z</option>
                <option value="desc">Z → A</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {!isLoading && !error && (
        <p className="directory-results" aria-live="polite">
          {formatCompanyCount(filteredCompanies.length, isFiltered)}
        </p>
      )}

      {error ? (
        <section className="directory-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setRequestKey((key) => key + 1)} type="button">
            Try again
          </button>
        </section>
      ) : (
        <div className="companies-table-shell">
          <div className="companies-table-scroll">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Symbol</th>
                  <th>ISIN</th>
                  <th><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }, (_, index) => (
                    <tr className="company-row-skeleton" key={index}>
                      <td><span /></td>
                      <td className="company-table-symbol-cell"><span /></td>
                      <td className="company-table-isin-cell"><span /></td>
                      <td><span /></td>
                    </tr>
                  ))
                  : visibleCompanies.map((company) => (
                    <tr key={company["ISIN Code"]}>
                      <td>
                        <Link
                          className="company-table-name"
                          href={`/company/${encodeURIComponent(company["ISIN Code"])}`}
                        >
                          {company["Company Name"]}
                        </Link>
                        <span className="company-table-mobile-meta">
                          <span>{company.Symbol}</span>
                          <span aria-hidden="true">•</span>
                          <span>{company["ISIN Code"]}</span>
                        </span>
                      </td>
                      <td className="company-table-symbol-cell">
                        <span className="company-table-symbol">{company.Symbol}</span>
                      </td>
                      <td className="company-table-isin-cell">
                        <span className="company-table-isin">{company["ISIN Code"]}</span>
                      </td>
                      <td>
                        <Link
                          aria-label={`View ${company["Company Name"]}`}
                          className="company-table-action"
                          href={`/company/${encodeURIComponent(company["ISIN Code"])}`}
                        >
                          View <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!isLoading && visibleCompanies.length === 0 && (
            <div className="directory-empty">
              <p>No companies found.</p>
              <span>Try searching by company name, symbol or ISIN.</span>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && filteredCompanies.length > 0 && (
        <nav className="directory-pagination" aria-label="Companies pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
            type="button"
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
            type="button"
          >
            Next <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}
    </div>
  );
}

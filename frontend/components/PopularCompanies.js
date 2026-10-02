"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const COMPANY_CACHE_KEY = "finscope:companies:v1";
const COMPANY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const POPULAR_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
];

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

function selectPopularCompanies(companies) {
  const companiesBySymbol = new Map(
    companies.map((company) => [company.Symbol, company]),
  );

  return POPULAR_SYMBOLS.map((symbol) => companiesBySymbol.get(symbol)).filter(
    Boolean,
  );
}

export default function PopularCompanies() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cachedCompanies = readCompanyCache();

    if (cachedCompanies) {
      const cacheFrameId = window.requestAnimationFrame(() => {
        setCompanies(selectPopularCompanies(cachedCompanies));
        setIsLoading(false);
      });
      return () => window.cancelAnimationFrame(cacheFrameId);
    }

    const controller = new AbortController();
    let disposed = false;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    async function fetchCompanies() {
      try {
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

        if (!disposed) setCompanies(selectPopularCompanies(data.companies));
      } catch (fetchError) {
        if (disposed) return;

        console.error("Unable to load popular companies:", fetchError);
        setError(true);
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
  }, []);

  return (
    <section className="popular-companies" aria-labelledby="popular-companies-title">
      <div className="popular-companies__heading">
        <div>
          <h2 id="popular-companies-title">Popular Companies</h2>
          <p>Quick access to some of the most researched companies.</p>
        </div>
        <Link className="popular-companies__view-all" href="/companies">
          View all companies <span aria-hidden="true">→</span>
        </Link>
      </div>

      {error ? (
        <p className="popular-companies__message">
          Popular companies are currently unavailable.
        </p>
      ) : (
        <div className="popular-companies__grid" aria-busy={isLoading}>
          {isLoading
            ? Array.from({ length: 6 }, (_, index) => (
              <div className="popular-card popular-card--loading" key={index}>
                <div className="popular-card__loading-copy">
                  <span />
                  <span />
                </div>
              </div>
            ))
            : companies.map((company) => (
              <Link
                aria-label={`View ${company["Company Name"]}`}
                className="popular-card"
                href={`/company/${encodeURIComponent(company["ISIN Code"])}`}
                key={company["ISIN Code"]}
              >
                <span className="popular-card__content">
                  <strong>{company["Company Name"]}</strong>
                  <span className="popular-card__meta">{company.Symbol}</span>
                </span>
              </Link>
            ))}
        </div>
      )}
    </section>
  );
}

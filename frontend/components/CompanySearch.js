"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const RESULT_LIMIT = 8;

function getMatchRank(company, normalizedQuery) {
  const symbol = company["Symbol"]?.toLowerCase() || "";
  const companyName = company["Company Name"]?.toLowerCase() || "";
  const isin = company["ISIN Code"]?.toLowerCase() || "";

  if (symbol === normalizedQuery) return 0;
  if (symbol.startsWith(normalizedQuery)) return 1;
  if (companyName.startsWith(normalizedQuery)) return 2;
  if (companyName.includes(normalizedQuery)) return 3;
  if (isin.startsWith(normalizedQuery)) return 4;
  if (isin.includes(normalizedQuery)) return 5;

  return -1;
}

export default function CompanySearch() {
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const hasFetchedCompanies = useRef(false);

  useEffect(() => {
    if (hasFetchedCompanies.current) return;
    hasFetchedCompanies.current = true;

    async function fetchCompanies() {
      try {
        const response = await fetch(`${API_BASE_URL}/companies`);

        if (!response.ok) {
          throw new Error(`Companies request failed with ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.companies)) {
          throw new Error("The companies API returned an unexpected response.");
        }

        setCompanies(data.companies);
      } catch (fetchError) {
        console.error("Unable to fetch companies:", fetchError);
        setError("Unable to load companies. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!searchContainerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || isLoading || error) return [];

    return companies
      .map((company) => ({
        company,
        rank: getMatchRank(company, normalizedQuery),
      }))
      .filter((result) => result.rank !== -1)
      .sort(
        (first, second) =>
          first.rank - second.rank ||
          first.company["Company Name"].localeCompare(
            second.company["Company Name"],
          ),
      )
      .slice(0, RESULT_LIMIT)
      .map((result) => result.company);
  }, [companies, error, isLoading, query]);

  function handleQueryChange(event) {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setActiveIndex(-1);
    setIsOpen(nextQuery.trim().length > 0);
  }

  function selectCompany(company) {
    const selectedIsin = company["ISIN Code"];

    setQuery(company["Company Name"]);
    setIsOpen(false);
    setActiveIndex(-1);

    console.log("Selected company:", company);
    console.log("Selected ISIN:", selectedIsin);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex < results.length - 1 ? currentIndex + 1 : 0,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : results.length - 1,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectCompany(results[activeIndex]);
    }
  }

  const hasQuery = query.trim().length > 0;
  const showDropdown = isOpen && hasQuery && !isLoading && !error;

  return (
    <div className="company-search" ref={searchContainerRef}>
      <div className="search-box">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>

        <input
          aria-activedescendant={
            activeIndex >= 0 ? `company-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls="company-suggestions"
          aria-expanded={showDropdown}
          autoComplete="off"
          disabled={isLoading || Boolean(error)}
          onChange={handleQueryChange}
          onFocus={() => hasQuery && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? "Loading companies..."
              : "Search company name, symbol or ISIN..."
          }
          role="combobox"
          type="search"
          value={query}
        />

      </div>

      {showDropdown && (
        <div className="suggestions" id="company-suggestions" role="listbox">
          {results.length > 0 ? (
            results.map((company, index) => (
              <button
                aria-selected={activeIndex === index}
                className={`suggestion ${
                  activeIndex === index ? "suggestion--active" : ""
                }`}
                id={`company-option-${index}`}
                key={company["ISIN Code"]}
                onClick={() => selectCompany(company)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span className="suggestion__name">{company["Company Name"]}</span>
                <span className="suggestion__details">
                  <span className="suggestion__symbol">{company["Symbol"]}</span>
                  <span aria-hidden="true">•</span>
                  <span>{company["ISIN Code"]}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="suggestions__empty">No companies found.</p>
          )}
        </div>
      )}

      {error && (
        <p className="search-message search-message--error" role="alert">{error}</p>
      )}
      {isLoading && (
        <p className="search-message" role="status">Loading the company directory…</p>
      )}
    </div>
  );
}

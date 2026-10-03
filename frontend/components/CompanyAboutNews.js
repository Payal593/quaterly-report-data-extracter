"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ContentModal from "@/components/ContentModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api-proxy-157704882598.us-east1.run.app";
const NEWS_RANGE_DAYS = 30;
const PREVIEW_LIMIT = 3;
const newsCache = new Map();

const newsDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatQueryDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNewsDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isFinite(date.getTime()) ? newsDateFormatter.format(date) : dateValue;
}

function NewsItem({ article, compact = false }) {
  return (
    <article className={`company-news-item ${compact ? "company-news-item--compact" : ""}`}>
      <div className="company-news-item__meta">
        {article.source && <span>{article.source}</span>}
        {article.date && <time>{formatNewsDate(article.date)}</time>}
      </div>
      <h3>{article.title}</h3>
      {!compact && article.link && (
        <a href={article.link} target="_blank" rel="noreferrer">
          Read article <span aria-hidden="true">↗</span>
        </a>
      )}
    </article>
  );
}

export default function CompanyAboutNews({ about, companyName }) {
  const [articles, setArticles] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [activeModal, setActiveModal] = useState("");

  useEffect(() => {
    if (!companyName) return undefined;

    const controller = new AbortController();
    const toDate = new Date();
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - NEWS_RANGE_DAYS);
    const query = new URLSearchParams({
      company_name: companyName,
      from_date: formatQueryDate(fromDate),
      to_date: formatQueryDate(toDate),
    });

    async function fetchNews() {
      try {
        setIsNewsLoading(true);
        setNewsError("");

        const cacheKey = query.toString();
        if (newsCache.has(cacheKey)) {
          setArticles(newsCache.get(cacheKey));
          return;
        }

        const response = await fetch(`${API_BASE_URL}/founder-news?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Founder news request failed with ${response.status}`);
        }

        const data = await response.json();
        const nextArticles = Array.isArray(data.articles) ? data.articles : [];
        newsCache.set(cacheKey, nextArticles);
        setArticles(nextArticles);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") return;

        console.error("Unable to load company news:", fetchError);
        setNewsError("Latest news is currently unavailable.");
      } finally {
        if (!controller.signal.aborted) setIsNewsLoading(false);
      }
    }

    fetchNews();
    return () => controller.abort();
  }, [companyName]);

  const previewArticles = useMemo(
    () => articles.slice(0, PREVIEW_LIMIT),
    [articles],
  );
  const closeModal = useCallback(() => setActiveModal(""), []);

  return (
    <div className="company-introduction">
      {about && (
        <section className="company-about" aria-labelledby="company-about-title">
          <div className="company-about__heading">
            <h2 id="company-about-title">About</h2>
            <button onClick={() => setActiveModal("about")} type="button">
              View more <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="company-about__text--clamped">{about}</p>
        </section>
      )}

      <section className="company-news" aria-labelledby="company-news-title">
        <div className="company-news__heading">
          <div>
            <h2 id="company-news-title">Latest News</h2>
            <p>Recent coverage from the last 30 days.</p>
          </div>
          {articles.length > 0 && (
            <button onClick={() => setActiveModal("news")} type="button">
              View full news <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        {isNewsLoading && (
          <div className="company-news-skeleton" aria-label="Loading latest news">
            {Array.from({ length: 3 }, (_, index) => <span key={index} />)}
          </div>
        )}

        {!isNewsLoading && newsError && (
          <p className="company-news__message" role="status">{newsError}</p>
        )}

        {!isNewsLoading && !newsError && previewArticles.length === 0 && (
          <p className="company-news__message">No recent news was found.</p>
        )}

        {!isNewsLoading && !newsError && previewArticles.length > 0 && (
          <div className="company-news__preview">
            {previewArticles.map((article, index) => (
              <NewsItem
                article={article}
                compact
                key={article.link || `${article.title}-${index}`}
              />
            ))}
          </div>
        )}
      </section>

      <ContentModal
        eyebrow="Company overview"
        isOpen={activeModal === "about"}
        onClose={closeModal}
        title={`About ${companyName}`}
      >
        <p className="company-about-modal-copy">{about}</p>
      </ContentModal>

      <ContentModal
        eyebrow="Latest coverage"
        isOpen={activeModal === "news"}
        meta={`${articles.length} articles from the last 30 days`}
        onClose={closeModal}
        title={`${companyName} News`}
      >
        {articles.map((article, index) => (
          <NewsItem
            article={article}
            key={article.link || `${article.title}-${index}`}
          />
        ))}
      </ContentModal>
    </div>
  );
}

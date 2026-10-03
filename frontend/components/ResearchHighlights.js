const highlights = [
  {
    key: "companies",
    title: "500+ listed companies",
    description:
      "Browse Indian listed companies and open their fundamentals directly from one searchable directory.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20V7l8-3 8 3v13" />
        <path d="M8 10h2M14 10h2M8 14h2M14 14h2M10 20v-3h4v3M2 20h20" />
      </svg>
    ),
  },
  {
    key: "fundamentals",
    title: "Financial fundamentals",
    description:
      "Review revenue, profitability, ratios, balance-sheet metrics and historical financial statements.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 11h6M9 15h6M9 19h4" />
      </svg>
    ),
  },
  {
    key: "charts",
    title: "Interactive charts",
    description:
      "Explore price history and financial trends visually across different time periods.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
      </svg>
    ),
  },
  {
    key: "access",
    title: "No login required",
    description:
      "Search, browse and research immediately without creating an account or portfolio.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M9 10V7a4 4 0 0 1 7-2M12 15v2" />
      </svg>
    ),
  },
];

export default function ResearchHighlights() {
  return (
    <section className="research-highlights" aria-labelledby="research-highlights-title">
      <header className="research-highlights__heading">
        <p className="research-highlights__kicker">Why FinScope</p>
        <h2 id="research-highlights-title">Research companies without the noise</h2>
        <p className="research-highlights__intro">
          Explore company fundamentals and market trends in one focused research
          experience.
        </p>
        <div className="research-highlights__bars" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
      </header>

      <div className="research-highlights__grid">
        {highlights.map((highlight) => (
          <article className="research-highlight" key={highlight.key}>
            <span className="research-highlight__icon">{highlight.icon}</span>
            <div>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

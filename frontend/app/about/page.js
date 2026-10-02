import Navbar from "@/components/Navbar";
import PopularCompanies from "@/components/PopularCompanies";

export const metadata = {
  title: "About | FinScope",
  description: "Learn how FinScope makes company fundamentals easier to explore.",
};

const explorationItems = [
  {
    title: "Financial Statements",
    description: "Profit & Loss, Balance Sheet and Cash Flow data.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 20V10M12 20V4M19 20v-7" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    title: "Growth Trends",
    description: "Understand how revenue and profit change over time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m4 17 5-5 4 3 7-8" />
        <path d="M15 7h5v5" />
      </svg>
    ),
  },
  {
    title: "Key Metrics",
    description: "Quickly review important financial indicators.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
        <path d="M8.5 11h5M11 8.5v5" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Search a company",
    description: "Search by company name, symbol or ISIN.",
  },
  {
    number: "02",
    title: "Explore financials",
    description: "View key metrics, statements and ratios.",
  },
  {
    number: "03",
    title: "Study trends",
    description: "Compare historical financial performance.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <Navbar />

      <div className="about-page__content">
        <header className="about-hero">
          <p className="about-kicker">About FinScope</p>
          <h1>Financial data, made easier to explore.</h1>
          <p>
            FinScope is a financial research platform designed to make company
            fundamentals easier to understand.
          </p>
        </header>

        <section className="about-section about-introduction" aria-labelledby="what-is-finscope">
          <p className="about-kicker">Platform overview</p>
          <h2 id="what-is-finscope">What is FinScope?</h2>
          <div className="about-copy">
            <p>
              FinScope helps users explore financial fundamentals of Indian
              listed companies through structured financial statements, key
              metrics and visual trends.
            </p>
            <p>
              Search from 500+ companies and quickly explore their financial
              performance without navigating complicated financial interfaces.
            </p>
          </div>
        </section>

        <section className="about-section" aria-labelledby="what-you-can-explore">
          <p className="about-kicker">Research essentials</p>
          <h2 id="what-you-can-explore">What you can explore</h2>
          <div className="about-feature-grid">
            {explorationItems.map((item) => (
              <article className="about-feature" key={item.title}>
                <span className="about-feature__icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" aria-labelledby="how-it-works">
          <p className="about-kicker">Simple by design</p>
          <h2 id="how-it-works">How it works</h2>
          <ol className="about-steps">
            {steps.map((step, index) => (
              <li key={step.number}>
               <div> <span className="about-step__number">{step.number}</span></div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <span className="about-step__arrow" aria-hidden="true">→</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section about-approach" aria-labelledby="our-approach">
          <p className="about-kicker">Our approach</p>
          <h2 id="our-approach">Data before noise.</h2>
          <p>
            FinScope focuses on presenting financial information clearly without
            trading features, social feeds or unnecessary distractions.
          </p>
          <div className="about-approach__goal">
            <span>The goal is simple</span>
            <strong>Search <b>→</b> Understand <b>→</b> Research</strong>
          </div>
        </section>

        <section className="about-section about-disclaimer" aria-labelledby="data-disclaimer">
          <div>
            <p className="about-kicker">Important information</p>
            <h2 id="data-disclaimer">Data &amp; Disclaimer</h2>
          </div>
          <div className="about-copy">
            <p>
              Financial information displayed on FinScope is provided for
              informational and educational purposes only.
            </p>
            <p>
              FinScope does not provide investment advice, recommendations,
              buy/sell signals or trading services.
            </p>
            <p>
              Users should verify important financial information from official
              company filings and exchange disclosures before making investment
              decisions.
            </p>
          </div>
        </section>
      </div>

      <PopularCompanies />
    </main>
  );
}

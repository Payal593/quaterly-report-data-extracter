import CompanySearch from "@/components/CompanySearch";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="site-shell">
      <Navbar />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__content">
          <p className="eyebrow">Indian market intelligence</p>
          <h1 id="hero-heading">Understand Companies Through Data</h1>
          <p className="hero__subtitle">
            Explore financials, fundamentals and growth trends of 500+ Indian
            companies.
          </p>

          <CompanySearch />

          <div className="search-hints" aria-label="Available search options">
            <span>Search by company</span>
            <span>Search by symbol</span>
            <span>Search by ISIN</span>
          </div>
        </div>
      </section>
    </main>
  );
}

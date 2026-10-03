import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/about", label: "About" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__content">
          <section className="site-footer__brand" aria-labelledby="footer-brand-title">
            <div className="site-footer__brand-title">
              <span className="brand__mark" aria-hidden="true">F</span>
              <h2 id="footer-brand-title">FinScope</h2>
            </div>
            <p>Explore Indian companies through financial data and fundamentals.</p>
          </section>

          <nav className="site-footer__explore" aria-label="Footer navigation">
            <h2>Explore</h2>
            {exploreLinks.map((link) => (
              <Link href={link.href} key={link.href}>{link.label}</Link>
            ))}
          </nav>

          <section className="site-footer__disclaimer" aria-labelledby="footer-disclaimer-title">
            <h2 id="footer-disclaimer-title">Disclaimer</h2>
            <p>
              FinScope is for informational and educational purposes only and
              does not provide investment advice.
            </p>
          </section>
        </div>

        <p className="site-footer__copyright">
          © 2026 FinScope. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

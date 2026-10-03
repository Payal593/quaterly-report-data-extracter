"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import CompanySearch from "@/components/CompanySearch";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/about", label: "About" },
];

function isActivePath(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/companies") {
    return pathname.startsWith("/companies") || pathname.startsWith("/company/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar({ showSearch = false }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar__main">
        <Link
          aria-label="FinScope home"
          className="brand"
          href="/"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="brand__mark" aria-hidden="true">F</span>
          <span>FinScope</span>
        </Link>

        {showSearch && (
          <div className="navbar__search">
            <CompanySearch variant="navbar" />
          </div>
        )}

        <button
          aria-controls="main-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className={`menu-toggle ${isMenuOpen ? "menu-toggle--open" : ""}`}
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          aria-label="Main navigation"
          className={isMenuOpen ? "navbar__nav--open" : ""}
          id="main-navigation"
        >
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`nav-link ${isActive ? "nav-link--active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}

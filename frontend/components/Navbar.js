import Link from "next/link";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" href="/" aria-label="FinScope home">
        <span className="brand__mark" aria-hidden="true">F</span>
        <span>FinScope</span>
      </Link>

      <nav aria-label="Main navigation">
        <Link className="nav-link nav-link--active" href="/">Home</Link>
        <a className="nav-link" href="#companies">Companies</a>
        <a className="nav-link" href="#about">About</a>
      </nav>
    </header>
  );
}

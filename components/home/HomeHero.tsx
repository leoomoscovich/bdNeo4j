import Link from "next/link";
import { ScrollSequence } from "./ScrollSequence";

export function HomeHero() {
  return (
    <header className="hero">
      <nav className="topnav" aria-label="SkinGraph public navigation">
        <Link href="/" className="brand">
          <span className="brand__mark">SG</span>
          <span className="brand__name">SkinGraph Radar</span>
        </Link>
        <div className="topnav__right">
          <a href="#senales" className="topnav__link">Preview</a>
          <Link href="/dashboard" className="btn btn--sm btn--red">Dashboard</Link>
        </div>
      </nav>

      <div className="hero__media">
        <ScrollSequence frameCount={192} />
      </div>
    </header>
  );
}

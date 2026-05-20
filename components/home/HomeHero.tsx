import Link from "next/link";
import { ScrollSequence } from "./ScrollSequence";

export function HomeHero() {
  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
        aria-label="SkinGraph public navigation"
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#fff",
            textDecoration: "none",
          }}
        >
          <span style={{
            background: "#dc2626",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            padding: "4px 9px",
            borderRadius: 6,
            letterSpacing: "0.05em",
          }}>SG</span>
          <strong style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.01em" }}>SkinGraph Radar</strong>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#preview" style={{ color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Preview</a>
          <Link
            href="/dashboard"
            style={{
              background: "#dc2626",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section id="trace">
        <ScrollSequence frameCount={192} />
      </section>
    </>
  );
}

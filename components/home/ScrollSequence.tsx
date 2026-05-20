"use client";

import { useEffect, useRef } from "react";

type ScrollSequenceProps = {
  frameCount?: number;
  frameBasePath?: string;
  extension?: string;
  alt?: string;
};

function padFrame(n: number) {
  return String(n).padStart(5, "0");
}

export function ScrollSequence({
  frameCount = 192,
  frameBasePath = "/animation/home-sequence/",
  extension = ".png",
  alt = "Animated CS2 market intelligence sequence",
}: ScrollSequenceProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Preload all frames eagerly
    const preloaded: HTMLImageElement[] = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `${frameBasePath}${padFrame(i)}${extension}`;
      preloaded.push(img);
    }

    if (reducedMotion) return () => { preloaded.forEach(img => { img.src = ""; }); };

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const el = outerRef.current;
        if (!el) { ticking = false; return; }

        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const progress = scrollable > 0
          ? Math.min(1, Math.max(0, -rect.top / scrollable))
          : 0;

        // Drive frame from scroll
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        const preImg = preloaded[frameIndex];
        if (imgRef.current) {
          imgRef.current.src = (preImg?.complete && preImg.naturalWidth > 0)
            ? preImg.src
            : `${frameBasePath}${padFrame(frameIndex + 1)}${extension}`;
        }

        // Fade headline out past 40% scroll
        if (headlineRef.current) {
          headlineRef.current.style.opacity = String(Math.max(0, 1 - progress / 0.4));
        }

        // Fade scroll cue out quickly
        if (scrollCueRef.current) {
          scrollCueRef.current.style.opacity = String(Math.max(0, 1 - progress / 0.08));
        }

        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      preloaded.forEach(img => { img.src = ""; });
    };
  }, [frameCount, frameBasePath, extension]);

  return (
    <div ref={outerRef} style={{ height: "300vh", position: "relative" }}>
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "#000",
      }}>
        <img
          ref={imgRef}
          src={`${frameBasePath}${padFrame(1)}${extension}`}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Headline overlay */}
        <div
          ref={headlineRef}
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <h1 style={{
            color: "#fff",
            fontSize: "clamp(2.2rem, 5.5vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "0 auto",
            maxWidth: 900,
            padding: "0 24px",
            textShadow: "0 2px 48px rgba(0,0,0,0.6)",
            lineHeight: 1.1,
          }}>
            Every trade leaves a trace.
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
            marginTop: 16,
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}>
            Scroll to follow the graph
          </p>
        </div>

        {/* Scroll cue */}
        <div
          ref={scrollCueRef}
          style={{
            position: "absolute",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div style={{
            width: 24,
            height: 40,
            border: "2px solid rgba(255,255,255,0.35)",
            borderRadius: 12,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 4,
              height: 8,
              borderRadius: 2,
              background: "#dc2626",
              animation: "scrollDot 1.6s ease-in-out infinite",
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollDot {
          0% { top: 6px; opacity: 1; }
          80% { top: 22px; opacity: 0.2; }
          100% { top: 6px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

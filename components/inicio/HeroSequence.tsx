'use client';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const FRAMES = 192;

export default function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const drawnFrame = useRef(-1);
  const raf = useRef(0);

  // Fade out scroll hint as user scrolls into sequence
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', '15% start'] });
  const hintOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Light sweep across the hero headline, tracking scroll over the full sequence
  const { scrollYProgress: heroProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const lightPosition = useTransform(heroProgress, [0, 1], ['-50% 50%', '200% 50%']);
  const lightOpacity = useTransform(heroProgress, [0, 0.08, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    }

    function drawFrame(img: HTMLImageElement) {
      if (!canvas || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const sw = iw * scale, sh = ih * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh);
    }

    function redraw() {
      const f = Math.max(0, drawnFrame.current);
      const img = images.current[f];
      if (img) drawFrame(img);
    }

    function getFrame() {
      const container = containerRef.current;
      if (!container) return 0;
      // 200vh scroll space = window.innerHeight * 2
      const scrolled = window.scrollY - container.offsetTop;
      const scrollSpace = window.innerHeight * 2;
      const progress = Math.max(0, Math.min(1, scrolled / scrollSpace));
      return Math.round(progress * (FRAMES - 1));
    }

    function onScroll() {
      const frame = getFrame();
      if (frame === drawnFrame.current) return;
      drawnFrame.current = frame;
      const img = images.current[frame];
      if (img?.complete && img.naturalWidth > 0) {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => drawFrame(img));
      }
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Progressive preload: first 20 immediately, then rest in background
    const preloadAll = () => {
      for (let i = 0; i < FRAMES; i++) {
        if (images.current[i]) continue;
        const img = new Image();
        const num = String(i + 1).padStart(5, '0');
        img.src = `/sequence/${num}.webp`;
        img.onload = () => {
          images.current[i] = img;
          if (i === drawnFrame.current || drawnFrame.current < 0) {
            redraw();
          }
        };
        images.current[i] = img;
      }
    };

    // Load first 30 frames synchronously priority
    for (let i = 0; i < 30; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(5, '0');
      img.src = `/sequence/${num}.webp`;
      img.onload = () => {
        images.current[i] = img;
        if (i === 0 && drawnFrame.current < 0) {
          drawnFrame.current = 0;
          drawFrame(img);
        } else if (i === drawnFrame.current) {
          drawFrame(img);
        }
      };
      images.current[i] = img;
    }

    // Rest after a tick
    setTimeout(preloadAll, 100);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: 'calc(100vh + 200vh)' }}
    >
      {/* Sticky viewport */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#0B0B0C',
        }}
      >
        {/* Canvas frame display */}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* Headline with scroll-driven light sweep */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 24px',
          }}
        >
          <h1
            style={{
              position: 'relative',
              margin: 0,
              fontFamily: 'var(--font-serif, serif)',
              fontWeight: 600,
              fontSize: 'clamp(2.4rem, 7vw, 6rem)',
              lineHeight: 1.08,
              textAlign: 'center',
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.16)',
            }}
          >
            <span aria-hidden="true">
              El precio es solo<br />la <em style={{ fontStyle: 'italic' }}>superficie</em>.
            </span>
            <motion.span
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.95) 50%, transparent 65%)',
                backgroundSize: '300% 300%',
                backgroundPosition: lightPosition,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                opacity: lightOpacity,
              }}
            >
              El precio es solo<br />la <em style={{ fontStyle: 'italic' }}>superficie</em>.
            </motion.span>
          </h1>
        </motion.div>

        {/* Top nav */}
        <nav className="topnav" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <a className="brand" href="#">
            <span className="brand__mark">SG</span>
            <span className="brand__name">SkinGraph Radar</span>
          </a>
          <div className="topnav__right">
            <a className="topnav__link" href="#senales">Preview</a>
            <a className="btn btn--red btn--sm" href="#cierre">Dashboard</a>
          </div>
        </nav>

        {/* Scroll hint */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            translateX: '-50%',
            opacity: hintOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <span>Scroll para ensamblar</span>
          {/* Mouse scroll icon */}
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
            <rect x="1" y="1" width="16" height="26" rx="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
            <motion.rect
              x="8" y="6" width="2" height="5" rx="1"
              fill="rgba(255,255,255,0.6)"
              animate={{ y: [6, 11, 6] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Progress bar at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '2px', background: 'rgba(255,255,255,0.08)',
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'var(--red)',
              scaleX: scrollYProgress,
              transformOrigin: 'left',
            }}
          />
        </div>
      </div>
    </div>
  );
}

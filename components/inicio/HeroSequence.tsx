'use client';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

/* ─── Config ──────────────────────────────────────────────── */
const PARTICLE_COUNT  = 180;
const SPREAD          = 52;          // half-extent of the volume
const CONNECT_DIST    = 18;          // max distance to draw an edge
const MAX_EDGES       = 320;         // cap to avoid overdraw
const RED_NODE_RATIO  = 0.07;        // fraction that are red (high-degree)

type QuestionSpot = {
  text: string;
  range: [number, number, number, number];
  style: React.CSSProperties;
};

const QUESTIONS: QuestionSpot[] = [
  {
    text: '¿Cansado de tener miedo de perder tus skins?',
    range: [0.04, 0.1, 0.21, 0.27],
    style: { top: '14%', left: '6%', width: 'min(28vw, 300px)', textAlign: 'left' },
  },
  {
    text: '¿Querés evitar estafas?',
    range: [0.24, 0.3, 0.41, 0.47],
    style: { top: '12%', right: '6%', width: 'min(22vw, 240px)', textAlign: 'right' },
  },
  {
    text: '¿Sabés quién tuvo tu skin antes que vos?',
    range: [0.44, 0.5, 0.61, 0.67],
    style: { bottom: '16%', left: '6%', width: 'min(26vw, 280px)', textAlign: 'left' },
  },
  {
    text: '¿Confiarías en un trader sin historial?',
    range: [0.64, 0.7, 0.81, 0.87],
    style: { bottom: '14%', right: '6%', width: 'min(26vw, 280px)', textAlign: 'right' },
  },
];

function QuestionText({ progress, spot }: { progress: ReturnType<typeof useScroll>['scrollYProgress']; spot: QuestionSpot }) {
  const [start, peakIn, peakOut, end] = spot.range;
  const opacity = useTransform(progress, [start, peakIn, peakOut, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, peakIn, peakOut, end], [18, 0, 0, -14]);
  const blur = useTransform(progress, [start, peakIn, peakOut, end], [6, 0, 0, 4]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      style={{
        position: 'absolute',
        ...spot.style,
        opacity,
        y,
        filter,
        fontFamily: 'var(--font-serif, serif)',
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 'clamp(1.1rem, 2.4vw, 1.9rem)',
        lineHeight: 1.35,
        letterSpacing: '0.01em',
        color: 'rgba(255,255,255,0.95)',
        textShadow: '0 0 24px rgba(255,255,255,0.25), 0 1px 12px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    >
      {spot.text}
    </motion.div>
  );
}

export default function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef     = useRef<HTMLDivElement>(null);
  const rafRef       = useRef(0);
  const mouseRef     = useRef({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const hintOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0]);

  // Question circles + closing line, tracking scroll over the full sequence
  const { scrollYProgress: heroProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  useEffect(() => {
    const mount     = mountRef.current as HTMLDivElement;
    const container = containerRef.current as HTMLDivElement;
    if (!mount || !container) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x0B0B0C, 1);
    mount.appendChild(renderer.domElement);

    /* ── Scene / Camera / Fog ── */
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x0B0B0C, 0.012);
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.5, 300);
    camera.position.set(0, 0, 72);

    /* ── Build particle positions ── */
    const positions: THREE.Vector3[] = [];
    const isRed: boolean[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 12 + Math.random() * SPREAD;
      positions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.5,
        r * Math.cos(phi),
      ));
      isRed.push(Math.random() < RED_NODE_RATIO);
    }

    /* ── Points geometry (one draw call for all particles) ── */
    const posArray = new Float32Array(PARTICLE_COUNT * 3);
    const colArray = new Float32Array(PARTICLE_COUNT * 3);
    const redColor  = new THREE.Color(0xEE2E2E);
    const baseColor = new THREE.Color(0x9a9a96);

    positions.forEach((p, i) => {
      posArray[i * 3]     = p.x;
      posArray[i * 3 + 1] = p.y;
      posArray[i * 3 + 2] = p.z;
      const c = isRed[i] ? redColor : baseColor;
      colArray[i * 3]     = c.r;
      colArray[i * 3 + 1] = c.g;
      colArray[i * 3 + 2] = c.b;
    });

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    pointsGeo.setAttribute('color',    new THREE.BufferAttribute(colArray, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });
    scene.add(new THREE.Points(pointsGeo, pointsMat));

    /* ── Edges (plexus lines) ── */
    const edgePositions: number[] = [];
    const edgeColors:    number[] = [];
    const edgeGeo = new THREE.BufferGeometry();
    let   edgeCount = 0;

    for (let i = 0; i < positions.length && edgeCount < MAX_EDGES; i++) {
      for (let j = i + 1; j < positions.length && edgeCount < MAX_EDGES; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < CONNECT_DIST) {
          const opacity = 1 - dist / CONNECT_DIST;   // fade by distance
          const isEdgeRed = isRed[i] || isRed[j];
          const r = isEdgeRed ? 0.93 : 0.6;
          const g = isEdgeRed ? 0.18 : 0.6;
          const b = isEdgeRed ? 0.18 : 0.6;
          const a = isEdgeRed ? opacity * 0.6 : opacity * 0.18;

          edgePositions.push(positions[i].x, positions[i].y, positions[i].z);
          edgePositions.push(positions[j].x, positions[j].y, positions[j].z);
          // encode alpha in color brightness (WebGL lines don't support per-vertex alpha natively)
          edgeColors.push(r * a, g * a, b * a);
          edgeColors.push(r * a, g * a, b * a);
          edgeCount++;
        }
      }
    }

    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeGeo.setAttribute('color',    new THREE.Float32BufferAttribute(edgeColors, 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
    const lines   = new THREE.LineSegments(edgeGeo, lineMat);
    scene.add(lines);

    /* ── Mouse parallax ── */
    function onMouseMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    }
    window.addEventListener('mousemove', onMouseMove);

    /* ── Resize ── */
    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    /* ── Scroll progress helper ── */
    function getProgress() {
      const scrolled = window.scrollY - (container.offsetTop ?? 0);
      return Math.max(0, Math.min(1, scrolled / (window.innerHeight * 2)));
    }

    /* ── Animation loop ── */
    let time = 0;
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      time += 0.003;

      const p = getProgress();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      /* Scroll-driven camera push */
      camera.position.z = 72 - p * 38;
      camera.position.y = p * 4;

      /* Mouse parallax — subtle tilt */
      camera.position.x += (mx * 6 - camera.position.x) * 0.04;
      camera.position.y += (-my * 4 - camera.position.y + p * 4) * 0.04;
      camera.lookAt(0, 0, 0);

      /* Slow scene rotation */
      scene.rotation.y = time * 0.08 + p * Math.PI * 0.35;
      scene.rotation.x = p * 0.12;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      pointsGeo.dispose();
      pointsMat.dispose();
      edgeGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: 'calc(100vh + 200vh)' }}>
      {/* Sticky viewport */}
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden', background: '#0B0B0C',
      }}>
        {/* Three.js canvas */}
        <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Gradient overlay — keeps text legible */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(11,11,12,0.55) 100%)',
        }} />

        {/* Trust questions, appearing one by one in the corners as the scene assembles */}
        {QUESTIONS.map((spot) => (
          <QuestionText key={spot.text} progress={heroProgress} spot={spot} />
        ))}

        {/* Closing line, revealed once all parts have come together */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 24px',
            opacity: useTransform(heroProgress, [0.84, 0.92, 1], [0, 1, 1]),
            scale: useTransform(heroProgress, [0.84, 0.94], [0.92, 1]),
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif, serif)',
              fontWeight: 600,
              fontSize: 'clamp(2.4rem, 7vw, 6rem)',
              lineHeight: 1.08,
              textAlign: 'center',
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.94)',
            }}
          >
            El precio es solo<br />la <em style={{ fontStyle: 'italic' }}>superficie</em>.
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
            <a className="btn btn--red btn--sm" href="/dashboard">Dashboard</a>
          </div>
        </nav>

        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', gap: 10,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(237,234,226,0.12)',
            padding: '5px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(237,234,226,0.4)',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#EE2E2E',
              boxShadow: '0 0 6px #EE2E2E',
              flexShrink: 0,
            }} />
            Red de compradores · Neo4j · En vivo
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div style={{
          position: 'absolute', bottom: 36, left: '50%', translateX: '-50%',
          opacity: hintOpacity,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          <span>Scroll para explorar</span>
          <svg width="16" height="26" viewBox="0 0 16 26" fill="none">
            <rect x="1" y="1" width="14" height="24" rx="7"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <motion.rect
              x="7" y="5" width="2" height="5" rx="1"
              fill="rgba(255,255,255,0.4)"
              animate={{ y: [5, 10, 5] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '1px', background: 'rgba(255,255,255,0.06)',
        }}>
          <motion.div style={{
            height: '100%', background: '#EE2E2E',
            scaleX: scrollYProgress, transformOrigin: 'left',
          }} />
        </div>
      </div>
    </div>
  );
}

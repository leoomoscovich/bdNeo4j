'use client';
import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

/* Editorial palette — matches the rest of the system */
const NODE_DEFS = [
  { color: 0xEE2E2E, size: 3.2, count: 8  },  // skin
  { color: 0x9a9a96, size: 2.0, count: 20 },  // trader
  { color: 0xc98a2a, size: 3.8, count: 5  },  // marketplace
  { color: 0xEDEAE2, size: 1.6, count: 15 },  // instance
  { color: 0x5b5b60, size: 1.0, count: 12 },  // transaction
];

const CONNECT_DIST = 28;

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
  const mountRef    = useRef<HTMLDivElement>(null);
  const rafRef      = useRef(0);

  /* scrollYProgress covers the full 300vh hero height */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Question circles + closing line, tracking scroll over the full sequence
  const { scrollYProgress: heroProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  useEffect(() => {
    const mount = mountRef.current as HTMLDivElement;
    const container = containerRef.current as HTMLDivElement;
    if (!mount || !container) return;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B0B0C, 0.007);

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 1, 500);
    camera.position.set(0, 0, 88);

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x0B0B0C, 1);
    mount.appendChild(renderer.domElement);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xfff2e2, 1.1);
    key.position.set(1.2, 1.8, 1.0);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe2d2, 0.4);
    fill.position.set(-1, -0.5, 0.5);
    scene.add(fill);

    /* ── Build network ── */
    const positions: THREE.Vector3[] = [];
    const meshes: THREE.Mesh[] = [];
    const edgeGeos: THREE.BufferGeometry[] = [];

    for (const { color, size, count } of NODE_DEFS) {
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(0.12),
        shininess: 55,
        transparent: true,
        opacity: 0.88,
      });

      for (let i = 0; i < count; i++) {
        /* Distribute in a flattened sphere */
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 18 + Math.random() * 28;
        const pos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.55,
          r * Math.cos(phi),
        );

        const geo  = new THREE.SphereGeometry(size, 9, 7);
        const mesh = new THREE.Mesh(geo, mat.clone());
        mesh.position.copy(pos);
        scene.add(mesh);
        positions.push(pos);
        meshes.push(mesh);
      }
    }

    /* ── Edges ── */
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xEDEAE2, transparent: true, opacity: 0.10,
    });
    const riskMat = new THREE.LineBasicMaterial({
      color: 0xEE2E2E, transparent: true, opacity: 0.40,
    });

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < CONNECT_DIST) {
          const isRisk = Math.random() < 0.08;
          const geo = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
          edgeGeos.push(geo);
          scene.add(new THREE.Line(geo, isRisk ? riskMat : edgeMat));
        }
      }
    }

    /* ── Scroll progress helper ── */
    function getProgress() {
      const scrolled = window.scrollY - (container?.offsetTop ?? 0);
      const range    = window.innerHeight * 2;
      return Math.max(0, Math.min(1, scrolled / range));
    }

    /* ── Resize ── */
    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    /* ── Animation loop ── */
    let time = 0;
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      time += 0.004;

      const p = getProgress();
      camera.position.z = 88 - p * 45;
      camera.position.y = p * 6;

      /* whole-scene rotation: slow drift + scroll-driven spin */
      scene.rotation.y = time * 0.12 + p * Math.PI * 0.45;
      scene.rotation.x = p * 0.18;

      /* node pulse */
      meshes.forEach((mesh, idx) => {
        const s = 1 + Math.sin(time * 1.6 + idx * 0.62) * 0.055;
        mesh.scale.setScalar(s);
      });

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      meshes.forEach((m) => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
      edgeGeos.forEach((g) => g.dispose());
      edgeMat.dispose();
      riskMat.dispose();
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
        {/* Three.js mount target */}
        <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

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

        {/* Center overlay: minimal label */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(237,234,226,0.38)', marginBottom: 0,
          }}>
            Red de compradores · Neo4j · En vivo
          </p>
        </div>

        {/* Scroll hint */}
        <motion.div style={{
          position: 'absolute', bottom: 36, left: '50%', translateX: '-50%',
          opacity: hintOpacity,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          <span>Scroll para explorar</span>
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
            <rect x="1" y="1" width="16" height="26" rx="8"
              stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <motion.rect
              x="8" y="6" width="2" height="5" rx="1"
              fill="rgba(255,255,255,0.55)"
              animate={{ y: [6, 11, 6] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '2px', background: 'rgba(255,255,255,0.07)',
        }}>
          <motion.div style={{
            height: '100%', background: 'var(--red)',
            scaleX: scrollYProgress, transformOrigin: 'left',
          }} />
        </div>
      </div>
    </div>
  );
}

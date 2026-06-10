"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  imageUrl: string;
  alt?: string;
};

/**
 * Three.js skin viewer: textured plane with metallic sheen +
 * mouse-driven rotation. Replaces the CSS-perspective tilt.
 */
export function SkinInspect3D({ imageUrl, alt }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current as HTMLDivElement;
    if (!mount) return;

    const w = mount.clientWidth  || 480;
    const h = mount.clientHeight || 360;

    /* ── Scene ── */
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // transparent background
    mount.appendChild(renderer.domElement);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xfff8f0, 1.0);
    key.position.set(1, 1, 2);
    scene.add(key);
    /* Point light follows mouse for specular pop */
    const point = new THREE.PointLight(0xffffff, 1.5, 12);
    point.position.set(0, 0, 3);
    scene.add(point);

    /* ── Skin plane ── */
    const geo = new THREE.PlaneGeometry(2.8, 2.8 * (h / w), 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.55,
      transparent: true,
      opacity: 0,       // fade in once texture loads
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    /* ── Load texture ── */
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    loader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        mat.map = texture;
        mat.needsUpdate = true;
        /* Fade in */
        let opacity = 0;
        const fadeIn = setInterval(() => {
          opacity = Math.min(1, opacity + 0.06);
          mat.opacity = opacity;
          if (opacity >= 1) clearInterval(fadeIn);
        }, 16);
      },
      undefined,
      () => { /* silent fail — plate shows empty state */ },
    );

    /* ── Mouse interaction ── */
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;
    let autoAngle = 0;
    const MAX_ROT = 0.32; // ~18°

    function onPointerMove(e: PointerEvent) {
      const rect = mount.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRotY =  px * MAX_ROT * 2;
      targetRotX = -py * MAX_ROT * 1.4;
      /* move the spec point light */
      point.position.set(px * 4, -py * 3, 3);
    }

    function onPointerLeave() {
      targetRotX = 0;
      targetRotY = 0;
    }

    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);

    /* ── Resize ── */
    function onResize() {
      const nw = mount.clientWidth  || w;
      const nh = mount.clientHeight || h;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ── Animation ── */
    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      autoAngle += 0.004;

      /* Lazy follow for smooth feel */
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      mesh.rotation.x = currentRotX;
      mesh.rotation.y = currentRotY + Math.sin(autoAngle) * 0.04;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [imageUrl]);

  return (
    <div
      ref={mountRef}
      aria-label={alt}
      style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
    />
  );
}

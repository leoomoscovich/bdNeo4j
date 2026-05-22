'use client';
import { useEffect, useState } from 'react';

/* Clock in masthead */
export function Clock() {
  const [time, setTime] = useState('—');
  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm} ART`);
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono mono--muted">{time}</span>;
}

/* "Actualizado hace X s" counter */
export function LastUpdated() {
  const [s, setS] = useState(38);
  useEffect(() => {
    const id = setInterval(() => setS(prev => prev >= 119 ? 12 : prev + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>hace {s} s</span>;
}

/* Scroll reveal — adds .is-in class when section enters viewport */
export function ScrollReveal() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.sg .reveal');
    document.querySelectorAll<HTMLElement>('.sg .layers .layer').forEach((el, i) => {
      el.style.setProperty('--i', String(i));
    });
    function check() {
      const vh = window.innerHeight;
      items.forEach(el => {
        if (el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) el.classList.add('is-in');
      });
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
    setTimeout(check, 100);
    setTimeout(check, 400);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);
  return null;
}

/* Counter roll for KPI numbers */
export function CounterRolls() {
  useEffect(() => {
    const done = new WeakSet<Element>();
    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

    function tryAnimate(el: Element) {
      if (done.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.85 || r.bottom < 0) return;
      done.add(el);
      const original = el.innerHTML;
      const text = el.textContent?.trim() ?? '';
      const m = text.replace(/\./g, '').replace(/,/g, '.').match(/(\d+(?:\.\d+)?)([KMB%×s]*)/);
      if (!m) return;
      const target = parseFloat(m[1]);
      const suffix = m[2];
      if (isNaN(target)) return;
      const duration = 1100;
      const start = performance.now();
      function step(now: number) {
        const p = Math.min(1, (now - start) / duration);
        const eased = easeOutCubic(p);
        const v = target * eased;
        let display: string;
        if (text.includes('K')) display = v.toFixed(1).replace('.', ',') + 'K';
        else if (text.includes('.')) display = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        else if (/^\d+$/.test(text)) display = Math.round(v).toString().padStart(text.length, '0');
        else display = Math.round(v).toString();
        el.textContent = display + (suffix && !['K','M'].includes(suffix) ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
        else el.innerHTML = original;
      }
      requestAnimationFrame(step);
    }

    function check() {
      document.querySelectorAll('.sg .kv__v').forEach(el => {
        if (/^\s*[\d\.,]/.test(el.textContent ?? '')) tryAnimate(el);
      });
    }
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 200);
    return () => window.removeEventListener('scroll', check);
  }, []);
  return null;
}

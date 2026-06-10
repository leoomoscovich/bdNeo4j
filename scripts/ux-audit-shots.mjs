import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.AUDIT_BASE || 'https://cs2.lmstores.com';
const OUT = 'handoff/ux-audit';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 300)}`));

const shots = [
  { name: 'home-top', url: '/', scroll: 0 },
  { name: 'home-mid', url: null, scroll: 2500 },
  { name: 'home-low', url: null, scroll: 6000 },
  { name: 'skins', url: '/skins', scroll: 0 },
  { name: 'dashboard', url: '/dashboard', scroll: 0 },
];

for (const s of shots) {
  try {
    if (s.url) {
      await page.goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);
    }
    if (s.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: `${OUT}/${s.name}.png` });
    console.log('ok', s.name);
  } catch (e) {
    console.log('fail', s.name, String(e).slice(0, 200));
  }
}

// try a skin detail
try {
  const res = await page.goto(BASE + '/api/skins', { timeout: 30000 });
  const data = await res.json();
  const first = (data.skins || data)[0];
  const id = first?.id;
  if (id) {
    await page.goto(`${BASE}/skins/${id}`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/skin-detail.png` });
    console.log('ok skin-detail', id);
  }
} catch (e) { console.log('fail skin-detail', String(e).slice(0, 200)); }

// mobile home
await page.setViewportSize({ width: 390, height: 844 });
try {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/home-mobile.png` });
  console.log('ok home-mobile');
} catch (e) { console.log('fail home-mobile', String(e).slice(0, 200)); }

fs.writeFileSync(`${OUT}/console-errors.txt`, errors.join('\n') || '(none)');
console.log('console errors:', errors.length);
await browser.close();

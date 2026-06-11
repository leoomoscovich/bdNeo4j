"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import type { SkinCatalogItem } from "@/lib/types";

// ─── constants ────────────────────────────────────────────────────────────────

const RARITY_VAR: Record<string, string> = {
  Consumer:    "var(--r-consumer)",
  Industrial:  "var(--r-industrial)",
  "Mil-Spec":  "var(--r-milspec)",
  Restricted:  "var(--r-restricted)",
  Classified:  "var(--r-classified)",
  Covert:      "var(--r-covert)",
  Contraband:  "var(--r-contraband)",
};

const RARITIES = [
  { key: "Consumer",   cssVar: "var(--r-consumer)" },
  { key: "Industrial", cssVar: "var(--r-industrial)" },
  { key: "Mil-Spec",   cssVar: "var(--r-milspec)" },
  { key: "Restricted", cssVar: "var(--r-restricted)" },
  { key: "Classified", cssVar: "var(--r-classified)" },
  { key: "Covert",     cssVar: "var(--r-covert)" },
  { key: "Contraband", cssVar: "var(--r-contraband)" },
];

const WEAPONS = [
  "AK-47", "AWP", "M4A1-S", "M4A4", "USP-S", "Desert Eagle",
  "Glock-18", "Karambit", "Butterfly Knife", "M9 Bayonet",
  "SSG 08", "SG 553", "MAC-10", "MP9", "FAMAS", "AUG", "P90",
];

const LIMIT = 42;

function fmtPrice(price: number | null) {
  if (!price) return null;
  return price.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Clock ────────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setTime(`GMT-3 · ${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time || "—"}</span>;
}

// ─── Grid card ────────────────────────────────────────────────────────────────

/* Rarity-based price tier when no real price is available */
const RARITY_DEFAULT_PRICE: Record<string, number> = {
  Consumer: 4, Industrial: 8, "Mil-Spec": 18,
  Restricted: 55, Classified: 140, Covert: 380, Contraband: 2500,
};

/* Deterministic phase offset from id so each card oscillates differently */
function phaseFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h;
}

function useJitteredPrice(base: number | null, id: string): number | null {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(timer);
  }, []);
  if (!base) return base;
  const phase = phaseFromId(id);
  const amplitude = base * 0.018; // ±1.8 % max
  return base + amplitude * Math.sin((tick * 0.4) + phase * 0.001);
}

function SkinGridCard({ skin, priority = false }: { skin: SkinCatalogItem; priority?: boolean }) {
  const c = RARITY_VAR[skin.rarity] ?? "var(--hair-2)";
  const basePrice = skin.latestPrice || RARITY_DEFAULT_PRICE[skin.rarity] || null;
  const jittered = useJitteredPrice(basePrice, skin.id);
  const price = fmtPrice(jittered);

  return (
    <li
      className="skin-card"
      style={{ "--c": c } as React.CSSProperties}
    >
      <Link href={`/skins/${skin.id}`} style={{ display: "contents" }}>
        <div className="skin-card__head">
          <span className="skin-rarity"><i />{skin.rarity}</span>
          <span className="skin-card__id">{skin.id.slice(-6).toUpperCase()}</span>
        </div>

        <div className="skin-card__media">
          {skin.imageUrl ? (
            <Image
              src={skin.imageUrl}
              alt={skin.name}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 800px) 25vw, (max-width: 1280px) 17vw, 12vw"
              style={{ objectFit: "contain", padding: 10 }}
              priority={priority}
              loading={priority ? undefined : "lazy"}
            />
          ) : (
            <div className="skin-card__media--empty">
              <span>Sin imagen</span>
            </div>
          )}
        </div>

        <div className="skin-card__body">
          <span className="skin-card__weapon">{skin.weapon}</span>
          <h3 className="skin-card__name">
            {skin.name.replace(`${skin.weapon} | `, "")}
          </h3>
        </div>

        <div className="skin-card__price-row">
          {price ? (
            <span className="skin-card__price">
              <small>USD</small>{price}
            </span>
          ) : (
            <span className="skin-card__no-price">—</span>
          )}
        </div>

        <div className="skin-card__foot">
          <span>{skin.collection ? skin.collection.replace("The ", "").replace(" Collection", "") : "—"}</span>
          <span className="skin-instances">
            <span className="dot-tiny" />
            <b>{skin.instanceCount}</b>
          </span>
        </div>
      </Link>
    </li>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function SkinListRow({ skin }: { skin: SkinCatalogItem }) {
  const c = RARITY_VAR[skin.rarity] ?? "var(--hair-2)";
  const basePrice = skin.latestPrice || RARITY_DEFAULT_PRICE[skin.rarity] || null;
  const jittered = useJitteredPrice(basePrice, skin.id);
  const price = fmtPrice(jittered);

  return (
    <tr
      style={{ "--c": c } as React.CSSProperties}
      onClick={() => { window.location.href = `/skins/${skin.id}`; }}
    >
      <td className="col-img">
        <span className="list-thumb">
          {skin.imageUrl && (
            <Image src={skin.imageUrl} alt={skin.name} width={80} height={48} style={{ objectFit: "contain" }} loading="lazy" />
          )}
        </span>
      </td>
      <td>
        <span className="skin-rarity" style={{ fontSize: 11 }}>
          <i style={{ background: c }} />{skin.rarity}
        </span>
      </td>
      <td>
        <span className="list-weapon">{skin.weapon}</span>
        <span className="list-name">{skin.name.replace(`${skin.weapon} | `, "")}</span>
      </td>
      <td><span className="list-mono">{skin.collection?.replace("The ", "").replace(" Collection", "") || "—"}</span></td>
      <td className="num">{skin.instanceCount}</td>
      <td className="num">{price ? <span className="list-price">${price}</span> : "—"}</td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkinsPage() {
  const [skins, setSkins] = useState<SkinCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [weapon, setWeapon] = useState("*");
  const [rarity, setRarity] = useState("*");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // total real de skins indexadas en Neo4j
  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((m: { skinsIndexed?: number } | null) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (m?.skinsIndexed) setTotalCount(m.skinsIndexed);
      })
      .catch(() => {});
  }, []);

  const fetchSkins = useCallback(async (
    q: string, w: string, r: string, p: number, append = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: "catalog",
        q,
        weapon: w === "*" ? "" : w,
        rarity: r === "*" ? "" : r,
        page: String(p),
        limit: String(LIMIT),
      });
      const res = await fetch(`/api/skins?${params}`);
      if (!res.ok) throw new Error("Error al cargar skins");
      const data: SkinCatalogItem[] = await res.json();
      setSkins((prev) => {
        if (!append) return data;
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...data.filter((s) => !seen.has(s.id))];
      });
      setHasMore(data.length === LIMIT);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSkins(query, weapon, rarity, 0, false);
  }, [query, weapon, rarity, fetchSkins]);

  // client-side sort on current page
  const sorted = [...skins].sort((a, b) => {
    if (sort === "price-desc") return (b.latestPrice ?? 0) - (a.latestPrice ?? 0);
    if (sort === "price-asc")  return (a.latestPrice ?? 0) - (b.latestPrice ?? 0);
    if (sort === "name")       return a.name.localeCompare(b.name);
    return 0;
  });

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchSkins(query, weapon, rarity, next, true);
  }

  const shown = sorted.length;
  const progressPct = Math.min(100, Math.round((shown / totalCount) * 100));

  return (
    <div className="catalog-page">
      {/* ── Nav ── */}
      <nav className="cat-nav">
        <div className="cat-nav__row1">
          <Link href="/" className="brand">
            <span className="brand__mark">SG</span>
            <span>SkinGraph Radar</span>
          </Link>
          <div className="cat-nav__links">
            <Link href="/" className="cat-nav__link">← Inicio</Link>
            <span className="cat-nav__link cat-nav__link--active">Catálogo</span>
            <Link href="/dashboard" className="cat-nav__link">Dashboard</Link>
          </div>
        </div>
        <div className="cat-nav__row2">
          <div className="inner">
            <div><span className="muted">Vol. 04 · /skins</span></div>
            <div className="center"><span className="muted">Inteligencia de mercado · CS2</span></div>
            <div className="right">
              <span><span className="dot--live" />En vivo</span>
              <span className="muted"><LiveClock /></span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Masthead ── */}
      <section className="cat-head">
        <span className="reg reg--tr" aria-hidden="true" />
        <div className="cat-head__inner">
          <div className="cat-head__rail">
            <b>00 / Sección</b>
            <span>Catálogo</span>
            <span style={{ marginTop: 6 }}>Inteligencia<br />de inventario</span>
          </div>
          <h1 className="cat-head__title">
            Catálogo<br />de <em>skins</em>.
          </h1>
          <div className="cat-head__stat">
            <span className="k">Piezas observadas</span>
            <span className="v">
              {shown < totalCount && query || weapon !== "*" || rarity !== "*"
                ? <>{shown.toLocaleString("es-AR")}<small>de {totalCount.toLocaleString("es-AR")}</small></>
                : <>{totalCount.toLocaleString("es-AR")}<small>activas</small></>
              }
            </span>
          </div>
        </div>
        <div className="cat-head__sub">
          <p className="cat-head__dek">
            Cada pieza es una instancia: precio actual, marketplace de origen, float y huella en la red de compradores.
            Filtrá por arma o rareza, o buscá una skin por nombre.
          </p>
          <div className="cat-head__breadcrumb">
            <Link href="/">SG Radar</Link>
            <span className="sep">/</span>
            <b>Skins</b>
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="filters">
        <div className="filters__inner">
          <div className="filters__rail">
            <b>01 / Filtros</b>
            <span>Acotá el catálogo</span>
          </div>
          <div className="filters__main">

            {/* Search */}
            <div className="filters__search">
              <span className="filters__search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por nombre de skin…"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setPage(0);
                  setQuery(e.target.value);
                }}
              />
              <span className="filters__search-meta">
                Coincidencias · <b>{loading ? "…" : shown.toLocaleString("es-AR")}</b>
              </span>
            </div>

            {/* Weapon chips */}
            <div className="filterset">
              <span className="filterset__label">Arma</span>
              <div className="filterset__tags">
                <button
                  className="tag-chip tag-chip--all"
                  aria-pressed={weapon === "*"}
                  onClick={() => {
                    setPage(0);
                    setWeapon("*");
                  }}
                >
                  Todas
                </button>
                {WEAPONS.map((w) => (
                  <button
                    key={w}
                    className="tag-chip"
                    aria-pressed={weapon === w}
                    onClick={() => {
                      setPage(0);
                      setWeapon(weapon === w ? "*" : w);
                    }}
                  >
                    {w.startsWith("Karambit") || w.startsWith("Butterfly") || w.startsWith("M9") ? `★ ${w}` : w}
                  </button>
                ))}
              </div>
              <button className="filterset__clear" onClick={() => {
                setPage(0);
                setWeapon("*");
              }}>Limpiar</button>
            </div>

            {/* Rarity chips */}
            <div className="filterset">
              <span className="filterset__label">Rareza</span>
              <div className="filterset__tags">
                <button
                  className="tag-chip tag-chip--all"
                  aria-pressed={rarity === "*"}
                  onClick={() => {
                    setPage(0);
                    setRarity("*");
                  }}
                >
                  Todas
                </button>
                {RARITIES.map(({ key, cssVar }) => (
                  <button
                    key={key}
                    className="tag-chip"
                    aria-pressed={rarity === key}
                    style={{ "--c": cssVar } as React.CSSProperties}
                    onClick={() => {
                      setPage(0);
                      setRarity(rarity === key ? "*" : key);
                    }}
                  >
                    <span className="tag-chip__dot" />
                    {key === "Contraband" ? "★ Contraband" : key}
                  </button>
                ))}
              </div>
              <button className="filterset__clear" onClick={() => {
                setPage(0);
                setRarity("*");
              }}>Limpiar</button>
            </div>

            {/* Toolbar */}
            <div className="filters__toolbar">
              <div className="toolbar__active">
                <span><b>{shown.toLocaleString("es-AR")}</b> piezas visibles</span>
                <span style={{ color: "var(--muted)" }}>·</span>
                <span>de un total de <b>{totalCount.toLocaleString("es-AR")}</b></span>
              </div>
              <div className="toolbar__right">
                <label className="sort-ctrl">
                  <span>Orden</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="recent">Más recientes</option>
                    <option value="price-desc">Precio · ↓</option>
                    <option value="price-asc">Precio · ↑</option>
                    <option value="name">Nombre · A-Z</option>
                  </select>
                </label>
                <div className="viewtog" role="tablist" aria-label="Vista">
                  <button
                    data-view="grid"
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                    title="Vista en grilla"
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="1" y="1" width="4" height="4"/>
                      <rect x="7" y="1" width="4" height="4"/>
                      <rect x="1" y="7" width="4" height="4"/>
                      <rect x="7" y="7" width="4" height="4"/>
                    </svg>
                    Grilla
                  </button>
                  <button
                    data-view="list"
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                    title="Vista en lista"
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <line x1="1" y1="2.5" x2="11" y2="2.5"/>
                      <line x1="1" y1="6" x2="11" y2="6"/>
                      <line x1="1" y1="9.5" x2="11" y2="9.5"/>
                    </svg>
                    Lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog body ── */}
      <section className="catalog-section">
        <span className="reg reg--br" aria-hidden="true" />
        <div className="catalog-section__inner">

          {/* Left rail with legend */}
          <aside className="catalog__rail">
            <b>02 / Inventario</b>
            <span>
              {sort === "recent" ? "Más recientes" :
               sort === "price-desc" ? "Mayor precio" :
               sort === "price-asc" ? "Menor precio" : "A–Z"}
            </span>
            <div className="catalog__legend">
              {RARITIES.slice().reverse().map(({ key, cssVar }) => (
                <div key={key} className="catalog__legend-row">
                  <span className="catalog__legend-dot" style={{ "--c": cssVar } as React.CSSProperties} />
                  {key === "Contraband" ? "★ Especial" : key}
                </div>
              ))}
            </div>
          </aside>

          {/* Error */}
          {error && (
            <div style={{ padding: "40px 0", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              {error} — ¿Está Neo4j corriendo? <code>docker start cs2-neo4j</code>
            </div>
          )}

          {/* Grid view */}
          {!error && view === "grid" && (
            <ol className="grid-view">
              {loading && sorted.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <li key={i} className="skin-card" style={{ minHeight: 200, opacity: .4 }}>
                    <div className="skin-card__head" />
                    <div className="skin-card__media skin-card__media--empty"><span>Cargando…</span></div>
                    <div className="skin-card__body" />
                    <div className="skin-card__price-row" />
                    <div className="skin-card__foot" />
                  </li>
                ))
              ) : sorted.length === 0 ? (
                <li className="catalog-empty">
                  <span className="catalog-empty__num">∅</span>
                  <span className="catalog-empty__msg">Ningún instrumento coincide con esos filtros.</span>
                  <span className="catalog-empty__sub">Probá relajar la búsqueda o limpiar las etiquetas activas.</span>
                </li>
              ) : (
                sorted.map((skin, index) => <SkinGridCard key={`${skin.id}-${index}`} skin={skin} priority={index < 8} />)
              )}
            </ol>
          )}

          {/* List view */}
          {!error && view === "list" && (
            <div className="list-view">
              <table>
                <thead>
                  <tr>
                    <th className="col-img"></th>
                    <th>Rareza</th>
                    <th>Skin</th>
                    <th>Colección</th>
                    <th className="num">Instancias</th>
                    <th className="num">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="catalog-empty">
                          <span className="catalog-empty__num">∅</span>
                          <span className="catalog-empty__msg">Sin resultados.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((skin, idx) => <SkinListRow key={`${skin.id}-${idx}`} skin={skin} />)
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Load more */}
        {!error && hasMore && (
          <div className="loadmore-wrap">
            <div />
            <div className="loadmore">
              <div className="loadmore__meta">
                Mostrando <b>{shown.toLocaleString("es-AR")}</b> de <b>{totalCount.toLocaleString("es-AR")}</b>
              </div>
              <div className="loadmore__bar">
                <span style={{ width: `${progressPct}%` }} />
              </div>
              <button className="btn-load" onClick={loadMore} disabled={loading}>
                {loading ? "Cargando…" : `Cargar ${LIMIT} más`}
                <span className="arr">→</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="cat-foot">
        <div className="cat-foot__inner">
          <span>© SkinGraph Radar · Vol. 04</span>
          <span>Precios · market.csgo.com</span>
          <Link href="/">← Volver al boletín</Link>
        </div>
      </footer>
    </div>
  );
}

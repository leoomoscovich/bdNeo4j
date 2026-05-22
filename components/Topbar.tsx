/* eslint-disable react-hooks/set-state-in-effect -- Controlled input mirrors externally applied global search filters. */

import { useEffect, useState, type ComponentType, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Bell, GitBranch, History, LayoutGrid, Moon, Search, Settings, Shield, Sun, User, Wallet, Zap } from "lucide-react";
import { applyTheme, getInitialTheme, setStoredTheme } from "./ThemeBoot";
import type { AppFilters, WorkspaceId } from "@/lib/ui-state";

const navItems: Array<{ id: WorkspaceId; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { id: "dashboard", label: "Dashboard", icon: Shield },
  { id: "market-radar", label: "Market", icon: LayoutGrid },
  { id: "risk-cycles", label: "Risk", icon: GitBranch },
  { id: "graph-explorer", label: "Network", icon: GitBranch },
  { id: "traders", label: "Traders", icon: User },
  { id: "watchlist", label: "Watchlist", icon: History },
];

type ThemeMode = "dark" | "light";

type TopbarProps = {
  activeNav: WorkspaceId;
  filters: AppFilters;
  scanStatus: "idle" | "running" | "error";
  onNavChange: (id: WorkspaceId) => void;
  onRunScan: () => void;
  onSearch?: (query: string) => void;
};

export function Topbar({ activeNav, filters, scanStatus, onNavChange, onRunScan, onSearch }: TopbarProps) {
  const [query, setQuery] = useState(filters.query);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const nextTheme = getInitialTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("skin-command-theme-change", { detail: nextTheme }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch?.(query);
  }

  return (
    <header className="topbar">
      <motion.nav
        className="command-nav"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        aria-label="Navegacion principal"
      >
        <button className="command-brand" onClick={() => onNavChange("dashboard")} aria-label="Ir al dashboard">
          <Zap className="brand-zap" size={20} strokeWidth={2.4} />
          <span>SKIN COMMAND</span>
        </button>

        <div className="command-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                className={`command-link${active ? " active" : ""}`}
                onClick={() => onNavChange(item.id)}
                whileTap={{ scale: 0.96 }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <motion.span
                  initial={false}
                  animate={{ width: active ? "auto" : 0, opacity: active ? 1 : 0, marginLeft: active ? 8 : 0 }}
                  className="command-link-label"
                >
                  {item.label}
                </motion.span>
                {active && <motion.span layoutId="active-command-glow" className="command-active-glow" />}
              </motion.button>
            );
          })}
        </div>

        <button className="execute-trade" onClick={onRunScan} disabled={scanStatus === "running"}>
          {scanStatus === "running" ? "SCANNING" : "EXECUTE SCAN"}
          <Zap size={14} fill="currentColor" />
        </button>
      </motion.nav>

      <form className="global-search" onSubmit={handleSubmit}>
        <Search className="search-icon" size={18} />
        <input
          aria-label="Busqueda global"
          placeholder="Search skin, trader, float, sticker, marketplace..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") {
              onSearch?.("");
            }
          }}
        />
      </form>
      <div className="top-actions">
        <span className="status-pill">
          <span className="status-dot" />
          Live feed
        </span>
        <span className="filter-pill">{filters.marketplaces.length} markets</span>
        <span className="filter-pill">Min spread: {filters.minSpreadPct}%</span>
        <span className="risk-pill">Max risk: {filters.maxRiskScore}</span>
        <div className="theme-toggle" role="group" aria-label="Tema de la interfaz">
          <button
            type="button"
            className="theme-toggle-option"
            aria-pressed={theme === "dark"}
            onClick={() => handleThemeChange("dark")}
            title="Dark mode"
          >
            <Moon size={14} />
            <span>Dark</span>
          </button>
          <button
            type="button"
            className="theme-toggle-option"
            aria-pressed={theme === "light"}
            onClick={() => handleThemeChange("light")}
            title="Light mode"
          >
            <Sun size={14} />
            <span>Light</span>
          </button>
        </div>
        <button className="icon-action" aria-label="Notificaciones"><Bell size={17} /></button>
        <button className="icon-action" aria-label="Wallet"><Wallet size={17} /></button>
        <button className="icon-action" aria-label="Configuracion"><Settings size={17} /></button>
      </div>
    </header>
  );
}

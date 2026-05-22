"use client";

import { useEffect, useState } from "react";

export function MastheadStrip() {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="masthead" aria-label="Masthead">
      <div className="masthead__inner">
        <div className="masthead__col">
          <span className="mono mono--muted">Vol. 04</span>
          <span className="mono mono--muted">Boletín de mercado</span>
        </div>
        <div className="masthead__col masthead__col--center">
          <span className="mono mono--muted">SkinGraph Radar · Inteligencia de mercado · CS2</span>
        </div>
        <div className="masthead__col masthead__col--right">
          <span className="mono"><span className="dot dot--live"></span> En vivo</span>
          <span className="mono mono--muted" id="clock">
            {time}
          </span>
        </div>
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

type StorySectionProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  visual?: ReactNode;
  align?: "left" | "right" | "center";
  id?: string;
};

export function StorySection({ eyebrow, title, children, visual, align = "left", id }: StorySectionProps) {
  return (
    <section id={id} className={`story-section story-section-${align}`}>
      <div className="story-copy">
        <p className="home-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <div className="story-body">{children}</div>
      </div>
      {visual && <div className="story-visual">{visual}</div>}
    </section>
  );
}

import type { ReactNode } from "react";

export type PanelVariant = "default" | "battle" | "dashboard";

export function Panel({
  title,
  subtitle,
  variant = "default",
  glow = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  variant?: PanelVariant;
  glow?: boolean;
  children: ReactNode;
}) {
  const mods = ["panel", `panel--${variant}`, glow ? "panel--glow" : ""].filter(Boolean).join(" ");
  return (
    <section className={mods}>
      {(title || subtitle) && (
        <header className="panel-header">
          {title ? <div className="panel-title">{title}</div> : null}
          {subtitle ? <div className="panel-subtitle">{subtitle}</div> : null}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function XPBar({
  label = "Experience",
  value,
  max,
  flash,
}: {
  label?: string;
  value: number;
  max: number;
  flash?: "gain";
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const frameClass = ["bar-frame", "bar-frame--xp", flash === "gain" ? "bar-frame--flash-xp" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={frameClass}>
      <div className="bar-frame__label">{label}</div>
      <div className="progress-track progress-track--xp">
        <div className="progress-fill progress-fill--xp" style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-frame__values">
        {value} / {max}
      </div>
    </div>
  );
}

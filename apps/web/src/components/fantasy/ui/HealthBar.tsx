export function HealthBar({
  label,
  value,
  max,
  flash,
}: {
  label: string;
  value: number;
  max: number;
  flash?: "hit" | "damage";
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const frameClass = [
    "bar-frame",
    "bar-frame--hp",
    flash === "hit" ? "bar-frame--flash-hit" : "",
    flash === "damage" ? "bar-frame--flash-damage" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={frameClass}>
      <div className="bar-frame__label">{label}</div>
      <div className="progress-track progress-track--hp">
        <div className="progress-fill progress-fill--hp" style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-frame__values">
        {value} / {max}
      </div>
    </div>
  );
}

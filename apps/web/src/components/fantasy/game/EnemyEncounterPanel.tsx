import { Diamond } from "lucide-react";
import { HealthBar } from "@/components/fantasy/ui/HealthBar";

export function EnemyEncounterPanel({
  enemyHp,
  maxEnemyHp,
  title = "Adversary",
  subtitle,
  hpFlash,
}: {
  enemyHp: number;
  maxEnemyHp: number;
  title?: string;
  subtitle?: string;
  hpFlash?: "hit" | null;
}) {
  return (
    <div className="enemy-encounter-panel">
      <div className="enemy-encounter-panel__creature" aria-hidden>
        <Diamond className="enemy-encounter-panel__icon" strokeWidth={1.25} />
      </div>
      <div className="enemy-encounter-panel__meta">
        <div className="enemy-encounter-panel__title">{title}</div>
        {subtitle ? (
          <div className="muted" style={{ fontSize: "0.82rem", marginTop: 4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <HealthBar label="Foe essence" value={enemyHp} max={maxEnemyHp} flash={hpFlash === "hit" ? "hit" : undefined} />
    </div>
  );
}

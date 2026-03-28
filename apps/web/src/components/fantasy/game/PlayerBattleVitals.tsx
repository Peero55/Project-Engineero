import { HealthBar } from "@/components/fantasy/ui/HealthBar";
import { XPBar } from "@/components/fantasy/ui/XPBar";

export function PlayerBattleVitals({
  playerHp,
  maxPlayerHp,
  xp,
  xpToNextLevel,
  hpFlash,
  xpFlash,
}: {
  playerHp: number;
  maxPlayerHp: number;
  xp: number;
  xpToNextLevel: number;
  hpFlash?: "damage" | null;
  xpFlash?: "gain" | null;
}) {
  return (
    <div className="player-battle-vitals">
      <div className="player-battle-vitals__label muted">Your stance</div>
      <HealthBar
        label="Your resilience"
        value={playerHp}
        max={maxPlayerHp}
        flash={hpFlash === "damage" ? "damage" : undefined}
      />
      <XPBar value={xp} max={xpToNextLevel} flash={xpFlash === "gain" ? "gain" : undefined} />
    </div>
  );
}

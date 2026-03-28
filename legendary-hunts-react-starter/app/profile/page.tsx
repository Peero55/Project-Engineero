import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { player, strongTopics, weakTopics } from '@/lib/data';

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Player-facing mastery summary. Keep it simple first; richer analytics can come later." />
      <div className="grid grid-2">
        <Panel title={player.name} subtitle={`Level ${player.level} · ${player.xp} XP`}>
          <div className="list">
            <div className="list-item"><strong>HP</strong>{player.hp} / {player.maxHp}</div>
            <div className="list-item"><strong>Daily streak</strong>{player.dailyStreak} days</div>
            <div className="list-item"><strong>Current hunt</strong>{player.currentHunt}</div>
          </div>
        </Panel>
        <Panel title="Mastery balance" subtitle="The agent should treat this as summary UI, not the full analytics engine.">
          <div className="list">
            <div className="list-item"><strong>Strong topics</strong>{strongTopics.join(', ')}</div>
            <div className="list-item"><strong>Weak topics</strong>{weakTopics.join(', ')}</div>
            <div className="list-item"><strong>Readiness</strong><ProgressBar value={82} /></div>
          </div>
        </Panel>
      </div>
    </>
  );
}

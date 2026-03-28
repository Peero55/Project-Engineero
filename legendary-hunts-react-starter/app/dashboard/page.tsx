import { PageHeader } from '@/components/layout/PageHeader';
import { PlayerInfoBar } from '@/components/layout/PlayerInfoBar';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { MasteryDashboard } from '@/components/game/MasteryDashboard';
import { dashboardStats, hunts, player, strongTopics, weakTopics } from '@/lib/data';

export default function DashboardPage() {
  const skillBars = [
    ...strongTopics.map((topic) => ({ topic, value: 85 + (topic.length % 10) })),
    ...weakTopics.map((topic) => ({ topic, value: 32 + (topic.length % 8) })),
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Slack drives the daily ritual. The web app holds the living hunt world."
        right={<Badge>Current hunt · {player.currentHunt}</Badge>}
      />

      <div className="screen-shell__header" style={{ marginBottom: 20 }}>
        <PlayerInfoBar
          name={player.name}
          level={player.level}
          hp={player.hp}
          maxHp={player.maxHp}
          xpLabel={`${player.xp} XP`}
        />
      </div>

      <div className="hero">
        <h3>Train like you play.</h3>
        <p>
          Legendary Hunts turns certification prep into a fantasy campaign where small
          encounters build wisdom, mini-bosses validate concept clusters, and legendary
          hunts signal true domain readiness.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginTop: 20 }}>
        {dashboardStats.map((stat) => (
          <div className="kpi" key={stat.label}>
            <div className="label">{stat.label}</div>
            <div className="value">{stat.value}</div>
          </div>
        ))}
      </div>

      <MasteryDashboard
        playerSlot={
          <p className="muted" style={{ marginBottom: 12 }}>
            Readiness snapshot — deeper graphs come after live telemetry.
          </p>
        }
        skills={skillBars}
        weakAreas={
          <div className="list">
            {weakTopics.map((topic) => (
              <div className="list-item" key={topic}>
                {topic}
              </div>
            ))}
          </div>
        }
        rewards={<p className="muted">Trophy hooks land with progression phase.</p>}
      />

      <div style={{ marginTop: 24 }}>
        <Panel variant="dashboard" title="Active hunts" subtitle="The build-ready MVP loop">
          <div className="list">
            {hunts.map((hunt) => (
              <div className="list-item" key={hunt.id}>
                <strong>{hunt.title}</strong>
                <div className="muted">{hunt.domain}</div>
                <p style={{ margin: '10px 0 12px' }}>{hunt.description}</p>
                <ProgressBar value={hunt.progress} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

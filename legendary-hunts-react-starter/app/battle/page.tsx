import { PageHeader } from '@/components/layout/PageHeader';
import { EncounterScreen } from '@/components/game/EncounterScreen';
import { NpcDialogue } from '@/components/game/NpcDialogue';
import { Panel } from '@/components/ui/Panel';
import { battle, player } from '@/lib/data';
import { StoneButton } from '@/components/ui/Button';

const CORRECT_INDEX = battle.answers.findIndex((a) => a === 'OSPF');

export default function BattlePage() {
  return (
    <>
      <PageHeader title="Battle" description="Encounter screen — embedded UI, not floating HUD." />
      <EncounterScreen
        playerName={player.name}
        playerLevel={player.level}
        playerHp={player.hp}
        playerMaxHp={player.maxHp}
        playerXp={player.xp}
        playerXpMax={2400}
        enemyName={battle.enemy}
        enemyHp={battle.enemyHp}
        enemyMaxHp={battle.enemyMaxHp}
        question={battle.question}
        answers={battle.answers}
        correctIndex={CORRECT_INDEX >= 0 ? CORRECT_INDEX : 1}
        lockedAttacks={['ultimate']}
        questionLabel={`Question ${battle.questionIndex} / ${battle.totalQuestions}`}
      />
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Panel title="Trophy clue" variant="dashboard">
          <p>{battle.trophyHint}</p>
        </Panel>
        <Panel title="Mentor hint" variant="dashboard">
          <p>{battle.mentorHint}</p>
        </Panel>
      </div>
      <div style={{ marginTop: 24 }}>
        <NpcDialogue
          npc="Mentor Naya"
          text={
            <>
              <p>
                OSPF is a link-state routing protocol. Each router builds a full map of the realm and
                runs shortest-path first to choose the true route.
              </p>
              <p className="muted">
                In the MVP, this layer receives learners from Slack after a quick daily question or a
                missed strike in battle.
              </p>
            </>
          }
          explainAction={<StoneButton type="light">Open full codex entry</StoneButton>}
        />
      </div>
    </>
  );
}

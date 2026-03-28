"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BattleEncounterPresentation,
  BattlePlayerView,
  BattleSessionView,
} from "@legendary-hunts/core";
import { ATTACK_BY_TIER, GAME_CONFIG, xpForLevel } from "@legendary-hunts/config";
import { PlayerInfoBar } from "@/components/fantasy/layout/PlayerInfoBar";
import { Panel } from "@/components/fantasy/ui/Panel";
import { StoneButton, type StoneButtonType } from "@/components/fantasy/ui/Button";
import { AttackBar } from "@/components/fantasy/game/AttackBar";
import { EncounterScreen } from "@/components/fantasy/game/EncounterScreen";
import { EnemyEncounterPanel } from "@/components/fantasy/game/EnemyEncounterPanel";
import { PlayerBattleVitals } from "@/components/fantasy/game/PlayerBattleVitals";
import { QuestionPanel } from "@/components/fantasy/game/QuestionPanel";
import { Feedback, FeedbackLayer } from "@/components/fantasy/game/FeedbackLayer";

const STONE_ORDER: StoneButtonType[] = ["light", "medium", "heavy", "ultimate"];

type View = {
  session: BattleSessionView;
  encounters: BattleEncounterPresentation[];
  activeEncounter: BattleEncounterPresentation | null;
  player: BattlePlayerView | null;
};

type StrikeFeedback = {
  correct: boolean;
  timedOut: boolean;
  damageDealt: number;
  damageTaken: number;
  explanation?: string;
  xpGained?: number;
  topicSlug?: string;
  domainSlug?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lockedStrikesForTier(tier: number | undefined): StoneButtonType[] {
  if (tier === undefined || tier < 1 || tier > 4) return [...STONE_ORDER];
  const allowed = ATTACK_BY_TIER[tier as 1 | 2 | 3 | 4];
  return STONE_ORDER.filter((s) => s !== allowed);
}

function formatBattleTypeLabel(t: string): string {
  return t.replace(/_/g, " ");
}

function formatTopicSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  return slug.replace(/-/g, " ");
}

export function BattleClient({
  battleId,
  slackUserId,
  initial,
}: {
  battleId: string;
  slackUserId: string;
  initial: View;
}) {
  const [view, setView] = useState<View>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);
  const [puzzleOrder, setPuzzleOrder] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<StrikeFeedback | null>(null);
  const [questionFlash, setQuestionFlash] = useState<"correct" | "incorrect" | null>(null);
  const [enemyHpFlash, setEnemyHpFlash] = useState<"hit" | null>(null);
  const [playerHpFlash, setPlayerHpFlash] = useState<"damage" | null>(null);
  const [xpBarFlash, setXpBarFlash] = useState<"gain" | null>(null);

  const session = view.session;
  const active = view.activeEncounter;
  const player = view.player;
  const timeoutMs = GAME_CONFIG.timeoutSeconds * 1000;

  const deadline = useMemo(() => {
    if (!active?.startedAt) return null;
    return new Date(active.startedAt).getTime() + timeoutMs;
  }, [active?.startedAt, timeoutMs]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (!questionFlash) return;
    const t = setTimeout(() => setQuestionFlash(null), 1400);
    return () => clearTimeout(t);
  }, [questionFlash]);

  useEffect(() => {
    if (!feedback) {
      setEnemyHpFlash(null);
      setPlayerHpFlash(null);
      setXpBarFlash(null);
      return;
    }
    if (feedback.damageDealt > 0 && feedback.correct) setEnemyHpFlash("hit");
    if (feedback.damageTaken > 0) setPlayerHpFlash("damage");
    if (feedback.xpGained != null && feedback.xpGained > 0) setXpBarFlash("gain");
    const t = setTimeout(() => {
      setEnemyHpFlash(null);
      setPlayerHpFlash(null);
      setXpBarFlash(null);
    }, 850);
    return () => clearTimeout(t);
  }, [feedback]);

  const secondsLeft =
    deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));

  const labels = useMemo(() => {
    if (active?.encounterType !== "puzzle_step" || !active.puzzle) return null;
    const raw = active.puzzle.payload.labels;
    if (!raw || typeof raw !== "object") return null;
    return raw as Record<string, string>;
  }, [active]);

  useEffect(() => {
    if (!labels) {
      setPuzzleOrder([]);
      return;
    }
    const keys = Object.keys(labels).sort((a, b) => Number(a) - Number(b));
    setPuzzleOrder(shuffle(keys));
  }, [labels, active?.id]);

  const refresh = useCallback(async () => {
    const res = await fetch(
      `/api/battle/${battleId}?slackUserId=${encodeURIComponent(slackUserId)}`
    );
    if (!res.ok) return;
    const data = (await res.json()) as View;
    setView(data);
    setPickedOptionId(null);
  }, [battleId, slackUserId]);

  const postAnswer = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/battle/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackUserId,
          battleId,
          ...body,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        correct?: boolean;
        timedOut?: boolean;
        damageDealt?: number;
        damageTaken?: number;
        explanation?: string;
        progression?: { xpGained: number } | null;
        activeEncounter?: BattleEncounterPresentation | null;
      };
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        return;
      }

      if (
        typeof json.correct === "boolean" &&
        typeof json.damageDealt === "number" &&
        typeof json.damageTaken === "number"
      ) {
        setFeedback({
          correct: json.correct,
          timedOut: Boolean(json.timedOut),
          damageDealt: json.damageDealt,
          damageTaken: json.damageTaken,
          explanation: json.explanation,
          xpGained: json.progression?.xpGained,
          topicSlug: active?.topicSlug,
          domainSlug: active?.domainSlug,
        });
        if (body.encounterId === active?.id && active?.encounterType === "question") {
          setQuestionFlash(json.correct ? "correct" : "incorrect");
        }
      }

      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!active || active.encounterType !== "question" || !active.question) return;
    const started = active.startedAt ? new Date(active.startedAt).getTime() : now;
    const responseMs = Math.max(0, now - started);
    if (!pickedOptionId) return;
    await postAnswer({
      encounterId: active.id,
      questionId: active.question.id,
      selectedOptionIds: [pickedOptionId],
      responseMs,
    });
  };

  const onStrike = (tier: StoneButtonType) => {
    if (!active || active.encounterType !== "question") return;
    if (!pickedOptionId) {
      setError("Choose an answer first.");
      return;
    }
    const t = active.difficultyTier;
    if (t === undefined || t < 1 || t > 4) return;
    const expected = ATTACK_BY_TIER[t as 1 | 2 | 3 | 4];
    if (tier !== expected) return;
    void submitQuestion();
  };

  const submitPuzzle = async () => {
    if (!active || active.encounterType !== "puzzle_step") return;
    const started = active.startedAt ? new Date(active.startedAt).getTime() : now;
    const responseMs = Math.max(0, now - started);
    await postAnswer({
      encounterId: active.id,
      puzzlePayload: { order: puzzleOrder },
      responseMs,
    });
  };

  const doPause = async () => {
    setLoading(true);
    await fetch("/api/battle/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slackUserId, battleId }),
    });
    await refresh();
    setLoading(false);
  };

  const doResume = async () => {
    setLoading(true);
    await fetch("/api/battle/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slackUserId, battleId }),
    });
    await refresh();
    setLoading(false);
  };

  const movePuzzle = (index: number, dir: -1 | 1) => {
    setPuzzleOrder((prev) => {
      const next = [...prev];
      const t = index + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  };

  const maxPlayer = GAME_CONFIG.maxPlayerHp;
  const maxFoe = GAME_CONFIG.maxEnemyHp;

  const strikeLocked = active ? lockedStrikesForTier(active.difficultyTier) : [...STONE_ORDER];

  const slackQ = `slack_user_id=${encodeURIComponent(slackUserId)}`;

  const playerLevel = player?.level ?? 1;
  const playerXp = player?.xp ?? 0;
  const playerXpCap = player?.xpToNextLevel ?? xpForLevel(playerLevel);

  if (session.status === "won" || session.status === "lost") {
    return (
      <Panel variant="battle" title={session.status === "won" ? "Victory" : "Defeat"} glow>
        <p className="muted" style={{ margin: 0 }}>
          {session.status === "won"
            ? "You cleared this battle."
            : "The encounter ends here. Rest and return when ready."}
        </p>
        <Link href={`/hunts?${slackQ}`} className="fantasy-stone-link">
          ← Back to hunts
        </Link>
      </Panel>
    );
  }

  if (session.status === "paused" || session.pausedAt) {
    return (
      <Panel variant="dashboard" title="Paused" subtitle="No time limit while you step away">
        <p className="muted">Take your time; the encounter waits.</p>
        <StoneButton
          type="medium"
          disabled={loading}
          onClick={() => void doResume()}
          className="mt-4 w-full max-w-xs"
        >
          Resume
        </StoneButton>
      </Panel>
    );
  }

  if (!active) {
    return (
      <p className="muted">
        No active encounter.{" "}
        <button type="button" className="underline" onClick={() => void refresh()}>
          Refresh
        </button>
      </p>
    );
  }

  const questionHint =
    active.encounterType === "question" && !pickedOptionId ? (
      <p className="muted" style={{ marginTop: 14, fontSize: "0.85rem" }}>
        Choose an answer, then strike with the matching tier.
      </p>
    ) : null;

  return (
    <EncounterScreen
      header={
        <PlayerInfoBar
          name={player?.displayName ?? "Traveler"}
          level={playerLevel}
          hp={session.playerHP}
          maxHp={maxPlayer}
          xpLabel={player ? `${playerXp} / ${playerXpCap} XP` : undefined}
        />
      }
      duelRow={
        <>
          <EnemyEncounterPanel
            enemyHp={session.enemyHP}
            maxEnemyHp={maxFoe}
            subtitle={formatTopicSlug(active.topicSlug)}
            hpFlash={enemyHpFlash}
          />
          <PlayerBattleVitals
            playerHp={session.playerHP}
            maxPlayerHp={maxPlayer}
            xp={playerXp}
            xpToNextLevel={playerXpCap}
            hpFlash={playerHpFlash}
            xpFlash={xpBarFlash}
          />
        </>
      }
      panelTitle={formatBattleTypeLabel(session.battleType)}
      panelSubtitle={`Step ${session.questionsAnswered + 1} / ${session.maxQuestions}`}
      panelGlow
      actionBar={
        active.encounterType === "question" ? (
          <div className="action-bar-wrap">
            <p className="action-bar-wrap__label muted">
              Strike — ties difficulty to your swing (answer required first)
            </p>
            <AttackBar locked={strikeLocked} onSelect={(t) => onStrike(t)} />
          </div>
        ) : (
          <div className="action-bar-wrap">
            <p className="action-bar-wrap__label muted">Riddle step — reorder, then submit above.</p>
            <AttackBar locked={[...STONE_ORDER]} />
          </div>
        )
      }
      feedback={
        <FeedbackLayer>
          {feedback?.correct ? (
            <Feedback
              type="correct"
              value={
                feedback.damageDealt > 0
                  ? `True strike · ${feedback.damageDealt} pressure`
                  : "True strike"
              }
            />
          ) : null}
          {feedback && !feedback.correct ? (
            <Feedback type="failure" value={feedback.timedOut ? "Time slipped away" : "Glancing miss"} />
          ) : null}
          {feedback && feedback.damageTaken > 0 ? (
            <Feedback type="damage" value={`−${feedback.damageTaken} resilience`} />
          ) : null}
          {feedback && feedback.xpGained != null && feedback.xpGained > 0 ? (
            <Feedback type="xp" value={`+${feedback.xpGained} progression`} />
          ) : null}
          {feedback?.explanation ? (
            <div className="feedback-explanation" role="note">
              {feedback.explanation.slice(0, 320)}
            </div>
          ) : null}
          {feedback && !feedback.correct && feedback.topicSlug && feedback.domainSlug ? (
            <Link
              href={`/explanations/${feedback.domainSlug}/${feedback.topicSlug}?${slackQ}`}
              className="fantasy-stone-link"
            >
              Open study page
            </Link>
          ) : null}
          {feedback && !feedback.correct && feedback.topicSlug && !feedback.domainSlug ? (
            <Link href={`/codex?${slackQ}`} className="fantasy-stone-link">
              Browse codex
            </Link>
          ) : null}
        </FeedbackLayer>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {secondsLeft !== null ? (
          <span
            className="muted"
            style={{
              fontVariantNumeric: "tabular-nums",
              color: secondsLeft <= 5 ? "var(--danger)" : undefined,
            }}
          >
            {secondsLeft}s
          </span>
        ) : null}
        <button
          type="button"
          className="fantasy-puzzle-actions"
          style={{ border: "none", background: "transparent", padding: 0 }}
          disabled={loading}
          onClick={() => void doPause()}
        >
          <span className="muted" style={{ textDecoration: "underline", cursor: "pointer" }}>
            Pause
          </span>
        </button>
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid rgba(255,98,98,0.35)",
            background: "rgba(40,20,22,0.5)",
            padding: "10px 12px",
            borderRadius: 12,
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      ) : null}

      {active.encounterType === "question" && active.question && (
        <QuestionPanel
          flash={questionFlash}
          prompt={active.question.prompt}
          options={active.options ?? []}
          loading={loading}
          pickedOptionId={pickedOptionId}
          onPickOption={(id) => {
            setError(null);
            setPickedOptionId(id);
          }}
          footerHint={questionHint}
        />
      )}

      {active.encounterType === "puzzle_step" && active.puzzle && labels && (
        <div className="question-card">
          <h3 className="question-card__prompt">{active.puzzle.title}</h3>
          <p className="muted" style={{ fontSize: "0.88rem" }}>
            Put layers in order (1 = Physical … 7 = Application).
          </p>
          <ol style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
            {puzzleOrder.map((key, i) => (
              <li key={`${key}-${i}`} className="fantasy-puzzle-row">
                <span>
                  {key}. {labels[key] ?? key}
                </span>
                <span className="fantasy-puzzle-actions">
                  <button type="button" disabled={loading} onClick={() => movePuzzle(i, -1)}>
                    Up
                  </button>
                  <button type="button" disabled={loading} onClick={() => movePuzzle(i, 1)}>
                    Down
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <StoneButton
            type="heavy"
            className="mt-4 w-full max-w-xs"
            disabled={loading}
            onClick={() => void submitPuzzle()}
          >
            Submit order
          </StoneButton>
        </div>
      )}
    </EncounterScreen>
  );
}

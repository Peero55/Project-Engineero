/**
 * Mock Battle Simulation — uses the ACTUAL in-place systems:
 *   - @legendary-hunts/config  → GAME_CONFIG, DAMAGE_BY_DIFFICULTY, ATTACK_BY_TIER, pickEncounterStepCount
 *   - @legendary-hunts/core    → getQuestion, submitAnswer, processEncounterResolution,
 *                                 generateAndInsertEncounters, fetchEncountersForBattleStart, applyProgression
 *
 * Creates a real user, real battle_session, real encounters in the local DB,
 * then plays through the battle using the production code paths.
 *
 * Usage: npx tsx scripts/mock-battle.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  GAME_CONFIG,
  DAMAGE_BY_DIFFICULTY,
  ATTACK_BY_TIER,
  pickEncounterStepCount,
} from "@legendary-hunts/config";
import {
  submitAnswer,
  processEncounterResolution,
  generateAndInsertEncounters,
  fetchEncountersForBattleStart,
  applyProgression,
} from "@legendary-hunts/core";

// ── Supabase client (local, service role bypasses RLS) ─────────────
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CERT_ID = "11111111-1111-4111-8111-111111111101"; // Network+

// ── Display helpers ─────────────────────────────────────────────────

const ATTACK_LABELS: Record<string, string> = {
  light: "⚡ Light",
  medium: "🔥 Medium",
  heavy: "💥 Heavy",
  ultimate: "☠️ Ultimate",
};

function bar(current: number, max: number, width = 20): string {
  const filled = Math.round((current / max) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${current}/${max}`;
}

function divider(): void {
  console.log("─".repeat(70));
}

// ── Create a mock test user in the DB ──────────────────────────────
async function ensureMockUser(): Promise<string> {
  const MOCK_SLACK_ID = "MOCK_BATTLE_TEST_USER";
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("slack_user_id", MOCK_SLACK_ID)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: user } = await supabase
    .from("users")
    .insert({ slack_user_id: MOCK_SLACK_ID, email: "mock-battle@test.local" })
    .select("id")
    .single();

  if (!user) throw new Error("Failed to create mock user");

  await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: "Mock Hunter",
    level: 1,
    xp: 0,
    current_hp: 100,
    max_hp: 100,
  });

  return user.id;
}

// ── Create a battle session row ────────────────────────────────────
async function createBattleSession(
  userId: string,
  stepCount: number,
): Promise<string> {
  const { data: session, error } = await supabase
    .from("battle_sessions")
    .insert({
      user_id: userId,
      battle_type: "normal",
      max_questions: stepCount,
      player_hp_start: GAME_CONFIG.maxPlayerHp,
      player_hp_current: GAME_CONFIG.maxPlayerHp,
      enemy_hp_start: GAME_CONFIG.maxEnemyHp,
      enemy_hp_current: GAME_CONFIG.maxEnemyHp,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !session)
    throw new Error(`Failed to create battle session: ${error?.message}`);
  return session.id;
}

// ── Main battle simulation using real systems ──────────────────────
async function runBattle(): Promise<void> {
  console.log("\n");
  console.log(
    "╔══════════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║         ⚔️  LEGENDARY HUNTS — MOCK BATTLE (REAL ENGINE) ⚔️          ║",
  );
  console.log(
    "║         CompTIA Network+ (N10-008)                                  ║",
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════════╝",
  );
  console.log("");

  // Step 1: Ensure mock user exists
  const userId = await ensureMockUser();
  console.log(`  👤 Mock user: ${userId}`);

  // Step 2: Pick encounter count using real config
  const stepCount = pickEncounterStepCount("normal");
  console.log(`  📋 Encounter count (pickEncounterStepCount): ${stepCount}`);
  console.log(
    `  ❤️  Player HP: ${GAME_CONFIG.maxPlayerHp}  |  🐉 Enemy HP: ${GAME_CONFIG.maxEnemyHp}`,
  );
  console.log("");

  // Step 3: Create battle session in DB
  const battleId = await createBattleSession(userId, stepCount);
  console.log(`  🗡️  Battle session created: ${battleId}`);

  // Step 4: Generate encounters using real encounter-sequence engine
  console.log(
    `  ⚙️  Generating encounters via generateAndInsertEncounters()...`,
  );
  const genResult = await generateAndInsertEncounters(supabase, {
    battleSessionId: battleId,
    userId,
    battleType: "normal",
    certificationId: CERT_ID,
    targetStepCount: stepCount,
  });

  if (!genResult.ok) {
    console.log(
      `  ❌ Encounter generation failed: ${"message" in genResult ? genResult.message : "unknown"}`,
    );
    process.exit(1);
  }
  console.log(`  ✅ Generated ${genResult.count} encounters`);

  // Step 5: Fetch encounters for display using real fetch function
  const encounters = await fetchEncountersForBattleStart(
    supabase,
    battleId,
    userId,
  );
  console.log(`  📦 Fetched ${encounters.length} encounters for battle start`);
  console.log("");
  divider();

  // Load topic names for display
  const { data: topics } = await supabase.from("topics").select("id, name");
  const topicMap = new Map(
    (topics ?? []).map((t: { id: string; name: string }) => [t.id, t.name]),
  );

  // Step 6: Play through each encounter using real engine
  const progressionResults: Array<{
    correct: boolean;
    difficulty: number;
    questionId: string;
    timesSeenBefore: number;
  }> = [];

  for (let i = 0; i < encounters.length; i++) {
    const enc = encounters[i];

    // Refresh battle state from DB
    const { data: battleState } = await supabase
      .from("battle_sessions")
      .select("player_hp_current, enemy_hp_current, status")
      .eq("id", battleId)
      .single();

    if (!battleState || battleState.status !== "active") {
      console.log(`\n  🏁 Battle ended early (status: ${battleState?.status})`);
      break;
    }

    if (enc.encounterType === "puzzle_step") {
      const puzzleCorrect = Math.random() < 0.6;
      const puzzleDmgDealt = puzzleCorrect ? 20 : 0;
      const puzzleDmgTaken = puzzleCorrect ? 0 : 25;

      console.log(`\n  ┌─ ENCOUNTER ${i + 1}/${encounters.length} ─ 🧩 Puzzle`);
      console.log(`  │  Title: ${enc.puzzle?.title ?? "unknown"}`);
      console.log(`  │  Layout: ${enc.puzzle?.layoutKind ?? "unknown"}`);

      const puzzleSnap = await processEncounterResolution(
        supabase,
        battleId,
        userId,
        enc.id,
        {
          correct: puzzleCorrect,
          damageDealt: puzzleDmgDealt,
          damageTaken: puzzleDmgTaken,
        },
      );

      if (puzzleSnap) {
        if (puzzleCorrect) {
          console.log(`  │  ✅ Puzzle solved! Dealt ${puzzleDmgDealt} damage.`);
        } else {
          console.log(`  │  ❌ Puzzle failed! Took ${puzzleDmgTaken} damage.`);
        }
        console.log(
          `  │  🧙 Player HP:  ${bar(puzzleSnap.playerHP, GAME_CONFIG.maxPlayerHp)}`,
        );
        console.log(
          `  │  🐉 Enemy HP:   ${bar(puzzleSnap.enemyHP, GAME_CONFIG.maxEnemyHp)}`,
        );
        console.log(
          `  │  📈 Battle: ${puzzleSnap.questionsAnswered}/${puzzleSnap.maxQuestions} — state: ${puzzleSnap.battleState}`,
        );

        progressionResults.push({
          correct: puzzleCorrect,
          difficulty: enc.difficultyTier ?? 2,
          questionId: enc.puzzle?.id ?? "puzzle",
          timesSeenBefore: 0,
        });

        if (puzzleSnap.battleState !== "active") {
          console.log(`  └${"─".repeat(65)}`);
          break;
        }
      }
      console.log(`  └${"─".repeat(65)}`);
      continue;
    }

    if (!enc.question || !enc.options) continue;

    const tier = enc.difficultyTier ?? 2;
    const attackType = ATTACK_BY_TIER[tier as 1 | 2 | 3 | 4] ?? "medium";
    const attackLabel = ATTACK_LABELS[attackType] ?? attackType;

    console.log("");
    console.log(
      `  ┌─ ENCOUNTER ${i + 1}/${encounters.length} ─ Tier ${tier} ─ ${attackLabel}`,
    );
    console.log(
      `  │  Topic: ${enc.topicSlug ?? "unknown"}  |  Domain: ${enc.domainSlug ?? "unknown"}`,
    );
    console.log(`  │`);
    console.log(`  │  ${enc.question.prompt}`);
    console.log(`  │`);

    for (const opt of enc.options) {
      console.log(`  │    ${opt.label}) ${opt.text}`);
    }

    // Fetch correct answer IDs (stripped from client presentation)
    const { data: correctAnswers } = await supabase
      .from("answer_options")
      .select("id, label, option_text")
      .eq("question_id", enc.question.id)
      .eq("is_correct", true);

    const correctIds = (correctAnswers ?? []).map((a: { id: string }) => a.id);
    const isCorrect = Math.random() < 0.7;
    const selectedId = isCorrect
      ? correctIds[0]
      : (enc.options.find((o) => !correctIds.includes(o.id))?.id ??
        enc.options[0].id);

    const selectedOpt =
      enc.options.find((o) => o.id === selectedId) ?? enc.options[0];
    const responseMs = Math.floor(2000 + Math.random() * 8000);

    console.log(`  │`);
    console.log(`  │  ⏱️  Response: ${(responseMs / 1000).toFixed(1)}s`);
    console.log(`  │  🎯 Selected: ${selectedOpt.label}) ${selectedOpt.text}`);

    // Use REAL submitAnswer() from packages/core
    const answerResult = await submitAnswer(supabase, {
      userId,
      questionId: enc.question.id,
      selectedOptionIds: [selectedId],
      responseMs,
    });

    if (!answerResult) {
      console.log(`  │  ⚠️  submitAnswer returned null — skipping`);
      continue;
    }

    console.log(`  │`);
    if (answerResult.correct) {
      console.log(
        `  │  ✅ CORRECT! ${attackLabel} hits for ${answerResult.damageDealt} damage!`,
      );
      console.log(
        `  │     (DAMAGE_BY_DIFFICULTY[${tier}] = ${DAMAGE_BY_DIFFICULTY[tier]})`,
      );
    } else {
      console.log(
        `  │  ❌ WRONG! Enemy strikes back for ${answerResult.damageTaken} damage!`,
      );
      console.log(`  │  📖 ${answerResult.explanation}`);
    }
    console.log(
      `  │  📊 Stats: topic=${answerResult.updatedStats.topicId.slice(0, 8)}… correct=${answerResult.updatedStats.correctCount} incorrect=${answerResult.updatedStats.incorrectCount} avgMs=${answerResult.updatedStats.avgTimeMs}`,
    );

    // Use REAL processEncounterResolution() from packages/core
    const snapshot = await processEncounterResolution(
      supabase,
      battleId,
      userId,
      enc.id,
      {
        correct: answerResult.correct,
        damageDealt: answerResult.damageDealt,
        damageTaken: answerResult.damageTaken,
      },
    );

    if (snapshot) {
      console.log(`  │`);
      console.log(
        `  │  🧙 Player HP:  ${bar(snapshot.playerHP, GAME_CONFIG.maxPlayerHp)}`,
      );
      console.log(
        `  │  🐉 Enemy HP:   ${bar(snapshot.enemyHP, GAME_CONFIG.maxEnemyHp)}`,
      );
      console.log(
        `  │  📈 Battle: ${snapshot.questionsAnswered}/${snapshot.maxQuestions} answered — state: ${snapshot.battleState}`,
      );

      progressionResults.push({
        correct: answerResult.correct,
        difficulty: tier,
        questionId: enc.question.id,
        timesSeenBefore: 0,
      });

      if (snapshot.battleState !== "active") {
        console.log(`  └${"─".repeat(65)}`);
        break;
      }
    }

    console.log(`  └${"─".repeat(65)}`);
  }

  // Step 7: Apply progression using REAL applyProgression()
  if (progressionResults.length > 0) {
    const progression = await applyProgression(
      supabase,
      userId,
      progressionResults,
    );
    console.log("");
    divider();
    console.log("");
    console.log(`  📈 PROGRESSION (via applyProgression()):`);
    console.log(
      `     Level: ${progression.level}  |  XP: ${progression.xp}  |  XP gained: ${progression.xpGained}`,
    );
  }

  // Step 8: Final battle state from DB
  const { data: finalBattle } = await supabase
    .from("battle_sessions")
    .select(
      "status, player_hp_current, enemy_hp_current, questions_answered, max_questions",
    )
    .eq("id", battleId)
    .single();

  console.log("");
  divider();
  console.log("");

  const status = finalBattle?.status ?? "unknown";
  const outcome =
    status === "won"
      ? "🏆 VICTORY! The enemy has been defeated!"
      : status === "lost"
        ? "💀 DEFEAT! You have fallen in battle."
        : `⚠️ Battle ended with status: ${status}`;

  console.log(`  ${outcome}`);
  console.log("");
  console.log(
    "  ┌─ BATTLE SUMMARY (from DB) ───────────────────────────────────",
  );
  console.log(`  │  Battle ID:         ${battleId}`);
  console.log(`  │  Status:            ${finalBattle?.status}`);
  console.log(
    `  │  Questions answered: ${finalBattle?.questions_answered}/${finalBattle?.max_questions}`,
  );
  console.log(
    `  │  Final Player HP:   ${finalBattle?.player_hp_current}/${GAME_CONFIG.maxPlayerHp}`,
  );
  console.log(
    `  │  Final Enemy HP:    ${finalBattle?.enemy_hp_current}/${GAME_CONFIG.maxEnemyHp}`,
  );
  console.log(
    `  │  Correct answers:   ${progressionResults.filter((r) => r.correct).length}/${progressionResults.length}`,
  );
  console.log(
    `  └──────────────────────────────────────────────────────────────`,
  );

  // Show encounter rows from DB
  const { data: encRows } = await supabase
    .from("battle_encounters")
    .select(
      "sequence_index, encounter_type, status, was_correct, damage_dealt, damage_taken",
    )
    .eq("battle_session_id", battleId)
    .order("sequence_index");

  if (encRows && encRows.length > 0) {
    console.log("");
    console.log(
      "  ┌─ ENCOUNTER LOG (from battle_encounters table) ──────────────",
    );
    for (const row of encRows) {
      const icon =
        row.status === "completed" ? (row.was_correct ? "✅" : "❌") : "⏳";
      console.log(
        `  │  #${row.sequence_index} ${icon} ${row.encounter_type.padEnd(12)} status=${row.status.padEnd(9)} dmgDealt=${row.damage_dealt ?? "-"} dmgTaken=${row.damage_taken ?? "-"}`,
      );
    }
    console.log(
      `  └──────────────────────────────────────────────────────────────`,
    );
  }

  // Show user_stats written by submitAnswer
  const { data: stats } = await supabase
    .from("user_stats")
    .select("topic_id, correct_count, incorrect_count, total_response_ms")
    .eq("user_id", userId);

  if (stats && stats.length > 0) {
    console.log("");
    console.log(
      "  ┌─ USER STATS (from user_stats table) ────────────────────────",
    );
    for (const s of stats) {
      const tName = topicMap.get(s.topic_id) ?? s.topic_id.slice(0, 8);
      const total = s.correct_count + s.incorrect_count;
      const avg = total > 0 ? Math.round(s.total_response_ms / total) : 0;
      console.log(
        `  │  ${tName.padEnd(25)} correct=${s.correct_count} incorrect=${s.incorrect_count} avgMs=${avg}`,
      );
    }
    console.log(
      `  └──────────────────────────────────────────────────────────────`,
    );
  }

  console.log("");
}

runBattle().catch((err) => {
  console.error("Battle simulation failed:", err);
  process.exit(1);
});

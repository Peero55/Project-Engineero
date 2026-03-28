# Phase 2: Core Engine Implementation — Compliance Checklist

## 1. DATABASE MODELS ✅

| Spec | Implementation |
|------|----------------|
| users: id, slack_id, level, xp, current_hp, max_hp | `users` + `profiles` (profiles has level, xp, current_hp, max_hp) |
| questions: id, text, answers, correct_answer, explanation, difficulty 1-5, topic, certification | `questions` (prompt, short_explanation, difficulty_tier 1-4) + `answer_options` |
| user_stats: user_id, topic, correct_count, incorrect_count, avg_time | `user_stats` (topic_id, correct_count, incorrect_count, total_response_ms → avg) |
| battles: id, user_id, enemy_type, enemy_hp, current_hp, state | `battle_sessions` (enemy_hp_start, enemy_hp_current, player_hp_current, status) |
| battle_logs: battle_id, question_id, correct, damage, timestamp | `battle_turns` |

**Migration:** `004_phase2_engine.sql` adds `user_stats`, battle columns.

---

## 2. QUESTION ENGINE ✅

| Spec | Implementation |
|------|----------------|
| getQuestion(user, difficulty, topic) | `packages/core/src/question-engine.ts` |
| Avoid repeating recent questions | Uses `user_question_history` last 20 |
| Weight toward weak topics | Uses `user_stats` correct/incorrect ratio |
| Return: question, answers, difficulty, explanation | `GetQuestionOutput` |

---

## 3. ANSWER EVALUATION ✅

| Spec | Implementation |
|------|----------------|
| submitAnswer(userId, questionId, answer, responseTime) | `packages/core/src/answer-evaluation.ts` |
| Returns: correct, damageDealt, damageTaken, explanation, updatedStats | `SubmitAnswerOutput` |
| Wrong/no answer = full damage taken | `BASE_DAMAGE_TAKEN` |
| Slower response = more damage taken | `SLOW_PENALTY_PER_SECOND` over 5s |
| Correct = damage dealt based on difficulty | `DAMAGE_BY_DIFFICULTY` |

---

## 4. BATTLE ENGINE ✅

| Spec | Implementation |
|------|----------------|
| processBattleTurn(userId, answerResult) | `packages/core/src/battle-engine.ts` |
| Reduce enemy HP, reduce player HP | Applied in processBattleTurn |
| Determine win/loss | player_hp<=0 → loss; enemy_hp<=0 → win |
| Max 4 questions per battle | `max_questions` from config |
| Battle ends after 4 turns OR HP <= 0 | Enforced in processBattleTurn |
| Returns: battleState, playerHP, enemyHP, result (ongoing|win|loss) | `BattleStateSnapshot` |

---

## 5. PROGRESSION SYSTEM ✅

| Spec | Implementation |
|------|----------------|
| applyProgression(userId, battleResult) | `packages/core/src/progression.ts` |
| XP based on difficulty, correctness, repetition penalty | `XP_BY_DIFFICULTY`, correctness multiplier, `REPETITION_PENALTY` |
| Level scaling exponential | `xpForLevel()` in config |
| Unlock stronger attacks/badges | Placeholder for future |

---

## 6. API ENDPOINTS ✅

| Spec | Implementation |
|------|----------------|
| POST /battle/start | `apps/web/src/app/api/battle/start/route.ts` |
| POST /battle/answer | `apps/web/src/app/api/battle/answer/route.ts` |
| GET /question | `apps/web/src/app/api/question/route.ts` |
| GET /user/profile | `apps/web/src/app/api/user/profile/route.ts` |

All routes are thin wrappers: validate input → call core → return response.

---

## 7. CODE QUALITY RULES ✅

| Rule | Status |
|------|--------|
| TypeScript strict mode | `strict: true` in all tsconfigs |
| Shared types in /packages/types | battle.ts, user.ts, question.ts |
| Logic in /packages/core | question-engine, answer-evaluation, battle-engine, progression |
| No business logic in API routes | Routes only validate, call core, return |
| Pure functions where possible | Damage/XP computation in config; core has minimal side-effect functions |

---

## No UI / No Frontend ✅

- No new UI components
- No frontend interactions
- Backend logic and shared types only

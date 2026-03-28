# System Design: Daily Question System (Phase 3)

**Status:** Architecture definition (pre-implementation)  
**Scope:** First functional flow — daily quiz delivery via team-chat integration  
**Aligned to:** [PHASE0_DESIGN_LOCK.md](PHASE0_DESIGN_LOCK.md), [ALIGNMENT_VARIABLES.md](ALIGNMENT_VARIABLES.md)  
**Task list:** [TASKLIST.md](../TASKLIST.md) Phase 3

---

## 1. System Overview

### What it is

The **Daily Question System** delivers a fixed quota of study questions per user per day through a team-chat integration (Slack first). Users answer in-place via buttons, receive immediate feedback with short explanations, and can optionally deep-link to the web app for full explanations or battles.

### Why it exists

- **Habit formation:** Low-friction, daily touchpoint to build certification study habits
- **Lead-in to web:** Slack = quick study; web app = deeper immersion (per product rules)
- **Platform diversity:** Same engine powers Slack today, Discord/Teams tomorrow via adapters

### Boundaries

- **In scope:** Question delivery, in-chat answer + feedback, deep link, daily quota, delivery tracking
- **Out of scope:** Battles, hunts, XP/progression (Phase 4/6), labs (tier 5), admin content (Phase 5)
- **Not combat:** This is study-only. No HP, damage, or battle sessions.

---

## 2. Core Components

### Layer separation

```
┌─────────────────────────────────────────────────────────────────┐
│  INTEGRATION LAYER (adapter-specific)                            │
│  SlackAdapter: Block Kit, actions, DM, app home                  │
│  Future: DiscordAdapter, TeamsAdapter                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  DAILY QUESTION SERVICE (platform-agnostic)                       │
│  - getNextQuestion(userId, certificationId?)                      │
│  - recordAnswer(userId, questionId, selectedOptionIds, responseMs)│
│  - getDeliveryStatus(userId, date)                               │
│  - canReceiveQuestion(userId, date)                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  CORE ENGINE (existing)                                          │
│  - getQuestion (packages/core)                                   │
│  - submitAnswer (packages/core) — lightweight variant for chat   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  THEME LAYER (future)                                            │
│  - Naming for "XP", "correct", "incorrect"                       │
│  - Narrative templates for feedback messages                     │
└─────────────────────────────────────────────────────────────────┘
```

### Services / modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| **DailyQuestionService** | `packages/core/src/daily-question.ts` | Quota check, question fetch, answer recording, delivery status. Calls getQuestion + submitAnswer. |
| **DeliveryScheduler** | `supabase/functions/daily-quiz-delivery` or external cron | Determines *when* to deliver; invokes delivery for each eligible user. |
| **ChatAdapter** | `apps/slack/src/adapters/` or `apps/slack/src/services/` | Renders question/feedback as platform-specific blocks; handles actions. |
| **DeeplinkService** | `apps/web/src/app/api/slack/deeplink` (existing) | Builds web app URL with platform user ID. |
| **Question engine** | `packages/core` (existing) | getQuestion, submitAnswer. |
| **Theme provider** | Future `packages/theme` | Naming/narrative for feedback. MVP: hardcode "XP", "correct", etc. |

---

## 3. Data Model

### New tables

#### `daily_question_deliveries`

Tracks each question delivered to a user on a given day. One row per delivered question.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | FK users, NOT NULL | Internal user |
| question_id | uuid | FK questions, NOT NULL | |
| delivered_at | timestamptz | NOT NULL, default now() | When the message was sent |
| answered_at | timestamptz | NULL | When user clicked an answer (null = unanswered) |
| platform | text | NOT NULL, check in ('slack','discord','teams') | Delivery channel |
| platform_message_ts | text | NULL | Slack/Discord message timestamp for updates |

Indexes:
- `(user_id, date(delivered_at))` — quota per user per day
- `(user_id, question_id, delivered_at)` — avoid duplicate delivery same day

#### `daily_question_config`

Global/per-certification config for daily delivery. Single row per certification or global default.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| certification_id | uuid | FK certifications, NULL = global | NULL = apply to all certs |
| questions_per_day | int | NOT NULL, default 5 | Quota |
| delivery_timezone | text | default 'UTC' | For "start of day" calculation |
| is_active | boolean | NOT NULL, default true | |

### Existing tables used

| Table | Use |
|-------|-----|
| users, profiles | Identity, slack_user_id |
| user_question_history | Avoid recent repeats (getQuestion already uses this) |
| user_stats | Weak-topic weighting (getQuestion already uses this) |
| questions, answer_options | Content |

### No new columns on existing tables

Identity remains `slack_user_id` for MVP. Future adapter: add `platform_identities` (user_id, platform, platform_user_id).

---

## 4. API Design

### Platform-agnostic (core)

These are internal service functions, not HTTP. Adapters call them.

#### `getNextDailyQuestion(supabase, input)`

**Input:**
```ts
interface GetNextDailyQuestionInput {
  userId: string;
  certificationId?: string | null;
  platform: 'slack' | 'discord' | 'teams';
}
```

**Output:**
```ts
interface GetNextDailyQuestionOutput {
  question: {
    id: string;
    text: string;
    difficulty: number;
    topicId: string;
  };
  answers: Array<{ id: string; label: string; text: string }>;
  explanation?: string; // Never send before answer; used after
}
```

**Behavior:**
- Check `canReceiveQuestion(userId, today)` via `daily_question_deliveries`
- If at quota → return `null`
- Call `getQuestion(supabase, { userId, difficulty: 2, certificationId, includeLabs: false })`
- Insert `daily_question_deliveries` row (delivered_at = now)
- Return question + answers (no isCorrect in payload)

---

#### `recordDailyAnswer(supabase, input)`

**Input:**
```ts
interface RecordDailyAnswerInput {
  userId: string;
  questionId: string;
  selectedOptionIds: string[];
  responseMs: number;
}
```

**Output:**
```ts
interface RecordDailyAnswerOutput {
  correct: boolean;
  explanation: string;
  updatedStats?: { topicId: string; correctCount: number; incorrectCount: number };
}
```

**Behavior:**
- Find `daily_question_deliveries` row: user_id, question_id, date = today, answered_at IS NULL
- If not found → return `null` (already answered or invalid)
- Call `submitAnswer` (core)
- Update `daily_question_deliveries.answered_at = now()`
- Return { correct, explanation, updatedStats }

---

### HTTP (web app, called by adapters)

#### `POST /api/daily-question`

Used by Slack app (or future adapters) to get the next question. Adapter calls this, then renders blocks.

**Request:**
```json
{
  "platformUserId": "U12345",
  "platform": "slack",
  "certificationId": "uuid-or-null"
}
```

**Response 200:**
```json
{
  "question": {
    "id": "uuid",
    "text": "What layer of OSI...",
    "difficulty": 2,
    "topicId": "uuid"
  },
  "answers": [
    { "id": "uuid", "label": "A", "text": "Application" },
    { "id": "uuid", "label": "B", "text": "Transport" }
  ]
}
```

**Response 200 (at quota):**
```json
{
  "atQuota": true,
  "message": "You've completed your 5 questions for today."
}
```

**Response 401:** Unresolved user

---

#### `POST /api/daily-question/answer`

**Request:**
```json
{
  "platformUserId": "U12345",
  "platform": "slack",
  "questionId": "uuid",
  "selectedOptionIds": ["uuid"],
  "responseMs": 4200
}
```

**Response 200:**
```json
{
  "correct": true,
  "explanation": "TCP operates at Layer 4..."
}
```

**Response 400:** Invalid/question already answered  
**Response 401:** Unresolved user

---

### Scheduler (cron / Edge Function)

**Not an HTTP API.** Scheduled job (Supabase cron, Vercel cron, or external) runs at configured times.

**Process:**
1. Query users with `slack_user_id` (or platform_identities) where we have an installation
2. For each user: call `getNextDailyQuestion` — if under quota, deliver via adapter
3. Adapter uses `chat.postMessage` (Slack) to DM or app home
4. No HTTP from scheduler to web app unless we expose an internal endpoint

**Alternative:** On-demand only. No cron. User clicks "Start daily quiz" → we deliver first question. Simpler; no timezone/scheduling. Phase 3 can ship with on-demand first.

---

## 5. Flow

### A. On-demand delivery (user clicks "Start daily quiz")

```
User clicks "Start daily quiz" (Slack)
    │
    ▼
Slack adapter receives action
    │
    ▼
Adapter calls POST /api/daily-question (platformUserId, platform=slack)
    │
    ▼
API resolves platformUserId → userId (getOrCreateUserBySlackId)
    │
    ▼
DailyQuestionService.getNextDailyQuestion(userId, certificationId, 'slack')
    │
    ├─ at quota? → return { atQuota: true }
    │
    └─ under quota?
         │
         ▼
    getQuestion(core) → question + answers
         │
         ▼
    Insert daily_question_deliveries
         │
         ▼
    Return question payload to adapter
         │
         ▼
Adapter renders Block Kit message (question + button per answer)
         │
         ▼
Slack chat.postMessage to user DM (or update app home)
```

### B. Answer flow (user clicks answer button)

```
User clicks answer button (Slack)
    │
    ▼
Slack adapter receives block_actions (action_id = answer_question)
    │
    ▼
Adapter extracts: questionId, selectedOptionIds, responseMs (from action metadata)
    │
    ▼
Adapter calls POST /api/daily-question/answer
    │
    ▼
API resolves platformUserId → userId
    │
    ▼
DailyQuestionService.recordDailyAnswer(userId, questionId, selectedOptionIds, responseMs)
    │
    ▼
submitAnswer(core) → { correct, explanation, updatedStats }
    │
    ▼
Update daily_question_deliveries.answered_at
    │
    ▼
Return { correct, explanation } to adapter
    │
    ▼
Adapter updates message (or posts ephemeral): "Correct! …" or "Incorrect. …" + explanation
    │
    ▼
Optional: "View full explanation" button → deep link to web app
```

### C. Scheduled delivery (future)

```
Cron fires (e.g. 9:00 user local time)
    │
    ▼
For each (user, installation):
    getNextDailyQuestion(userId)
    if question:
        Adapter.sendMessage(userId, renderQuestion(question))
```

---

## 6. Rules / Constraints

| Rule | Rationale |
|------|-----------|
| No HP/damage in daily flow | Daily questions are study-only. Combat is web/battles. |
| Server-side answer validation only | Never trust client. submitAnswer is source of truth. |
| Tier 1–4 only | No labs (tier 5) in daily questions. |
| Quota enforced in DB | `daily_question_deliveries` is source of truth for "questions today". |
| Platform-agnostic service layer | DailyQuestionService accepts `platform`; no Slack types inside. |
| Adapter renders UI | Core returns data. Adapter chooses Block Kit vs Discord embed vs Teams card. |
| Deep link optional | User can continue in Slack only. Deep link is for "learn more". |
| One delivery row per question | Idempotent: same question_id + user_id + date = one row. |

### Modularity guards

- **DO NOT** import Slack types into `packages/core` or `DailyQuestionService`
- **DO NOT** hardcode "Slack" in core; use `platform` enum
- **DO NOT** put Block Kit structure in core; adapter owns it
- **DO NOT** add XP/level updates to daily flow unless Phase 6 specifies it

---

## 7. Edge Cases

| Edge case | Handling |
|-----------|----------|
| User not in DB | getOrCreateUserBySlackId on first interaction. Create profile. |
| No questions in DB | getQuestion returns null. Return friendly "No questions yet" to user. |
| User at quota | Return `{ atQuota: true }`. Adapter shows "Come back tomorrow." |
| Question already answered (double-click) | recordDailyAnswer finds no unanswered delivery → 400. Adapter shows "Already answered." |
| Stale message (question from yesterday) | recordDailyAnswer filters by date. Old message → 400. |
| Empty selectedOptionIds (timeout) | Treat as wrong. Pass empty array; submitAnswer handles it. |
| responseMs not available | Use 0 or omit. submitAnswer uses SLOW_PENALTY logic; 0 is safe. |
| Slack rate limits | Adapter should batch/throttle. Scheduler: stagger user delivery. |
| User uninstalls app | No delivery. Installation store (slack_installations) used for scheduled. |
| Multi-select question | selectedOptionIds is array. submitAnswer already supports. |

---

## 8. Scaling Concerns

| Concern | Mitigation |
|---------|------------|
| Many users at 9am | Stagger scheduled delivery (e.g. 5 users/sec). Or on-demand only. |
| Question pool exhaustion | getQuestion weights weak topics; RECENT_QUESTION_COUNT=20. Monitor. |
| Delivery table growth | Partition or archive by date. Keep recent N days. |
| Adapter code duplication | Shared render helpers (question → blocks) in adapter, not core. |
| Cron reliability | Use Supabase pg_cron or Vercel cron. Add idempotency keys. |

---

## 9. Future Expansion

| Direction | Notes |
|-----------|-------|
| Discord adapter | Same DailyQuestionService. New adapter: Discord embeds, interaction handlers. |
| Teams adapter | Same service. Adaptive Cards, Action.Submit. |
| Scheduled delivery | Add cron + timezone handling. Use daily_question_config. |
| XP for daily answers | Phase 6. Add optional progression call in recordDailyAnswer. |
| Streak tracking | New table `daily_streaks`. Increment when user answers all quota. |
| Theme integration | Swap explanation wrapper with theme narrative. "You got it!" vs "Target acquired." |

---

## 10. Implementation Checklist (for Phase 3)

*Synced with [TASKLIST.md](../TASKLIST.md) Phase 3.*

- [ ] Migration: `daily_question_deliveries`, `daily_question_config`
- [ ] `packages/core/src/daily-question.ts`: getNextDailyQuestion, recordDailyAnswer, canReceiveQuestion
- [ ] API routes: POST /api/daily-question, POST /api/daily-question/answer
- [ ] Slack adapter: render question blocks, handle answer action, call API
- [ ] Update start_daily_quiz action to use real flow
- [ ] Deep link: "View full explanation" → web app with question/topic context
- [ ] Config: questions_per_day default 5, certification_id for Network+

---

*This design precedes implementation. Do not code against undefined contracts.*

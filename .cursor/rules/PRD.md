# Legendary Hunts (Network+ MVP)

> **Implementation alignment:** Technical build decisions are governed by [docs/ALIGNMENT_VARIABLES.md](../../docs/ALIGNMENT_VARIABLES.md), [docs/PHASE0_DESIGN_LOCK.md](../../docs/PHASE0_DESIGN_LOCK.md), [docs/ENCOUNTER_MODEL.md](../../docs/ENCOUNTER_MODEL.md), and [.cursor/rules/alignment.mdc](alignment.mdc). Where this PRD specifies a *technical* approach that differs (e.g. Deno-only Slack, fixed step counts), the alignment docs and `TASKLIST.md` take precedence unless the team explicitly updates the design lock.

A root **`.cursorrules`** file points here and to `.cursor/rules/` (see repository root).
***1. Product Overview & Vision***
Legendary Hunts is a free, internal gamified learning platform that transforms CompTIA Network+ certification study into an interactive RPG experience.
Aesthetic & Theme: Dark Fantasy / Monster Hunter. The UI must feature deep atmospheric palettes, dark mode by default, custom fonts, and beast-hunting motifs where learning milestones are framed as tracking and defeating legendary creatures.
Dual-Surface Architecture: Combines daily habit-building via a Slack App with deep, immersive "monster hunts" on a Next.js Web Application.
***2. Scope & Target Audience***
Target Certification: CompTIA Network+.
Initial Content: 500 hand-reviewed Network+ questions, structured by domain and subtopic.
Focus: MVP focuses strictly on individual progression, but the database schema must be designed with future team/faction scalability in mind (e.g., including team_id or faction_id in user profiles). Monetization is out of scope.
***3. Core Experience Architecture***
Surface A: Slack Integration (The Habit Layer)
Purpose: Daily 5-question flows, weak-topic nudges, and lightweight practice sets.
Tech: Deno Slack SDK utilizing Block Kit interactive elements.
Mechanics: Uses interactive message buttons (action_id and block_id) to present multiple-choice questions. The app will use addBlockActionsHandler to process user answers, evaluate correctness, and instantly update the message block with results.
Surface B: Web Application (The Immersive Layer)
Purpose: Deep study hub featuring hunt boards, player avatars, NPC dialogue, battle screens, and an inventory/codex system.
Encounter Types:
Short Loop: Small creature encounters for quick concept practice yielding XP.
Mid Loop: Mini-boss hunts (10 questions) validating subtopic understanding.
Long Loop: Legendary hunts (20 questions + guided click-through labs) representing domain mastery.
***4. Game Mechanics & Combat***
Combat = Learning: Questions act as attacks (Light, Medium, Heavy, Ultimate) which dictate the difficulty of the question.
Damage System: Correct answers deal damage to the monster and grant XP. Wrong answers deal damage to the player and log weakness data for future remediation.
Defeat Penalty: Full HP loss triggers escalating cooldowns (5 minutes → 15 minutes → 1 hour) before the player can try again.
NPC System: Non-Playable Characters (Concept Mentor, Practice Guide, General Coach, Herald, Lab Master) provide long-form explanations and guided practice directly in the web app.
***5. Technical Stack & Deployment***
Frontend: Next.js, TailwindCSS (configured for the Dark Fantasy aesthetic), deployed on Vercel.
Backend & Database: Supabase (PostgreSQL) handling authentication (Sign in with Slack OIDC), storage, real-time mechanics, and Edge Functions.
AI Integration: AI is restricted to the backend content ingestion pipeline (not live chat). Edge functions will utilize LLMs (e.g., Claude or OpenAI) to generate questions, distractors, and explanations from uploaded study texts.
***6. Database Schema Design (Supabase/PostgreSQL)***   
To ensure scalable progress tracking and analytics, the relational database should be highly normalized. The schema must include:
Users: Stores profile data, XP, level, and a faction_id/team_id for future scaling.
Questions: Stores the question text, domain, subtopic, difficulty, and an is_active flag to selectively display published questions.
Question_Choices: Stores available multiple-choice options with an is_correct_choice boolean to define the right answer.
User_Question_Answers: Logs every attempt a user makes. Must include the user_id, question_id, selected_choice_id, an is_right boolean for fast lookup, and an answer_time timestamp to track historical strengths/weaknesses and calculate mastery.
***7. Step-by-Step Instructions for Cursor AI Agent***

Agent directive: Read this PRD and execute work in repo phases documented in **`TASKLIST.md`** (see **PRD ↔ repository phase map** there). Use Composer or the IDE agent for multi-file work.

**PRD ↔ repository phase map (conceptual)**

| PRD §7 phase | Intent | Repository tracking |
|--------------|--------|---------------------|
| Phase 1 — Init + rules | Next.js, Tailwind, project rules | **Done:** pnpm monorepo `apps/web`, Tailwind; rules in `.cursor/rules/` + root `.cursorrules` pointer |
| Phase 2 — DB | Normalized schema, RLS | **Done:** Supabase migrations (`supabase/migrations/`), RLS on user-owned tables |
| Phase 3 — AI content pipeline | Edge Functions for ingestion / generation | **TASKLIST Phase 5** — admin + import + Edge Functions (`import-questions`, etc.); admin review before activation |
| Phase 4 — Slack habit layer | Daily quiz, Block Kit, actions | **TASKLIST Phases 2–3** — Slack app in `apps/slack` using **Slack Bolt (Node)** and Block Kit; not Deno-only; business logic stays in `packages/core` + web APIs |
| Phase 5 — Web immersive UI | Hunt board, battle, NPC, codex | **TASKLIST Phases 4–6** — pages and game UI; Dark Fantasy presentation on web; **core engine** remains theme-agnostic (no monster/boss language in `packages/core`) |

**Encounter lengths (short / mid / long):** Product copy may describe ~4 / ~10 / ~20 steps. The engine must still support **variable** encounter counts per [ENCOUNTER_MODEL.md](../../docs/ENCOUNTER_MODEL.md); defaults in config (e.g. 4 / 10 / 20 max questions) are **hunt templates**, not a hard-coded universal step count for every battle.

***Phase 1: Project Initialization & .cursorrules***

Initialize a Next.js project with TailwindCSS.

Create a `.cursorrules` file in the root directory (pointer to `.cursor/rules/`) and keep **Dark Fantasy / Monster Hunter** styling and lore in **web and theme layers**; see alignment for core naming.

***Phase 2: Backend & Database Setup***

Generate the Supabase PostgreSQL schema based on the normalized structure defined in Section 6 (Users, Questions, choices, answer history). Table names in-repo may differ (e.g. `answer_options` vs `Question_Choices`) while preserving relations.

Implement Row Level Security (RLS) policies for user data protection.

***Phase 3: Content Ingestion Pipeline***

Create Supabase Edge Functions to act as the "AI Content Factory" that takes raw text, extracts concepts, and generates structured questions and distractors for Admin review.

***Phase 4: Slack App (Habit Layer)***

Implement the Slack app with Block Kit and interactive handlers for the daily quiz. **Repository choice:** Slack Bolt (Node) in `apps/slack`, calling platform-agnostic HTTP APIs — equivalent to PRD intent; Deno-only SDK is not required if the adapter pattern and Block Kit behavior match.

***Phase 5: Web App UI (Immersive Layer)***

Build the Next.js frontend pages: Hunt Board, Battle Engine (Light/Medium/Heavy/Ultimate attack mapping per tier), NPC Dialogue components, and User Codex.

Ensure components use the Dark Fantasy Tailwind theme on the **presentation layer**.
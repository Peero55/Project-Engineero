# ENGINEERO — DESIGN SPEC (MVP)

## 1. Overview

Engineero is a fantasy-themed, gamified learning platform that transforms technical study into a battle-driven RPG experience.

Users engage in:

- Hunts (learning paths)

- Battles (questions as combat)

- Progression (XP, mastery, items)

Primary interface:

- Web app (Next.js)

Secondary interface:

- Slack (daily engagement + notifications)

---

## 2. Core Experience Loop

### Primary Loop

1. User logs into web app

2. Selects a Hunt (topic)

3. Starts a Battle

4. Answers questions (combat)

5. Gains XP / rewards

6. Progresses mastery

---

### Daily Engagement Loop (Slack)

1. User receives 5 daily questions

2. Answers inside Slack

3. Gains XP / maintains streak

4. Redirects to web for deeper play

---

## 3. System Architecture

### Monorepo Structure

- apps/web → Next.js frontend (UI + battle rendering)

- apps/slack → Slack bot (Bolt)

- packages/core → gameplay logic

- packages/types → shared types

- packages/config → constants/config

- supabase → DB + migrations

---

### Responsibilities

| Layer | Responsibility |

|------|--------|

| Supabase | data, content, progression |

| Web (React) | rendering, UX, battle scenes |

| Slack | notifications + daily loop |

| Core package | battle logic, scoring |

---

## 4. Game Design Model

### Hunts

A Hunt represents a learning domain:

- Example: "Networking Fundamentals"

- Contains multiple battles

---

### Battles

A battle is a sequence of questions.

Each battle:

- has difficulty tier (1–4)

- belongs to a hunt

- yields XP + rewards

---

### Questions

For MVP:

- Multiple Choice only

Future:

- Short answer

- Scenario-based

---

## 5. Battle System

### Concept

User = player

Question = attack

Correct answer = successful hit

Incorrect answer = damage taken / reduced reward

---

### Battle Flow

1. Load battle

2. Render enemy + scene

3. Show question

4. Player answers

5. Show feedback

6. Apply XP + effects

7. Move to next question

8. End battle summary

---

### Difficulty Mapping

| Tier | Meaning |

|-----|--------|

| 1 | Basic |

| 2 | Intermediate |

| 3 | Advanced |

| 4 | Expert |

---

## 6. Progression System (MVP)

### XP

- Earned per correct answer

- Bonus for streaks

- Bonus for difficulty tier

---

### Mastery

Tracks user proficiency per hunt:

- Beginner

- Intermediate

- Advanced

---

### Items (MVP-lite)

Simple effects:

- Heal (restore progress buffer)

- Shield (reduce penalty)

- Bonus XP boost

---

## 7. Data Model (Supabase)

### Users

- id

- email

- created_at

---

### Hunts

- id

- title

- description

- category

---

### Battles

- id

- hunt_id

- difficulty

- name

---

### Questions

- id

- battle_id

- question_text

- options (json)

- correct_answer

- explanation

---

### User Progress

- user_id

- hunt_id

- xp

- mastery_level

---

### Battle Attempts

- id

- user_id

- battle_id

- score

- completed_at

---

### Inventory (MVP)

- user_id

- item_type

- quantity

---

## 8. UI System (Web)

### Design Goal

Fantasy, immersive, game-like

NOT SaaS dashboard

---

### Battle Screen Layout

Layers:

1. Background (scene)

2. Enemy (monster/mentor)

3. HUD (health/XP/status)

4. Question panel

5. Feedback layer

---

### Required Screens

- Home (dashboard)

- Hunts list

- Hunt detail

- Battle screen

- Results screen

- Profile

---

## 9. Asset System

### Rule

Supabase stores:

- asset keys (strings)

React renders:

- images

- animations

- effects

---

### Example

DB: enemy_type = "goblin_scout"

UI: assets/enemies/goblin_scout.png

---

### Fallback

If asset missing:

- use default placeholder

- log warning

---

## 10. Slack Integration

### Purpose

NOT full gameplay

ONLY engagement layer

---

### Features

- Daily 5 questions

- Answer in Slack

- XP rewards

- Streak tracking

- Link back to web

---

### Commands (MVP)

- /hunt → open web app

- daily questions (auto push)

---

## 11. Admin System (Simple MVP)

### Features

- Create/edit hunts

- Create battles

- Add questions

- Assign difficulty

---

### Implementation

- Basic web UI

- Backed by Supabase

- No full CMS yet

---

## 12. API Design (Next.js)

### Example Routes

- POST /api/battle/start

- POST /api/battle/answer

- GET /api/hunts

- GET /api/hunt/:id

---

## 13. MVP Definition

MVP is complete when:

- App runs locally

- Hunts are visible

- Battles start successfully

- Questions render correctly

- Answers evaluate correctly

- XP updates

- Slack sends daily questions

- One battle experience feels polished

---

## 14. Non-Goals (MVP)

- Multiplayer battles

- Real-time sync

- Advanced inventory

- Full CMS

- AI-generated questions

- Complex animations

---

## 15. Future Roadmap

### Phase 2

- Scenario questions

- Better items

- Leaderboards

### Phase 3

- Multiplayer

- Guilds

- PvP battles

### Phase 4

- AI-generated content

- Adaptive difficulty

---

## 16. Key Principles

- Build playable slices

- Keep logic centralized

- Keep UI immersive

- Avoid overengineering

- Optimize for iteration speed

---

## 17. Success Criteria

User can:

- log in

- choose a hunt

- complete a battle

- gain XP

- feel progression

- return daily

---

END SPEC

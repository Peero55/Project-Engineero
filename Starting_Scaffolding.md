legendary-hunts/
├─ README.md
├─ .gitignore
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ docs/
│  ├─ PRODUCT_BLUEPRINT.md
│  ├─ GOLDEN_BUILD_PROMPT.md
│  ├─ MVP_SCOPE.md
│  ├─ ARCHITECTURE.md
│  └─ CONTENT_PIPELINE.md
├─ apps/
│  ├─ web/
│  │  ├─ package.json
│  │  ├─ next.config.ts
│  │  ├─ tsconfig.json
│  │  ├─ postcss.config.js
│  │  ├─ tailwind.config.ts
│  │  ├─ components.json
│  │  ├─ middleware.ts
│  │  ├─ public/
│  │  │  ├─ logo.svg
│  │  │  └─ monsters/
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ layout.tsx
│  │     │  ├─ page.tsx
│  │     │  ├─ login/page.tsx
│  │     │  ├─ dashboard/page.tsx
│  │     │  ├─ profile/page.tsx
│  │     │  ├─ codex/page.tsx
│  │     │  ├─ hunts/
│  │     │  │  ├─ page.tsx
│  │     │  │  └─ [huntId]/page.tsx
│  │     │  ├─ battles/
│  │     │  │  └─ [battleId]/page.tsx
│  │     │  ├─ explanations/
│  │     │  │  └─ [topicSlug]/page.tsx
│  │     │  ├─ admin/
│  │     │  │  ├─ page.tsx
│  │     │  │  ├─ questions/page.tsx
│  │     │  │  ├─ imports/page.tsx
│  │     │  │  ├─ users/page.tsx
│  │     │  │  ├─ teams/page.tsx
│  │     │  │  └─ events/page.tsx
│  │     │  └─ api/
│  │     │     ├─ slack/deeplink/route.ts
│  │     │     ├─ battles/start/route.ts
│  │     │     ├─ battles/answer/route.ts
│  │     │     ├─ hunts/start/route.ts
│  │     │     ├─ questions/recommendations/route.ts
│  │     │     └─ admin/import/route.ts
│  │     ├─ components/
│  │     │  ├─ ui/
│  │     │  ├─ battle/
│  │     │  ├─ hunt/
│  │     │  ├─ npc/
│  │     │  ├─ profile/
│  │     │  └─ admin/
│  │     ├─ lib/
│  │     │  ├─ supabase/
│  │     │  │  ├─ client.ts
│  │     │  │  ├─ server.ts
│  │     │  │  └─ middleware.ts
│  │     │  ├─ auth.ts
│  │     │  ├─ battle-engine.ts
│  │     │  ├─ hunt-engine.ts
│  │     │  ├─ mastery.ts
│  │     │  ├─ rewards.ts
│  │     │  └─ validations.ts
│  │     ├─ hooks/
│  │     ├─ styles/
│  │     └─ types/
│  └─ slack/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ index.ts
│        ├─ app.ts
│        ├─ env.ts
│        ├─ listeners/
│        │  ├─ app-home-opened.ts
│        │  ├─ shortcuts.ts
│        │  ├─ actions/
│        │  │  ├─ answer-question.ts
│        │  │  ├─ view-explanation.ts
│        │  │  ├─ start-daily-quiz.ts
│        │  │  └─ open-web-hunt.ts
│        │  └─ commands/
│        │     └─ legendary.ts
│        ├─ blocks/
│        │  ├─ daily-question.ts
│        │  ├─ feedback.ts
│        │  ├─ app-home.ts
│        │  └─ leaderboard.ts
│        ├─ services/
│        │  ├─ questions.ts
│        │  ├─ progress.ts
│        │  ├─ deeplinks.ts
│        │  └─ users.ts
│        └─ clients/
│           ├─ supabase.ts
│           └─ web.ts
├─ packages/
│  ├─ ui/
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ battle-card.tsx
│  │     ├─ progress-bar.tsx
│  │     ├─ npc-dialog.tsx
│  │     └─ stat-chip.tsx
│  ├─ types/
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ battle.ts
│  │     ├─ hunt.ts
│  │     ├─ question.ts
│  │     ├─ rewards.ts
│  │     └─ user.ts
│  └─ config/
│     ├─ package.json
│     └─ src/
│        ├─ game.ts
│        ├─ mastery.ts
│        └─ slack.ts
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  │  ├─ 001_initial_schema.sql
│  │  ├─ 002_rls_policies.sql
│  │  ├─ 003_seed_cert_network_plus.sql
│  │  ├─ 004_scoring_functions.sql
│  │  ├─ 005_battle_functions.sql
│  │  └─ 006_admin_views.sql
│  ├─ seed.sql
│  └─ functions/
│     ├─ slack-events/
│     │  └─ index.ts
│     ├─ daily-quiz-scheduler/
│     │  └─ index.ts
│     ├─ import-questions/
│     │  └─ index.ts
│     └─ generate-explanations/
│        └─ index.ts
└─ scripts/
   ├─ bootstrap.sh
   ├─ validate-env.ts
   └─ import-questions.ts
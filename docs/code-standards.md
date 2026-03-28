# Code standards

This document describes how we aim to write and organize code in Engineero. Exact tooling (ESLint, Prettier, TypeScript strictness) will be finalized when the app is bootstrapped — until then, treat sections marked *placeholder* as team decisions to confirm.

## Naming conventions

- **Files:** use clear, consistent casings agreed by the team (e.g. `PascalCase` for React components, `kebab-case` for some route segments per Next.js conventions).
- **Variables and functions:** `camelCase` in TypeScript/JavaScript unless a framework dictates otherwise.
- **Constants:** `SCREAMING_SNAKE_CASE` for true module-level constants when it improves clarity.
- **Database:** `snake_case` for PostgreSQL columns and tables is common; align with migrations once adopted.

## Folder and file organization

- **Next.js app directory** (when added): colocate UI near routes; keep heavy business logic in dedicated modules if it grows beyond a screen.
- **Shared utilities:** one obvious place (e.g. `lib/` or `utils/`) — avoid scattering copy-pasted helpers.
- **API routes / server handlers:** keep request parsing, validation, and orchestration visible; push pure logic into testable functions where it helps.

## Readability

- Prefer **straightline code** over clever one-liners.
- **Early returns** for guard clauses reduce nesting.
- **Meaningful names** over comments that merely restate the code.

## Comments and documentation

- Comment **why**, not what, when the reason is non-obvious (business rules, performance tradeoffs, security caveats).
- Public APIs and non-obvious modules: a short module-level note or docstring is welcome.
- Update **`docs/`** when conventions or setup change.

## Separation of concerns

| Layer | Responsibility |
|--------|----------------|
| **Frontend (Next.js)** | UI, interaction, formatting for display, client-side state |
| **Server / API** | Auth checks, validation, orchestration, calling data access |
| **PostgreSQL** | Persisted data, state, metadata, **asset keys** — not HTML/templates for UI |

**PostgreSQL must not own UI rendering.** Store identifiers, metadata, and configuration that the app uses to render in React/Next.js — not presentation markup meant for the browser.

## Shared utilities

- **DRY with judgment:** deduplicate when it reduces bugs; don’t create abstraction layers for two call sites.
- **Pure functions** for transformations are easier to test and reuse.
- **Side effects** (I/O, DB, network) stay at the edges (API routes, server actions, data access modules).

## TypeScript, linting, formatting (*placeholder*)

When the repo adds tooling, the team should document here:

- TypeScript **`strict`** mode (recommended) and path aliases
- ESLint rules and `@typescript-eslint` presets
- Prettier (or equivalent) and editor integration
- Pre-commit hooks (optional) and CI checks

Until then: prefer explicit types at module boundaries; avoid `any` unless there is a documented escape hatch.

## Git and review

- Follow **`CONTRIBUTING.md`**: feature branches, PRs, no direct commits to `main`.

## AI-assisted development

- See **`.github/copilot-instructions.md`** for repository boundaries and safety rules.

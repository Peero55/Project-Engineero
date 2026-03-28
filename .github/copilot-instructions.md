# Copilot / Cursor agent instructions — Engineero

Repository-specific guidance for AI coding assistants working in this codebase.

## Structure and files

- **Follow the exact repository structure** agreed by the team. Do not invent alternate monorepo layouts unless the team explicitly expands the tree.
- **Do not rename** required documentation or workflow files (for example: `CONTRIBUTING.md`, files under `docs/`, `.github/*`).
- **Do not modify `main` directly.** Assume `main` is protected; work on feature branches and use pull requests.

## Secrets and safety

- **Never put secrets** (API keys, tokens, passwords, private URLs with credentials) in source code, commits, or documentation.
- Use **`.env.example`** for variable *names* and safe placeholders only. Real values belong in local env files or the deployment platform (not in git).

## Architecture boundaries

- **Frontend (Next.js):** UI composition, routing, client/server components as appropriate, styling, and user-visible behavior.
- **Backend / API:** business rules, validation, orchestration, and data access *interfaces* used by the app.
- **PostgreSQL:** persistence for **data, state, metadata, and asset keys** — not for rendering UI. Do not push presentation or template HTML into the database.
- When **game or trivia-style UI** is introduced later: store **asset keys and metadata** in PostgreSQL; **rendering stays in React/Next.js**.

## Code quality

- Prefer **readable, typed, maintainable** code (TypeScript when the project adopts it).
- **Avoid unnecessary abstraction.** Match existing patterns in the repo before introducing new layers.
- **Update documentation** when introducing new conventions (see `docs/code-standards.md`).

## Process

- **Small, focused changes** are easier to review than large mixed PRs.
- If setup or deployment behavior changes, update **`docs/getting-started.md`** or **`docs/deployment.md`** accordingly.

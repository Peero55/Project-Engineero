# Contributing to Engineero

Thank you for helping build Engineero. This guide explains how we work together on GitHub so changes stay reviewable, safe, and easy to follow.

## Branch workflow

- **Do not modify `main` directly.** `main` is protected; all work lands through **feature branches** and **pull requests (PRs)**.
- **Sync before you branch:** pull the latest `main` (or your team’s default branch) and create a new branch from it.
- **Open a PR early** if you want feedback while work is in progress (use draft PRs when helpful).

### Branch naming examples

Use clear, prefixes that describe intent:

- `feat/short-description` — new capability
- `fix/short-description` — bug fix
- `chore/short-description` — tooling, config, housekeeping
- `docs/short-description` — documentation only

Examples:

- `feat/user-profile-api`
- `fix/login-redirect-loop`
- `docs/deployment-env-vars`

## Pull request expectations

- **One focused change per PR** when possible. Large refactors can be split into reviewable steps.
- **Describe what and why** in the PR summary. Link related issues (`Closes #123` or `Refs #456`).
- **Self-review** before requesting review: diff readability, stray files, and secrets.
- **Respond to review feedback** with commits or discussion; resolve threads when addressed.

## Commit guidance

- Prefer **small, logical commits** with messages that explain intent (not only what files changed).
- Conventional prefixes are welcome if the team adopts them (e.g. `feat:`, `fix:`, `docs:`) — align with `docs/code-standards.md` once finalized.

## Documentation

- **Update docs** when your change affects **setup**, **standards**, or **deployment** (`docs/getting-started.md`, `docs/code-standards.md`, `docs/deployment.md`).
- If formal automated tests are not in place yet, **include test notes in the PR**: what you ran manually, environments, and edge cases checked.

## Review readiness

- Keep PRs **small and focused** so reviewers can reason about risk and give timely feedback.
- Call out **breaking changes**, **env var changes**, and **migration needs** explicitly in the PR description.

## Getting help

- New contributors: start with `docs/getting-started.md` and `docs/code-standards.md`.
- For agent-assisted work, see `.github/copilot-instructions.md`.

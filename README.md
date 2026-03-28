# Engineero

Team project scaffold: **Next.js**, **Node.js**, and **PostgreSQL**.

## Quick links

| Doc | Purpose |
|-----|---------|
| [Contributing](CONTRIBUTING.md) | Branches, PRs, how we work |
| [Getting started](docs/getting-started.md) | Clone, env, run locally |
| [Code standards](docs/code-standards.md) | Structure and responsibilities |
| [Deployment](docs/deployment.md) | Environments and release notes (placeholder) |
| [Copilot / Cursor instructions](.github/copilot-instructions.md) | AI agent boundaries |

## Stack (planned)

- Frontend and SSR: **Next.js**
- Runtime / APIs: **Node.js**
- Data: **PostgreSQL** (data, metadata, asset keys — not UI markup)

Application code (`package.json`, `app/`, etc.) will land in follow-up PRs after the team agrees on bootstrap details.

## First-time contributors

1. Read **CONTRIBUTING.md** — do not commit directly to `main`.
2. Follow **docs/getting-started.md** for setup.
3. Copy **`.env.example`** to your local env file and fill in values (never commit secrets).

## Required GitHub settings

Automation runs in **GitHub Actions** on push and pull requests. After workflows exist on the default branch, configure the repository on **github.com** so checks are enforced—not just advisory.

1. **Branch protection (`main`, and `dev` if you use it)** — *Settings → Branches → Add / edit rule*. Require a pull request before merging; block force-push and deletion where possible; optionally require branches to be up to date before merge.
2. **Required status checks** — In that rule, enable *Require status checks to pass before merging* and select the checks that correspond to the **CI** and **Secret Scan** workflows (exact names appear under the **Actions** tab after the first run).
3. **Reviews** — Enable *Require approvals* (or follow org policy) so merges are reviewed.
4. **Dependabot & security** — *Settings → Code security*: turn on Dependabot alerts and Dependabot security updates; review and merge Dependabot PRs on GitHub.
5. **Secret scanning** — Enable GitHub **secret scanning** for the repo (and **push protection** if your plan includes it).
6. **CODEOWNERS** — With [`.github/CODEOWNERS`](.github/CODEOWNERS) on the default branch, GitHub can request reviews from the listed owners or teams when you enable *Require review from Code Owners* (optional).

You can add or edit workflow files directly on GitHub (*Add file*, commit to a branch, open a PR) so the **GitHub repo** stays the source of truth for automation config.

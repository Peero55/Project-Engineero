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

Workflows, templates, and [CODEOWNERS](.github/CODEOWNERS) live **in this repository**. Branch protection, security products, Dependabot behavior, and merge preferences are turned on in the **GitHub UI** (repository or organization settings on github.com)—not via local commands.

### Branch protection: `main` (strict)

Configure under **Settings → Branches** with a rule for `main`:

- Require a **pull request** before merging.
- **Do not** set a required approval count for now (small team); you can add a minimum number of approvals later.
- **Require status checks to pass** before merging. After Actions have run at least once, select the checks that match this repo’s workflows, for example:
  - **CI / lint**
  - **CI / typecheck**
  - **CI / build**
  - **CI / test** (safe to require even when the job skips: it succeeds when no root `scripts.test` exists)
  - **Secret Scan / secret-scan**
- **Do not allow force pushes** to `main`.
- **Do not allow deletions** of `main`.

Set the **default merge method** for the repo to **Squash and merge** (recommended for early growth):

- **Cleaner history** — one commit per merged PR instead of merge commits and noisy branch tips.
- **Easier review and rollback** — one logical change unit maps to one revert.
- **Better fit for a small, fast-moving team** — less time spent curating merge bubbles.

Individual PRs can still use other merge methods if org policy allows, but squash should be the norm.

### Branch protection: `dev` (looser, when the branch exists)

When you add a `dev` branch, create a **separate** rule that is **looser** than `main`:

- Still use PRs (and optionally required checks) if you want basic hygiene.
- Avoid mirroring every strict `main` rule until the team needs them—`dev` is for integration before promotion to `main`.

### Secret scanning and push protection

Under **Settings → Code security and analysis** (names vary slightly by plan):

- Enable **Secret scanning** for the repository.
- Enable **Push protection** for supported secret types when your plan includes it, so pushes blocked at the remote fail fast.

### Dependabot

- Turn on **Dependabot alerts** and **Dependabot security updates** for the repo.
- The config file is [.github/dependabot.yml](.github/dependabot.yml) (npm + GitHub Actions; Actions updates are grouped into one weekly PR).

**Auto-merge for patch and minor updates:** GitHub does not encode “auto-merge only Dependabot patch/minor” entirely in `dependabot.yml`. After CI is stable:

1. Enable **Allow auto-merge** at **Settings → General**.
2. For Dependabot PRs that only bump patch/minor (and pass required checks), use **Enable auto-merge** on the PR (squash, if that is your default) so merges happen once checks are green.

Larger upgrades (major, or risky batches) should stay manual until you trust automation.

### CODEOWNERS

[`.github/CODEOWNERS`](.github/CODEOWNERS) lists **@Najm557** as the default owner for all paths. You can later enable **Require review from Code Owners** in branch rules if you want reviews routed automatically; that remains optional for now.

### Summary

| Location | What |
|----------|------|
| **In the repo** | Workflow YAML, Dependabot YAML, PR template, CODEOWNERS |
| **On GitHub (UI)** | Branch protection, required checks selection, secret scanning, Dependabot alerts, allow auto-merge, default to squash merge |

You can edit workflow files on GitHub (**Add file** / **Edit** → commit to a branch → PR) so the remote repository stays the source of truth.

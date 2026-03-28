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

*Automation runs on GitHub Actions; use branch protection on GitHub to require those checks before merge.*

Workflow YAML, [.github/dependabot.yml](.github/dependabot.yml), [CODEOWNERS](.github/CODEOWNERS), and the PR template live **in this repository**. Branch protection rules, required status check selection, secret scanning, and org-level policies are configured on **github.com** (repository or organization settings)—not via local commands.

### Branch protection (`main`, and `dev` if used)

Under **Settings → Branches → Branch protection rules**:

- Require a **pull request** before merge.
- **Disallow force pushes** and **disallow branch deletion** for protected branches (recommended for `main`).
- Optionally require branches to be **up to date** before merge.

Add a **separate, looser** rule for **`dev`** when that branch exists (fewer required checks or lighter rules than `main`).

### Required status checks

In the branch rule, enable **Require status checks to pass before merging** and select the check names that correspond to the **CI** and **Secret Scan** workflows. Exact labels appear under the **Actions** tab after workflows have run at least once (they may look like **`lint`**, **`CI / lint`**, **`secret-scan`**, **`Secret Scan / secret-scan`**, etc.—pick what matches your jobs).

### Reviews

Use **Require a pull request before merging** and follow your **organization’s policy** for whether **required approvals** are turned on and how many.

### Dependabot and security

Under **Settings → Code security** (or equivalent):

- Enable **Dependabot alerts** and **Dependabot security updates**; review and merge Dependabot PRs on GitHub.

### Secret scanning

Enable **secret scanning** for the repository and, if your plan includes it, **push protection** for supported secrets.

### CODEOWNERS

With [.github/CODEOWNERS](.github/CODEOWNERS) on the default branch, GitHub can request reviews from the listed owners or teams when you enable review-from-codeowners rules (optional).

### Summary

| Where | What |
|--------|------|
| **Repo files** | [`.github/workflows/*.yml`](.github/workflows/ci.yml), Dependabot, CODEOWNERS, PR template |
| **GitHub UI** | Branch protection, required checks, secret scanning, Dependabot toggles, merge defaults |

You can add or edit workflow files on GitHub (**Add file** / **Edit** → branch → PR) so the hosted repository remains the source of truth.

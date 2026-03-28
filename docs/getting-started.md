# Getting started

Welcome to **Engineero**. This guide helps you clone the project, install dependencies, and run it locally. Exact commands may evolve as the Next.js app layout and package manager are finalized — placeholders below are realistic; update this doc when tooling is locked in.

## Project overview

Engineero is a team project using:

- **Next.js** — web application and frontend concerns
- **Node.js** — server/runtime for API routes, server logic, and tooling
- **PostgreSQL** — durable data, metadata, and asset references (not UI rendering)

New contributors should read this page, then **`docs/code-standards.md`**, then **`CONTRIBUTING.md`**.

## Prerequisites

- **Node.js** — LTS version recommended (exact version TBD; consider pinning via `.nvmrc` or `engines` when adopted)
- **Package manager** — npm, pnpm, or yarn (team choice TBD)
- **PostgreSQL** — local install or Docker (connection details in `.env`; see `.env.example`)
- **Git** — for branching and pull requests

## Clone and setup

```bash
git clone https://github.com/<org-or-user>/Engineero.git
cd Engineero
```

Create a working branch (do not work directly on `main`):

```bash
git checkout main
git pull origin main
git checkout -b feat/your-branch-name
```

## Install dependencies

**Placeholder** — replace with the team’s package manager when `package.json` exists:

```bash
# npm
# npm install

# pnpm
# pnpm install

# yarn
# yarn install
```

## Environment variables

1. Copy `.env.example` to your local env file (convention TBD; many Next.js teams use `.env.local`).
2. Set `DATABASE_URL` and other variables to match your local PostgreSQL and app URL.
3. Never commit secrets. `.env.example` stays template-only.

See `.env.example` for commented placeholders.

## Run the app locally

**Placeholder** — typical Next.js dev command after the app is scaffolded:

```bash
# npm run dev
# pnpm dev
# yarn dev
```

The app will likely be available at `http://localhost:3000` unless `API_PORT` / custom ports are configured.

## Database

**Placeholder** — when migrations exist, document how to create the database and apply them (e.g. `npm run db:migrate`). Until then:

- Ensure PostgreSQL is running and `DATABASE_URL` is valid.
- Coordinate with the team before applying schema changes to shared environments.

## What to read first

1. **`CONTRIBUTING.md`** — branching, PRs, and review expectations
2. **`docs/code-standards.md`** — how we organize code and responsibilities
3. **`docs/deployment.md`** — environments and release notes (placeholder until deploy is wired)
4. **`.github/copilot-instructions.md`** — guidance for AI-assisted contributions

## Troubleshooting

- **Port in use:** change the dev port per Next.js docs or stop the conflicting process.
- **DB connection errors:** verify `DATABASE_URL`, firewall, and that PostgreSQL accepts local connections.
- **Stale build:** remove `.next` and reinstall dependencies if the team agrees that is safe for your OS.

If something in this doc is wrong or outdated, open a PR to fix it.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

The Next.js app lives in `personal-website/` (nested directory). All commands should be run from there.

## Commands

```bash
# Development
pnpm dev              # Start dev server at localhost:3000
pnpm dev:turbo        # Dev server with Turbopack
pnpm dev:clean        # Clear .next cache and restart

# Build & Production
pnpm build            # Production build
pnpm start            # Serve production build

# Quality
pnpm lint             # ESLint (eslint .)
pnpm lint:fix         # Auto-fix lint + prettier
pnpm type-check       # TypeScript checking (tsc --noEmit)
pnpm test             # Node tests (node --test tests/**/*.test.mjs)

# CI/CD
pnpm changeset        # Create a changeset for versioning
pnpm secrets:check    # Gitleaks scan on staged files
pnpm secrets:scan     # Gitleaks scan on full repo

# Bundle analysis
ANALYZE=true pnpm build
```

Tests live in `personal-website/tests/*.test.mjs` and use Node's built-in test runner (Node ≥ 22; CI uses Node 24). Locally the `node` on PATH may be a broken nvm shim, so prefix with `PATH=/opt/homebrew/bin:$PATH`.

## Architecture

**Next.js 16 App Router** with React 19, TypeScript, Tailwind CSS 4, deployed on Vercel.

### Key directories (`personal-website/src/`)

- `app/` — App Router pages. Route group `(pages)/` contains contact and projects. `projects/[slug]/` has dynamic routes with `generateStaticParams`.
- `components/features/` — Domain components (homepage, portfolio guide, agent scene, project pages)
- `components/ui/` — shadcn/ui components (new-york style, Lucide icons). Add via `npx shadcn@latest add <component>`.
- `components/layouts/` — Header and Footer
- `content/projects.ts` — Project data source; long descriptions loaded from `content/project-descriptions/*.md`
- `lib/` — Utilities: sanitizer (DOMPurify), validation (Zod schemas), markdown processing, guardrails (guide safety)
- `components/providers/webllm-provider.tsx` — client-side LLM via WebLLM, run in a web worker

### Important patterns

- **Server Components by default** — only add `'use client'` when necessary
- **Path alias** — `@/*` maps to `./src/*`
- **Security headers** — CSP, COEP/COOP (required for WebLLM SharedArrayBuffer), HSTS in production. Configured in `next.config.js`.
- **WebLLM** — Requires `unsafe-eval` in CSP and WebAssembly experiments in webpack config. Client-side only with Node module fallbacks disabled.
- **HTML sanitization** — All user/markdown content goes through DOMPurify (`lib/sanitizer.ts`). Use `SecureContent` component for rendering HTML.
- **Input validation** — Zod schemas in `lib/validation.ts` for all user inputs
- **Project content** — Add entry to `allProjects` array in `src/content/projects.ts` and corresponding markdown file in `src/content/project-descriptions/`
- **Console logs** — Stripped in production via `compiler.removeConsole`

### CI/CD

- **GitHub Actions** — `.github/workflows/ci.yml` (lint, type-check, test, build, gitleaks) and `changeset-check.yml` on push/PR to main. Workflows are at the git root, not inside `personal-website/`.
- **Conventional commits** — Enforced by commitlint via husky `commit-msg` hook. Types: feat, fix, chore, refactor, docs, test, ci, perf. Example: `feat: add dark mode toggle`
- **Pre-commit** — Husky runs gitleaks secret scan + lint-staged (eslint --fix + prettier) on staged files
- **Pre-push** — Husky runs local CI via `act` (requires Docker). Skippable: `SKIP=act git push`
- **Changesets** — Version management via `pnpm changeset`. Config in `.changeset/config.json`.
- **Act** — Local GitHub Actions simulation. Config at git root: `.actrc`, `.actignore`. Requires Docker + `brew install act`.
- **Gitleaks** — Secret scanning config at git root: `.gitleaks.toml`
- **Prettier** — Formatting config in `.prettierrc.json`. Runs via lint-staged on commit.

### Claude Code Agentic Tooling (`.claude/`)

**Agents** (`.claude/agents/`) — Specialized sub-agents for parallel research:

- `codebase-locator` — Finds WHERE code lives (file finder, "super grep")
- `codebase-analyzer` — Analyzes HOW code works (implementation details, data flow)
- `codebase-pattern-finder` — Finds similar implementations and reusable patterns with code examples
- `web-search-researcher` — Web research specialist for up-to-date information
- `thoughts-analyzer` — Extracts insights from research documents
- `thoughts-locator` — Finds documents in thoughts/ directory

**Commands** (`.claude/commands/`) — Slash commands for workflows:

- `/commit`, `/ci_commit` — Create git commits (with/without user approval)
- `/create_plan`, `/create_plan_nt`, `/create_plan_generic` — Create implementation plans (Opus model)
- `/iterate_plan`, `/iterate_plan_nt` — Update existing plans based on feedback
- `/implement` — Implement a GitHub issue end-to-end
- `/implement_plan` — Execute a plan with phase-by-phase verification
- `/validate_plan` — Validate implementation against plan
- `/describe_pr`, `/describe_pr_nt`, `/ci_describe_pr` — Generate PR descriptions
- `/research_codebase`, `/research_codebase_nt`, `/research_codebase_generic` — Document codebase using parallel sub-agents
- `/feature` — Create GitHub issue from feature request
- `/debug` — Investigate issues via logs, git history, and state
- `/create_handoff`, `/resume_handoff` — Transfer work between sessions
- `/create_worktree`, `/local_review` — Git worktree management
- `/linear` — Linear ticket management
- `/ralph_plan`, `/ralph_research`, `/ralph_impl` — Linear ticket automation
- `/oneshot`, `/oneshot_plan` — Quick ticket research + planning
- `/founder_mode` — Create Linear ticket + PR for experiments

**Git Workflow:**

- Commit format: `type: description` (lowercase, max 100 chars)
- Types: feat, fix, chore, refactor, docs, test, ci, perf
- Use `pnpm` exclusively (never npm or yarn)
- Use `@/` path alias for imports

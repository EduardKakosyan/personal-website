# Dev Template - Development Starter

**Open Source Template for Building with Claude Code**

---

## Project Overview

Dev Template is a tooling-only starter template designed for building startups with a Next.js + Supabase + Vercel stack. It's explicitly **not a scaffold** — it contains zero application code. Instead, it provides a fully pre-configured development infrastructure layer that you fork and build on top of. The key differentiator is its deep optimization for development with Claude Code, with 6 specialized sub-agents and 30+ slash commands.

**The Problem:** Setting up proper development infrastructure — CI/CD, git hooks, testing, linting, secret scanning, agent configuration — takes days of work that every team repeats from scratch. And when you're building with coding assistants, there's no standard way to configure them for consistent, high-quality output.

**The Solution:** Fork this template and immediately get a production-grade development environment with a complete agent framework built in.

## The Agent System

This is the most distinctive part of the template. The `.claude/` directory contains a complete framework for assisted development.

### 6 Specialized Sub-Agents

Each agent runs on the Sonnet model and has a focused responsibility:

| Agent                 | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| **Codebase Locator**  | "Super Grep" — finds WHERE code lives without reading contents |
| **Codebase Analyzer** | Analyzes HOW code works with file:line precision               |
| **Pattern Finder**    | Finds reusable patterns with concrete code examples            |
| **Web Researcher**    | Web research for up-to-date external information               |
| **Thoughts Analyzer** | Extracts insights from research documents                      |
| **Thoughts Locator**  | Discovers relevant documents in the knowledge base             |

All agents are explicitly instructed to be **"documentarians, not critics"** — they describe what exists without suggesting improvements, preventing the assistant from going off-track during research.

### 30+ Slash Commands

Key workflow commands include:

- **`/create_plan`** — Interactive plan creation that spawns parallel sub-agents for codebase research, generates phased implementation plans with success criteria
- **`/implement`** — End-to-end GitHub issue implementation: reads the issue, researches codebase, creates branch, generates plan, implements phase-by-phase, commits, and creates PR
- **`/implement_plan`** — Executes a plan phase-by-phase with verification, pausing for manual testing between phases
- **`/research_codebase`** — Comprehensive codebase documentation using parallel sub-agents
- **`/feature`** — Turns plain-language feature requests into codebase-aware GitHub issues
- **`/debug`** — Investigation-only analysis of logs, database state, and git history
- **`/create_handoff`** / **`/resume_handoff`** — Transfers work context between sessions via structured documents

### Persistent Knowledge Base

The `thoughts/` directory serves as long-term memory for agents across sessions, organized into plans, research, tickets, handoffs, and PR descriptions.

## Development Infrastructure

### Three-Layer Git Hook Protection

Every commit passes through:

1. **Pre-commit**: Gitleaks secret scanning + lint-staged (ESLint + Prettier)
2. **Commit-msg**: Commitlint validates conventional commit format
3. **Pre-push**: Runs the full GitHub Actions CI pipeline locally via `act` in Docker

### CI/CD Pipeline

- ESLint + Prettier validation
- TypeScript strict type checking
- Vitest unit tests with 60% coverage thresholds
- Gitleaks secret detection (with dual-environment support for GitHub Actions and local `act`)
- Changeset verification on PRs

### Custom Secret Scanning

Extended Gitleaks configuration with custom rules for Supabase service keys, Vercel API tokens, and NextAuth secrets — with allowlists for test files and examples.

## Technology Stack

- **TypeScript** 5.7+ (strict mode)
- **ESLint** 9 (flat config) + **Prettier** 3.8
- **Vitest** 3.0 + React Testing Library (60% coverage thresholds)
- **Husky** 9.1 (3 git hooks)
- **commitlint** (conventional commits)
- **Changesets** (semantic versioning)
- **Gitleaks** (secret scanning)
- **nektos/act** (local CI via Docker)
- **pnpm** (enforced)

## How to Use

1. Fork the repository
2. Layer your Next.js application on top
3. The entire development infrastructure — CI/CD, hooks, testing, agents — is ready to go

---

**Links:**

- [GitHub Repository](https://github.com/AI-First-Consulting/dev-template)
- [AI-First Consulting](https://www.ai-first.ca/)

_Open source under MIT license. Contributions welcome._

# Claude Autonomous

**Reusable Harness for Autonomous Development**

---

## Project Overview

Claude Autonomous is an open-source infrastructure harness for running Claude Code as a long-running autonomous agent inside an isolated Docker container on macOS. It schedules nightly development cycles via launchd, enforces budget and quality gates, and maintains persistent state between runs.

**The Idea:** Coding assistants are powerful interactively — but can they sustain long-term software projects autonomously with proper safety guardrails, budget control, and quality enforcement?

**What We Built:** A containerized environment where Claude Code runs on a schedule: picking tasks from a backlog, implementing with tests, committing only when quality gates pass, and documenting decisions for the next run.

## Technical Architecture

### Nightly Execution Cycle

1. **launchd triggers** `claude-nightly.sh` at 2 AM daily
2. Script refreshes OAuth credentials, injects operator instructions
3. Docker container starts with workspace mounted
4. Claude Code reads `CLAUDE.md` for context and `tasks.json` for backlog
5. Agent picks next pending task, implements with tests
6. Commits only if `make check` passes (fmt + vet + lint + test)
7. Updates task status, logs output in structured JSON
8. Budget enforcement: $100/run cap, 3-hour timeout, 500 max turns

### Security & Isolation

- **Container Firewall** — Blocks access to private networks, allows only HTTP/HTTPS/SSH
- **Permission Allowlist** — Only approved bash commands (gofmt, go build, make check)
- **No Secrets in Container** — Credentials injected at runtime, never persisted
- **Network Isolation** — `init-firewall.sh` configures iptables rules

### Persistent State

- **Task Backlog** — `tasks.json` with dependencies and status tracking across runs
- **Agent Learnings** — `AGENTS.md` documents patterns discovered across runs
- **Cost Tracking** — JSONL logs for spend monitoring
- **Git History** — All work auditable through conventional commits

## Technology Stack

- **Container**: Docker (Debian-based, Go 1.24, Node.js, Claude Code CLI)
- **Scheduling**: macOS launchd (plist daemon)
- **Orchestration**: Bash scripts with budget enforcement
- **Security**: iptables firewall rules, permission allowlists
- **Quality Gates**: golangci-lint v2, go test -race, gofmt, go vet
- **Git Hooks**: Pre-commit (gofmt, gitleaks), commit-msg (conventional), pre-push (make check)

## Key Features

- **One-Command Setup** — `./setup.sh` builds Docker image, installs launchd job, configures hooks
- **Budget Controls** — $100/day spend limit with automatic shutdown
- **Quality Gates** — Code only committed when all checks pass
- **Auditable** — Every decision traceable through git history and structured logs
- **Reusable** — Generic harness; swap the workspace for any project
- **Proven** — Successfully built VoxCoach across 12+ nightly runs (47 tasks, 10 phases)

---

**Links:**

- [GitHub Repository](https://github.com/EduardKakosyan/claude-autonomous)

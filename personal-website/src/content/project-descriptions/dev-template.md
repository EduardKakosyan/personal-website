# Dev Template

In January 2026 I was starting several internal projects at AI-First Solutions, and the coding agents we used would sometimes make a bad commit and push it on their own. I put the checks and agent setup I wanted in every new project into one repository, so nobody had to rebuild them. It is tooling only: it assumes Next.js, Supabase and Vercel but contains no app.

## Working with agents

The research agents and planning commands come from HumanLayer's open-source Claude Code setup. I added two commands: one researches the codebase and turns a feature request into a GitHub issue, and one implements an issue end to end. Each command has its own narrow permissions, so there is no need to run Claude with permission checks turned off.

A `thoughts/` directory holds plans and handoff notes. Several agents can read the same plan and build separate features at once, each committing only the files it changed. Architecture decision records tell the next developer, and the agent, why earlier choices were made.

## Checks around a commit

Before a commit, Gitleaks scans for secrets and lint-staged runs ESLint and Prettier. Commitlint rejects badly formatted messages, so an agent has to fix its message before the commit goes through. Before a push, `act` runs the GitHub Actions checks locally in Docker; if act or Docker is missing, the hook warns and lets the push continue. On GitHub, every pull request runs lint, type checks, Vitest and the secret scan again.

The secret scan took a few fixes. The Gitleaks action can't run under act, so the workflow detects act and runs the Gitleaks binary instead, and CI needed the full Git history to scan.

## Starting a project

Create a repository from the template on GitHub, then add the application. The tooling uses pnpm; the README covers setup and the available commands.

Between January and June 2026, seven company repositories were created from the template and two more copied its hooks and commands. Teammates started several of them. An early version of HUGO and this site use the same setup.

[Source code and setup](https://github.com/AI-First-Consulting/dev-template)

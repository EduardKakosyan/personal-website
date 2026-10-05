# Dev Template

This is the development setup I put together for projects at AI-First Consulting. It collects the agent commands, checks, and Git hooks in one place so they can be reused when starting a project.

## Working with agents

The template includes agents for finding code, reading it, and researching a change. Commands cover the steps from a feature request through a plan, implementation, and review.

A `thoughts/` directory holds plans, research, and handoff notes between sessions.

## Checks around a commit

Before a commit, Gitleaks scans for secrets and lint-staged runs ESLint and Prettier. A separate hook checks the commit message. Before a push, `act` can run the GitHub Actions checks locally in Docker.

The template also includes TypeScript checking, Vitest and React Testing Library, and Changesets for versioning.

## Starting a project

Fork the repository and add the application on top. The tooling uses pnpm; the README covers setup and the available commands.

[Source code and setup](https://github.com/AI-First-Consulting/dev-template)

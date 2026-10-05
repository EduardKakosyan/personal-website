# Claude Autonomous

This was my earlier setup for letting a coding agent work through a project over several nights. It runs Claude Code in a Docker container, with a schedule, a spending limit, and saved task state between runs.

I used it for VoxCoach before moving on to the local-model setup in [dgx-autonomy](/projects/dgx-autonomy).

## A nightly run

A macOS launchd job starts the container. Claude Code reads the project instructions and task backlog, picks up a task, and runs the project’s checks before committing. It then saves its progress and notes for the next run.

The runs have limits on spending, elapsed time, and conversation turns. A firewall restricts network access, and a command allowlist limits the tools the agent can use.

## Keeping track of the work

The task file records what is pending and what is finished. Notes carry decisions between conversations, while logs and Git history record the changes and cost of each run.

The VoxCoach build spanned more than twelve nightly runs, covering 47 tasks across ten phases.

## What I used

Docker, Bash, macOS launchd, and Claude Code. The project checks included Go formatting, linting, and tests, with Git hooks for secret scanning and commit messages.

[Source code and setup](https://github.com/EduardKakosyan/claude-autonomous)

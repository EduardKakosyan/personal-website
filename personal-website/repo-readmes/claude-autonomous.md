# Claude Autonomous

## What

An earlier harness for running Claude Code overnight in an isolated Docker container.

## Why

I explored persistent task state, scheduling and budget controls before building a fully local environment.

## Demo

No current public interactive demo is verified.

## Run it

Read-only inspection found a Dockerfile, firewall script, setup script and launchd configuration, but no root README. Setup and required credentials remain unverified. Review those files before installing a scheduled job or changing firewall rules.

## How it's tested

No automated test invocation is verified. Isolation, scheduling and spending limits need explicit checks before unattended use.

## How it works

Docker isolates the worker; Bash and launchd support orchestration and scheduling. Unlike dgx-autonomy, this harness uses Claude Code rather than claiming a fully local model.

## Status

Historical precursor. Architectural facts come from the approved project registry; operational instructions still need review.

## More

[Harness context](https://kakosyaneduard.ca/projects/claude-autonomous).

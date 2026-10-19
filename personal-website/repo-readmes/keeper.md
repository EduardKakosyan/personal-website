# Keeper

## What

A private meeting archive with search, summaries and MCP access, paired with a Mac capture and dictation app.

## Why

I want meeting evidence to remain under the owner's control while still being useful to search and assistant tools.

## Demo

No public demo is verified. The site describes the system without exposing meeting data.

## Run it

Publication is blocked on a full-history secret scan and fixture review. A safe fresh-machine installation command has not been verified for this public draft. Do not substitute private deployment instructions.

## How it's tested

The archive's access boundary scopes requests to the token owner. A public test command and sanitized fixtures still need verification; this draft does not claim tests were run.

## How it works

Python and FastAPI serve a SQLite FTS5 archive, summary versions, a web UI and MCP tools. A configured local model can summarize meetings. Swift provides the Mac capture side. I built the project; source details remain private pending review.

## Status

Private repository, publication audit pending. Facts follow the approved Keeper case study and registry. Do not link to source or pin the repository until separate publication approval.

## More

[Keeper: decisions and boundaries](https://kakosyaneduard.ca/projects/keeper).

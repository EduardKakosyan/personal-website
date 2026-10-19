# Second Brain

## What

A study assistant connecting course files, chat and calendar actions.

## Why

We explored helping students turn course material into study plans. This is the older Volta project, not the newer beach-status app.

## Demo

The upstream README contains workflow screenshots; no current interactive demo is verified.

## Run it

The README describes n8n, Pinecone and Google Drive, but does not establish a complete reproducible setup. Workflow import steps and credential scopes need verification. Never commit live credentials or student documents.

## How it's tested

No automated test command was verified in the inspected documentation. Calendar permissions and duplicate-event behavior need review before using real accounts.

## How it works

Workflows ingest course files into a vector store and give a chat agent retrieval and calendar tools. I contributed with a hackathon team.

## Status

Historical 2024 hackathon prototype. Facts follow the project registry and upstream README; current service compatibility is unverified.

## More

[Second Brain context](https://kakosyaneduard.ca/projects/second-brain).

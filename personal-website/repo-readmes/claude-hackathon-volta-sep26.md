# Is the Beach Open

## What

A map of the 35 Nova Scotia beaches where a government tests the water, with the official notice behind each status.

## Why

I built this newer Volta hackathon project to make scattered public information easier to use. It is not the earlier Second Brain project.

## Demo

Use local fixture mode for a reproducible demonstration. No deployed URL is verified here. Fixture data is not current swimming advice.

## Run it

The upstream README specifies Node 22 and pnpm. From the repository root:

```sh
pnpm install
pnpm dev
```

Without database credentials, it uses fixture mode. Live mode needs the documented Supabase configuration; do not publish credentials.

## How it's tested

Verified package scripts expose `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm e2e`. Vitest exercises captured source pages; Playwright covers browser flows. These commands were inspected, not executed here.

## How it works

Next.js serves a MapLibre map. Supabase stores statuses, history and reports. Source readers normalize municipal beach information, park notices and algae notices into a shared state.

## Status

Public hackathon build. Exact event dates, team composition and competition outcome are unverified. Evidence: upstream README and package.json, inspected read-only.

## More

[Project context](https://kakosyaneduard.ca/projects/volta-sep26).

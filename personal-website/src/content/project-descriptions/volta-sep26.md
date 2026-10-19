# Is the Beach Open

## Problem

A beach map is only useful if it explains whether swimming is currently advised. This newer Volta hackathon project brings public notices into one map. It is separate from the earlier Second Brain study assistant.

## System

The public repository documents a Next.js app with MapLibre and Supabase. It reads municipal beach information, provincial park notices and algae notices, then normalizes them into swimming statuses. Fixture mode works without database credentials; live mode reads the configured database.

## Verification and limits

The repository provides Vitest tests over captured source pages and Playwright browser checks. These were inspected, not executed as part of this portfolio update. Exact event dates, team composition and competition outcome remain unverified. Fixture results are not live safety advice; check the official notice before swimming.

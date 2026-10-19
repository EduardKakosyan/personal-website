# Is the Beach Open

## Problem

Beach notices are spread across three public sources: the municipality's supervised-beach table, provincial park notices, and the provincial blue-green algae feed. Our map brings them together, with the official notice underneath each status. I built it with [@Harshil-varia](https://github.com/Harshil-varia) at the Volta hackathon, September 12–14, 2026.

## System

A Next.js app with MapLibre and Supabase. The server reads the three sources and turns them into one status per beach: open, advisory, closed or off-season. It runs without a database in fixture mode, using captured copies of the source pages, and against Supabase in live mode.

## Testing

Vitest checks the parsing against captured copies of each source page, and Playwright checks the map in a mobile browser. The statuses are not safety advice; check the official notice before you swim.

[Source code](https://github.com/EduardKakosyan/claude-hackathon-volta-sep26)

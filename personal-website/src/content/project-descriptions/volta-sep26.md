# Is the Beach Open

## Problem

Can you swim at this beach right now? The answer is spread across three public sources: the municipality's supervised-beach table, provincial park notices, and the provincial blue-green algae feed. I built a map that answers it in one place, with the official notice underneath each status. It was a Volta hackathon project, September 12–14, 2026, built with [@Harshil-varia](https://github.com/Harshil-varia).

## System

A Next.js app with MapLibre and Supabase. The server reads the three sources and turns them into one status per beach: open, advisory, closed or off-season. It runs without a database in fixture mode, using captured copies of the source pages, and against Supabase in live mode.

## Testing

Vitest checks the parsing against captured copies of each source page, and Playwright checks the map in a mobile browser. The statuses are not safety advice; check the official notice before you swim.

[Source code](https://github.com/EduardKakosyan/claude-hackathon-volta-sep26)

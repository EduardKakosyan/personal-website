# Is the Beach Open

## Problem

At the Halifax Claude Hackathon at Volta on September 12, 2026, a one-day competition, city staff brought five problems. One was beach status: Halifax tests its supervised beaches for bacteria and blue-green algae but posts the results on a page few people check, and the province posts park notices and algae reports on separate pages with no map. I built this with [@Harshil-varia](https://github.com/Harshil-varia). It puts the 35 beaches where a government tests the water, 18 municipal and 17 provincial, on one map, with the official words under each status.

## What I checked first

Before writing code I had research agents read the sources and look for existing tools. The only aggregator, Swim Guide, showed historical pass rates for most provincial beaches and had no public feed. The city's table turns away some automated requests, the algae feed names lakes instead of beaches, and by September every beach was off-season. So statuses are read on the server, each beach stores the exact name every source uses for it, and a labelled replay of past days became the way to show the map working.

## System

A Next.js app with MapLibre and Supabase on Vercel. Every hour the server reads the three sources and settles each beach on one status: open, advisory, closed or off-season. If a source can't be read, the beach keeps its last confirmed status and says when that was. Wind comes from Open-Meteo and ocean temperature from the Halifax Harbour buoy; lakes get no made-up temperature. You can follow a beach and get a push notification when its status changes.

## After the hackathon

The hackathon build proved out the data model. Over the next two days I took it to production: a drag-up sheet, a flat paper-style map in place of satellite terrain, nearest beaches first, a replay of every day of 2026 marked verified, inferred or calendar, and the production database.

## Testing

Vitest checks the parsing against captured copies of each source page; 742 unit and component tests passed at the last merge. Playwright runs on desktop Chromium, iPhone Chromium and WebKit in both orientations, and iPad WebKit, and CI has to pass before anything reaches main. The statuses are not safety advice; check the official notice before you swim.

[Live site](https://www.nsbeaches.ca) · [Source code](https://github.com/EduardKakosyan/claude-hackathon-volta-sep26)

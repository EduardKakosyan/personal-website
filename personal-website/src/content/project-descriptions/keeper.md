# Keeper

## Problem

Our team recorded calls with Fireflies, a bot that joins each meeting and keeps the transcripts on its own servers. I wanted a meeting memory on hardware we own: every transcript, summary and action item, searchable from a browser and from Claude or ChatGPT, with dictation in the same Mac app. Keeper is that replacement.

## System

The archive is one Python process with one SQLite database. Search uses SQLite's full-text index (FTS5), and you reach it through a web interface, a REST API and MCP tools for AI assistants. It runs on a DGX Spark, and teammates connect over a private network.

The Mac app notices when a Teams call takes the microphone, records the microphone and everything the Mac plays, transcribes and labels speakers on the Mac, and uploads when the call ends. On the server each new meeting goes into a summary queue. If the model is busy, the job waits and retries, so the Mac doesn't have to stay connected. Search works without a model.

A local model in my [dgx-autonomy](/projects/dgx-autonomy) loop wrote the first server and Mac app against a frozen brief and acceptance checks. I reviewed its builds and got the Mac app compiling. Since October 13 I've developed Keeper with Claude Code.

## Decisions

**Record like Fireflies, but visibly.** Meetings record automatically. A floating indicator offers Stop and Skip, and Keeper posts a short notice in the Teams chat.

**One access rule for everything.** Ownership and sharing are checked where the data is stored, so search, exports, web pages and MCP follow the same rule. A meeting that isn't yours looks the same as one that doesn't exist. A colleague can read a meeting you shared without being able to change it.

**Access through external assistants.** An assistant connected over MCP sends what it retrieves to its own provider. So each person connects with their own token, and the admin token is refused there.

**What stays on the Mac.** Dictated text never leaves it; only counts and categories sync. A Mac deletes its copy of a recording once the server confirms the upload.

**Summary versions and speaker labels.** Old summaries stay available after a new one is generated. Speaker names sit on top of the original labels, and an unnamed speaker stays unknown rather than being guessed from the attendee list.

**Not built:** task tracking, reminders, calendar changes, or voiceprints and training data pooled across people. Action items are kept as evidence from the meeting, not as tasks.

## Result

Keeper for Mac reached version 0.3.1 on October 21, 2026, the first update delivered through its own update feed. Teammates started testing it the day before. Next is a week-long pilot that decides whether we can cancel Fireflies.

The server has 934 Python tests, plus 23 regression probes from an earlier review, and the Mac core has 1,135 Swift tests. They cover account isolation, repeat imports, paging, recovery and MCP over a real server connection. The code is private.

## What broke

Search results came back worst-first. SQLite's BM25 score is a cost, where lower is better, and the ranking code treated it as relevance. A search for an exact phrase left the meeting containing it out of the top 20. The paging tests still passed because the right rows came back; they were just ranked wrong. A test on the reported score now pins the order.

Search paging in the web interface reached 200 of 757 matching meetings, because every page sliced the same first response. Paging by position in the ranked results made all 757 reachable over 38 pages, with no repeats or gaps.

The builder wrote the first Mac app in a Linux sandbox with no Apple compiler, so I handled the first native build. After 15 fixes it launched and recorded a 75-second panel with three speakers.

Early teammate testing surfaced meetings that uploaded with no audio. Now the Mac says why nothing was recorded, and the page says "No audio was recorded for this meeting."

# Keeper

## Problem

Meeting transcripts are useful only if you can find the decision again and check it against what was actually said. I built Keeper as a private archive, with a Mac app for capture and dictation and a server for retrieval.

## System

The server stores transcripts and summary versions in SQLite, indexes them with FTS5, and exposes a server-rendered web interface, a REST API and MCP tools. A configured model endpoint can summarize meetings; archive search does not require a model.

Live uploads enter a durable summary queue. If the inference machine is busy, the job waits and retries rather than making the Mac keep a connection open. Imports preserve the original summary instead of queuing the entire back catalogue for regeneration.

## Decisions

Ownership and sharing rules sit at the repository boundary, so search, exports, web pages and MCP read through the same access rule. A colleague can read a shared meeting without gaining the right to change it.

Summary versions remain available after regeneration. Speaker names are overlays on the original labels rather than destructive transcript rewrites. Unknown speakers stay unknown instead of being guessed from an attendee list.

Private storage does not make every connected assistant private. An external MCP client can send retrieved material to its provider. The credential used for that connection must match the access the person intended to grant.

## Result

Keeper provides a searchable archive with timestamped evidence, portable exports and model-optional retrieval. Its documented tests exercise account isolation, import idempotency, paging, recovery and MCP over a real server connection. These are implementation checks, not a claim of measured business impact.

The repository is currently private. Publication still requires the planned history scan and fixture review; no public source link is offered before that step.

## What broke

An earlier search implementation treated SQLite's BM25 cost as relevance and displayed results in reverse order. Paging tests stayed green because the candidate rows were right while their ranking was wrong. The lesson was to test the meaning of the score, not just whether pages were reachable.

Another version changed the candidate window with the requested page, producing duplicates and gaps. Keeping that window fixed per query made paging a traversal of one ranked result set rather than a new search on every page.

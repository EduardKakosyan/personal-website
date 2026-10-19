# Keeper

## Problem

Keeper is a private meeting archive for finding decisions and checking them against the transcript. I built a Mac app that captures meetings and handles dictation, and a server that stores and searches the archive.

## System

Transcripts and summaries live in SQLite with full-text search (FTS5). You can reach them three ways: a web interface, a REST API, and MCP tools for AI assistants. A model can write summaries, but search works without one.

When a meeting uploads, its summary goes into a queue. If the machine running the model is busy, the job waits and retries, so the Mac doesn't have to stay connected. Imported meetings keep their original summaries instead of regenerating the whole back catalogue.

## Decisions

**One access rule for everything.** Ownership and sharing are checked where the data is stored, so search, exports, web pages and MCP all follow the same rule. A colleague can read a meeting you shared without being able to change it.

**Summary versions and speaker labels.** Old summaries stay available after a new one is generated. Speaker names sit on top of the original labels instead of rewriting the transcript. If a speaker is unknown, Keeper leaves them unknown rather than guessing from the attendee list.

**Access through external assistants.** An AI assistant connected over MCP can still send what it retrieves to its own provider. So the credential for that connection should grant only the access the person meant to give.

## Result

A searchable archive with timestamps back to the source, exports you can take elsewhere, and search that doesn't need a model. The tests cover account isolation, repeat imports, paging, recovery, and MCP over a real server connection. I haven't measured business impact.

The code stays private until I've scanned its history and reviewed the test data.

## What broke

Search results came back in reverse order. SQLite's BM25 score is a cost, where lower is better, and an early version treated it as relevance, where higher is better. The paging tests still passed because the right rows came back; they were just ranked wrong. Those tests didn't check the meaning of the score.

Paging also produced duplicates and gaps for a while, because each page ran a slightly different search. Fixing the set of candidates per query made every page a slice of one ranked list.

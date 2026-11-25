# Keeper

## What

Meeting notes and dictation for a team, on hardware the team owns. A Mac app records and transcribes calls, and a small server keeps every meeting searchable for people and for their AI assistants.

## Why

We paid for a notetaker bot and a dictation app, and both sent client conversations to someone else's servers. Turning speech into text and tidying a paragraph are small jobs. Small open models do them on a machine we already own, with no bill per seat and no rate limit.

## Demo

There is no public demo, because the archive holds our team's meetings. The [write-up on my site](https://kakosyaneduard.ca/projects/keeper) walks through one meeting from the call to a searchable summary.

## Run it

The server is one Python process with one SQLite file. Install, configuration, running under systemd, importing from Fireflies and backup are covered section by section further down this README. Keeper for Mac is built from `mac/`; `mac/BUILD_ON_MAC.md` has the steps.

## How it's tested

The server has about 1,300 pytest tests and the Mac and iPhone code about 1,600 Swift tests. They cover who can see a meeting on every surface (web, REST and MCP), repeat uploads, paging, recovery after a crash and MCP over a real server connection. `tests/test_readme.py` fails when this README names a setting, command or route the code doesn't have.

## How it works

1. **Record, on the Mac.** When Teams takes the microphone, Keeper records two channels: the microphone and everything the Mac plays. No bot joins the call.
2. **Transcribe, on the Mac.** A streaming speech model writes the live transcript and a second model tells speakers apart. After the call a slower, more accurate model transcribes the recording again.
3. **Store.** The transcript and audio go to the server, which indexes them with SQLite full-text search.
4. **Summarise.** New meetings join a queue. A model behind any OpenAI-compatible endpoint writes the overview, decisions and action items. A busy GPU only delays a summary.
5. **Find.** The web page, the REST API and the MCP tools all read through one access rule: a meeting belongs to the person who recorded it.

Where a model is used: speech to text, telling speakers apart, summaries and tidying long dictations. Where it isn't: rules format spoken numbers and lists and protect web addresses, search is a keyword index, and each person's vocabulary is learned by counting spellings in their own meetings. A model's dictation cleanup replaces the rule-based text only if it passes a check, and Ask Keeper refuses an answer that cites a meeting the model wasn't shown.

`PROCESSORS.md` lists every service that touches meeting content and how to turn each one off.

## Status

In daily use by our team. A local model wrote the first version in my dgx-autonomy loop; I have built it since October 2026 with Claude Code, on branches reviewed and merged through pull requests.

## More

[Keeper: the problem, the choices and where AI fits](https://kakosyaneduard.ca/projects/keeper).

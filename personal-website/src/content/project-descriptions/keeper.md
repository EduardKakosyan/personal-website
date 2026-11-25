# Keeper

## The problem

Our team paid for two subscriptions to remember what was said: a notetaker bot that joined every call, and a dictation app. Both sent client conversations to someone else's servers, and neither could be changed to fit how we work.

Turning speech into text and tidying a paragraph are small jobs. They don't need a frontier model or a bill per seat. Small open models do them well on hardware we already own, with no rate limits. I built Keeper to replace both subscriptions.

## What it does

Keeper for Mac notices when a Teams call starts and records it. No bot joins the meeting. A live transcript runs during the call. When the call ends, the meeting goes to our Keeper server, which writes a summary with the decisions and action items.

Every meeting is searchable from a web page, and from Claude or ChatGPT over MCP. I can ask my assistant what we agreed with a client last month and it reads the transcript to answer.

The same app does dictation. Hold Fn, speak, and the text lands where the cursor is, cleaned up in the style chosen for that app.

## How it works

![How a meeting moves through Keeper: recorded and transcribed on the Mac, stored and summarised on our own server.](/images/projects/keeper.svg)

1. **Record, on the Mac.** When Teams takes the microphone, Keeper records two channels: my microphone and everything the Mac plays.
2. **Transcribe, on the Mac.** A streaming speech model writes the live transcript and a second model tells the speakers apart. After the call, a slower and more accurate model transcribes the recording again. No audio goes to a cloud speech service.
3. **Store.** The Mac uploads the transcript and the audio to our server, a DGX Spark we own.
4. **Summarise.** Each new meeting joins a queue, and an open-weights model on the same machine writes the overview, decisions and action items. If the GPU is busy, the job waits.
5. **Find.** Search is SQLite's built-in full-text index. The web page, the REST API and the MCP tools all read through one access rule.

## The choices

**Record without being asked, and show it.** A notetaker that has to be started gets forgotten. Recording starts by itself, and a small floating indicator shows it, with a Stop button.

**One file, one process.** SQLite with full-text search is enough for a team's meetings. There is nothing else to install, back up or keep running.

**One access rule.** A meeting belongs to the person who recorded it. Admins can't open it, and sharing is read-only. The rule sits where the data is read, so search, the API, the web page and MCP can't disagree. A meeting that isn't yours looks the same as one that doesn't exist.

**Each person connects their own assistant.** When Claude or ChatGPT reads a meeting, that text goes to their provider. So everyone signs in for themselves and reaches only their own archive.

**Left out on purpose:** tasks, reminders, calendar changes and voiceprints. An action item is a record of what was said, not a to-do list.

## Where AI fits

Models do the jobs that need one: turning speech into text, telling speakers apart, summarising a meeting and tidying a long dictation.

Plain code does the rest. Rules format spoken numbers and lists, and keep web addresses and file paths from being rewritten. Search is a keyword index, so it works with no model running. Keeper learns each person's vocabulary by counting how names and terms are spelled in their own meetings.

A model's answer is never used unchecked. Rules produce a usable version of every dictation first. A model's cleanup replaces it only if it passes a check: it can't add a greeting or change a number. Short dictations are cleaned by Apple's on-device model, and long ones by the model on our server, which stores nothing.

Ask Keeper, the question box on the web page, searches the archive first and shows the model only the lines it found. An answer citing a meeting the model wasn't shown is thrown away. With no model running, it returns the lines themselves.

## Where it is now

Keeper is our team's notetaker and dictation app. In November 2026 we switched off both subscriptions.

A local model wrote the first version in my [dgx-autonomy](/projects/dgx-autonomy) loop. I took it over in October and have built it since with Claude Code, on branches that are reviewed and merged through pull requests. It has nearly 2,900 automated tests.

Building it took weeks. Getting a whole team to use all of it takes longer, so Keeper has a page for that too. It shows where people have stopped using it and what would help.

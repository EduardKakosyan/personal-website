# Keystone

## Problem

I built most of AI-First's first internal dashboard. By mid-2026 the team skipped its scorecard in the weekly meeting. Each of its four stages, attract, convert, deliver and collect, squeezed a lot of work into one percentage that nobody could act on.

An audit showed the numbers were also wrong. The weekly snapshot job had stopped in January, so every trend arrow read "flat". Two stages were calculated twice, in SQL and TypeScript, with different rules. A finance sync had failed while still logging "completed".

![The old scorecard's four stages. Synthetic diagram, no company data.](/images/keystone/funnel.svg)

## Discovery

I brought in a UX researcher. She reviewed the old dashboard and comparable firms, then wrote an interview guide for each leadership seat. The guides tested specific options instead of asking for wishes: should the capacity view flag overbooked people, unassigned won work, or a thin pipeline first?

She wrote the questions and I ran the interviews to her script. The CEO's was a 77-minute one-on-one on a 16-question guide. The operations and finance lead answered a 30-question set, and I answered my own on custom development, adoption and reusable IP. The delivery lead's input comes next, so some pipeline definitions are still open.

People describe a tidier version of how they work, so I checked against behaviour: eight AI agents measured feature usage read-only in the production database, and I read months of Monday-meeting transcripts to see how project risk was discussed.

## Findings

**Every number already had a home.** Plans live in Linear, time in Outlook, money in QuickBooks and signed statements of work in SharePoint. The dashboard kept weaker copies.

**Definitions were missing or contested.** Nobody had written down what makes a lead qualified, what counts as a productized offer or what reusable IP is. The CEO and the operations lead disagreed on who the company view is for. Her decision register logged 13 conflicts like these.

**There were no plans to measure against.** A project can't be on budget if its original plan isn't recorded.

**The CEO wanted to ask, not browse.** He questioned building views up front when he could ask Claude for the data.

## Decisions

Much of the design is what we chose not to build:

- No file storage or task lists. SharePoint keeps files, Linear keeps tasks; Keystone links to them.
- No new time-tracking routine for staff.
- No copy of the cash forecast. QuickBooks stays the source, read-only.
- No red, amber or green without an approved threshold. Missing data reads "Data missing".
- No view without a meeting that uses it.
- No off-the-shelf CRM. MCP added on top of an old API wouldn't make AI the main way in.

Each remaining metric got a contract: an owner, the question it answers, its source, its cadence, and whether it's live or waiting for data. The researcher turned that into a prototype with 25 measures across eight views: leadership, strategy, capacity, delivery, finance, people, tech adoption and reusable IP.

![Eight synthetic scorecard wireframes, one per view.](/images/keystone/scorecards.svg)

She built it in Figma, then in HTML with sample data. After review we widened the definition of reusable IP, gave plans an optimistic, expected and pessimistic range, and tied capacity targets to job roles.

## Architecture

Keystone owns no data; it holds the other systems together, hence the name.

The old dashboard's MCP tools were hand-written, untested and drifting from the app. In Keystone, each operation is declared once in a capability registry with its input schema and permission, and the Claude tools are generated from it. Claude signs in as the person, so it reaches only what they can. A parity test checks that the same action from the app and from Claude writes the same record. If only one of the two can do a thing, it isn't finished.

![Synthetic architecture diagram: capability registry to MCP to an agent.](/images/keystone/capabilities.svg)

I designed the architecture and built the first phase: sign-in, the registry and the generated Claude tools. Developers on my team built most of what followed; I review and merge their work.

We're rolling Keystone out in phases. The first scorecard is due at the end of October 2026. The QuickBooks, Linear and SharePoint connectors come later, and the old dashboard runs until cutover, so there are no adoption numbers yet. The code is private.

## What was hard

**Definitions are owed by people, not code.** Several metrics wait for someone to agree a definition or accept ownership; if the proposed owner declines, the metric is cut.

**Data discipline.** Consistent naming was a constant fight, and only about half of the old opportunities migrated cleanly.

**Change management.** In the first brainstorm I said it mattered more than the software. It did.

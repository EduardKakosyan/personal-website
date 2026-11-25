# Keystone

## The problem

AI-First runs on SharePoint, Linear, QuickBooks and Outlook. Each holds part of the picture: files, tasks, money and time. None of them can answer a question that crosses two of them, such as whether a project made money or who has room for new work next month.

My first attempt was a dashboard I mostly built on my own, without asking the people who would use it. It collected far more than anyone read, and people stopped trusting its numbers. Its Claude tools were written by hand beside the app, so the two drifted apart.

Keystone is the second attempt. It started with the people instead of the screens.

## What it does

Keystone connects client, opportunity, project, person, time and money in one place. It keeps its own records for the things no other system owns: the pipeline, project plans, capacity and risks. For everything else it reads from the system that owns it and shows when it last checked.

That lets it answer questions no single tool can, such as which blocked projects in Linear also have an overdue invoice in QuickBooks.

Staff use it in the browser. They also use it from Claude. Nearly everything the app can do, Claude can do for them, with the same permissions.

## How it works

![One registry of operations serves both the web app and Claude, and both pass through the same permission checks.](/images/projects/keystone.svg)

Every operation is declared once in a registry: its name, a one-line description, the shape of its input, the permission it needs and the code that runs it. There are about 150.

The web app calls those operations. The Claude tools are generated from the same entries, so nobody writes a tool by hand. Both paths go through the same steps: check the input, check the permission, run as the signed-in person under the database's row-level rules, and write an audit record.

Claude signs in as the person, through a consent screen. It reaches what they can reach and nothing more.

Scheduled jobs read from QuickBooks, Linear, SharePoint and Outlook, and store what they find with the time it was fetched. If a connector goes quiet for twice its usual interval, Keystone flags it.

## The choices

**Start with interviews.** Before any design I interviewed our leadership team: the founder, the head of operations and the head of delivery, with my own answers as head of tech. Agents measured which parts of the old dashboard were being used. A business analyst, a Master of Digital Innovation student, turned that into a scorecard prototype we could argue over: 25 measures across eight views, with sample data.

**One registry for people and for Claude.** In the old dashboard, keeping the app and the AI tools in step was a rule people had to remember. Here a tool can't exist without the operation behind it.

**Keep the join, not the files.** SharePoint keeps files, Linear keeps tasks and QuickBooks keeps the ledger. Keystone links them. QuickBooks is read-only, permanently.

**Every metric has an owner.** A number on a scorecard names the role that owns it, the question it answers, where it comes from and how often it updates. A metric that is waiting for data says so instead of showing zero.

**The database enforces access.** No request carries an admin key. Every request runs as the person who made it, and about 1,500 tests check the row-level rules against a real database.

**Left out on purpose:** targets and status colours on anyone's capacity, and any view that no meeting uses.

## Where AI fits

There is no model inside Keystone. The numbers are SQL. The sentence under each metric that says why it matters comes from a template a person wrote. The alerts are rules, such as an opportunity nobody has touched in fourteen days, and each one opens a work item for a person.

The AI is the one each person already has. Our founder told me he would rather ask Claude for a number than open a page of charts. So Claude gets the same door as everyone else, and the same lock.

## Where it is now

We started in August 2026. I wrote the requirements and the technical design, then built the first phase myself: sign-in, the registry and the generated Claude tools. Developers on my team have built most of what followed, each working from tickets cut from the design. I review the Linear issues and what merges to main, and I still build some parts myself.

Keystone is deployed and we are rolling it out, switching features on one at a time. The old dashboard stays in charge until one planned switch-over. The code is private.

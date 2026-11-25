# lyfe

## The problem

I only buy software I can't build myself. I can't build a bank, a brokerage or accounting software, so I pay for those. I can build an app for my own routines and goals, and then it shows exactly what I need.

lyfe keeps those routines going, holds them to a few goals and shows where my money goes. I'm the only user.

It also keeps the data mine. My spending sits in lyfe's own database on a machine I run, not in a budgeting app's cloud. A model already runs there, so later I can point it at my finances without sending them to a model company. Today no model touches money.

An earlier attempt covered every part of my life at once, and I stopped using it. This one started with one routine.

## What it does

- **The gym.** I record a workout on my watch and it shows up in lyfe as a filled square. Four days with a workout keep the week. Nothing to type.
- **Breath training.** The phone runs the session, one tap per hold. Once my holds fill most of a round, the next session's rounds get longer.
- **Study.** A timed session on a subject. Four days a week keep the streak.
- **Weight.** Typed into the morning notification, shown as a seven-day average.
- **Food.** A meal I eat often is one tap. A packet is a barcode scan and a weight. Anything else is a photo and one line, or one of about 3,700 catalogue foods.
- **Goals.** Up to three at a time, each shown against a steady pace. lyfe never moves a date.
- **Money.** Spending by category for the month, straight from my bank accounts. Net worth by day, and how far I am from financial independence, shown without advice.

A missed week doesn't end a streak. Keeping the next week recovers it. Two missed weeks in a row end it.

## How it works

![The phone records what happened, the backend decides what it means, and two models do narrow jobs.](/images/projects/lyfe.svg)

An iPhone app in Swift talks to a Rust backend with PostgreSQL. The backend runs on a DGX Spark and is reachable only over a private Tailscale network, never from the public internet.

The backend is the only place that decides anything: whether a session counts, whether a streak is alive, what the next breath session is. The phone records what happened. Offline, it keeps recording and sends everything later. Each record carries an id made on the phone, so a resend counts once.

Workouts arrive from Garmin, which the backend checks every fifteen minutes. Bank transactions arrive through a read-only bridge, four times a day. The backend always asks; nothing outside can call in.

## The choices

**One authority.** With one user, two-way sync between phone and server buys nothing and risks the two disagreeing about a streak.

**Swift for the app, Rust for the backend.** Typing my weight into a notification, a timer that keeps going with the screen locked, and the barcode scanner all need Apple's own frameworks.

**Always on, locked down.** The Spark never sleeps, so the phone never depends on my laptop. lyfe has its own sign-in, a separate token for each device and a database with no network port. A nightly backup leaves the machine encrypted.

## Where AI fits

Two models, three narrow jobs.

A photo of a meal goes to an open-weights vision model on the Spark, which estimates what is on the plate. Its numbers are marked as an estimate, shown with a range, and kept apart from anything weighed or read off a label. An answer that can't be true, such as more protein than the food weighs, is thrown away.

A second model redraws the photo as a small illustration, and drew an icon for each food in the catalogue. It never touches a number.

Everything else is rules I can read: what counts as a session, how a streak recovers, the pace toward a goal, when a reminder is worth sending. Spending categories too: I sort each payee once, by hand, because a wrong category in a number I'm meant to trust is worse than an unsorted one.

## Where it is now

I started lyfe in November 2026 and built it with a coding agent from a written plan. Each step worked end to end, from capture to a screen, before the next began. All of it is on my phone, and the code is public.

Before any code I wrote a glossary of the words the app uses, and it grows with each step. "Streak", "recovery" and "estimate" mean one thing in the code, the app and my conversations with the agent.

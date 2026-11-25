# lyfe

## What

A private iPhone app that keeps my routines going and holds them to a few goals: the gym, breath-hold training, study, a morning weigh-in and logging what I eat. It also shows where my money goes, my net worth over time and how far I am from financial independence.

## Why

I only buy software I can't build myself. A bank or a brokerage I pay for; an app for my own routines and goals I can build, and then it shows exactly what I need. The data sits in lyfe's own database on a machine I run, not in a budgeting app.

An earlier attempt tried to cover every part of my life at once, and I stopped using it. This one started with one routine, and each step worked end to end, from capture to a screen, before the next began.

## Demo

None. It is built for one person and holds my own data. The [write-up on my site](https://kakosyaneduard.ca/projects/lyfe) shows how the pieces connect, and a debug build can show every screen with made-up data.

## Run it

The backend needs Rust and Docker; the app needs Xcode and `xcodegen`. The requirements and the first commands are below; `docs/development.md` has the stand-ins and debug settings, and `docs/operations.md` covers the Spark.

## How it's tested

The backend tests run the real API against a real PostgreSQL, with stand-ins for Garmin, the bank bridge and both models; they never contact the real services. The Swift package has its own tests for the app model, the breath timer, the network layer, food, money, goals, study and the lock.

## How it works

An iPhone app in Swift talks to a Rust backend with PostgreSQL. The backend runs on a DGX Spark and is reachable only over a private Tailscale network.

The backend is the only place that decides anything: whether a session counts, whether a streak is alive, what the next breath session is. The phone records what happened, keeps recording offline and sends it later, with an id made on the phone so a resend counts once.

Two models have three narrow jobs. A vision model estimates a meal from a photo; its numbers are marked as an estimate and kept apart from measured ones. A second model redraws the photo as an illustration and drew an icon for each food in the catalogue. Everything else is rules, and no model touches money.

`CONTEXT.md` defines the words the app uses. `docs/adr/` records each decision and what it costs.

## Status

In daily use. Built with Claude Code, one step of `docs/build-plan.md` at a time. The gym, breath, study, weigh-ins, food, goals and money are on my phone.

## More

[lyfe: the problem, the choices and where AI fits](https://kakosyaneduard.ca/projects/lyfe).

# dgx-autonomy

## What

A setup that lets a local open-weights model build software on its own for up to 40 hours on one NVIDIA DGX Spark. The work isn't finished when the model says so. It's finished when tests the model can't edit say so.

## Why

Putting a frontier model in a loop is well understood, and you pay for every token. I wanted to know how far an open model could get on a machine that sits on a desk, if I gave up speed and let it work for a day or two.

## Demo

Two apps it built are live: [Shoreline](https://eduardkakosyan.github.io/shoreline/) and [Camp Yahtzee](https://eduardkakosyan.github.io/yahtzee/). Each repository keeps its brief, its acceptance tests and every message sent to the builder.

## Run it

You need Linux, an NVIDIA GPU, Docker with the NVIDIA runtime, nftables and uv. Model memory and the network rules are specific to the machine, so start with `docs/operator-manual.md`.

```sh
uv sync
```

## How it's tested

```sh
uv run pytest -m "not dgx"
```

About 390 tests run without a GPU or a model. A separate set runs on the machine itself and covers killed controllers and crashed stacks, a forced conversation reset, the network rules and the protected tests.

## How it works

1. **Freeze.** The brief and the acceptance tests are locked and fingerprinted before the build starts.
2. **Build.** The model works in a locked-down container as an OpenHands agent. It can reach the internet for packages and documentation, but not the host or the local network.
3. **Hand off.** When a conversation fills up or gets stuck, the model writes a handoff note and a fresh conversation continues from it.
4. **Check the claim.** When the model says it is done, the controller saves a snapshot, runs each frozen test in its own throwaway container against the running demo, and rejects the result if the code changed during the test.
5. **Review.** A passing build can be held for a person, who accepts it or sends feedback as a user would.

The model writes the code. Plain code decides whether it is finished. A person decides whether it is good.

## Status

Built in September 2026 with Claude Code. It built Shoreline, Camp Yahtzee and the first version of Keeper, a meeting-notes app my team now uses.

## More

[dgx-autonomy: the problem, the choices and where AI fits](https://kakosyaneduard.ca/projects/dgx-autonomy).

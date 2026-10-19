# dgx-autonomy

## What

A controller for local coding agents that saves progress and submits builds to checks outside the builder's control.

## Why

I wanted to test what local models can build when persistence and independent verification matter more than quick generation.

## Demo

[Recorded build walkthrough](https://kakosyaneduard.ca/projects/dgx-autonomy). Shoreline and Camp Yahtzee are outputs, not guarantees for arbitrary briefs.

## Run it

The upstream README documents Linux, an NVIDIA GPU, Docker with its NVIDIA runtime, nftables and uv. Model memory and machine-specific networking need configuration; this is not a portable one-command install. Start with the upstream `docs/operator-manual.md` before launching a controller.

```sh
uv sync
```

## How it's tested

The documented non-hardware suite is:

```sh
uv run pytest -m "not dgx"
```

It was not run for this README pass. Actual builds also require frozen acceptance checks and human product review.

## How it works

I built the controller around OpenHands. It manages handoffs, isolated evaluators, snapshots and recovery. SGLang or llama.cpp serves the configured model. Human and Claude supervision supply briefs and product review; the local builder produces the app code.

## Status

Experimental local build infrastructure. The upstream README and operator manual are the setup evidence, inspected read-only; host-specific configuration must be reviewed before reuse.

## More

[Architecture and build evidence](https://kakosyaneduard.ca/projects/dgx-autonomy).

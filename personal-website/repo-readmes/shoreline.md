# Shoreline

## What

Weather, tides and sea conditions for a day at the water.

## Why

I set the direction to test whether a local coding agent could build a useful mobile app; a supervising Claude session wrote the brief and checks and reviewed each build as product lead.

## Demo

[Open Shoreline](https://eduardkakosyan.github.io/shoreline/).

## Run it

The upstream README documents `node tools/serve.js` from the repo root. It serves the static app on localhost:3000 without a build step.

## How it's tested

Upstream documents Playwright acceptance checks with intercepted Open-Meteo fixtures. Dependency and browser setup must follow the upstream instructions; the suite was not run for this draft.

## How it works

The browser reads Open-Meteo APIs. A local model built the app within dgx-autonomy; a supervising Claude session wrote the brief and reviewed it, and I accepted the result. Frozen checks and operator feedback are preserved in `loop/runs/`.

## Status

Public local-agent experiment; listed in the site's archive, not marked archived on GitHub. Evidence: upstream README and approved project registry.

## More

[Build context](https://kakosyaneduard.ca/projects/shoreline).

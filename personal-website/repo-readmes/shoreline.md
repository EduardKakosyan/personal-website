# Shoreline

## What

Weather, tides and sea conditions for a day at the water.

## Why

I supplied briefs and product review to test whether a local coding agent could build a useful mobile app.

## Demo

[Open Shoreline](https://eduardkakosyan.github.io/shoreline/).

## Run it

The upstream README documents `node tools/serve.js` from the repo root. It serves the static app on localhost:3000 without a build step.

## How it's tested

Upstream documents Playwright acceptance checks with intercepted Open-Meteo fixtures. Dependency and browser setup must follow the upstream instructions; the suite was not run for this draft.

## How it works

The browser reads Open-Meteo APIs. A local model built the app within dgx-autonomy; human and Claude supervision supplied briefs and reviews. Frozen checks and operator feedback are preserved in `loop/runs/`.

## Status

Public local-agent experiment; listed in the site's archive, not marked archived on GitHub. Evidence: upstream README and approved project registry.

## More

[Build context](https://kakosyaneduard.ca/projects/shoreline).

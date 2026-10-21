# Camp Yahtzee

## What

An offline dice game for a phone passed around a camp table.

## Why

I wanted real-dice scoring without a connection, and used the build as a local-agent verification exercise.

## Demo

[Play Camp Yahtzee](https://eduardkakosyan.github.io/yahtzee/).

## Run it

Upstream documents `node serve.mjs public 3000` to serve the built app and `node build.mjs` to rebuild it, from the repository root.

## How it's tested

The documented rules command is `node --test tests/rules.test.js tests/rules-oracle.test.js`. Playwright checks cover acceptance and later controls. No external tests were run for this draft.

## How it works

Rules, UI and offline storage support play on one device. The original local-agent build used dgx-autonomy with human product review; multi-step undo, restart turn, reset game and change players were added separately through CodeLayer.

## Status

Public experiment with later maintenance changes. Evidence: upstream README and project registry. Do not attribute all subsequent changes to the original local model.

## More

[Build and review notes](https://kakosyaneduard.ca/projects/yahtzee).

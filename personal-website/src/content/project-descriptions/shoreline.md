# Shoreline

A mobile-first companion for a day at the water: beach and fishing verdicts, tides, sea state, moon and weather. Inland locations get a weather view.

## Built by the local loop

Shoreline was built by Qwen3.8-Flash-Next on one DGX Spark inside dgx-autonomy, across three runs from September 24 to 28, 2026. The operator and a supervising Claude session supplied briefs and product reviews. The local builder wrote the app; a separate final commit added documentation and loop records.

## Evidence

The final run passed 19/19 frozen acceptance checks, according to the public build record. Each run records its brief, checks and operator messages. These are documented results, not tests rerun by this website.

The app calls Open-Meteo directly for weather and marine data.

[Try Shoreline](https://eduardkakosyan.github.io/shoreline/)

[Inspect the run records](https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs)

[How the build environment works](/projects/dgx-autonomy)

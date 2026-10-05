# Shoreline

Shoreline brings weather, tides, and sea conditions into one view for a day at the beach or a fishing trip. For inland locations, it shows the weather.

## Built by the local loop

This was one of the apps built with my [dgx-autonomy setup](/projects/dgx-autonomy). Qwen3.8-Flash-Next wrote it on my DGX Spark over three runs, from September 24 to 28, 2026.

I supplied briefs and reviewed the app with help from a supervising Claude session. A separate final commit added the documentation and build records.

## Evidence

The final build record reports 19 out of 19 acceptance checks passing. Those checks were fixed before evaluation, so the builder couldn’t edit them to make its code pass. The repository has the briefs, checks, and review messages for each run.

Weather and marine data come from Open-Meteo.

[Try Shoreline](https://eduardkakosyan.github.io/shoreline/) · [Read the build notes](https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs)

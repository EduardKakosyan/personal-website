# Shoreline

Shoreline is for deciding whether today is a day at the water. Search a coastal town and the first phone screen rates today Good, Fair or Poor for the beach and for fishing, with the reason in plain words. Below that come today's tides on a chart with dawn and dusk marked, the sea state, the moon and the forecast. Inland places get the weather and nothing about the sea.

## Built by the local loop

A local model, Qwen3.8-Flash-Next, wrote all of the app's code in my [dgx-autonomy setup](/projects/dgx-autonomy) on a DGX Spark: 42 commits over three runs, September 24 to 28, 2026. It started as a weather app. The first run used llama.cpp, and I stopped it to move the model to SGLang. The second run continued the same code through two rounds of review. Then I asked for tides, sea and fishing conditions, and the third run turned the app into Shoreline.

The model got briefs and product feedback, never code help. A supervising Claude session, acting as product lead on my instructions, wrote the Shoreline brief and checks, reviewed each claim on live data and drafted the feedback. My own commits on top add the README, the build records and the live-demo link.

## What review caught

Review on live data found a mistake in the brief itself. Its rule for a tide turn, an hour higher or lower than both neighbours, misses the flat tops and bottoms that are common in real hourly data. Sydney held −0.63 m at 14:00 and 15:00, so the chart showed a low the list left out. The amended rule counts a flat run as one turn. The same review caught a "next low" time that had already passed. The test fixtures had no flat runs, so the checks couldn't have found either problem.

## Evidence

The final run passed 19 of 19 automated acceptance checks (78 Playwright tests). They were frozen at launch, so the builder couldn't edit them. Two more criteria needed human judgment and passed on review. The repository has each run's brief, checks and every message the builder received.

Weather and marine data come from Open-Meteo, called from the browser with no key.

[Try Shoreline](https://eduardkakosyan.github.io/shoreline/) · [Read the build notes](https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs)

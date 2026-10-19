# HUGO

## What

A voice assistant running speech recognition, reasoning, tools and speech synthesis on a DGX Spark, with a Reachy Mini robot body.

## Why

I built HUGO to explore a conversational interface whose inference runs on hardware I control.

## Demo

No current public interactive demo is verified. The site explains the voice loop.

## Run it

The upstream README documents separate vLLM, speech-recognition and speech-synthesis environments, plus the robot SDK. On the configured robot machine it uses `scripts/setup_service_venv.sh` for each service and `uv sync --group robot` for the main environment. Service installation changes the host; review the upstream operational notes before running it. This is not a laptop-only quickstart.

## How it's tested

Upstream documents `pytest tests/unit`, `mypy`, `ruff check .` and `ruff format --check .` after environment setup. Unit tests fake hardware boundaries. Integration tests need live services on the DGX. Neither suite was executed for this draft.

## How it works

Parakeet handles transcription, Nemotron through vLLM handles reasoning, and Qwen3-TTS produces streamed speech. Wake detection and voice-activity detection gate the conversation. The current Python implementation supersedes the older Go version.

## Status

Personal hardware project. Setup and test statements are based on the current public README; hardware readiness and end-to-end operation have not been independently checked here.

## More

[HUGO voice-system notes](https://kakosyaneduard.ca/projects/hugo).

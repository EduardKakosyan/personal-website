# VoxCoach

VoxCoach is a practice tool for sales discovery calls at AI-First Consulting. You talk to a simulated buyer, then get feedback on the conversation. Speech recognition, the language model, and speech synthesis run locally on Apple Silicon.

It was built through [Claude Autonomous](/projects/claude-autonomous), with Claude Code working across more than twelve nightly runs.

## Practising a call

The buyer has a role, a set of concerns, and a level of technical knowledge. The conversation moves from introductions into questions about their work, then toward a proposed next step.

After the call, a separate model reviews it against seven criteria based on Pollard’s consultative selling framework and AI-First’s approach. These include understanding the buyer’s tools, identifying a specific workflow, and agreeing on a next step. The feedback and session history are saved for later review.

## The voice loop

Browser audio travels over a WebSocket to Silero for voice detection and voxtral.c for transcription. Qwen generates a response, and Kokoro turns it into speech.

Speech synthesis starts as sentences become available while the model continues writing. If the user interrupts, the application cancels the queued speech. There are also live hints during a call.

## What it runs on

The backend is written in Go, with the frontend embedded in the binary. Qwen runs through Ollama, and the local database stores sessions and feedback. The repository describes the voice components and their fallback options.

[Source code and setup](https://github.com/EduardKakosyan/voxcoach)

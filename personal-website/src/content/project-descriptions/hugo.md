# HUGO

HUGO is a voice assistant for my Reachy Mini robot. Speech recognition, the language model, tool calls, and speech synthesis all run locally on my DGX Spark.

## How it works

The robot’s microphone picks up speech, NVIDIA Parakeet transcribes it, and Nemotron processes the request through vLLM. Qwen3-TTS generates the spoken response, which plays through the robot’s speaker.

openWakeWord detects the wake word, and Silero detects when someone is speaking.

## Talking to HUGO

HUGO starts speaking as sentences become available, rather than waiting for the full response. It acknowledges tool calls and supports follow-up questions without requiring the wake word again. The application also handles interruptions and tracks the conversation state.

## Testing

Hardware interfaces let me test conversation state and interruptions with simulated components. Integration checks on the DGX test the full sequence from speech recognition to a spoken response.

This version uses Python and the DGX Spark. The earlier version was written in Go.

## Documentation

- [Source code and setup](https://github.com/EduardKakosyan/hugo)
- [Architecture decisions](https://github.com/EduardKakosyan/hugo/tree/main/docs/adr)

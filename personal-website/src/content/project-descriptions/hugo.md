# HUGO - Helpful Universal Guide & Organizer

**Voice-First Agent Platform for Reachy Mini Robot**

---

## Project Overview

HUGO is a voice-first agent platform written in Go that orchestrates tools, controls a Reachy Mini robot, and communicates primarily through speech. The agent talks to you while it works — not after it's done.

**The Idea:** A physical desktop companion that listens, acts on your behalf, and responds with voice — all through natural conversation in a browser-based interface.

**The Architecture:** Browser Mic → WebSocket → VAD → STT → LLM Agent (Claude) → Tool Execution → TTS → Audio Playback

## Technical Architecture

### Core (tRPC-agent-go)

Single agent powered by Claude Sonnet 4 via tRPC-agent-go, a production-grade orchestration framework supporting:

- **Streaming ReAct loop** — Observe, think, act, with real-time event emission
- **Tool calling** — `current_time`, `calculator`, `look_at` (robot control)
- **Concurrent event consumer** — Agent runner and voice pipeline operate independently via goroutine channels

### Voice Pipeline (All Local)

Full speech processing running on-device with no cloud dependency:

- **Voice Activity Detection**: Silero VAD (ONNX Runtime, <20ms)
- **Speech-to-Text**: Moonshine Tiny (sherpa-onnx, quantized, local)
- **Text-to-Speech**: Kokoro-82M (MLX) with OpenAI API fallback
- **Speech Queue**: Non-blocking buffered channel with barge-in support

### WebSocket Server

Real-time browser communication with structured message protocol:

- Streaming response chunks, tool call events, and tool results
- Goroutine-isolated per-connection handlers
- JSON message protocol for extensibility

### Concurrent Design

The core UX innovation is **overlapped execution**:

- Agent keeps thinking while TTS synthesizes previous sentences
- User can barge-in (interrupt) — context cancellation propagates through runner, consumer, and speech queue
- Non-blocking speech queue means the agent never waits for audio playback

## Technology Stack

- **Language**: Go 1.25
- **Agent Framework**: tRPC-agent-go v1.6.0 (streaming ReAct loop)
- **LLM**: Claude Sonnet 4 (via OpenAI-compatible endpoint)
- **VAD**: Silero ONNX
- **STT**: Moonshine Tiny (sherpa-onnx, quantized)
- **TTS**: Kokoro-82M (MLX), OpenAI TTS fallback
- **Audio**: gen2brain/malgo (miniaudio, cross-platform)
- **Server**: gorilla/websocket + net/http
- **Robot**: Reachy Mini (integration in progress)

## What's Been Built

- **Text Agent** — Full agentic conversation with tool calling and streaming responses
- **Tool System** — Extensible tool registration with current_time, calculator, look_at
- **WebSocket Server** — Browser-based real-time communication with structured protocol
- **Voice Pipeline** — VAD, STT, TTS interfaces and implementations with speech queue
- **Concurrent Architecture** — Event consumer pattern enabling overlapped agent/voice execution

---

**Links:**

- [GitHub Repository](https://github.com/EduardKakosyan/hugo)

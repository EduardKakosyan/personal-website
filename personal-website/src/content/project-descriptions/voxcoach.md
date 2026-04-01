# VoxCoach

**100% Local Voice Sales Training Platform**

---

## Project Overview

VoxCoach is a voice-driven sales training simulator built for AI-First Consulting. It simulates realistic discovery calls where users practice consultative selling with LLM-driven buyer personas — all running 100% offline on Apple Silicon with sub-800ms end-to-end voice latency.

**The Problem:** New consultants need to practice discovery calls before engaging real prospects, but role-playing with colleagues doesn't scale and doesn't provide consistent, objective feedback.

**What We Built:** A real-time voice conversation with a simulated buyer who follows a realistic 6-phase discovery call flow, scored against Pollard's 7-step consultative selling framework with AI-First Consulting-specific criteria.

## Technical Architecture

### Voice Processing Pipeline (<800ms end-to-end)

```
Browser mic (16kHz PCM Int16)
  → WebSocket frame
  → VAD (Silero ONNX, <20ms)
  → STT (voxtral.c Metal GPU, <200ms)
  → LLM (Qwen 3 8B streaming, <400ms first token)
  → Sentence buffer (stream to TTS while LLM continues)
  → TTS (Kokoro MLX, <150ms first audio chunk)
  → Audio queue with cancellation (barge-in support)
  → WebSocket → Browser playback
```

LLM and TTS overlap — while TTS renders one sentence, the LLM generates the next. Barge-in instantly flushes the queue and cancels in-progress synthesis.

### 6-Phase Discovery Call Simulation

The simulated buyer follows a realistic consultative sales flow:

1. **Greeting** — Buyer speaks first, casual opening
2. **Context Sharing** — Buyer explains why they're calling
3. **Consultant Intro** — Brief AI-First Consulting overview
4. **Discovery** — Questions about workflows, tools, pain points
5. **Solution Alignment** — Propose bounded next step
6. **Close** — Mutual commitments and friendly goodbye

### Scoring System

Post-call evaluation on 7 AI-First criteria using Qwen 3 14B:

- Identified AI readiness level
- Scoped narrow workflow (not broad transformation)
- Understood buyer's current tech stack
- Quantified business impact (time/cost saved)
- Matched to right service (Accelerator, Custom Dev, or Fractional CTO/CAIO)
- Clear next step proposed
- Professional tone maintained

### 5 Buyer Archetypes

Each persona has distinct pain points, technical literacy, and buying authority — CTO, Head of Ops, VP Engineering, and more.

## Technology Stack

- **Language**: Go 1.24 with chi v5 HTTP router
- **STT**: voxtral.c (Metal GPU via CGo) with whisper.cpp fallback
- **VAD**: Silero VAD (ONNX Runtime)
- **LLM**: Qwen 3 8B (real-time conversation) / 14B (post-call scoring) via Ollama
- **TTS**: Kokoro-82M (MLX) with Piper TTS fallback
- **Database**: Supabase local stack (PostgreSQL 15 + PostgREST + GoTrue auth)
- **Frontend**: Vanilla JS embedded via `go:embed` (single binary distribution)
- **WebSocket**: coder/websocket with compression

## Key Features

- **100% Offline** — All audio processing, LLM inference, and scoring runs locally on Apple Silicon
- **Real-Time Voice** — Sub-800ms end-to-end latency with overlapped LLM/TTS streaming
- **Barge-In Support** — Interrupt the speaker mid-sentence naturally
- **Live Coaching** — Hints during the call to guide technique
- **Post-Call Feedback** — Detailed breakdown on each scoring criterion
- **Progress Tracking** — Session history and improvement trends in PostgreSQL
- **Single Binary** — Frontend embedded in Go binary, no separate JS build needed

---

**Links:**

- [GitHub Repository](https://github.com/EduardKakosyan/voxcoach)

# HUGO - Helpful Universal Guide & Organizer

**Voice-First Personal Assistant Embodied in a Reachy Mini Robot**

---

## Project Overview

HUGO is a voice-first personal assistant that lives inside a Reachy Mini desktop robot. It uses multi-agent AI orchestration to help manage email, calendar, project management, meeting transcripts, and general conversation — all controlled through natural voice commands.

**The Idea:** Instead of switching between a dozen apps and tabs throughout the day, just talk to a robot on your desk. HUGO listens, understands what you need, routes your request to the right specialist agent, and responds with both voice and physical robot expressions.

**The Interaction Loop:** Voice Input → Voice Activity Detection → Speech-to-Text → Semantic Intent Routing → Specialist AI Agent → Text-to-Speech → Robot Expression & Animation

## Technical Architecture

### 7 Specialist AI Agents (CrewAI)

Each user utterance gets classified by a semantic router and dispatched to the right agent:

- **Email Agent** — Read, search, summarize, draft, and send emails via Microsoft Graph
- **Calendar Agent** — View schedule, check availability, create events via Microsoft Graph
- **Linear Agent** — View assigned issues, create tickets, update status via Linear GraphQL API
- **Fireflies Agent** — Search meeting transcripts, extract action items and decisions via Fireflies.ai
- **Vision Agent** — Analyze camera feed, describe scenes, read text using Qwen3-VL
- **General Agent** — Conversation, general knowledge, small talk
- **Orchestrator** — Routes and synthesizes across all agents for complex multi-domain requests

### Local-First Voice Pipeline (Apple Silicon / MLX)

~90% of all inference runs entirely on-device:

- **Voice Activity Detection**: Silero VAD via PyTorch
- **Speech-to-Text**: Whisper V3 Turbo via mlx-audio
- **Text-to-Speech**: Kokoro-82M via mlx-audio
- **Voice Pipeline Framework**: Pipecat

### LLM Inference with Fallback Chain

1. **Primary (local)**: Qwen3-32B via mlx-lm (4-bit quantized on Apple Silicon)
2. **Cloud fallback tier 1**: Gemini 2.5 Flash
3. **Cloud fallback tier 2**: Claude Sonnet 4.5 (for the hardest tasks)

### Sub-Millisecond Intent Routing

Uses nomic-embed-text V2 (Mixture of Experts) semantic embeddings via the semantic-router library to classify user utterances into 7 categories before any LLM call — making routing nearly instantaneous.

### MCP (Model Context Protocol) Servers

Each external service is implemented as a standalone FastMCP server:

- **Microsoft Graph** — Email, calendar, files via Azure Identity + msgraph-sdk
- **Linear** — Issue and project management via Linear GraphQL API
- **Fireflies.ai** — Meeting transcript search via Fireflies GraphQL API

### Robot Control

- **Reachy Mini SDK** — Head movement, antenna-based emotional expressions (happy, sad, thinking, surprised, wiggle), body rotation, camera capture
- **Simulation mode** (`--sim`) for development without hardware
- **Text-only mode** (`--no-voice`) for testing agent logic

## Technology Stack

- **Language**: Python 3.12 with strict mypy typing
- **Agent Framework**: CrewAI with YAML-configured agents and tasks
- **Voice**: Silero VAD, Whisper V3 Turbo, Kokoro-82M, Pipecat (all via MLX)
- **LLMs**: Qwen3-32B (local), Qwen3-VL 4B (vision), Gemini 2.5 Flash, Claude Sonnet 4.5
- **Semantic Routing**: nomic-embed-text V2 via semantic-router
- **MCP Servers**: FastMCP for Microsoft Graph, Linear, Fireflies.ai
- **Robot**: Reachy Mini SDK (Pollen Robotics)
- **Data Modeling**: Pydantic v2 for structured outputs
- **Package Management**: uv with hatchling build backend
- **CI/CD**: GitHub Actions, Ruff, mypy (strict), pytest, Bandit, Gitleaks, commitlint

## Key Features

- **Voice-First Interaction** — Speak naturally; the robot listens, processes, and responds with voice and physical expressions
- **Privacy-First** — 90% of inference runs locally on Apple Silicon, no data sent to cloud unless the local model can't handle it
- **Approval Gates** — Safety mechanism requiring explicit confirmation before sending emails, creating issues, or scheduling events
- **Physical Embodiment** — Robot antenna emotions and head movements give the assistant personality and presence
- **Simulation Mode** — Full development experience without robot hardware

---

**Links:**

- 📁 [GitHub Repository](https://github.com/EduardKakosyan/hugo)

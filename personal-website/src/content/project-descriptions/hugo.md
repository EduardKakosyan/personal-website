# HUGO

HUGO is a voice assistant for a Reachy Mini robot. The wake word, speech recognition, the language model and speech synthesis run on a DGX Spark that my teammates also use. Only tools such as web search reach the internet.

Earlier versions used Gemini, local models on a Mac, and a Go agent calling Claude while I learned Go. The robot's SDK is Python-only, so in July 2026 I rewrote it in Python for the DGX (ADR 0001).

## How it works

openWakeWord listens for "hey hugo", using a model I trained overnight on the DGX from 10,000 synthetic clips. Silero marks the end of speech, Parakeet transcribes it once, and Nemotron-3-Super answers through vLLM. Qwen3-TTS speaks the reply through the robot.

Each model runs in its own process and Python environment (ADR 0005). Everything loads when HUGO starts and unloads when it sleeps, even after a crash, so my teammates get the memory back (ADR 0002).

## Talking to HUGO

The first DGX version took more than 40 seconds to answer "What can you do?" and then recited its own instructions: the model's hidden reasoning was being spoken. With reasoning separated and switched off, and each sentence spoken as soon as it is generated, a test got the first sentence back in 1.44 seconds.

After a reply the microphone stays open for about six seconds for a follow-up. "Stop" ends the conversation and "go to sleep" shuts everything down.

I planned for any speech to interrupt HUGO, but without echo cancellation it heard its own voice and kept cutting itself off. For now only the wake word interrupts it.

## Testing

Unit tests fake the robot and models, so the conversation states are tested without hardware. On the DGX, integration tests check that reasoning never reaches the speaker, and one runs without a person: HUGO's voice asks a question, its speech recognition transcribes it, and the model answers.

Live sessions found what tests could not: a hardware volume control left at -23 dB, a 100 ms pause rule that cut people off mid-sentence, and a microphone clipping while the robot spoke. In the last live session, in July 2026, first audio took about 5.3 seconds; the target is 3. HUGO is a working prototype, and echo cancellation is next on the backlog.

## Documentation

- [Source code and setup](https://github.com/EduardKakosyan/hugo)
- [Architecture decisions](https://github.com/EduardKakosyan/hugo/tree/main/docs/adr)

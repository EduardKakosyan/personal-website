# dgx-autonomy

## The problem

Putting a frontier model in a loop and letting it write code is well understood, and you pay for every token. I wanted to know how far an open-weights model could get on a computer that sits on a desk, if I gave up speed and let it work for a day or two.

The machine is an NVIDIA DGX Spark. It writes about 20 tokens a second, a fraction of what a data centre does. The bet was that patience matters more than speed, as long as the model stays on track and something other than the model decides when the work is done.

## What it does

I give it a written brief and a set of acceptance tests. It builds the app alone for up to 40 hours, with nobody answering its questions, though I can send product feedback while it works. I come back to a running demo and a report that keeps what the model claimed apart from what the tests proved.

## How it works

![One run: the brief and tests are frozen, the model builds in a sandbox, and its claim to be finished is checked from outside.](/images/projects/dgx-autonomy.svg)

1. **Freeze.** The brief and the tests are locked and fingerprinted before the build starts.
2. **Build.** The model works inside a locked-down container as an OpenHands agent. It plans, writes code, runs its own tests and serves a demo. It can reach the internet for packages and documentation, but not the host or the local network.
3. **Hand off.** When the conversation fills up or the model gets stuck, it writes a handoff note and a fresh conversation picks up from it.
4. **Check the claim.** When the model says it is finished, that is a claim. The controller saves a snapshot of the code and runs each frozen check in its own throwaway container against the running demo. If the code changed during a check, the result is thrown out and the check runs again. A crashed test runner never counts as a pass.
5. **Review.** A passing build can be held for review. I open the demo, then accept it or send feedback as a user would.

## The choices

**Use OpenHands for the agent loop.** The loop of think, act and observe is a solved problem. My work is the controller around it: memory, isolation, evaluation and recovery.

**Tests the builder can't edit.** The model can read the tests, but the folder is read-only to it and the fingerprint is checked again before every evaluation. Local models say "done" early and with confidence. Before a run, a dry run checks the checks: each one has to fail when there is no app yet.

**Notes instead of a memory system.** A handoff is a structured note the next conversation reads. Anything marked done has to point at a file or a test run.

**Measure before switching.** On one build, llama.cpp slowed from about 25 tokens a second to 8 as the conversation grew. I qualified SGLang on the box first, where it read prompts five times faster, and on the next build it held 21 to 25.

**Survive a crash.** Every step is written down before it happens, so a killed controller or a reboot picks up the same run and the same conversation.

## Where AI fits

The model writes all of the code. Plain code decides whether it is finished. A person decides whether it is good.

That last part earned its place. In one review the number keys in the Yahtzee app were drawn so that a 4 read as a 3. Every check had passed; none of them could see it.

Claude is here too, as the supervisor. A Claude session wrote the briefs and tests for two of the apps and reviewed the demos with me. The local model built and the frontier model managed.

## Where it is now

I built the controller in a week in September 2026 with Claude Code, after writing the research, the requirements and the design first. It has built three things: [Shoreline](/projects/shoreline), a beach and fishing conditions app; [Camp Yahtzee](/projects/yahtzee), a score keeper for one phone passed around a camp table; and the first version of [Keeper](/projects/keeper).

Before a long build I reserve the machine: the controller stops one other model service, tells its users it is busy, and starts it again when the run ends.

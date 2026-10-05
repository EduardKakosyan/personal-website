# dgx-autonomy

I built dgx-autonomy to run a coding agent on my DGX Spark and let it keep working across conversations. It saves progress, recovers from interrupted runs, and submits code to tests the agent can’t change.

## What I built around the agent

OpenHands runs the coding loop. My part is the controller around it: managing handoffs, isolating the build and test environments, checking a fixed version of the code, and deciding when to pause for review.

Shoreline and the original Camp Yahtzee release were built with this setup. Briefs and product reviews came from me and a supervising Claude session; the local model wrote the app code.

## Build notes

[Source code and architecture](https://github.com/EduardKakosyan/dgx-autonomy)

[Shoreline build records](https://github.com/EduardKakosyan/shoreline/tree/main/loop/runs)

[Camp Yahtzee build records](https://github.com/EduardKakosyan/yahtzee/tree/main/loop)

# Camp Yahtzee

Camp Yahtzee is for passing one phone around a camp table. Players can use real or on-screen dice, keep a tally across games, and play offline after installing it.

## Autonomous original release

The original version was built with my [dgx-autonomy setup](/projects/dgx-autonomy). Qwen3.8-Flash-Next ran on one DGX Spark and worked through four conversations over about 24 hours on September 28–29, 2026. The run included a brief and two rounds of product feedback.

## Verification and attribution

The build record reports 24 out of 24 acceptance tests passing. The agent also checked the scoring rules across all 7,776 possible rolls against a separate reference implementation.

Undo, reset, and game-management controls were added later through CodeLayer. Those changes are in the app you can play today; the local agent built the original release.

[Play Camp Yahtzee](https://eduardkakosyan.github.io/yahtzee/) · [Read the build notes](https://github.com/EduardKakosyan/yahtzee/tree/main/loop)

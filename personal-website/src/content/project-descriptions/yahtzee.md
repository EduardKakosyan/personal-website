# Camp Yahtzee

Official-rules Yahtzee for one phone passed around a camp table. It supports real or on-screen dice, multiple players, a session tally, and offline play after installation.

## Autonomous original release

The original release was built by Qwen3.8-Flash-Next, served by SGLang on one DGX Spark in dgx-autonomy. It worked across four conversations over about 24 hours of wall-clock time on September 28–29, 2026. People supplied a brief and two rounds of product feedback.

## Verification and attribution

The original release passed 24/24 frozen acceptance tests. The agent’s own rules audit covered all 7,776 possible rolls against an independent oracle. These are results reported in the public build record.

Later undo, reset and game-management controls were added separately through CodeLayer. The current app includes that later work; autonomous authorship refers to the original release.

[Play Camp Yahtzee](https://eduardkakosyan.github.io/yahtzee/)

[Inspect the build record](https://github.com/EduardKakosyan/yahtzee/tree/main/loop)

[The build environment](/projects/dgx-autonomy)

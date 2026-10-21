# Camp Yahtzee

Camp Yahtzee is for one phone passed around a camp table. It plays the official rules for 1 to 8 players, with real dice at the table or dice on the phone. It keeps a tally across games and plays offline once it's on the home screen.

## Autonomous original release

I asked for official-rules Yahtzee that felt better than a paper scoresheet, for one iPhone at camp, with more players and several games in a row. The original release was built in my [dgx-autonomy setup](/projects/dgx-autonomy). Qwen3.8-Flash-Next, running on one DGX Spark, wrote it across four conversations in about 24 hours on September 28–29, 2026. A supervising Claude session turned my request into the brief and its checks, and reviewed the builds.

All 24 checks were green about two hours in. Then I clarified something the brief had missed: we roll real dice at the table, and the phone only keeps score. That became the first round of feedback, and real-dice mode, with a keypad for entering the five faces, became the main path. The second round fixed a bug no check could see. A count badge covered a pip on each keypad key, so the 4 key looked like a 3.

## Verification and attribution

Both of the builder's completion claims passed all 24 frozen acceptance tests, run in separate containers. The builder also wrote its own rules-engine tests, including a check of all 7,776 possible rolls against a second scorer it wrote differently on purpose. The review before the keypad fix played two full real-dice games by script, with 3 and 8 players over 143 turns, and checked every box value against an independent rules implementation. It found no scoring errors.

The original release had an Undo for the last recorded box. Undo across several turns that survives a reload, restart turn, reset game and change players were added on October 1 through CodeLayer, without the DGX model. Those changes are in the app you can play today.

[Play Camp Yahtzee](https://eduardkakosyan.github.io/yahtzee/) · [Read the build notes](https://github.com/EduardKakosyan/yahtzee/tree/main/loop)

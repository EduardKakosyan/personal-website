# GitHub publication checklist

Closeout update (2026-10-20): the website redesign, resume and custom monogram are deployed to production and merged into main through `3389ad9`. The corrected profile README was republished to `EduardKakosyan/EduardKakosyan` main as `69ec8988a6daf065fd6c516807bce5fc79f82379`. The positioning is forward deployed AI development, not GTM. The production narrator and private-term secrets are configured. The CI workflow now passes HIDDEN_TERMS to tests and requires it on hosted branch builds. Repository privacy changes, audits, archiving, deletions and other repository README publication remain separately approved work, not website launch blockers.

## Profile and privacy

- [x] Approve the generated profile README voice and facts (user approved Phase 5 and publication).
- [x] Publish the generated README to the profile repository (profile main only, API commit `6a867472810d905c73b0f373450923aac35d34ad`).
- [ ] Set bio to "Forward Deployed AI Developer in Halifax. Lead AI Developer at AI-First Solutions. Local AI systems and coding-agent loops." Blocked: the current GitHub CLI login lacks the user scope; edit the bio manually or authorize that scope.
- [ ] Link and verify dev@ai-first.ca on the account without rewriting history.
- [ ] Enable private contribution counts after reviewing privacy implications.
- [ ] Run a full-history gitleaks scan of Keeper in its own repository; resolve findings privately.
- [ ] Review Keeper fixtures, transcripts, recordings, configuration and history for private data; sanitize before publication.
- [ ] Separately approve making Keeper public after both audit gates pass; then update the site's described-only boundary and regenerate the profile.
- [ ] Pin Keeper only after approved publication.
- [ ] Pin dgx-autonomy.
- [ ] Pin hugo.
- [ ] Pin claude-hackathon-volta-sep26.
- [ ] Pin personal-website.
- [ ] Leave the sixth pin unassigned pending explicit selection and clearance.
- [x] Add HIDDEN_TERMS as a GitHub Actions secret using the private comma-separated list; never commit or log its values.
- [x] Pass that secret as HIDDEN_TERMS in the CI test step. Hosted push builds fail if the list is missing; fork PRs can still run without secrets. Confirm the hosted scan in the closeout CI run.

## README publication

Recheck source, attribution, licensing, unknown setup instructions and demo availability before each push. External commands were inspected, not executed here.

- [ ] Approve and publish keeper.md after audit and verification of setup/tests.
- [ ] Approve and publish dgx-autonomy.md.
- [ ] Approve and publish hugo.md.
- [ ] Approve and publish claude-hackathon-volta-sep26.md after confirming dates and team credit.
- [x] Approve and publish the root personal-website README with the website changes (merged into main).
- [ ] Approve and publish shoreline.md.
- [ ] Approve and publish yahtzee.md.
- [ ] Approve and publish atlantic-ai-conference-hackathon.md after verifying setup.
- [ ] Approve and publish volta_hackathon.md after verifying imports and permissions.
- [ ] Approve and publish q-learning-network-sim.md after checking its environment.
- [ ] Approve and publish exosky_nasa.md after verifying backend setup and attribution.

## Descriptions and topics

- [ ] Review/set Keeper: private meeting archive; python, sqlite, mcp (after publication approval).
- [ ] Review/set dgx-autonomy: local coding-agent controller; python, local-ai, docker.
- [ ] Review/set hugo: local robot voice assistant; python, voice, robotics.
- [ ] Review/set the newer Volta repo: beach-status map; nextjs, maps, open-data.
- [ ] Review/set personal-website: engineering portfolio; nextjs, typescript, portfolio.
- [ ] Review/set shoreline: coastal conditions; weather, local-ai.
- [ ] Review/set yahtzee: offline camp dice game; offline, game.
- [ ] Review/set the HealthByte repo: simulated article reactions; agents, hackathon.
- [ ] Review/set the older Volta repo: study assistant workflows; n8n, hackathon.
- [ ] Review/set q-learning-network-sim: routing simulation; reinforcement-learning, simulation.
- [ ] Review/set exosky_nasa: exoplanet sky explorer; astronomy, hackathon.

## Historical cleanup

Verify ownership and dependencies before each action. Fill ARCHIVED.md with verified learning notes and dates. Deletions require fresh per-repository approval and a backup decision.

- [ ] Approve an archived README for makemore, then archive it.
- [ ] Approve an archived README for particle-simulator-rust, then archive it.
- [ ] Approve an archived README for ParticleSimulator, then archive it.
- [ ] Approve an archived README for studia, then archive it.
- [ ] Approve an archived README for FinSync, then archive it.
- [ ] Approve an archived README for GroupProject, then archive it.
- [ ] Approve an archived README for CTFs-Dal, then archive it.
- [ ] Approve an archived README for high-tides, then archive it.
- [ ] Separately approve making scratch private after reviewing consequences.
- [ ] Separately approve making obi private after reviewing consequences.
- [ ] Optionally approve making dotfiles private after reviewing dependencies.
- [ ] Reconfirm fork status and backup needs, then explicitly approve deletion of textream-v2.0.
- [ ] Reconfirm fork status and backup needs, then explicitly approve deletion of n8n-cargrep.

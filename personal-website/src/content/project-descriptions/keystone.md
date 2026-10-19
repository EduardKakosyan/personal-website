# Keystone

## Discovery

Our old internal dashboard had inaccurate numbers, and people barely used it. A UX research contractor and I interviewed the team about the information they needed and where their files were stored.

I designed Keystone's architecture and lead a team of five developers building it. I also work on the code.

## Definitions

The scorecard covers four stages: attract, convert, deliver, collect. We used those interviews to agree on what each metric means before drawing the views.

![Synthetic funnel diagram: attract, convert, deliver, collect.](/images/keystone/funnel.svg)

The eight views below are sketches, not screenshots. They contain no company data.

![Eight synthetic scorecard wireframes, labelled View A through View H.](/images/keystone/scorecards.svg)

## Architecture

Keystone connects SharePoint, Linear and QuickBooks through a shared registry of named capabilities. Staff use those capabilities through the application; AI agents access them through MCP. Each capability is one operation an agent is allowed to call. The diagram shows that boundary, not the private code behind it.

![Synthetic architecture diagram: capability registry to MCP to an agent.](/images/keystone/capabilities.svg)

## Build

We're rolling Keystone out, with a target of the end of October 2026. The rollout isn't complete, so we don't have adoption numbers yet. The code is private.

## What broke

The old dashboard's inaccurate numbers and low usage led us to revisit the metric definitions before designing its replacement.

We haven't yet evaluated the new scorecard in daily use.

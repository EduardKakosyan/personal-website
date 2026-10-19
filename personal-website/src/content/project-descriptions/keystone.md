# Keystone

## Discovery

Our old internal dashboard had a problem a redesign couldn't fix: its numbers were inaccurate, and people barely used it. So I started with discovery instead of screens. What does leadership need to know? What does each role need? Where do the files actually live?

I led Keystone and designed the architecture. A UX researcher ran discovery with me, and two co-op developers are building it from my design.

## Definitions

The scorecard follows the business from start to finish: attract, convert, deliver, collect. Before drawing any views, we interviewed each role about the numbers they rely on. If two people disagree on what a number means, a nicer chart won't help.

![Synthetic funnel diagram: attract, convert, deliver, collect.](/images/keystone/funnel.svg)

The eight views below are sketches, not screenshots. They contain no company data.

![Eight synthetic scorecard wireframes, labelled View A through View H.](/images/keystone/scorecards.svg)

## Architecture

Keystone keeps a registry of named capabilities and exposes them to AI agents through MCP. Each capability is one operation an agent is allowed to call. The diagram shows that boundary, not the private code behind it.

![Synthetic architecture diagram: capability registry to MCP to an agent.](/images/keystone/capabilities.svg)

## Build

I handed the architecture to the development team and led the move into code. Keystone is rolling out now, with a target of the end of October 2026. It hasn't shipped, so there are no adoption numbers yet. The code is private.

## What broke

The old dashboard. Its numbers were inaccurate and people barely used it. A new dashboard built on the same unclear definitions would have failed the same way, which is why this project started with discovery instead of design.

The new scorecard still has to prove itself in daily use. That hasn't happened yet.

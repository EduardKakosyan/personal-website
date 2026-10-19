# Keystone

## Discovery

The earlier internal dashboard had metrics that were judged inaccurate and underused. Rebuilding the interface alone would not fix that. I started with discovery: how leadership and the team worked, what each role needed to know, and how files were stored.

I led Keystone and designed its architecture. A UX research contractor ran discovery with me, and two co-op developers build from my architecture.

## Definitions

The scorecard follows the business from attract to convert to deliver to collect. KPI interviews with each role came before the views: a shared definition matters more than a polished chart if people disagree on what it measures.

![Synthetic funnel diagram: attract, convert, deliver, collect.](/images/keystone/funnel.svg)

The eight scorecard views below are schematic placeholders, not screenshots or a claim about the final interface. They contain no company records, real figures or identifying data.

![Eight synthetic scorecard wireframes, labelled View A through View H.](/images/keystone/scorecards.svg)

## Architecture

The architecture connects a capability registry to MCP. The diagram deliberately shows the boundary rather than private implementation details: named capabilities provide the operations an agent can call.

![Synthetic architecture diagram: capability registry to MCP to an agent.](/images/keystone/capabilities.svg)

## Build

I handed the architecture to the development team and led the coding handoff. Keystone is rolling out; the target was the end of October 2026. There is no shipped adoption or performance result to claim here yet. The code stays private.

## What broke

The predecessor's metrics were inaccurate and underused. That is the concrete failure this work addresses, not evidence that the replacement has already solved it. The new definitions and scorecard still need to prove useful in day-to-day use.

This site follows the same design sequence: define who needs what, make the evidence readable, then test whether people can find it.

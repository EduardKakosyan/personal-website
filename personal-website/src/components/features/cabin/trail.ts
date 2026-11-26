// The fairy trail (Eduard: "navigation around the woodshed is still not
// great, its hard to tell where you need to go, so perhaps lets add like a
// little fairy trail to show where they should be going next in sequence …
// lets do some sort of fairy lights or something in those lines telling
// where they should go next"). Which place of the tour comes next, the way
// there, and when the lights come out. fairy-trail.tsx draws them.
//
// No three.js or React here: the Node tests load it directly.

import { CAST_SPOT } from './brook'
import { FIRE_SEATS, seatStand } from './fire'
import { findPath } from './nav'
import { BENCH_FRONT, BOXES_CENTRE, DOOR, SPLIT_SPOT, insideCabin, type Vec2 } from './world'

export type TrailStopId = 'welcome' | 'door' | 'bench' | 'block' | 'landing' | 'fire'

export type TrailStop = {
  id: TrailStopId
  /** Where the trail ends: somewhere the guest can stand, by the thing. */
  at: Vec2
  /** Within this many metres of `at` the guest is there, and the lights go out. */
  reach: number
  /** How long the guest stands about or wanders off before the lights come out for it (seconds). */
  wait: number
}

/** How long the lights wait before coming out, at most places. */
const WAIT = 4

/**
 * The places, in the tour's order (storyboard scenes 3 to 7). The cabin's
 * résumé isn't one: inside, the arrow bobbing over it does that job.
 */
export const TRAIL_STOPS: Record<TrailStopId, TrailStop> = {
  // Up the driveway to Eduard on the deck (scene 3). The welcome starts well
  // short of it (WELCOME_DISTANCE), so the trail turns to the door before
  // they get there.
  // (A longer wait: HUGO's hello and Rusty's run with the cow come first.)
  welcome: { id: 'welcome', at: { x: 2.0, z: 3.6 }, reach: 1.5, wait: 14 },
  // The cabin's door step, where "Go in" comes up (scene 4).
  door: { id: 'door', at: DOOR.outside, reach: 1.3, wait: WAIT },
  // The woodshed (scene 5): the project boxes first, in front of the
  // workbench, where HUGO points them out...
  bench: {
    id: 'bench',
    at: { x: BOXES_CENTRE.x + BENCH_FRONT.x, z: BOXES_CENTRE.z + BENCH_FRONT.z },
    reach: 1.5,
    wait: WAIT,
  },
  // ... then the chopping block, where they stand to split.
  block: { id: 'block', at: SPLIT_SPOT, reach: 1.4, wait: WAIT },
  // The brook (scene 6): down the stairs to the landing, where the rod is.
  landing: { id: 'landing', at: CAST_SPOT, reach: 1.2, wait: WAIT },
  // The fire, at night (scene 7): their camp chair, next to Eduard's.
  fire: { id: 'fire', at: seatStand(FIRE_SEATS.guest), reach: 1.2, wait: WAIT },
}

/** How far round the tour the guest has got: what the scene and the overlay already keep track of. */
export type TourFacts = {
  /** Inside the cabin now. */
  inside: boolean
  /** They came up the driveway close enough for Eduard's welcome. */
  welcomed: boolean
  /** They've been into the cabin. */
  enteredCabin: boolean
  /** The résumé has been read (the checklist's tick: the arrow over it goes then too). */
  resumeRead: boolean
  /** This visit: looked in a box on the workbench, and had a go with the axe at the block. */
  boxesSeen: boolean
  blockTried: boolean
  /** HUGO is leading them on to the brook. */
  brookLead: boolean
  brookReached: boolean
  /** Had a go at the fishing hole, or ran the tap. */
  brookDone: boolean
  /** HUGO has called them back to the fire (or the visit started there, at night). */
  fireCalled: boolean
  /** They've sat down by the fire with Eduard: the end of the tour. */
  satByFire: boolean
}

/**
 * The next place on the tour, or null when there's nowhere to send the guest
 * (inside the cabin until they've read the résumé, waiting at the brook for
 * HUGO's call, and after the fire). At the woodshed it's the boxes, then the
 * chopping block, one after the other, whichever they haven't been to yet;
 * HUGO leading on to the brook (A48) or the fire (A50) wins over anything left.
 */
export function nextStop(f: TourFacts): TrailStop | null {
  if (f.fireCalled) return f.satByFire ? null : TRAIL_STOPS.fire
  if (!f.welcomed) return TRAIL_STOPS.welcome
  if (!f.enteredCabin) return TRAIL_STOPS.door
  if (f.inside && !f.resumeRead) return null
  const shedDone = (f.boxesSeen && f.blockTried) || f.brookLead || f.brookReached
  if (!shedDone) return f.boxesSeen ? TRAIL_STOPS.block : TRAIL_STOPS.bench
  if (!f.brookDone) return TRAIL_STOPS.landing
  return null
}

// ------------------------------------------------------------------ the way

/**
 * The walking way from one point to another (nav.ts), starting with `from`:
 * round the woodshed, the trees and whatever else is in the way, and in or
 * out of the cabin through the door, the way the guest walks it (the
 * scene's walkTo).
 */
export function trailWay(from: Vec2, to: Vec2): Vec2[] {
  const leg = (a: Vec2, b: Vec2): Vec2[] =>
    (findPath(a, b, true) ?? [b]).map((p) => ({ x: p.x, z: p.z }))
  const fromInside = insideCabin(from)
  const toInside = insideCabin(to)
  const way =
    fromInside === toInside
      ? leg(from, to)
      : fromInside
        ? [...leg(from, DOOR.inside), DOOR.mouth, ...leg(DOOR.mouth, to)]
        : [...leg(from, DOOR.outside), DOOR.mouth, DOOR.inside, ...leg(DOOR.inside, to)]
  return [{ x: from.x, z: from.z }, ...way]
}

/** A way, measured: each point's distance along it, and how long it is. */
export type Way = { pts: Vec2[]; along: number[]; length: number }

export function measure(pts: Vec2[]): Way {
  const along = [0]
  for (let i = 1; i < pts.length; i++)
    along.push(along[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  return { pts, along, length: along[along.length - 1] ?? 0 }
}

/** The point `s` metres along a way, and which way it runs there (a unit vector). */
export function pointAt(way: Way, s: number) {
  const { pts, along } = way
  if (pts.length === 1) return { x: pts[0].x, z: pts[0].z, dx: 0, dz: 1 }
  let i = 1
  while (i < pts.length - 1 && along[i] < s) i++
  const a = pts[i - 1]
  const b = pts[i]
  const len = along[i] - along[i - 1] || 1
  const k = Math.min(1, Math.max(0, (s - along[i - 1]) / len))
  return {
    x: a.x + (b.x - a.x) * k,
    z: a.z + (b.z - a.z) * k,
    dx: (b.x - a.x) / len,
    dz: (b.z - a.z) / len,
  }
}

/** Where a point is nearest the way: how far along, and how far off it. */
export function nearestOnWay(way: Way, p: Vec2) {
  const { pts, along } = way
  let best = { s: 0, off: Math.hypot(p.x - pts[0].x, p.z - pts[0].z) }
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const len = along[i] - along[i - 1]
    if (len < 1e-6) continue
    const k = Math.min(
      1,
      Math.max(0, ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / (len * len)),
    )
    const off = Math.hypot(p.x - (a.x + (b.x - a.x) * k), p.z - (a.z + (b.z - a.z) * k))
    if (off < best.off) best = { s: along[i - 1] + len * k, off }
  }
  return best
}

// ------------------------------------------------------------------ when it shows

/**
 * When the lights come out. `always` (the game's default; Eduard: "set
 * trail to always") has them out whenever there's somewhere to go, after a
 * moment to settle. Without it (?trail=lost) they wait until the guest has
 * stood about or wandered for a few seconds without getting any closer to
 * the next place. Once out they stay until the guest gets there (or starts
 * doing something), so they don't flicker on and off as the guest turns.
 */
export type TrailShow = {
  stop: TrailStopId | null
  /** The closest they've got to the place since the wait started. */
  best: number
  /** Seconds without getting closer. */
  lostFor: number
  on: boolean
}

/** How much closer counts as heading the right way (metres). */
const PROGRESS = 0.3
/** With `always`, a moment before they come out (after the place changes, or something the guest was doing). */
const SETTLE = 1

export function createShow(): TrailShow {
  return { stop: null, best: Infinity, lostFor: 0, on: false }
}

export function stepShow(
  st: TrailShow,
  o: {
    stop: TrailStop | null
    guest: Vec2
    /** Doing something (splitting, a box open, fishing, sitting, reading, HUGO's card, the cut to the fire...). */
    busy: boolean
    dt: number
    always?: boolean
  },
): boolean {
  const id = o.stop?.id ?? null
  if (id !== st.stop) {
    st.stop = id
    st.best = Infinity
    st.lostFor = 0
    st.on = false
  }
  const left = o.stop ? Math.hypot(o.guest.x - o.stop.at.x, o.guest.z - o.stop.at.z) : 0
  if (!o.stop || o.busy || left < o.stop.reach) {
    st.best = Infinity
    st.lostFor = 0
    st.on = false
    return false
  }
  const closer = left < st.best - PROGRESS
  if (closer) st.best = left
  // (with `always` the wait just runs: getting closer doesn't hold it back)
  st.lostFor = closer && !o.always ? 0 : st.lostFor + o.dt
  if (st.lostFor >= (o.always ? SETTLE : o.stop.wait)) st.on = true
  return st.on
}

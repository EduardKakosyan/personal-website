// The brook (storyboard scene 6, A21): where it runs, its banks, the stairs
// down to the water, the landing at the foot of them by the fishing hole, and
// the tap. Plain data and maths, no three.js or React: world.ts, the scene,
// the overlay and the tests all use it.
//
// Three.js coordinates (x east, z south). The Blender build
// (art/cabin/scripts/build_arrival.py, `brook()`) uses Blender's (x, y = -z)
// and must agree with the numbers here: keep BROOK_* in the script in step.

import type { Vec2 } from './world'

/**
 * The middle of the brook at a given z: it winds north–south along the east
 * edge of the grass field (A55, A62). Same curve as `brook_x` in the build.
 */
export function brookX(z: number) {
  const y = -z
  return 26 + 1.3 * Math.sin(y * 0.1 + 0.6) + 0.6 * Math.sin(y * 0.29 + 2.0)
}

/** The water's surface (the bed is about 20 cm under it: shallow and clear, photo 03). */
export const WATER_Y = -0.5
/**
 * Where the field stops: the top of the bank, this far from the middle of the
 * brook (the bank itself varies a little; this is its nearest).
 */
export const BANK_TOP = 2.45

/**
 * The wooden stairs down the west bank, at the end of the path from the camp
 * (A21). Three steps from the field down to the landing.
 */
export const STAIRS = {
  /** The top of the first step, and where the steps end at the landing. */
  x0: 24.35,
  x1: 25.1,
  z: -0.2,
  /** Half the stairs' width. */
  half: 0.5,
  steps: 3,
  /** How far each step drops. */
  rise: 0.09,
}
/** The landing at the foot of the stairs: timber on posts, reaching out over the water's edge. */
export const LANDING = { x0: 25.1, x1: 26.05, z0: -0.75, z1: 0.45, y: -0.36 }
/** The little fishing hole right by the stairs (A21): a deeper pool off the landing. */
export const FISHING_HOLE = { x: 26.75, z: 0.65, r: 0.95 }
/** Where the guest stands to cast, and which way they face (towards the hole). */
export const CAST_SPOT: Vec2 = { x: 25.72, z: 0.05 }
/**
 * The tap where you get water (A21): on a post at the top of the stairs,
 * north side, the spout over the blue water jug. `TAP` is the spout (the
 * water runs from there); the post and the jug are in the way.
 */
export const TAP = { x: 23.94, z: -1.05, y: 0.55 }
const TAP_POST: Vec2 = { x: 24.12, z: -1.05 }
const TAP_JUG: Vec2 = { x: 23.94, z: -1.05 }
/** Where the guest stands to use the tap: in front of it, on the field side. */
export const TAP_SPOT: Vec2 = { x: 23.42, z: -0.98 }
/** The top of the jug, where the water lands. */
export const JUG_TOP_Y = 0.31
/** The rod leaning on the handrail at the foot of the stairs (it glows; clicking it casts). */
export const ROD_PROP = { x: 25.3, y: 0.15, z: 0.33 }
/** The top of the stairs, on the path. */
export const STAIRS_TOP: Vec2 = { x: 23.95, z: -0.2 }

/** HUGO's way from the woodshed to the brook when he leads the guest there (A48). */
export const BROOK_LEAD_PATH: Vec2[] = [
  { x: 8.6, z: 4.8 },
  { x: 10.9, z: 2.3 },
  { x: 13.6, z: 0.6 },
  { x: 16.8, z: 0.45 },
  { x: 20.0, z: 0.5 },
  { x: 23.0, z: 0.6 },
]
/** The guest counts as at the brook within this distance of the top of the stairs. */
export const BROOK_REACHED = 3.2

/**
 * Which point of the way HUGO waits at next: he moves on once the guest has
 * caught up with him, and also past any point the guest is already beyond
 * (they set off across the field their own way), so he's always ahead of
 * them, never left waiting behind.
 */
export function brookLeadIndex(index: number, guest: Vec2) {
  const toStairs = (p: Vec2) => Math.hypot(p.x - STAIRS_TOP.x, p.z - STAIRS_TOP.z)
  let i = index
  while (i < BROOK_LEAD_PATH.length - 1) {
    const wp = BROOK_LEAD_PATH[i]
    const caughtUp = Math.hypot(guest.x - wp.x, guest.z - wp.z) < 2.6
    const beyond = toStairs(guest) < toStairs(wp) + 0.5
    if (!caughtUp && !beyond) break
    i++
  }
  return i
}

const onStairs = (p: Vec2, pad: number) =>
  p.x > STAIRS.x0 - 0.6 && p.x < STAIRS.x1 && Math.abs(p.z - STAIRS.z) < STAIRS.half - pad

const onLanding = (p: Vec2, pad: number) =>
  p.x > LANDING.x0 - 0.01 &&
  p.x < LANDING.x1 - pad &&
  p.z > LANDING.z0 + pad &&
  p.z < LANDING.z1 - pad

/** On the stairs or the landing (below the field). */
export function belowBank(p: Vec2) {
  return (onStairs(p, 0) && p.x > STAIRS.x0) || onLanding(p, 0)
}

/**
 * Whether the guest (a circle of radius `pad`) would be over the bank or in
 * the water. The stairs and the landing are the way down; the tap's post is
 * in the way like anything else.
 */
export function brookBlocked(p: Vec2, pad: number) {
  if (Math.hypot(p.x - TAP_POST.x, p.z - TAP_POST.z) < 0.1 + pad) return true
  if (Math.hypot(p.x - TAP_JUG.x, p.z - TAP_JUG.z) < 0.14 + pad) return true
  if (onStairs(p, pad) || onLanding(p, pad)) return false
  return p.x > brookX(p.z) - BANK_TOP - pad
}

/** How high the ground is on the stairs or the landing; null anywhere else. */
export function brookHeight(p: Vec2): number | null {
  if (onLanding(p, 0)) return LANDING.y
  if (onStairs(p, 0) && p.x > STAIRS.x0) {
    const tread = (STAIRS.x1 - STAIRS.x0) / STAIRS.steps
    const k = Math.min(STAIRS.steps - 1, Math.floor((p.x - STAIRS.x0) / tread))
    return -(k + 1) * STAIRS.rise
  }
  return null
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/**
 * The camera at the brook (Eduard's photo 03 looks along it, under
 * the alders): coming up to the stairs the follow camera comes down lower and
 * swings south-west, looking up the brook past the landing. `k` is how far
 * that has happened (0 out in the field, 1 at the stairs). The visitor's own
 * turn and zoom (A109) still apply on top, so this is only the starting view.
 * On a portrait phone it aims nearer the guest: they stand higher up the
 * screen, clear of the bar along the bottom, with the path back up the field
 * in view to tap.
 */
export function brookView(guest: Vec2, portrait = false) {
  const d = Math.hypot(guest.x - STAIRS_TOP.x, guest.z - STAIRS_TOP.z)
  const k = guest.x > 16 ? 1 - smooth(4, 9, d) : 0
  return {
    k,
    /** The camera's offset from the guest (x east, y up, z south). */
    off: { x: -4.6, y: 4.4, z: 8.4 },
    /** Where it aims, from the guest: over the water, a little way along it (north, the way it runs). */
    ahead: portrait ? { x: 0.3, z: -0.6 } : { x: 2.2, z: -3.2 },
  }
}

/**
 * Whether HUGO should lead the guest on to the brook (A48: "Let's go look at
 * the best thing about this place."). After the woodshed, once the guest has
 * done something there (looked in a box or split the night's wood) and is
 * free again, or has walked off from the woodshed out into the field, the
 * brook's way (walking back to the cabin doesn't count): the agent's pick,
 * for Eduard to confirm.
 */
export function readyForBrook(o: {
  reachedWoodshed: boolean
  reachedBrook: boolean
  didSomethingAtShed: boolean
  busy: boolean
  freeFor: number
  fromWoodshed: number
  /** How far east of the woodshed the guest is (the field and the brook are east; the cabin is west). */
  eastOfWoodshed: number
}) {
  if (!o.reachedWoodshed || o.reachedBrook || o.busy) return false
  return (o.didSomethingAtShed && o.freeFor > 2.5) || (o.fromWoodshed > 9 && o.eastOfWoodshed > 3)
}

/**
 * A tap or click on the brook. The scene's taps land on an invisible ground
 * at the field's height, and the landing, the stairs and the water are below
 * it, so this follows the pointer's ray down to them: the landing or a step
 * (walk there), or the water by the fishing hole (cast).
 */
export function brookTap(
  o: { x: number; y: number; z: number },
  d: { x: number; y: number; z: number },
): null | { hole: boolean; at: Vec2 } {
  if (d.y > -1e-4) return null
  const at = (y: number): Vec2 => {
    const k = (y - o.y) / d.y
    return { x: o.x + d.x * k, z: o.z + d.z * k }
  }
  const l = at(LANDING.y)
  if (onLanding(l, 0)) return { hole: false, at: l }
  const tread = (STAIRS.x1 - STAIRS.x0) / STAIRS.steps
  for (let k = 0; k < STAIRS.steps; k++) {
    const p = at(-(k + 1) * STAIRS.rise)
    if (
      p.x >= STAIRS.x0 + k * tread &&
      p.x < STAIRS.x0 + (k + 1) * tread &&
      Math.abs(p.z - STAIRS.z) < STAIRS.half
    )
      return { hole: false, at: p }
  }
  const w = at(WATER_Y)
  if (Math.hypot(w.x - FISHING_HOLE.x, w.z - FISHING_HOLE.z) < FISHING_HOLE.r + 0.35)
    return { hole: true, at: w }
  return null
}

/** HUGO's line as he sets off to the brook: Eduard's wording (A48), not a draft. */
export const HUGO_BROOK_LEAD_LINE = 'Let’s go look at the best thing about this place.'

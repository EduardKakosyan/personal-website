// The fire (storyboard scene 7; A22, A26, A27, A30): where it is, the camp
// chairs round it, who sits where, HUGO's way back to it from the brook, and
// when night falls. Plain data and maths, no three.js or React: world.ts, the
// scene, the overlay and the tests all use it.
//
// Three.js coordinates (x east, z south). The Blender build
// (art/cabin/scripts/build_arrival.py: FIRE, SEAT_RING, SEAT_BEARINGS,
// PICNIC, YAHTZEE_LOCAL) uses Blender's (x, y = -z) and must agree with the
// numbers here.

import { STAIRS_TOP } from './brook'

type Vec2 = { x: number; z: number }

/** The fire ring, south-east of the deck (Eduard's sketch, A57). */
export const FIRE: Vec2 = { x: 6.0, z: 2.6 }
/** The ring of stones, for walking round it. */
export const FIRE_RADIUS = 0.8
/**
 * Where a visit that starts at night stands the guest: south-east of the fire,
 * looking at it (?night=1, or coming back to the fire's checkpoint, checkpoint.ts).
 */
export const NIGHT_START: Vec2 = { x: 8.9, z: 5.0 }

/** How far out from the fire the camp chairs sit, and the top of a chair's seat. */
const SEAT_RING = 1.85
export const SEAT_Y = 0.445

export type Seat = Vec2 & {
  /** The way the chair faces: at the fire. */
  yaw: number
}

/** A chair at a bearing from the fire (degrees clockwise from north), facing it. */
function seat(bearing: number): Seat {
  const a = (bearing * Math.PI) / 180
  return {
    x: FIRE.x + SEAT_RING * Math.sin(a),
    z: FIRE.z - SEAT_RING * Math.cos(a),
    yaw: -a,
  }
}

/**
 * The three camp chairs, pulled up round the fire in a half ring on its
 * north-west side, between it and the deck: Eduard's (west of the fire), the
 * guest's (north of it), and a third between them, which HUGO floats over.
 * The night camera looks from the south-east, so it sees both their faces,
 * one either side of the flames, with the cabin and its string lights behind
 * (photo 02).
 */
export const FIRE_SEATS = {
  eduard: seat(-78),
  guest: seat(2),
  spare: seat(-38),
} as const

/**
 * Where someone stands to sit down in a chair: in front of it, on the fire's
 * side (there's just room to stand between the chair and the stones).
 */
export function seatStand(s: Seat): Vec2 {
  return { x: s.x + Math.sin(s.yaw) * 0.6, z: s.z + Math.cos(s.yaw) * 0.6 }
}

/**
 * Rusty's spot for the night: south-west of the fire, a dog's length back
 * from the stones, lying with his face to the yard (and the camera) and the
 * cow in front of him (A22, A31).
 */
export const RUSTY_FIRE_BED = { x: 3.95, z: 3.5, yaw: 1.9 }

/** HUGO at the fire: floating over the third chair (A31). */
export const HUGO_FIRE_SPOT = { x: FIRE_SEATS.spare.x, y: 1.08, z: FIRE_SEATS.spare.z }

/** The guest counts as at the fire within this distance of it. */
export const FIRE_REACHED = 4.2

/** Camp Yahtzee on the picnic table (A51), and where the guest stands to look at it. */
export const YAHTZEE = { x: 3.84, y: 0.8, z: 4.4 }
export const YAHTZEE_SPOT: Vec2 = { x: 2.72, z: 4.4 }
/** The lantern on the deck's north-east corner (something to walk round). */
export const DECK_LANTERN: Vec2 = { x: 3.47, z: -0.27 }

/**
 * HUGO's way back from the brook to the fire (A50: "Looks like the fire's
 * going. Come on!"), along the path across the field.
 */
export const FIRE_LEAD_PATH: Vec2[] = [
  { x: 21.0, z: 0.5 },
  { x: 17.6, z: 0.45 },
  { x: 14.2, z: 0.6 },
  { x: 11.2, z: 1.7 },
  { x: 8.9, z: 2.7 },
]

/**
 * Which point of the way back HUGO waits at next: he moves on once the guest
 * has caught up, and past any point they're already beyond, so he's always
 * ahead of them (the same rule as on the way out, brook.ts).
 */
export function fireLeadIndex(index: number, guest: Vec2) {
  const toFire = (p: Vec2) => Math.hypot(p.x - FIRE.x, p.z - FIRE.z)
  let i = index
  while (i < FIRE_LEAD_PATH.length - 1) {
    const wp = FIRE_LEAD_PATH[i]
    const caughtUp = Math.hypot(guest.x - wp.x, guest.z - wp.z) < 2.6
    const beyond = toFire(guest) < toFire(wp) + 0.5
    if (!caughtUp && !beyond) break
    i++
  }
  return i
}

/**
 * Whether it's time for HUGO to call the guest back to the fire. At the
 * brook, once they've done something there (cast a line or run the tap) and
 * are free again, or have simply been there a while, or have started back
 * across the field on their own: the agent's pick, for Eduard to confirm.
 */
export function readyForFire(o: {
  reachedBrook: boolean
  /** Fishing, at the tap, or reading HUGO's card. */
  busy: boolean
  didSomethingAtBrook: boolean
  /** Seconds since they were last busy or walking. */
  freeFor: number
  /** Seconds since they first got to the brook. */
  atBrookFor: number
  /** How far back west of the top of the stairs they are now. */
  backFromStairs: number
}) {
  if (!o.reachedBrook || o.busy) return false
  return (
    (o.didSomethingAtBrook && o.freeFor > 2.5) ||
    (o.atBrookFor > 45 && o.freeFor > 2.5) ||
    o.backFromStairs > 7
  )
}

/** How far west of the top of the brook's stairs a point is (the fire's way). */
export function backFromStairs(p: Vec2) {
  return STAIRS_TOP.x - p.x
}

/** Standing still, sunset takes this long to turn to night once HUGO has called. */
const NIGHTFALL_SECONDS = 50

/**
 * Night falling (A27, A39), 0 sunset .. 1 night. It starts when HUGO calls
 * the guest back to the fire, comes on as they walk back west across the
 * field (dark by the time they reach the camp), creeps on by itself if they
 * stay put, and never lifts again: once it's night, it's night everywhere.
 */
export function nightfall(previous: number, guest: Vec2, dt: number) {
  // (evenly along the way back, from the top of the stairs to the camp)
  const byWalking = Math.min(1, Math.max(0, (22.5 - guest.x) / 12.5))
  const byTime = previous + dt / NIGHTFALL_SECONDS
  return Math.min(1, Math.max(previous, byWalking, byTime))
}

/** HUGO's line as he calls the guest back from the brook: approved (A50). */
export const HUGO_FIRE_LEAD_LINE = 'Looks like the fire’s going. Come on!'

// Casting a line at the fishing hole (A50, approved; optional for the guest).
// Plain simulation, no three.js or React, like split.ts: the scene reads it
// each frame to pose the guest, the rod, the line, the bobber and the catch.
//
// How it plays (short, about fifteen seconds a go):
//   1. Cast (E, Space, a click on the water, or the button): the guest swings
//      the rod back over their shoulder and whips it forward; the bobber
//      flies out and lands in the hole.
//   2. Wait: the bobber bobs. A nibble or two (small dips) are teases.
//   3. The bite: the bobber goes under. Strike now (within BITE_WINDOW) and
//      it's hooked; strike during a nibble ("Too soon") or miss the bite
//      ("It got away") and the line comes back in for another cast.
//   4. Reel: press again and again to wind it in while it pulls back. Let the
//      line go slack and it gets away.
//   5. It comes up out of the water on the line, the guest holds it up, and
//      it goes back in. Then cast again or stop.

import type { Vec2 } from './world'
import { CAST_SPOT, FISHING_HOLE, WATER_Y } from './brook'

/**
 * What the guest catches. **Open question for Eduard (storyboard scene 6):
 * what does he catch at the fishing hole?** Until he says, it's a plain,
 * neutral fish shape in greys, and no species is named anywhere.
 */
export const FISHING_CATCH = {
  /** How it's named in the HUD and the checklist (no species). */
  label: 'a fish',
  /** Its length in metres (bigger than life, so it reads at pixel size). */
  length: 0.42,
  /** A neutral grey back and a pale belly. */
  back: '#6d7c84',
  belly: '#d9dfe0',
} as const

export type FishPhase =
  | 'off'
  /** Walking to the landing. */
  | 'walking'
  /** Rod out, ready to cast. */
  | 'ready'
  /** The rod going back over the shoulder. */
  | 'windup'
  /** The rod whipping forward, the bobber flying out. */
  | 'cast'
  /** The bobber on the water; nibbles; then the bite. */
  | 'waiting'
  /** It's taken: strike now. */
  | 'bite'
  /** Hooked: wind it in. */
  | 'reel'
  /** Out of the water, held up. */
  | 'landed'
  /** Got away, or struck too soon: the line comes back in. */
  | 'missed'
  /** Putting the rod away. */
  | 'putaway'

export type FishEvent = null | 'cast' | 'nibble' | 'bite' | 'hooked' | 'soon' | 'away' | 'caught'

/** How long the bite lasts before it lets go (seconds). */
export const BITE_WINDOW = 0.9
const WINDUP = 0.32
const CAST = 0.5
const FLIGHT = 0.7
/** Each press winds in this much of the line; it pulls back at REEL_PULL a second. */
const REEL_STEP = 0.17
const REEL_PULL = 0.22
const LANDED_TIME = 2.4

export function createFishing() {
  return {
    phase: 'off' as FishPhase,
    t: 0,
    /** Where the bobber is meant to land, and how far through the flight it is (0..1). */
    target: { x: FISHING_HOLE.x, z: FISHING_HOLE.z } as Vec2,
    flight: 0,
    /** Seconds until the bite, and the nibbles before it (times from landing). */
    biteAt: 0,
    nibbles: [] as number[],
    /** How far down the bobber's been pulled (0 floating .. 1 under). */
    dip: 0,
    /** Reeling: how much of the line is in (0 .. 1 landed), and the tug as it pulls. */
    reel: 0,
    tug: 0,
    /** Catches this go, and in all. */
    caught: 0,
    /** For the HUD: what just happened (one frame). */
    event: null as FishEvent,
    /** 0..1, the rod's swing: back over the shoulder (-) and out in front (+). */
    rod: 0,
  }
}

export type Fishing = ReturnType<typeof createFishing>

export function fishingActive(f: Fishing) {
  return f.phase !== 'off'
}

/** The guest holds the rod from the moment they reach the landing until it's put away. */
export function holdsRod(f: Fishing) {
  return f.phase !== 'off' && f.phase !== 'walking'
}

/** Where to stand and which way to face (towards the hole). */
export function castStance(): { at: Vec2; yaw: number } {
  return {
    at: CAST_SPOT,
    yaw: Math.atan2(FISHING_HOLE.x - CAST_SPOT.x, FISHING_HOLE.z - CAST_SPOT.z),
  }
}

export function startFishing(f: Fishing) {
  if (f.phase !== 'off') return
  f.phase = 'walking'
  f.t = 0
}

/** Reached the landing: rod out. */
export function arriveAtHole(f: Fishing) {
  if (f.phase !== 'walking') return
  f.phase = 'ready'
  f.t = 0
}

/** Stop (walking off, Esc, the Done button). */
export function stopFishing(f: Fishing) {
  if (f.phase === 'off' || f.phase === 'putaway') return
  if (f.phase === 'walking') {
    f.phase = 'off'
    return
  }
  f.phase = 'putaway'
  f.t = 0
}

/**
 * The one button (E, Space, a click, the HUD's button): cast, strike, or
 * reel, depending on where they are. `rnd` is for tests (defaults to Math.random).
 */
export function press(f: Fishing, rnd: () => number = Math.random) {
  switch (f.phase) {
    case 'ready': {
      f.phase = 'windup'
      f.t = 0
      // a spot in the hole, a little different each cast
      const a = rnd() * Math.PI * 2
      const r = rnd() * FISHING_HOLE.r * 0.45
      f.target = { x: FISHING_HOLE.x + Math.cos(a) * r, z: FISHING_HOLE.z + Math.sin(a) * r }
      return true
    }
    case 'waiting':
      // struck at nothing (or a nibble): too soon, it's off
      miss(f, 'soon')
      return true
    case 'bite':
      f.phase = 'reel'
      f.t = 0
      f.reel = 0.2
      f.event = 'hooked'
      return true
    case 'reel':
      f.reel = Math.min(1, f.reel + REEL_STEP)
      f.tug = 1
      return true
    case 'landed':
      if (f.t > 0.8) {
        f.phase = 'ready'
        f.t = 0
      }
      return true
  }
  return false
}

function miss(f: Fishing, why: 'soon' | 'away') {
  f.phase = 'missed'
  f.t = 0
  f.event = why
}

export function updateFishing(f: Fishing, dt: number, rnd: () => number = Math.random) {
  f.event = null
  if (f.phase === 'off') return
  f.t += dt
  const ease = (rate: number) => 1 - Math.exp(-rate * dt)
  let rodGoal = 0.15
  let dipGoal = 0
  switch (f.phase) {
    case 'walking':
    case 'ready':
      break
    case 'windup':
      rodGoal = -1
      if (f.t > WINDUP) {
        f.phase = 'cast'
        f.t = 0
        f.flight = 0
        f.event = 'cast'
      }
      break
    case 'cast':
      rodGoal = 1
      f.flight = Math.min(1, f.t / FLIGHT)
      if (f.t > Math.max(CAST, FLIGHT)) {
        f.phase = 'waiting'
        f.t = 0
        // a bite after 2–4.5 s, with a nibble or two before it
        f.biteAt = 2 + rnd() * 2.5
        f.nibbles = []
        const n = 1 + Math.floor(rnd() * 2)
        for (let k = 0; k < n; k++) f.nibbles.push(0.7 + rnd() * (f.biteAt - 1.2))
        f.nibbles.sort((a, b) => a - b)
      }
      break
    case 'waiting': {
      rodGoal = 0.45
      const nib = f.nibbles.find((n) => f.t > n && f.t < n + 0.35)
      if (nib !== undefined) {
        dipGoal = 0.35
        if (f.t - dt <= nib) f.event = 'nibble'
      }
      if (f.t >= f.biteAt) {
        f.phase = 'bite'
        f.t = 0
        f.event = 'bite'
      }
      break
    }
    case 'bite':
      rodGoal = 0.55
      dipGoal = 1
      if (f.t > BITE_WINDOW) miss(f, 'away')
      break
    case 'reel':
      rodGoal = -0.25
      dipGoal = 0.6
      f.tug = Math.max(0, f.tug - dt * 5)
      // (wound all the way in: landed, before it gets to pull again)
      if (f.reel >= 1) {
        f.phase = 'landed'
        f.t = 0
        f.caught += 1
        f.event = 'caught'
        break
      }
      f.reel -= REEL_PULL * dt * (0.6 + 0.8 * Math.max(0, Math.sin(f.t * 5.3)))
      if (f.reel <= 0) {
        f.reel = 0
        miss(f, 'away')
      }
      break
    case 'landed':
      rodGoal = -0.15
      if (f.t > LANDED_TIME) {
        f.phase = 'ready'
        f.t = 0
      }
      break
    case 'missed':
      rodGoal = -0.2
      if (f.t > 0.9) {
        f.phase = 'ready'
        f.t = 0
      }
      break
    case 'putaway':
      rodGoal = 0
      if (f.t > 0.6) f.phase = 'off'
      break
  }
  const fast = f.phase === 'cast' ? 22 : f.phase === 'windup' ? 12 : 7
  f.rod += (rodGoal - f.rod) * ease(fast)
  f.dip += (dipGoal - f.dip) * ease(dipGoal > f.dip ? 14 : 5)
}

/**
 * Where the bobber is: flying out on the cast, on the water while waiting,
 * coming in as it's reeled, back at the rod otherwise. `tip` is the rod's tip.
 */
export function bobberAt(
  f: Fishing,
  tip: { x: number; y: number; z: number },
  time: number,
): { x: number; y: number; z: number; onWater: boolean } {
  const water = WATER_Y + 0.02
  const bob = Math.sin(time * 3.1) * 0.012
  switch (f.phase) {
    case 'cast': {
      const k = f.flight
      const e = 1 - (1 - k) * (1 - k)
      return {
        x: tip.x + (f.target.x - tip.x) * e,
        y: tip.y + (water - tip.y) * k + Math.sin(k * Math.PI) * 0.9,
        z: tip.z + (f.target.z - tip.z) * e,
        onWater: k >= 1,
      }
    }
    case 'waiting':
    case 'bite':
      return { ...f.target, y: water + bob - f.dip * 0.09, onWater: true }
    case 'reel': {
      // drawn in towards the landing, zigzagging as it pulls
      const k = f.reel
      const side = Math.sin(f.t * 4.1) * 0.35 * (1 - k)
      const dx = tip.x - f.target.x
      const dz = tip.z - f.target.z
      const len = Math.hypot(dx, dz) || 1
      return {
        x: f.target.x + dx * k * 0.75 + (-dz / len) * side,
        y: water - 0.05,
        z: f.target.z + dz * k * 0.75 + (dx / len) * side,
        onWater: true,
      }
    }
    default:
      // hanging just under the rod tip
      return { x: tip.x, y: tip.y - 0.35, z: tip.z, onWater: false }
  }
}

/**
 * The guest's pose for casting, from their own joints (like the axe swing):
 * the arms (radians from hanging straight down; negative is forward and up),
 * and how far the rod points up from level (`pitch`, radians). The scene turns
 * the rod in the hand so it points that way whatever the arm is doing.
 */
export function castPose(f: Fishing, time: number) {
  const r = f.rod
  const back = Math.max(0, -r)
  const out = Math.max(0, r)
  const winding = f.phase === 'reel'
  // the catch held up on the line
  const hold = f.phase === 'landed' ? Math.min(1, f.t * 3) : 0
  const armR = -0.9 - back * 1.7 + out * 0.2
  const armL = -0.75 - back * 0.35 + (winding ? Math.sin(time * 16) * 0.2 : 0)
  return {
    armR: armR * (1 - hold) - 1.55 * hold,
    armL: armL * (1 - hold) - 1.25 * hold,
    armRz: -0.08,
    armLz: 0.42 * (1 - hold) + 0.15 * hold,
    // back over the shoulder on the windup, low over the water after the cast
    pitch: 0.6 + back * 1.8 - out * 0.45,
    head: f.phase === 'landed' ? -0.15 : 0.15,
    /** The rod's tip shakes with the pull while reeling and on the bite. */
    shake: (winding ? 0.06 * (0.4 + f.tug) : 0) + (f.phase === 'bite' ? 0.05 : 0),
  }
}

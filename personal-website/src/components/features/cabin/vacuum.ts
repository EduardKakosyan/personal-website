// HUGO tidies up the split wood (Eduard, A106: "a cool little life hack that
// has HUGO in the background picking up and placing the wood in the woodshed,
// he should do it through a little vacuum, that comes out of the bottom of
// him with O rings in white that animate the pick up").
//
// Once the guest has split the night's firewood and walked off, HUGO floats
// over each piece lying about the chopping block, lowers a hose from the
// bottom of his body, and white O-rings run up it as the piece is sucked in.
// Then he floats to the woodshed's open front and lays the pieces on top of
// the front stack, the rings running back down the hose.
// Plain simulation, no three.js: the scene draws the hose, the rings and the
// stacked pieces from this state.

import type { Chunk, Split } from './split'
import { WOODSHED } from './world'

export type VacPhase = 'idle' | 'toChunk' | 'suck' | 'toShed' | 'drop'
type P3 = { x: number; y: number; z: number }

/** The woodshed's turn (WOODSHED_ROT in the build script); its open front is local -Y. */
export const SHED_ROT = (125 * Math.PI) / 180
/** The top of the split pieces stacked at the front, where he lays the new ones. */
const STACK_TOP = 1.66
/** Across the stack: where each new piece goes (the middle post stays clear). */
const COLUMNS = Array.from({ length: 15 }, (_, k) => -1.2 + k * 0.17).filter(
  (x) => Math.abs(x) > 0.13,
)
/** How high he hovers over a piece while he picks it up. */
const HOVER = 0.95
/** Seconds after the last piece settles before he starts (the guest sees him come over). */
const START_DELAY = 1.2

const SUCK = {
  extend: 0.3,
  rings: [0.22, 1.25] as const,
  rise: [0.45, 1.15] as const,
  gone: 1.2,
  retract: 1.45,
}
const DROP = { extend: 0.3, rings: [0.15, 0.85] as const, place: 0.72, retract: 1.05 }

/** A point in the woodshed's frame (Blender x, y and height) in the world. */
export function shedPoint(lx: number, ly: number, y = 0): P3 {
  const c = Math.cos(SHED_ROT)
  const s = Math.sin(SHED_ROT)
  return { x: WOODSHED.x + lx * c - ly * s, y, z: WOODSHED.z - lx * s - ly * c }
}

/** Where the n-th piece he brings goes on the stack (layer by layer). */
export function stackSpot(n: number): { at: P3; lx: number; layer: number } {
  const col = n % COLUMNS.length
  const layer = Math.floor(n / COLUMNS.length) % 3
  const lx = COLUMNS[col]
  // (at the front edge of the stack, so the ends show under the roof)
  return { at: shedPoint(lx, -0.66, STACK_TOP + layer * 0.11), lx, layer }
}

export function createVacuum() {
  return {
    phase: 'idle' as VacPhase,
    t: 0,
    /** 0..1: how far the hose is out. */
    hose: 0,
    /** Where the hose reaches to (world), and which way the rings run (1 up into him, -1 down). */
    reach: null as P3 | null,
    flow: 0,
    /** How far along the rings are (they loop), for the scene to draw. */
    ringT: 0,
    /** The pieces in him, by kind (0, 1 the halves, 2 a whole log). */
    carried: [] as (0 | 1 | 2)[],
    /** Everything he has stacked so far, in order. */
    placed: [] as (0 | 1 | 2)[],
    /** The piece he's picking up now. */
    chunk: null as Chunk | null,
    /** This pick-up or drop has taken or laid its one piece. */
    handled: false,
  }
}

export type Vacuum = ReturnType<typeof createVacuum>

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => {
  const k = clamp01(v)
  return k * k * (3 - 2 * k)
}

/**
 * Whether the tidy-up should start now: the night's wood is split, the axe
 * is back in the block and the pieces have stopped rolling. (It starts as the
 * guest finishes, so they see him come over and set to it while they walk
 * on to the bench.)
 */
export function readyToTidy(sp: Split, inside: boolean) {
  return (
    sp.done &&
    sp.phase === 'off' &&
    !inside &&
    sp.chunks.length > 0 &&
    sp.chunks.every((c) => c.settled && c.age > START_DELAY)
  )
}

/**
 * One frame. Returns where HUGO should float to while he's busy (null when
 * he's free to follow the guest again). `hugo` is where he is now.
 */
export function updateVacuum(v: Vacuum, sp: Split, hugo: P3, dt: number): P3 | null {
  v.t += dt
  v.ringT += dt * 1.7
  const near = (p: P3, r = 0.09) => Math.hypot(p.x - hugo.x, p.y - hugo.y, p.z - hugo.z) < r
  switch (v.phase) {
    case 'idle':
      v.hose = 0
      v.flow = 0
      return null
    case 'toChunk': {
      const c = sp.chunks[0]
      if (!c) {
        v.phase = v.carried.length ? 'toShed' : 'idle'
        return null
      }
      const over = { x: c.pos.x, y: HOVER, z: c.pos.z }
      if (near(over)) {
        v.phase = 'suck'
        v.t = 0
        v.chunk = c
        v.handled = false
      }
      return over
    }
    case 'suck': {
      const c = v.chunk
      if (!c) {
        v.phase = 'toChunk'
        return null
      }
      v.reach = { x: c.pos.x, y: c.pos.y + 0.07, z: c.pos.z }
      v.hose =
        v.t < SUCK.gone
          ? ease(v.t / SUCK.extend)
          : 1 - ease((v.t - SUCK.gone) / (SUCK.retract - SUCK.gone))
      v.flow = v.t > SUCK.rings[0] && v.t < SUCK.rings[1] ? 1 : 0
      c.suck = ease((v.t - SUCK.rise[0]) / (SUCK.rise[1] - SUCK.rise[0]))
      if (v.t >= SUCK.gone && !v.handled) {
        v.handled = true
        if (sp.chunks[0] === c) sp.chunks.shift()
        v.carried.push(c.kind)
      }
      if (v.t >= SUCK.retract) {
        v.phase = sp.chunks.length ? 'toChunk' : 'toShed'
        v.t = 0
      }
      return { x: v.reach.x, y: HOVER, z: v.reach.z }
    }
    case 'toShed': {
      if (!v.carried.length) {
        v.phase = 'idle'
        return null
      }
      const spot = stackSpot(v.placed.length)
      // in front of the open front, level with the top of the stack
      const hover = shedPoint(spot.lx, -1.35, STACK_TOP + 0.1 + spot.layer * 0.11)
      if (near(hover, 0.12)) {
        v.phase = 'drop'
        v.t = 0
        v.handled = false
      }
      return hover
    }
    case 'drop': {
      // (this piece's spot: it's counted as placed partway through)
      const spot = stackSpot(v.placed.length - (v.handled ? 1 : 0))
      v.reach = spot.at
      v.hose =
        v.t < DROP.place
          ? ease(v.t / DROP.extend)
          : 1 - ease((v.t - DROP.place) / (DROP.retract - DROP.place))
      v.flow = v.t > DROP.rings[0] && v.t < DROP.rings[1] ? -1 : 0
      if (v.t >= DROP.place && !v.handled && v.carried.length) {
        v.handled = true
        v.placed.push(v.carried.shift() as 0 | 1 | 2)
      }
      if (v.t >= DROP.retract) {
        v.phase = v.carried.length ? 'toShed' : 'idle'
        v.t = 0
      }
      return shedPoint(spot.lx, -1.35, STACK_TOP + 0.1 + spot.layer * 0.11)
    }
  }
}

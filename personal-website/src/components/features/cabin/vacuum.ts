// HUGO tidies up the split wood (Eduard, A106: "a cool little life hack that
// has HUGO in the background picking up and placing the wood in the woodshed,
// he should do it through a little vacuum, that comes out of the bottom of
// him with O rings in white that animate the pick up").
//
// Reworked (A112; Eduard: "the wood pick up animation and put away animation
// is questionable at best, I think you can do much much better"). The first
// version was a stiff black stick that dropped straight down, a piece that
// shrank to nothing, and pieces that popped into the stack. Now:
//
//   Picking up: he glides over a piece and settles, a ribbed hose uncoils
//   from the bottom of his body with a flared nozzle. The suction comes on:
//   the piece rattles, stands up on end, and is drawn up into the nozzle,
//   stretching thin as it goes, with white O-rings and little streaks of air
//   running in after it. A lump travels up the hose and he gulps it down (a
//   squash and a little hop). If the next piece is close the hose stays out
//   and swings over to it.
//
//   Putting away: he floats up in front of the woodshed, the hose reaches in
//   over the stack, he swells, the lump runs down the hose, and the piece
//   pops out of the nozzle with a puff (a white ring) and a kick of the
//   hose, flies the last hand's width and lands on the stack with a bounce.
//
// Plain simulation, no three.js: the scene draws the hose, the rings, the
// streaks and the pieces from this state.

import type { Chunk, Split } from './split'
import { WOODSHED } from './world'

export type VacPhase = 'idle' | 'toChunk' | 'suck' | 'toShed' | 'drop'
type P3 = { x: number; y: number; z: number }

/** The woodshed's turn (WOODSHED_ROT in the build script); its open front is local -Y. */
export const SHED_ROT = (125 * Math.PI) / 180
/** The top of the split pieces stacked at the front, where he lays the new ones. */
const STACK_TOP = 1.66
/**
 * Across the stack: where each new piece goes (the middle post stays clear).
 * He starts at the end nearest the chopping block, where the guest can see
 * the pieces land, and works along from there.
 */
const COLUMNS = Array.from({ length: 15 }, (_, k) => 1.18 - k * 0.17).filter(
  (x) => Math.abs(x) > 0.13,
)
/** How high he hovers over a piece while he picks it up. */
const HOVER = 0.92
/** Seconds after the last piece settles before he starts (the guest sees him come over). */
const START_DELAY = 1.2
/** A next piece this close: the hose stays out and swings over to it. */
const KEEP_OUT_WITHIN = 1.3
/** How far out the hose stays between two pieces. */
const KEPT = 0.55

/** Picking up one piece, in seconds from when he's over it. */
export const SUCK = {
  /** the hose is out */
  out: 0.38,
  /** the suction is on: the piece rattles and stands up, then goes up the nozzle */
  pull: [0.3, 1.0] as const,
  /** the lump travels up the hose */
  lump: [1.0, 1.42] as const,
  /** gulp */
  gulp: 1.42,
  /** the hose is back in (or held out for the next piece) */
  end: 1.85,
}
/** Laying one piece on the stack. */
export const DROP = {
  out: 0.34,
  /** he swells, the lump runs down */
  lump: [0.3, 0.7] as const,
  /** the piece pops out */
  pop: 0.7,
  /** ... and is on the stack */
  land: 1.06,
  end: 1.36,
}

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

/**
 * Where he hovers to lay the n-th piece: out in front of the open front and
 * a step along from its place (the way he's working), so the hose reaches
 * across in plain view. Straight in front of it he hid the whole thing
 * behind his own back.
 */
function shedHover(n: number): P3 {
  const spot = stackSpot(n)
  return shedPoint(spot.lx - 0.62, -1.5, STACK_TOP + 0.2 + spot.layer * 0.11)
}

/** Where the nozzle stops to lay the n-th piece: just short of its place, a little above it. */
function shedNozzle(n: number): P3 {
  const spot = stackSpot(n)
  return shedPoint(spot.lx, -1.14, STACK_TOP + 0.17 + spot.layer * 0.11)
}

export function createVacuum() {
  return {
    phase: 'idle' as VacPhase,
    t: 0,
    /** 0..1: how far the hose is out. */
    hose: 0,
    /** Where the nozzle is reaching to (world). */
    reach: null as P3 | null,
    /** Which way the rings run: 1 up into him, -1 down to the nozzle, 0 none. */
    flow: 0,
    /** How far along the rings are (they loop), for the scene to draw. */
    ringT: 0,
    /** The lump in the hose: 0 at his body .. 1 at the nozzle; -1 none. */
    lump: -1,
    /** 1 the moment he swallows a piece (or swells to blow one out), fading to 0. */
    gulp: 0,
    /** 1 when a piece pops out of the nozzle, fading to 0 (the puff, the kick of the hose). */
    puff: 0,
    /** The suction is on (the streaks of air; the nozzle flares). */
    suction: 0,
    /** 0..1: the piece he just blew out, on its way from the nozzle to the stack. */
    fly: 1,
    /** The pieces in him, by kind (0, 1 the halves, 2 a whole log). */
    carried: [] as (0 | 1 | 2)[],
    /** Everything he has stacked so far, in order. */
    placed: [] as (0 | 1 | 2)[],
    /** The piece he's picking up now. */
    chunk: null as Chunk | null,
    /** This pick-up or drop has taken or laid its one piece. */
    handled: false,
    /** The hose stays out on the way to the next piece. */
    keep: false,
    /** He has just finished the lot (a moment's satisfaction), counting down. */
    proud: 0,
  }
}

export type Vacuum = ReturnType<typeof createVacuum>

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const ease = (v: number) => {
  const k = clamp01(v)
  return k * k * (3 - 2 * k)
}
/** Out past the end and back (the hose uncoiling, a piece popping out). */
const overshoot = (v: number) => {
  const k = clamp01(v) - 1
  return 1 + k * k * (2.6 * k + 1.6)
}
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a))

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

/** The nearest piece to him goes first (he works his way round, not back and forth). */
function nearestFirst(sp: Split, hugo: P3) {
  let best = 0
  let bestD = Infinity
  sp.chunks.forEach((c, i) => {
    const d = Math.hypot(c.pos.x - hugo.x, c.pos.z - hugo.z)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  if (best > 0) sp.chunks.unshift(...sp.chunks.splice(best, 1))
  return bestD
}

/**
 * One frame. Returns where HUGO should float to while he's busy (null when
 * he's free to follow the guest again). `hugo` is where he is now.
 */
export function updateVacuum(v: Vacuum, sp: Split, hugo: P3, dt: number): P3 | null {
  v.t += dt
  v.ringT += dt * 2.2
  v.gulp = Math.max(0, v.gulp - dt * 2.6)
  v.puff = Math.max(0, v.puff - dt * 3.2)
  v.proud = Math.max(0, v.proud - dt)
  if (v.fly < 1) v.fly = Math.min(1, v.fly + dt / (DROP.land - DROP.pop))
  const near = (p: P3, r = 0.1) => Math.hypot(p.x - hugo.x, p.y - hugo.y, p.z - hugo.z) < r
  switch (v.phase) {
    case 'idle':
      v.hose += (0 - v.hose) * Math.min(1, dt * 8)
      v.flow = 0
      v.lump = -1
      v.suction = 0
      return null
    case 'toChunk': {
      if (!sp.chunks.length) {
        v.phase = v.carried.length ? 'toShed' : 'idle'
        v.keep = false
        return null
      }
      if (!v.chunk || sp.chunks[0] !== v.chunk) {
        nearestFirst(sp, hugo)
        v.chunk = sp.chunks[0]
      }
      const c = v.chunk
      const over = { x: c.pos.x, y: HOVER, z: c.pos.z }
      // on the way: the hose is in, or (the next piece being close) hangs half out
      const want = v.keep ? KEPT : 0
      v.hose += (want - v.hose) * Math.min(1, dt * 7)
      v.reach = { x: hugo.x, y: hugo.y - HOVER + c.pos.y + 0.1, z: hugo.z }
      v.flow = 0
      v.lump = -1
      v.suction = 0
      if (near(over)) {
        v.phase = 'suck'
        v.t = v.keep ? SUCK.out * 0.55 : 0
        v.handled = false
        c.suck = 0
      }
      return over
    }
    case 'suck': {
      const c = v.chunk
      if (!c) {
        v.phase = 'toChunk'
        return null
      }
      // the nozzle stops just over the piece
      v.reach = { x: c.pos.x, y: c.pos.y + 0.3, z: c.pos.z }
      const pull = span(v.t, SUCK.pull)
      v.suction = v.t > SUCK.pull[0] && v.t < SUCK.lump[0] + 0.1 ? 1 : 0
      v.flow = v.t > SUCK.pull[0] && v.t < SUCK.gulp ? 1 : 0
      v.lump = v.t >= SUCK.lump[0] && v.t < SUCK.lump[1] ? 1 - ease(span(v.t, SUCK.lump)) : -1
      if (!v.handled) c.suck = pull
      if (v.t >= SUCK.pull[1] && !v.handled) {
        v.handled = true
        const i = sp.chunks.indexOf(c)
        if (i >= 0) sp.chunks.splice(i, 1)
        v.carried.push(c.kind)
      }
      // what's next decides whether the hose goes back in
      const nextNear =
        sp.chunks.length > 0 &&
        sp.chunks.some((o) => Math.hypot(o.pos.x - c.pos.x, o.pos.z - c.pos.z) < KEEP_OUT_WITHIN)
      const backTo = v.handled && nextNear ? KEPT : 0
      v.hose =
        v.t < SUCK.gulp
          ? Math.max(v.hose, overshoot(v.t / SUCK.out))
          : 1 + (backTo - 1) * ease((v.t - SUCK.gulp) / (SUCK.end - SUCK.gulp))
      if (v.t >= SUCK.gulp && v.t - dt < SUCK.gulp) v.gulp = 1
      if (v.t >= SUCK.end) {
        v.keep = nextNear
        v.chunk = null
        v.phase = sp.chunks.length ? 'toChunk' : 'toShed'
        v.t = 0
      }
      return { x: c.pos.x, y: HOVER, z: c.pos.z }
    }
    case 'toShed': {
      v.hose += (0 - v.hose) * Math.min(1, dt * 7)
      v.flow = 0
      v.lump = -1
      v.suction = 0
      v.keep = false
      if (!v.carried.length) {
        v.phase = 'idle'
        return null
      }
      const hover = shedHover(v.placed.length)
      if (near(hover, 0.12)) {
        v.phase = 'drop'
        v.t = 0
        v.handled = false
      }
      return hover
    }
    case 'drop': {
      // (this piece's place: it's counted as placed from the moment it pops out)
      const n = v.placed.length - (v.handled ? 1 : 0)
      const nozzle = shedNozzle(n)
      v.reach = nozzle
      const last = v.carried.length === 0
      const more = !last
      v.hose =
        v.t < DROP.pop
          ? Math.max(v.hose, overshoot(v.t / DROP.out))
          : more
            ? 1
            : 1 - ease((v.t - DROP.land) / (DROP.end - DROP.land))
      v.flow = v.t > DROP.lump[0] && v.t < DROP.pop + 0.05 ? -1 : 0
      v.lump = v.t >= DROP.lump[0] && v.t < DROP.lump[1] ? ease(span(v.t, DROP.lump)) : -1
      // he swells before he blows
      if (v.t >= DROP.lump[0] - 0.12 && v.t - dt < DROP.lump[0] - 0.12) v.gulp = 1
      if (v.t >= DROP.pop && !v.handled && v.carried.length) {
        v.handled = true
        v.placed.push(v.carried.shift() as 0 | 1 | 2)
        v.puff = 1
        v.fly = 0
      }
      if (v.t >= DROP.end) {
        if (v.carried.length) {
          v.phase = 'toShed'
          // (the hose stays out as he slides along to the next place)
          v.t = 0
          const next = shedHover(v.placed.length)
          if (near(next, 0.5)) {
            v.phase = 'drop'
            v.t = 0.1
            v.handled = false
          }
        } else {
          v.phase = 'idle'
          v.proud = 1.4
          v.t = 0
        }
      }
      return shedHover(n)
    }
  }
}

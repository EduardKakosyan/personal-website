// Splitting wood at the chopping block (Eduard: "a little mini game that they
// can use to split the wood"). Plain simulation, no three.js or React: the
// scene reads it each frame to pose the guest, the axe, the log and the halves.
//
// How it plays: the guest picks the axe out of the block and a log goes on.
// A marker sweeps back and forth along a bar; swing (E, Space, click or the
// button) when it's in the middle and the log splits clean in two, the halves
// flying off the block. Swing early or late and the axe glances off: the log
// tips off the block and a fresh one goes on. Five clean splits is the night's
// firewood; the guest can stop any time.

import { CHOPPING_BLOCK, SPLIT_GOAL, blocked, type Vec2 } from './world'

export type SplitPhase =
  | 'off'
  /** Walking to the block. */
  | 'walking'
  /** Taking the axe out of the block (the log appears). */
  | 'pickup'
  /** Axe held, marker sweeping, waiting for the swing. */
  | 'ready'
  /** Arms going up. */
  | 'windup'
  /** The axe coming down. */
  | 'chop'
  /** Split: the halves fly; a moment before the next log. */
  | 'hit'
  /** Glanced off: the log tips away. */
  | 'miss'
  /** Putting the axe back. */
  | 'putback'

export type Chunk = {
  pos: { x: number; y: number; z: number }
  vel: { x: number; y: number; z: number }
  /** Yaw and how far it has fallen over (0 upright .. 1 on its side). */
  yaw: number
  tip: number
  tipRate: number
  /** Which way it lies, once down. */
  side: number
  settled: boolean
  /** Which mesh: 0 = half A, 1 = half B, 2 = a whole log that tipped off. */
  kind: 0 | 1 | 2
  age: number
  /** 0..1 while HUGO sucks it up his hose (vacuum.ts). */
  suck?: number
}

const GRAVITY = 14
/** The top of the block, where the log stands. */
export const LOG_Y = 0.46
export const LOG_H = 0.36
/** How close to the middle counts as a clean split, and as a perfect one. */
const SWEET = 0.12
const PERFECT = 0.045
const WINDUP = 0.26
const CHOP = 0.11
/** Loose chunks lying about the block before the oldest ones go. */
const MAX_CHUNKS = 10

export function createSplit() {
  return {
    phase: 'off' as SplitPhase,
    t: 0,
    /** 0..1 along the bar. */
    marker: 0,
    dir: 1,
    speed: 1.05,
    /** Clean splits this session, and the last swing's result. */
    count: 0,
    perfect: false,
    /** Is there a log on the block, and how far it has popped up (0..1). */
    log: false,
    logIn: 0,
    chunks: [] as Chunk[],
    /** How far the axe is raised (0 held low .. 1 overhead), for the arms. */
    raise: 0,
    /** Set for a frame when something happened, for the HUD. */
    event: null as null | 'crack' | 'perfect' | 'thunk' | 'done',
    done: false,
  }
}

export type Split = ReturnType<typeof createSplit>

const damp = (dt: number, rate: number) => 1 - Math.exp(-rate * dt)

export function splitActive(s: Split) {
  return s.phase !== 'off'
}

/** The guest holds the axe from the pickup until it goes back. */
export function holdsAxe(s: Split) {
  return s.phase !== 'off' && s.phase !== 'walking' && !(s.phase === 'pickup' && s.t < 0.3)
}

export function startSplit(s: Split) {
  if (s.phase !== 'off') return
  s.phase = 'walking'
  s.t = 0
  s.count = 0
  s.done = false
  s.speed = 1.05
}

/** The guest has reached the block: take the axe. */
export function arriveAtBlock(s: Split) {
  if (s.phase !== 'walking') return
  s.phase = 'pickup'
  s.t = 0
}

/** Swing, if the marker's sweeping. Returns false if there's nothing to swing at. */
export function swing(s: Split) {
  if (s.phase !== 'ready' || !s.log) return false
  s.phase = 'windup'
  s.t = 0
  return true
}

/** Put the axe back and stop (walking away, Esc, or the Done button). */
export function stopSplit(s: Split) {
  if (s.phase === 'off' || s.phase === 'putback') return
  if (s.phase === 'walking') {
    s.phase = 'off'
    return
  }
  s.phase = 'putback'
  s.t = 0
  s.log = false
}

function newLog(s: Split) {
  s.log = true
  s.logIn = 0
}

/** A half of the log, flung sideways off the block (left or right of the swing). */
function fling(s: Split, kind: 0 | 1, side: number, power: number, guestYaw: number) {
  // sideways is across the guest's facing: the split runs along the swing
  const sx = Math.cos(guestYaw) * side
  const sz = -Math.sin(guestYaw) * side
  s.chunks.push({
    pos: { x: CHOPPING_BLOCK.x + sx * 0.08, y: LOG_Y, z: CHOPPING_BLOCK.z + sz * 0.08 },
    vel: { x: sx * (1.1 + power * 0.9), y: 2.2 + power * 1.4, z: sz * (1.1 + power * 0.9) },
    yaw: guestYaw,
    tip: 0,
    tipRate: 2.5 + Math.random() * 2,
    side,
    settled: false,
    kind,
    age: 0,
  })
}

/** The whole log, knocked off the block by a glancing blow. */
function tipOff(s: Split, guestYaw: number) {
  const side = Math.random() < 0.5 ? -1 : 1
  const sx = Math.cos(guestYaw) * side + Math.sin(guestYaw) * 0.5
  const sz = -Math.sin(guestYaw) * side + Math.cos(guestYaw) * 0.5
  const d = Math.hypot(sx, sz) || 1
  s.chunks.push({
    pos: { x: CHOPPING_BLOCK.x, y: LOG_Y, z: CHOPPING_BLOCK.z },
    vel: { x: (sx / d) * 0.9, y: 0.9, z: (sz / d) * 0.9 },
    yaw: guestYaw + side * 0.4,
    tip: 0,
    tipRate: 2.2,
    side,
    settled: false,
    kind: 2,
    age: 0,
  })
  s.log = false
}

export function updateSplit(s: Split, dt: number, guestYaw: number) {
  s.event = null
  // (the loose chunks keep falling and rolling after the game is put away;
  // they used to freeze mid-roll the moment it ended)
  if (s.phase === 'off') {
    updateChunks(s, dt)
    return
  }
  s.t += dt
  switch (s.phase) {
    case 'walking':
      break
    case 'pickup':
      if (s.t > 0.45 && !s.log) newLog(s)
      if (s.t > 0.8) {
        s.phase = 'ready'
        s.t = 0
      }
      break
    case 'ready':
      s.marker += s.dir * s.speed * dt
      if (s.marker > 1) {
        s.marker = 2 - s.marker
        s.dir = -1
      } else if (s.marker < 0) {
        s.marker = -s.marker
        s.dir = 1
      }
      break
    case 'windup':
      if (s.t > WINDUP) {
        s.phase = 'chop'
        s.t = 0
      }
      break
    case 'chop':
      if (s.t > CHOP) {
        const off = Math.abs(s.marker - 0.5)
        if (off < SWEET) {
          const power = off < PERFECT ? 1 : 1 - off / SWEET
          s.perfect = off < PERFECT
          fling(s, 0, -1, power, guestYaw)
          fling(s, 1, 1, power, guestYaw)
          s.log = false
          s.count += 1
          s.speed = Math.min(1.9, s.speed + 0.11)
          s.event = s.perfect ? 'perfect' : 'crack'
          s.phase = 'hit'
        } else {
          tipOff(s, guestYaw)
          s.event = 'thunk'
          s.phase = 'miss'
        }
        s.t = 0
      }
      break
    case 'hit':
    case 'miss':
      if (s.t > (s.phase === 'hit' ? 0.55 : 0.8)) {
        if (s.count >= SPLIT_GOAL && !s.done) {
          s.done = true
          s.event = 'done'
          s.phase = 'putback'
          s.t = 0
        } else {
          newLog(s)
          s.phase = 'ready'
          s.t = 0
          s.marker = s.dir > 0 ? 0 : 1
        }
      }
      break
    case 'putback':
      if (s.t > 0.7) s.phase = 'off'
      break
  }
  // the axe: low while waiting, up over the head in the windup, down in the chop
  const raiseGoal =
    s.phase === 'windup' ? 1 : s.phase === 'chop' ? -0.35 : s.phase === 'ready' ? 0.25 : 0
  const rate = s.phase === 'chop' ? 40 : s.phase === 'windup' ? 14 : 8
  s.raise += (raiseGoal - s.raise) * damp(dt, rate)
  // the log pops up onto the block
  s.logIn += ((s.log ? 1 : 0) - s.logIn) * damp(dt, 12)

  updateChunks(s, dt)
}

/** The loose chunks: fly, bounce, tip over, roll to a stop. */
function updateChunks(s: Split, dt: number) {
  for (const c of s.chunks) {
    c.age += dt
    if (c.settled) continue
    c.vel.y -= GRAVITY * dt
    const next = { x: c.pos.x + c.vel.x * dt, z: c.pos.z + c.vel.z * dt }
    if (!blocked(next, 0.05) || c.pos.y > 0.3) {
      c.pos.x = next.x
      c.pos.z = next.z
    } else {
      c.vel.x *= -0.3
      c.vel.z *= -0.3
    }
    c.pos.y += c.vel.y * dt
    c.tip = Math.min(1, c.tip + c.tipRate * dt)
    if (c.pos.y <= 0) {
      c.pos.y = 0
      if (Math.abs(c.vel.y) > 1.6) {
        c.vel.y = -c.vel.y * 0.3
        c.vel.x *= 0.5
        c.vel.z *= 0.5
      } else {
        c.vel.y = 0
        c.vel.x *= 1 - damp(dt, 5)
        c.vel.z *= 1 - damp(dt, 5)
        if (Math.hypot(c.vel.x, c.vel.z) < 0.05 && c.tip >= 1) c.settled = true
      }
    }
  }
  while (s.chunks.length > MAX_CHUNKS) s.chunks.shift()
}

/** Where the guest should stand and face for the game. */
export function splitStance(): { at: Vec2; yaw: number } {
  return { at: { x: CHOPPING_BLOCK.x - 0.82, z: CHOPPING_BLOCK.z }, yaw: Math.PI / 2 }
}

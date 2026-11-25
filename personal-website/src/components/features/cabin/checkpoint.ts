// The tour's checkpoints (Eduard: "it should remember the last checkpoint you
// have hit in case the website crashes or something like that"). Each place
// the tour reaches is saved as the guest gets there: the cabin once Eduard has
// welcomed them, then the woodshed, the brook and the fire. A reload, a
// crash, or coming back from one of the site's other pages puts them back at
// the last one, with what they've asked Eduard by the fire still ticked.
//
// It's kept for the visit (sessionStorage), not for good: the same tab comes
// back to it, and a new visit starts on the gravel road again.
//
// Plain data and storage. No `@/` imports and no React: the Node tests load
// this file directly.

import { BROOK_LEAD_PATH, STAIRS_TOP } from './brook'
import { FIRE, NIGHT_START } from './fire'
import { GUEST_SKIP, LEAD_PATH, WOODSHED, type Vec2 } from './world'

export type CheckpointAt = 'cabin' | 'woodshed' | 'brook' | 'fire'

/** In the order the tour reaches them. */
export const CHECKPOINTS: readonly CheckpointAt[] = ['cabin', 'woodshed', 'brook', 'fire']

export type Checkpoint = {
  at: CheckpointAt
  /** The questions asked by the fire (fire-questions.ts ids): they keep their ticks. */
  asked: string[]
}

/** For "Back at the woodshed, where you left off." */
export const CHECKPOINT_NAMES: Record<CheckpointAt, string> = {
  cabin: 'the cabin',
  woodshed: 'the woodshed',
  brook: 'the brook',
  fire: 'the fire',
}

/**
 * Where the guest is put back for each one, and what they face. Each spot is
 * close enough to its place to count as having got there again (the woodshed's
 * and the brook's arrival lines and the fire's welcome play once more, which
 * says where they are), and on the way HUGO leads them along.
 */
export const RESUME_SPOTS: Record<CheckpointAt, { at: Vec2; facing: Vec2 }> = {
  // on the driveway, looking up it at the cabin (where ?skip starts)
  cabin: { at: GUEST_SKIP, facing: { x: GUEST_SKIP.x, z: 0 } },
  // the end of HUGO's way there, in front of the woodshed by the workbench
  woodshed: { at: LEAD_PATH[LEAD_PATH.length - 1], facing: WOODSHED },
  // the end of his way there, at the top of the stairs down to the water
  brook: { at: BROOK_LEAD_PATH[BROOK_LEAD_PATH.length - 1], facing: STAIRS_TOP },
  fire: { at: NIGHT_START, facing: FIRE },
}

const order = (at: CheckpointAt) => CHECKPOINTS.indexOf(at)

/** Whether `cp` is at `at` or further round. */
export function reached(cp: Checkpoint | null, at: CheckpointAt) {
  return cp !== null && order(cp.at) >= order(at)
}

/**
 * The guest has got to `at`. A checkpoint never goes back: walking past the
 * woodshed again on the way to the fire leaves it at the brook.
 */
export function reach(cp: Checkpoint | null, at: CheckpointAt): Checkpoint {
  if (cp && reached(cp, at)) return cp
  return { at, asked: cp?.asked ?? [] }
}

/** The guest asked Eduard something by the fire. */
export function withAsked(cp: Checkpoint | null, id: string): Checkpoint {
  const base = reach(cp, 'fire')
  return base.asked.includes(id) ? base : { ...base, asked: [...base.asked, id] }
}

/** Read a saved checkpoint back, or null for anything that isn't one. */
export function parseCheckpoint(raw: string | null): Checkpoint | null {
  if (!raw) return null
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  if (!v || typeof v !== 'object') return null
  const { at, asked } = v as { at?: unknown; asked?: unknown }
  if (typeof at !== 'string' || !CHECKPOINTS.includes(at as CheckpointAt)) return null
  return {
    at: at as CheckpointAt,
    asked: Array.isArray(asked) ? asked.filter((a): a is string => typeof a === 'string') : [],
  }
}

const KEY = 'cabin.checkpoint.v1'

export function loadCheckpoint(): Checkpoint | null {
  try {
    return parseCheckpoint(window.sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveCheckpoint(cp: Checkpoint) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(cp))
  } catch {
    // private mode, or storage full: the visit just isn't remembered
  }
}

export function clearCheckpoint() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}

// Which stop of the tour the guest is at, for HUGO's questions (A48). No
// three.js here: the overlay and the Node tests use it too.
import { CHOPPING_BLOCK, WOODSHED, WORKBENCH, insideCabin, type Vec2 } from './world'
import { FIRE } from './fire'

/**
 * The stops HUGO has questions for, in tour order. `arrival` is the gravel
 * road, the driveway and the yard with the deck, Eduard and Rusty. The fire
 * (scene 7) only counts at night (see `hugoStopAt`).
 */
export const HUGO_STOPS = ['arrival', 'cabin', 'woodshed', 'brook', 'fire'] as const
export type HugoStop = (typeof HUGO_STOPS)[number]

/** The fire ring south-east of the deck (fire.ts). */
export const FIRE_RING: Vec2 = FIRE

/**
 * Coarse regions, in metres. The woodshed is the shed itself, the chopping
 * block in front of it and the workbench off its south end; the driveway runs
 * past it about 5 m to the west, behind the stand of trees, and stays
 * `arrival`. The brook is the east end of the grass field, from about 6 m
 * short of the water (the stairs are at x ≈ 22.5).
 */
const WOODSHED_REACH = 4.5
const BLOCK_REACH = 2.6
const BENCH_REACH = 3
const BROOK_FROM_X = 16.5
const FIRE_REACH = 3.5
/** Once at a stop, the guest has to be this much further out before it changes (no flicker at an edge). */
export const STOP_MARGIN = 1

const near = (p: Vec2, c: Vec2, r: number) => Math.hypot(p.x - c.x, p.z - c.z) < r

/**
 * The stop the guest is at. `inside` is whether they're inside the cabin (the
 * scene knows; outside it's worked out from where they stand). Pass the
 * previous stop to keep it until the guest is clearly somewhere else. The
 * fire only counts once it's `night` (scene 7).
 */
export function hugoStopAt(
  p: Vec2,
  inside: boolean = insideCabin(p),
  previous: HugoStop | null = null,
  { night = false }: { night?: boolean } = {},
): HugoStop {
  if (inside) return 'cabin'
  const m = (stop: HugoStop) => (previous === stop ? STOP_MARGIN : 0)
  if (night && near(p, FIRE_RING, FIRE_REACH + m('fire'))) return 'fire'
  if (
    near(p, WOODSHED, WOODSHED_REACH + m('woodshed')) ||
    near(p, CHOPPING_BLOCK, BLOCK_REACH + m('woodshed')) ||
    near(p, WORKBENCH, BENCH_REACH + m('woodshed'))
  )
    return 'woodshed'
  if (p.x > BROOK_FROM_X - m('brook')) return 'brook'
  return 'arrival'
}

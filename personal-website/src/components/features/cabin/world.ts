// Layout of the arrival scene, in three.js coordinates (Y up).
// The models come from art/cabin/scripts/build_arrival.py (Blender, Z up):
// Blender (x, y, z) becomes three.js (x, z, -y). So +X is east, -Z is north:
// the road is to the west, the brook to the east, and the cabin's front faces
// +Z, down the driveway (Eduard's sketch, A55).
// No three.js imports here: the overlay uses this file too.

export type Vec2 = { x: number; z: number }

export const MODELS = {
  set: '/models/cabin/set.glb',
  /** The roof, south wall, string lights and door: faded or moved by the scene. */
  cabinParts: '/models/cabin/cabin-parts.glb',
  /** The woodshed, the stand of trees by it and the saplings: each fades when it hides the guest. */
  seeThrough: '/models/cabin/see-through.glb',
  eduard: '/models/cabin/eduard.glb',
  hiker: '/models/cabin/hiker.glb',
  rusty: '/models/cabin/rusty.glb',
  cow: '/models/cabin/cow.glb',
  hugo: '/models/cabin/hugo.glb',
} as const

/** Where the gravel, meadow and blueberries are (painted in Blender). */
export const GROUND_MASK = '/models/cabin/ground-mask.png'
/** The square the mask covers, in Blender's x/y (matches GROUND in the script). */
export const GROUND_RECT = { x0: -110, y0: -80, size: 200 }

export const SKY = '#9fd0ee'

/**
 * How the world is drawn (see pixel-look.tsx). Eduard picked **soft** (A61):
 * pixel art at about twice the pixel look's resolution. `?look=pixel|smooth`
 * still shows the other two for comparison.
 */
export type Look = 'pixel' | 'soft' | 'smooth'
export const DEFAULT_LOOK: Look = 'soft'
export function parseLook(value: string | null): Look {
  return value === 'pixel' || value === 'soft' || value === 'smooth' ? value : DEFAULT_LOOK
}
/** Rows of pixels the world is drawn with (pixel looks only), normal and Lo-Fi. */
export const LOOK_ROWS: Record<Exclude<Look, 'smooth'>, { normal: number; lofi: number }> = {
  pixel: { normal: 230, lofi: 150 },
  soft: { normal: 460, lofi: 230 },
}

/** The guest starts on the driveway, just after it turns north towards the cabin. */
export const GUEST_START: Vec2 = { x: 0.7, z: 23 }
/** With ?skip=1 the guest starts close enough to trigger the welcome. */
export const GUEST_SKIP: Vec2 = { x: 0.2, z: 9.4 }
export const RUSTY_START: Vec2 = { x: 2.6, z: 2.9 }
/** Where Rusty is when the site opens: already running down the driveway with the cow (A76, option C). */
export const RUSTY_RUN_START: Vec2 = { x: 0.6, z: 13.2 }
// The deck is on the cabin's east side (Eduard's second sketch). Eduard kneels at
// the edge of the finished boards, facing the open south end (and the arriving
// guest), clear of the path from the deck to the door.
export const EDUARD_SPOT = { x: 3.15, y: 0.17, z: 1.3, facing: 0 }

// ------------------------------------------------------------------ the cabin
/** Inside the cabin walls (the floor the guest can walk on). */
const CABIN_INSIDE = { x0: -1.7, x1: 1.7, z0: -2.35, z1: 2.35 }
export const CABIN_FLOOR_Y = 0.25
const DECK = { x0: 1.8, x1: 3.65, z0: -0.45, z1: 2.35, y: 0.3 }
/** The east door: where to stand outside, in the doorway, and just inside. */
export const DOOR = {
  outside: { x: 2.45, z: 1.02 } as Vec2,
  inside: { x: 1.05, z: 1.02 } as Vec2,
  /** Hinge side of the door, for the prompt. */
  prompt: { x: 1.85, y: 1.3, z: 1.02 },
}
/** Things to read inside (the prompt sits over them). */
export const READABLES = {
  resume: { x: -0.18, y: 1.05, z: -1.68, label: 'Read' },
  todo: { x: 0.85, y: 1.95, z: -2.3, label: 'Read' },
} as const
export type ReadableId = keyof typeof READABLES

/** The workbench by the woodshed with the project boxes (scene 5): the prompt sits over it. */
export const WORKBENCH = { x: 7.52, y: 1.7, z: 10.65 }
/** The way the workbench's front faces (east-north-east, the same as the woodshed's). */
export const BENCH_FRONT = { x: 0.819, z: -0.574 }
/** The middle of the six project boxes, where the camera looks at the bench. */
export const BOXES_CENTRE = { x: 7.606, z: 10.77 }
/**
 * Where the guest steps to at the bench: its left end, so they don't stand in
 * front of the boxes.
 */
export const BENCH_SPOT: Vec2 = { x: 8.689, z: 11.356 }
/**
 * Where each project box's name tag shows, in the order of the projects (top of
 * the bench left to right, then the shelf). Copied from the build script's
 * crate positions; the middle tags are offset so neighbours don't overlap.
 */
export const BOX_TAGS = [
  { x: 7.641, y: 1.15, z: 10.941 },
  { x: 7.463, y: 1.33, z: 10.687 },
  { x: 7.285, y: 1.15, z: 10.433 },
  // the shelf: just in front of each box, so the tag shows below the bench top
  { x: 7.996, y: 0.36, z: 11.047 },
  { x: 7.824, y: 0.21, z: 10.801 },
  { x: 7.652, y: 0.36, z: 10.555 },
]
/** HUGO's woodshed line plays the first time the guest comes this close. */
export const WOODSHED = { x: 5.8, z: 8.8 }
export const WOODSHED_DISTANCE = 4
/**
 * Places where the camera turns round to show the thing properly (Eduard): the
 * usual camera looks north from behind the guest, so it sees the woodshed
 * through the stand of trees and the outdoor shower over the cabin roof. Within
 * `enter` metres the camera moves out along `from` (behind the guest) and looks
 * back at it; it turns back once they're further than `leave` (so it doesn't
 * flip back and forth at the edge).
 */
export const CAMERA_SPOTS = [
  // the woodshed, from the grass field, facing its open front and the workbench
  { at: WOODSHED, from: { x: 0.819, z: -0.574 }, enter: 4.2, leave: 5.6 },
  // the outdoor shower, from the east, facing its open side
  { at: { x: 2.9, z: -4.0 }, from: { x: 0.88, z: -0.47 }, enter: 3.0, leave: 4.2 },
]
/** HUGO's way from the cabin to the woodshed when he leads the guest there. */
export const LEAD_PATH: Vec2[] = [
  { x: 3.6, z: 3.0 },
  { x: 4.9, z: 4.6 },
  { x: 6.6, z: 6.0 },
]

/** Every reading panel: the two inside the cabin, and the workbench. */
export type PanelId = ReadableId | 'workbench'

export function insideCabin(p: Vec2) {
  return (
    p.x > CABIN_INSIDE.x0 && p.x < CABIN_INSIDE.x1 && p.z > CABIN_INSIDE.z0 && p.z < CABIN_INSIDE.z1
  )
}

/**
 * The nearest spot inside the cabin, a step in from the walls. Taps while
 * inside stay inside (clicking a wall shouldn't walk the guest out); leaving
 * is through "Go out".
 */
export function clampInsideCabin(p: Vec2): Vec2 {
  const m = 0.3
  return {
    x: Math.min(CABIN_INSIDE.x1 - m, Math.max(CABIN_INSIDE.x0 + m, p.x)),
    z: Math.min(CABIN_INSIDE.z1 - m, Math.max(CABIN_INSIDE.z0 + m, p.z)),
  }
}

/** How high the ground is: the cabin floor and the deck sit above the yard. */
export function groundHeight(p: Vec2) {
  if (insideCabin(p)) return CABIN_FLOOR_Y
  if (p.x > DECK.x0 && p.x < DECK.x1 && p.z > DECK.z0 && p.z < DECK.z1) return DECK.y
  return 0
}

/** The guest triggers the welcome when they get this close to the deck. */
export const WELCOME_DISTANCE = 7.5
export const WELCOME_POINT: Vec2 = { x: 2.7, z: 2.6 }

/** Walkable area: the clearing and grass field, between the tree strip (west) and the brook (east). */
const BOUNDS = { x0: -8, x1: 23.5, z0: -6, z1: 30 }

type Box = { x0: number; x1: number; z0: number; z1: number }
type Circle = { x: number; z: number; r: number }

/** Things the guest walks around (padded at runtime). */
const BOXES: Box[] = [
  // cabin walls (the long side faces east; the door is a gap in the east wall)
  { x0: -1.85, x1: -1.7, z0: -2.5, z1: 2.5 }, // west
  { x0: -1.85, x1: 1.85, z0: -2.5, z1: -2.35 }, // north
  { x0: -1.85, x1: 1.85, z0: 2.35, z1: 2.5 }, // south (barn doors)
  { x0: 1.7, x1: 1.85, z0: -2.5, z1: 0.6 }, // east, north of the door
  { x0: 1.7, x1: 1.85, z0: 1.45, z1: 2.5 }, // east, south of the door
  // inside
  { x0: -0.95, x1: 0.55, z0: -2.1, z1: -1.4 }, // bistro table and chairs
  { x0: -1.7, x1: -1.2, z0: -2.1, z1: -1.4 }, // folding table
  { x0: -1.7, x1: -1.25, z0: -0.05, z1: 0.6 }, // tote
  { x0: -1.7, x1: -1.25, z0: 1.3, z1: 2.3 }, // chainsaw
  { x0: 1.2, x1: 1.7, z0: -1.75, z1: -0.35 }, // counter under the window
  { x0: 1.4, x1: 1.7, z0: -0.1, z1: 0.35 }, // tackle box, north of the door
  { x0: 4.2, x1: 4.85, z0: -2.9, z1: -0.9 }, // lumber pile
  { x0: 1.95, x1: 2.55, z0: -1.5, z1: -0.8 }, // sink
  { x0: 3.0, x1: 4.6, z0: 3.9, z1: 5.7 }, // picnic table
  { x0: 2.1, x1: 3.7, z0: -4.8, z1: -3.2 }, // outdoor shower
]
const CIRCLES: Circle[] = [
  { x: -1.5, z: 0.85, r: 0.18 }, // propane tank
  { x: 4.15, z: -3.27, r: 0.5 }, // shower door
  { x: 3.0, z: -2.7, r: 0.35 }, // the stepladder by the shower
  { x: 2.45, z: -2.05, r: 0.35 }, // grill
  { x: 4.4, z: -3.5, r: 0.6 }, // sawhorse
  { x: 6.0, z: 2.6, r: 0.8 }, // fire ring
  { x: 5.6, z: -0.8, r: 0.35 }, // camp chairs
  { x: 6.7, z: -1.1, r: 0.35 },
  { x: 7.7, z: -0.6, r: 0.35 },
  { x: 5.8, z: 8.8, r: 1.6 }, // woodshed
  { x: 7.26, z: 10.28, r: 0.55 }, // workbench, off the woodshed's south end
  { x: 7.78, z: 11.02, r: 0.55 },
  { x: 5.62, z: 5.75, r: 0.45 }, // chopping block
  // the stand of trees between the driveway and the woodshed
  { x: 2.8, z: 7.6, r: 0.9 },
  { x: 3.3, z: 9.0, r: 1.1 },
  { x: 2.7, z: 10.3, r: 0.4 },
  { x: 3.4, z: 11.5, r: 1.0 },
  { x: 2.9, z: 12.7, r: 0.95 },
  { x: 4.3, z: 13.0, r: 0.4 },
  { x: 5.6, z: 13.3, r: 1.0 },
  { x: 7.0, z: 12.9, r: 0.4 },
  { x: 8.2, z: 13.5, r: 0.95 },
  // young spruce and blue spruce in the grass field
  { x: 7.8, z: 5.6, r: 0.4 },
  { x: 11.0, z: 4.6, r: 0.3 },
  { x: 14.5, z: 9.0, r: 0.5 },
  { x: 18.0, z: 3.2, r: 0.3 },
  { x: 12.5, z: 16.0, r: 0.4 },
  { x: 20.0, z: 12.5, r: 0.5 },
  { x: 16.0, z: 22.0, r: 0.35 },
  { x: -6.5, z: 14.0, r: 0.5 },
  { x: 6.5, z: 24.0, r: 0.45 },
  { x: -5.6, z: 9.0, r: 0.5 }, // rocks
  { x: 8.4, z: 4.0, r: 0.7 },
  { x: -6.8, z: 2.0, r: 0.6 },
]

/** Eduard: he moves (fetching boards), so the scene keeps this up to date. */
export const EDUARD_BLOCK = { x: 3.15, z: 1.3, r: 0.4 }

export function blocked(p: Vec2, pad = 0.28) {
  if (Math.hypot(p.x - EDUARD_BLOCK.x, p.z - EDUARD_BLOCK.z) < EDUARD_BLOCK.r + pad) return true
  return (
    BOXES.some(
      (o) => p.x > o.x0 - pad && p.x < o.x1 + pad && p.z > o.z0 - pad && p.z < o.z1 + pad,
    ) || CIRCLES.some((c) => Math.hypot(p.x - c.x, p.z - c.z) < c.r + pad)
  )
}

/** Keep a tap target inside the walkable area. */
export function clampToWalkable(p: Vec2): Vec2 {
  return {
    x: Math.min(BOUNDS.x1, Math.max(BOUNDS.x0, p.x)),
    z: Math.min(BOUNDS.z1, Math.max(BOUNDS.z0, p.z)),
  }
}

/** One movement step that slides along obstacles instead of passing through them. */
export function step(from: Vec2, to: Vec2, maxStep: number, pad = 0.28): Vec2 {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-4) return from
  const s = Math.min(1, maxStep / d)
  const next = { x: from.x + dx * s, z: from.z + dz * s }
  if (!blocked(next, pad)) return next
  const slideX = { x: next.x, z: from.z }
  if (!blocked(slideX, pad) && Math.abs(dx) > 1e-3) return slideX
  const slideZ = { x: from.x, z: next.z }
  if (!blocked(slideZ, pad) && Math.abs(dz) > 1e-3) return slideZ
  return from
}

/** Where a thrown cow can land: somewhere open, away from the buildings. */
export function landingSpot(from: Vec2, toward: Vec2, distance: number): Vec2 {
  const dx = toward.x - from.x
  const dz = toward.z - from.z
  const d = Math.hypot(dx, dz) || 1
  for (let tries = 0; tries < 12; tries++) {
    const a =
      Math.atan2(dz, dx) + (tries === 0 ? 0 : (tries % 2 ? 1 : -1) * 0.35 * Math.ceil(tries / 2))
    const p = clampToWalkable({
      x: from.x + Math.cos(a) * distance,
      z: from.z + Math.sin(a) * distance,
    })
    if (!blocked(p, 0.5)) return p
  }
  return clampToWalkable({ x: from.x + (dx / d) * 2, z: from.z + (dz / d) * 2 })
}

/** Turn an angle towards a target angle by at most `amount`, the short way round. */
export function turnTowards(current: number, target: number, amount: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + Math.max(-amount, Math.min(amount, diff))
}

export function facing(from: Vec2, to: Vec2) {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

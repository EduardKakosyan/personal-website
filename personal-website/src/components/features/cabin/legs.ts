// Where a leg meets the ground. The guests and Eduard share a build
// (guest_model.py, eduard_model.py: the hip 0.4 up, the knee 0.2 below it).
// Plain maths, no three.js or React: the scene and eduard.ts use it to put a
// kneeling or crouching body down so its knees or boots rest on the ground,
// whatever the bend, where a fixed drop sank the boots into the ground in
// one pose and left the knees in the air in another.

/** Hip to knee, and hip to the bottom of the thigh. */
const THIGH = 0.2
const THIGH_END = 0.21
/**
 * Points on the shin and boot, from the knee (y up, z forwards, before the
 * knee bends): the front and back of the knee, the heel, the sole under the
 * ball of the foot, and the toe. Taken from the models' vertices.
 */
const SHIN: readonly (readonly [number, number])[] = [
  [0, 0.07],
  [0, -0.07],
  [-0.185, -0.055],
  [-0.19, 0.12],
  [-0.17, 0.165],
]

/**
 * How far below the hip the leg reaches. `thigh` is the thigh's angle from
 * hanging straight down (negative: forwards), `shin` the bend at the knee
 * (positive: the shin back). The same angles the scene gives the joints.
 */
export function legReach(thigh: number, shin: number) {
  const kneeY = -THIGH * Math.cos(thigh)
  let low = -THIGH_END * Math.cos(thigh)
  const c = Math.cos(thigh + shin)
  const s = Math.sin(thigh + shin)
  for (const [y, z] of SHIN) low = Math.min(low, kneeY + y * c - z * s)
  return -low
}

/** Standing straight, the soles are this far below the hip. */
export const STAND_REACH = legReach(0, 0)

/**
 * How far to lower a body from standing so the lower of its two legs rests
 * on the ground (0 standing straight).
 */
export function legDrop(thighL: number, shinL: number, thighR = thighL, shinR = shinL) {
  return STAND_REACH - Math.max(legReach(thighL, shinL), legReach(thighR, shinR))
}

/**
 * Kneeling: the thighs a little forward of straight down, the shins folded
 * back past flat so the knees and the toes of the boots both rest on the
 * ground (the shin flat behind pushed the toes into it).
 */
export const KNEEL = { thigh: -0.15, shin: Math.PI / 2 + 0.66 }

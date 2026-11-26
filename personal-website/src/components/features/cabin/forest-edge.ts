// Where the forest round the clearing starts, so a camera that has been moved
// off its everyday place (a spot's view turned round to show something, or
// the visitor's own turn) can be kept out of the trees. Plain maths, no
// three.js: the scene and the tests use it.
//
// The forest is merged into set.glb, so unlike the stand by the woodshed its
// trees can't fade when they're in the way: a camera out among them sees
// nothing but branches. (Eduard, at the outdoor shower: "your camera goes
// into a tree so then regardless of how much you click and where you cant
// get out".)
//
// The open ground mirrors forest() in art/cabin/scripts/build_arrival.py
// (`open_ground`: no tree is planted inside it), in three.js coordinates
// (the script's y is -z here). Keep the two in step.

import { brookX } from './brook'
import type { Vec2 } from './world'

/**
 * How far the crowns of the trees at the forest's edge reach out over the
 * open ground at the camera's height (5 m up and more). Measured on set.glb:
 * at most about 2.4 m, the big spruces along the north of the grass field.
 */
export const CROWN_REACH = 2.6

/** How far inside a rectangle a point is; outside it, minus how far away. */
function depthIn(p: Vec2, x0: number, x1: number, z0: number, z1: number) {
  const dx = Math.max(x0 - p.x, p.x - x1)
  const dz = Math.max(z0 - p.z, p.z - z1)
  return dx <= 0 && dz <= 0 ? -Math.max(dx, dz) : -Math.hypot(Math.max(dx, 0), Math.max(dz, 0))
}

/**
 * How far inside the open ground a point is, in metres (below 0, how far
 * out among the trees). The open ground is the clearing, from the tree strip
 * in the west to the brook (whose banks are kept clear 2.1 m either side of
 * its middle), and the yard round the cabin, which runs further north.
 * Inside, taking the larger of the two is never more than the true distance
 * to the edge.
 */
export function clearingDepth(p: Vec2) {
  return Math.max(
    depthIn(p, -9, brookX(p.z) + 2.1, -6.5, 44), // the clearing
    depthIn(p, -7, 9, -10, 44), // the yard
  )
}

/**
 * How much of its offset from the guest the camera can keep and stay clear
 * of the crowns: 1 where that's already so, less to bring it in towards the
 * guest (it then looks down more steeply), but never below `least`. Where no
 * amount is clear (the guest is right at the forest's edge themselves), the
 * one that's furthest from the trees.
 */
export function cameraReach(guest: Vec2, off: Vec2, least = 0.3) {
  let best = 1
  let bestDepth = -Infinity
  for (let i = 0; ; i++) {
    const k = Math.max(least, 1 - i * 0.02)
    const depth = clearingDepth({ x: guest.x + off.x * k, z: guest.z + off.z * k })
    if (depth >= CROWN_REACH) return k
    if (depth > bestDepth) {
      best = k
      bestDepth = depth
    }
    if (k <= least) return best
  }
}

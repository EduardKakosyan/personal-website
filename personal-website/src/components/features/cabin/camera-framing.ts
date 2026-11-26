// The set views that hold the camera for a while out in the yard: the view
// turned round at the woodshed and at the outdoor shower (CAMERA_SPOTS), and
// the bench's view of the project boxes. The moments with a camera of their
// own (inside, a box, the chopping block, the fire) are the scene's business.
//
// Eduard, on a phone: "you can get stuck at the woodshed because you can't
// control where your camera looks in there and then you have to do this
// stupid 1000 clicks to get somewhere". The woodshed view looks back at the
// shed from the field, and a phone's narrow screen shows little else; it
// held the camera all the while the guest was within a few metres of the
// shed, a drag did nothing there, and every step out from the bench brought
// it straight back. So:
//  - turning or zooming the camera in a set view lets it go: the everyday
//    camera takes over, facing the way the view faced, and the visitor turns
//    it from there (the scene works out the turn, `yawFacing`);
//  - walking off from the bench lets the woodshed's view go as well (it's
//    for arriving; going back to it each time pointed the camera at the shed
//    just as the guest wanted to leave);
//  - a view let go stays let go until the guest walks out of its range, so
//    it doesn't flip back and forth; next time they come, it turns round again.
//
// Plain data and maths. No `@/` imports and no React: the Node tests load
// this file directly.

import { CAMERA_SPOTS, type Vec2 } from './world'

export type Framing = {
  /** Which of CAMERA_SPOTS the guest is in range of (-1: none). */
  viewSpot: number
  /** ... and its view has let go of the camera. */
  spotLetGo: boolean
  /** The bench's view has let go of the camera (until the guest steps away from the bench). */
  benchLetGo: boolean
  /** Last frame the guest was at the bench (or busy with one of its boxes). */
  wasAtBench: boolean
}

export const newFraming = (): Framing => ({
  viewSpot: -1,
  spotLetGo: false,
  benchLetGo: false,
  wasAtBench: false,
})

/**
 * Which set view holds the camera this frame. `own`: a moment with a camera
 * of its own (they win, and the spot's view starts afresh after them);
 * `atBench`: standing at the workbench; `atBox`: walking to one of its boxes
 * or looking in one.
 */
export function holdCamera(
  f: Framing,
  guest: Vec2,
  { own, atBench, atBox }: { own: boolean; atBench: boolean; atBox: boolean },
): { spot: number; bench: boolean } {
  const away = (i: number) =>
    Math.hypot(guest.x - CAMERA_SPOTS[i].at.x, guest.z - CAMERA_SPOTS[i].at.z)
  // In within `enter`, out past `leave` (further, so it doesn't flip at the edge).
  if (own || (f.viewSpot >= 0 && away(f.viewSpot) > CAMERA_SPOTS[f.viewSpot].leave)) f.viewSpot = -1
  if (f.viewSpot < 0 && !own)
    f.viewSpot = CAMERA_SPOTS.findIndex((_, i) => away(i) < CAMERA_SPOTS[i].enter)
  if (f.viewSpot < 0) f.spotLetGo = false
  // walking off from the bench (not to one of its boxes)
  const benchNow = atBench || atBox
  if (f.wasAtBench && !benchNow && !own) f.spotLetGo = true
  f.wasAtBench = benchNow
  if (!atBench) f.benchLetGo = false
  return { spot: f.spotLetGo ? -1 : f.viewSpot, bench: atBench && !f.benchLetGo }
}

/** The visitor turned or zoomed the camera in a set view: it lets go. */
export function letGo(f: Framing) {
  f.spotLetGo = true
  f.benchLetGo = true
}

/**
 * The visitor's turn (radians, the scene's `camYaw`) that has the everyday
 * camera face the way a camera at `from` looking at `to` faces. `facing` is
 * the everyday camera's own way, unturned: from its spot behind the guest to
 * the point it looks at.
 */
export function yawFacing(from: Vec2, to: Vec2, facing: Vec2) {
  const a = Math.atan2(to.x - from.x, to.z - from.z) - Math.atan2(facing.x, facing.z)
  return Math.atan2(Math.sin(a), Math.cos(a))
}

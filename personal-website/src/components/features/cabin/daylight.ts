// Time passes during the visit (A39): a sunny summer afternoon on arrival, the
// light turning golden on the way round (golden by the woodshed), and sunset
// at the brook. Night by the fire is scene 7 and isn't here yet.
//
// It follows where the guest is, eastwards across the property (the cabin is
// west, the woodshed in the middle, the brook on the east edge), so it's
// gentle, and it goes back if they walk back: the agent's choice, for Eduard
// to confirm (the other way would be to tie it to how far the tour has got,
// and never turn it back).

import * as THREE from 'three'
import type { Vec2 } from './world'

type Light = {
  /** The sky (the background and the haze). */
  sky: string
  sun: string
  sunIntensity: number
  /** Where the sun is, from the guest (it sinks towards the west). */
  sunFrom: { x: number; y: number; z: number }
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  /** The water's glints and the sheen on it (brook-water.ts). */
  glint: string
  sheen: string
}

/** The arrival: the scene's original afternoon light. */
const AFTERNOON: Light = {
  sky: '#9fd0ee',
  sun: '#ffe2a8',
  sunIntensity: 2.1,
  sunFrom: { x: -10, y: 12, z: 5 },
  hemiSky: '#b9cdf5',
  hemiGround: '#7c8f55',
  hemiIntensity: 1.55,
  glint: '#fff4d6',
  sheen: '#d6e8e4',
}
/** Golden: warmer, a little lower. */
const GOLDEN: Light = {
  sky: '#b3d3e6',
  sun: '#ffcf87',
  sunIntensity: 2.15,
  sunFrom: { x: -11.5, y: 9.5, z: 4 },
  hemiSky: '#c5cbe6',
  hemiGround: '#828c50',
  hemiIntensity: 1.5,
  glint: '#ffe2a0',
  sheen: '#dfe4d6',
}
/** Sunset at the brook: a low orange sun, a peach sky, lilac in the shadows. */
const SUNSET: Light = {
  sky: '#f1c7a6',
  sun: '#ffbe8a',
  sunIntensity: 2.0,
  sunFrom: { x: -13, y: 6, z: 2.5 },
  hemiSky: '#c4bdd6',
  hemiGround: '#768050',
  hemiIntensity: 1.45,
  glint: '#ffd394',
  sheen: '#f4dcc4',
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/**
 * How far into the evening it is where the guest stands: 0 afternoon,
 * 1 golden (from the woodshed on), 2 sunset (at the brook).
 */
export function eveningAt(p: Vec2) {
  return smooth(2.5, 7.5, p.x) + smooth(15, 23, p.x)
}

const ca = new THREE.Color()
const cb = new THREE.Color()
function mixColor(out: THREE.Color, a: string, b: string, k: number) {
  return out.copy(ca.set(a)).lerp(cb.set(b), k)
}

/** The light for an evening value (eveningAt), blended between the three. */
function lightAt(e: number) {
  const [a, b, k] = e <= 1 ? [AFTERNOON, GOLDEN, e] : [GOLDEN, SUNSET, e - 1]
  return { a, b, k }
}

export type DaylightTargets = {
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  background: THREE.Color
  fog: THREE.Fog | null
  glint: THREE.Color
  sheen: THREE.Color
  /** The sky the water reflects. */
  waterSky: THREE.Color
}

/**
 * Set the lights for the evening value `e`, around the guest at `at`. The
 * sun is placed relative to the guest (its shadow box follows them).
 */
export function applyDaylight(t: DaylightTargets, e: number, at: Vec2) {
  const { a, b, k } = lightAt(e)
  mixColor(t.background, a.sky, b.sky, k)
  if (t.fog) t.fog.color.copy(t.background)
  t.waterSky.copy(t.background)
  mixColor(t.sun.color, a.sun, b.sun, k)
  t.sun.intensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * k
  const f = {
    x: a.sunFrom.x + (b.sunFrom.x - a.sunFrom.x) * k,
    y: a.sunFrom.y + (b.sunFrom.y - a.sunFrom.y) * k,
    z: a.sunFrom.z + (b.sunFrom.z - a.sunFrom.z) * k,
  }
  t.sun.position.set(at.x + f.x, f.y, at.z + f.z)
  t.sun.target.position.set(at.x, 0, at.z - 3)
  t.sun.target.updateMatrixWorld()
  mixColor(t.hemi.color, a.hemiSky, b.hemiSky, k)
  mixColor(t.hemi.groundColor, a.hemiGround, b.hemiGround, k)
  t.hemi.intensity = a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * k
  mixColor(t.glint, a.glint, b.glint, k)
  mixColor(t.sheen, a.sheen, b.sheen, k)
}

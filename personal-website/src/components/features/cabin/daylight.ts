// Time passes during the visit (A39): a sunny summer afternoon on arrival, the
// light turning golden on the way round (golden by the woodshed), sunset at
// the brook, and then night for the fire (scene 7, A27): the blue hour first,
// then dark, "lit only by the string lights and the flames".
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

/**
 * The blue hour, on the way back from the brook (photo 02): the sun's gone,
 * the sky is a deep evening blue and everything is cool and even.
 */
const DUSK: Light = {
  sky: '#55698f',
  sun: '#b9a6c4',
  sunIntensity: 0.0,
  sunFrom: { x: -13, y: 6, z: 2.5 },
  hemiSky: '#8e9cc4',
  hemiGround: '#4d5a52',
  hemiIntensity: 1.0,
  glint: '#c9d3ea',
  sheen: '#7f8fb2',
}
/**
 * Night by the fire: a dark blue sky, a little cool moonlight from high in
 * the south-east so shapes still read, and the rest left to the flames and
 * the string lights (fire-fx.ts).
 */
const NIGHT: Light = {
  sky: '#131c33',
  sun: '#9db4e6',
  sunIntensity: 0.5,
  sunFrom: { x: 7, y: 13, z: 6 },
  hemiSky: '#3d4d7c',
  hemiGround: '#1f2a33',
  hemiIntensity: 0.72,
  glint: '#8fa3d8',
  sheen: '#2c3a5c',
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

/** The evening value for sunset (the brook) and for full night (the fire). */
export const EVENING_SUNSET = 2
export const EVENING_NIGHT = 3

/**
 * The light for an evening value, blended between its neighbours: 0
 * afternoon, 1 golden, 2 sunset, 2.5 the blue hour, 3 night.
 */
function lightAt(e: number): { a: Light; b: Light; k: number } {
  if (e <= 1) return { a: AFTERNOON, b: GOLDEN, k: Math.max(0, e) }
  if (e <= 2) return { a: GOLDEN, b: SUNSET, k: e - 1 }
  if (e <= 2.5) return { a: SUNSET, b: DUSK, k: (e - 2) * 2 }
  return { a: DUSK, b: NIGHT, k: Math.min(1, (e - 2.5) * 2) }
}

/** How much of the night is on, 0 (sunset or earlier) .. 1 (night): for the stars, the lamps and the fire's glow. */
export function nightAmount(e: number) {
  return smooth(2.15, 2.95, e)
}

export type DaylightTargets = {
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  background: THREE.Color
  fog: THREE.Fog | null
  glint: THREE.Color
  sheen: THREE.Color
  /** The sky the water reflects, and the sky straight overhead (what it shows looking down). */
  waterSky: THREE.Color
  waterOverhead: THREE.Color
  /** The leaves the water reflects. */
  waterLeaves: THREE.Color
}

/** The sky overhead by day (cool, even at sunset) and at night. */
const OVERHEAD_DAY = new THREE.Color().setRGB(0.5, 0.74, 0.88)
const OVERHEAD_NIGHT = new THREE.Color().setRGB(0.05, 0.08, 0.17)
const LEAVES_DAY = new THREE.Color().setRGB(0.13, 0.27, 0.2)
const LEAVES_NIGHT = new THREE.Color().setRGB(0.012, 0.03, 0.03)

/**
 * Set the lights for the evening value `e`, around the guest at `at`. The
 * sun is placed relative to the guest (its shadow box follows them).
 */
export function applyDaylight(t: DaylightTargets, e: number, at: Vec2) {
  const { a, b, k } = lightAt(e)
  mixColor(t.background, a.sky, b.sky, k)
  if (t.fog) t.fog.color.copy(t.background)
  t.waterSky.copy(t.background)
  t.waterOverhead.copy(OVERHEAD_DAY).lerp(OVERHEAD_NIGHT, nightAmount(e))
  t.waterLeaves.copy(LEAVES_DAY).lerp(LEAVES_NIGHT, nightAmount(e))
  // (The sun is out at the blue hour, so the moon can come up somewhere else
  // without its shadows sweeping across the yard: it doesn't slide there.)
  const moon = b === NIGHT
  if (moon) t.sun.color.set(b.sun)
  else mixColor(t.sun.color, a.sun, b.sun, k)
  t.sun.intensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * k
  const f = moon
    ? b.sunFrom
    : {
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

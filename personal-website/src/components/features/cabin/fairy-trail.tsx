'use client'

// The fairy trail's lights (trail.ts says where to and when): a string of
// small warm motes floating low over the ground along the walking way, from
// a little ahead of the guest to the next place on the tour, each bobbing
// and twinkling, with a brighter pulse running along them towards the place
// so which way it goes reads at a glance. Where the way ends, a few of them
// circle the spot. At night they read as fireflies.
//
// One Points object (a single draw call) whose motes are moved each frame.
// Clicks and taps go straight through it.

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Greeting } from './eduard'
import type { Progress } from './checklist'
import {
  createShow,
  measure,
  nearestOnWay,
  nextStop,
  pointAt,
  stepShow,
  trailWay,
  type TrailStopId,
  type Way,
} from './trail'
import { groundHeight, insideCabin, type Look, type Vec2 } from './world'

/** Motes along the way, and the few that circle where it ends. */
const ALONG = 40
const RING = 5
const POOL = ALONG + RING
/** Metres between them along the way. */
const GAP = 0.4
/** The trail starts this far ahead of the guest, and runs on at most this far. */
const AHEAD = 0.7
const SHOWN = ALONG * GAP - 1
/** How high they float over the ground. */
const HOVER = 0.42
/**
 * A mote's size, in metres (it's drawn the same size on screen in every
 * look). The smooth look's are a little bigger: its soft glow fades out
 * where the pixel looks' haze still shows.
 */
const SIZE = 0.17
const SMOOTH_SIZE = 1.35
/** The pulse: how fast it runs towards the place (m/s), and how far apart the pulses are. */
const PULSE_SPEED = 2.8
const PULSE_GAP = 4.5
/** How fast the trail runs out from the guest to the place when it comes out (m/s). */
const REVEAL = 9
/** The circle round the end of the way. */
const RING_RADIUS = 0.32
/** Planning the way again: once they're this far off it, and have walked this far since, at most this often. */
const REPLAN_OFF = 0.6
const REPLAN_MOVED = 1
const REPLAN_EVERY = 1

/**
 * The palette's warm light (the sparkles' #fff7e6 and #fec54f, the flames'
 * #f08a2c): saturated enough to stand out on sunny grass and the gravel.
 */
const CORE = '#fffbea'
const GLOW = '#fec54f'
const HALO = '#f08a2c'

/** What the trail reads of the scene's simulation (arrival-scene.tsx, `sim`). */
type TrailSim = {
  guest: Vec2
  welcomed: boolean
  enteredCabin: boolean
  box: { want: number; opened: boolean[] }
  split: { phase: string }
  fish: { phase: string }
  tapRun: number
  sit: { phase: string }
  tagShow: number
  pendingRub: boolean
  dog: { rubbing: number; petting: number }
  brook: { reached: boolean; didShed: boolean; triedBlock: boolean }
  fire: { called: boolean; seated: boolean; cut: number; didBrook: boolean }
}

/** ... and of what the overlay tells the scene (ArrivalSceneProps). */
type TrailScene = {
  found: Progress
  brookLead: boolean
  eduardGreeting: Greeting
  hugoAskOpen?: boolean
  panelOpen?: boolean
}

const vertex = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
uniform float uMin;
uniform float uMax;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uScale / -mv.z, uMin, uMax);
  vAlpha = aAlpha;
}`

const fragment = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uGlow;
uniform vec3 uHalo;
uniform float uSmooth;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  vec3 col;
  float a;
  if (uSmooth > 0.5) {
    // the smooth look: a soft round glow with a bright middle
    float r = length(c) * 2.0;
    float core = 1.0 - smoothstep(0.2, 0.42, r);
    float glow = 1.0 - smoothstep(0.35, 0.72, r);
    float halo = 1.0 - smoothstep(0.55, 1.0, r);
    col = mix(mix(uHalo, uGlow, glow), uCore, core);
    a = max(core, max(glow * 0.9, halo * 0.35));
  } else {
    // the pixel looks: a little round light, a bright middle in a warm glow
    // with a faint orange haze round it (a dot, not the easter eggs'
    // four-point star)
    float ax = abs(c.x);
    float ay = abs(c.y);
    bool core = max(ax, ay) <= 0.15;
    bool glow = ax + ay <= 0.4 && max(ax, ay) <= 0.3;
    col = core ? uCore : glow ? uGlow : uHalo;
    a = core ? 1.0 : glow ? 0.9 : step(length(c), 0.5) * 0.35;
  }
  a *= vAlpha;
  if (a < 0.02) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`

function createLights(smooth: boolean) {
  const geometry = new THREE.BufferGeometry()
  const position = new THREE.BufferAttribute(new Float32Array(POOL * 3), 3)
  const size = new THREE.BufferAttribute(new Float32Array(POOL), 1)
  const alpha = new THREE.BufferAttribute(new Float32Array(POOL), 1)
  for (const a of [position, size, alpha]) a.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', position)
  geometry.setAttribute('aSize', size)
  geometry.setAttribute('aAlpha', alpha)
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uScale: { value: 1 },
      uMin: { value: 3 },
      uMax: { value: 12 },
      uCore: { value: new THREE.Color(CORE) },
      uGlow: { value: new THREE.Color(GLOW) },
      uHalo: { value: new THREE.Color(HALO) },
      uSmooth: { value: smooth ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
  })
  const points = new THREE.Points(geometry, material)
  points.name = 'FairyTrail'
  // (no outline round them, never in the way of a click, and always drawn:
  // they move about, so the bounds they were made with mean nothing)
  points.userData.noOutline = true
  points.raycast = () => {}
  points.frustumCulled = false
  points.renderOrder = 4
  points.visible = false
  return { points, position, size, alpha, material, geometry, sizeK: smooth ? SMOOTH_SIZE : 1 }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** 0 at `a`, 1 at `b` (either way round), eased. */
const ramp = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a))
  return k * k * (3 - 2 * k)
}
const drawSize = new THREE.Vector2()

export function FairyTrail({
  sim,
  scene,
  look,
}: {
  sim: MutableRefObject<TrailSim>
  scene: MutableRefObject<TrailScene>
  look: Look
}) {
  const fx = useMemo(() => createLights(look === 'smooth'), [look])
  useEffect(
    () => () => {
      fx.geometry.dispose()
      fx.material.dispose()
    },
    [fx],
  )
  // ?trail=always has them out whenever there's somewhere to go; ?trail=off
  // switches them off (for comparing).
  const [mode] = useState(() => {
    const v =
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('trail')
    return v === 'always' || v === 'off' ? v : 'lost'
  })
  const state = useRef({
    show: createShow(),
    way: null as Way | null,
    wayFor: null as TrailStopId | null,
    plannedFrom: { x: 0, z: 0 } as Vec2,
    plannedAt: -Infinity,
    /** How much the trail shows, 0..1 (it fades in and out), and when it last came out. */
    vis: 0,
    wasOn: false,
    shownAt: 0,
    satByFire: false,
    /** Planning the way: how many times, and the slowest (ms), for checking from a test browser. */
    plans: 0,
    slowest: 0,
    t: 0,
  })

  // Handy when checking the trail from a test browser; not exposed in production.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') Object.assign(window, { __cabinTrail: state })
  }, [])

  useFrame(({ camera, gl }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = state.current
    st.t += dt
    const t = st.t
    const s = sim.current
    const p = scene.current
    const inside = insideCabin(s.guest)
    st.satByFire ||= s.fire.seated
    const stop =
      mode === 'off'
        ? null
        : nextStop({
            inside,
            welcomed: s.welcomed,
            enteredCabin: s.enteredCabin,
            resumeRead: p.found.resume === true,
            boxesSeen: s.box.opened.some(Boolean) || s.brook.didShed,
            blockTried: s.brook.triedBlock,
            brookLead: p.brookLead,
            brookReached: s.brook.reached,
            brookDone: s.fire.didBrook,
            fireCalled: s.fire.called,
            satByFire: st.satByFire,
          })
    // Not while the guest's doing something, or something's being said or read.
    const doing = (phase: string) => phase !== 'off' && phase !== 'walking'
    const busy =
      s.box.want >= 0 ||
      doing(s.split.phase) ||
      doing(s.fish.phase) ||
      s.tapRun >= 0 ||
      s.sit.phase !== 'off' ||
      s.tagShow > 0 ||
      s.pendingRub ||
      s.dog.rubbing > 0 ||
      s.dog.petting > 0 ||
      s.fire.cut >= 0 ||
      p.eduardGreeting !== false ||
      Boolean(p.hugoAskOpen) ||
      Boolean(p.panelOpen)
    const on = stepShow(st.show, { stop, guest: s.guest, busy, dt, always: mode === 'always' })

    // The way there: planned when the lights come out for a place, and again
    // only once the guest has wandered a metre or so off it (never every frame).
    if (on && stop) {
      const fresh = st.wayFor !== stop.id || !st.way
      const moved = Math.hypot(s.guest.x - st.plannedFrom.x, s.guest.z - st.plannedFrom.z)
      const strayed =
        !fresh &&
        moved > REPLAN_MOVED &&
        t - st.plannedAt > REPLAN_EVERY &&
        nearestOnWay(st.way as Way, s.guest).off > REPLAN_OFF
      if (fresh || strayed) {
        const t0 = performance.now()
        st.way = measure(trailWay(s.guest, stop.at))
        st.slowest = Math.max(st.slowest, performance.now() - t0)
        st.plans++
        st.wayFor = stop.id
        st.plannedFrom = { x: s.guest.x, z: s.guest.z }
        st.plannedAt = t
      }
      if (!st.wasOn) st.shownAt = t
    }
    st.wasOn = on
    st.vis = clamp01(st.vis + (on ? dt * 2.2 : -dt * 3))
    const way = st.way
    fx.points.visible = st.vis > 0.001 && way !== null
    if (!fx.points.visible || !way) return

    // Drawn the same size on screen in every look: pixels per metre, a metre
    // away (and never bigger than a small fraction of the screen, right by
    // the camera).
    gl.getDrawingBufferSize(drawSize)
    fx.material.uniforms.uScale.value =
      drawSize.y * 0.5 * camera.projectionMatrix.elements[5] * fx.sizeK
    fx.material.uniforms.uMax.value = Math.max(4, drawSize.y * 0.024 * fx.sizeK)

    const pos = fx.position.array as Float32Array
    const size = fx.size.array as Float32Array
    const alpha = fx.alpha.array as Float32Array
    const here = nearestOnWay(way, s.guest)
    const L = way.length
    const from = Math.min(L, here.s + AHEAD)
    const to = Math.min(L, from + SHOWN)
    // (running out from the guest to the place as it comes out)
    const front = here.s + (t - st.shownAt) * REVEAL
    let n = 0
    // The motes keep their places counted back from the end of the way, so
    // they stay put as the guest walks along it (only the near ones go).
    const kFirst = Math.max(0, Math.floor((L - to) / GAP))
    for (let k = kFirst; n < ALONG; k++) {
      const along = L - k * GAP
      if (along < from - 0.3) break
      const at = pointAt(way, along)
      // a little hover: up and down, and to and fro across the way
      const sway = Math.sin(t * 1.7 + k * 2.3) * 0.05
      const y = groundHeight(at) + HOVER + Math.sin(t * 2.3 + k * 1.3) * 0.05
      pos[n * 3] = at.x - at.dz * sway
      pos[n * 3 + 1] = y
      pos[n * 3 + 2] = at.z + at.dx * sway
      // the pulse, running towards the place
      const u = ((k * GAP + PULSE_SPEED * t) / PULSE_GAP) % 1
      const w = ((u - 0.5) * PULSE_GAP) / 0.55
      const pulse = Math.exp(-w * w)
      const twinkle = 0.85 + 0.15 * Math.sin(t * 6.1 + k * 1.9)
      const fade =
        ramp(from - 0.3, from + 1.1, along) *
        (L > to + 0.01 ? ramp(to, to - 3, along) : 1) *
        ramp(front, front - 0.8, along)
      size[n] = SIZE * twinkle * (1 + 0.55 * pulse)
      alpha[n] = st.vis * fade * (0.55 + 0.45 * pulse)
      n++
    }
    for (; n < ALONG; n++) alpha[n] = 0
    // Where it ends, a few circle the spot (once the trail's run out that far).
    const end = way.pts[way.pts.length - 1]
    const ringOn = L <= to + 0.01 ? st.vis * ramp(L, L + 1, front) : 0
    for (let i = 0; i < RING; i++) {
      const j = ALONG + i
      const a = t * 1.1 + (i / RING) * Math.PI * 2
      pos[j * 3] = end.x + Math.cos(a) * RING_RADIUS
      pos[j * 3 + 1] = groundHeight(end) + HOVER + 0.12 + Math.sin(t * 2 + i * 1.7) * 0.06
      pos[j * 3 + 2] = end.z + Math.sin(a) * RING_RADIUS
      size[j] = SIZE * (0.9 + 0.2 * Math.sin(t * 5.3 + i * 2.1))
      alpha[j] = ringOn * (0.75 + 0.25 * Math.sin(t * 3.1 + i))
    }
    fx.position.needsUpdate = true
    fx.size.needsUpdate = true
    fx.alpha.needsUpdate = true
  })

  return <primitive object={fx.points} />
}

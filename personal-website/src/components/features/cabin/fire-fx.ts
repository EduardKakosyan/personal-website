// What the night looks like (scene 7; A27, A39: "lit only by the string lights
// and the flames"; photo 02): the fire itself (flames, the glowing bed, sparks
// going up), its flickering light, the warm light of the string lights, the
// lanterns and the cabin's window and door, and the stars. Made here, moved
// each frame by the scene. Three.js only, no React.

import * as THREE from 'three'
import { DECK_LANTERN, FIRE } from './fire'
import { toToon } from './pixel-look'

/** Flame colours, outside in (the palette's oranges, A37). */
const FLAME_COLOURS = ['#d9482a', '#f08a2c', '#fec54f', '#fff1bf']
const EMBER = '#ffb14a'
const LAMP = '#ffc56b'

/** Deterministic "random" numbers, so the stars and the flames are the same every visit. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** A low, faceted teardrop, standing on its base: one tongue of flame. */
function tongueGeometry() {
  const profile = [
    [0.0, 0.0],
    [0.34, 0.06],
    [0.5, 0.26],
    [0.44, 0.5],
    [0.26, 0.76],
    [0.0, 1.0],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  return new THREE.LatheGeometry(profile, 6)
}

type Tongue = {
  mesh: THREE.Mesh
  /** Its place in the ring, height, width, and how it moves. */
  x: number
  z: number
  h: number
  w: number
  speed: number
  phase: number
}

type Spark = { sprite: THREE.Sprite; phase: number; speed: number; drift: number; swirl: number }

export type NightFx = {
  /** Everything here, to put in the scene. */
  world: THREE.Group
  /** The stars: kept round the camera, so they're always far away. */
  sky: THREE.Points
  update: (o: {
    t: number
    dt: number
    /** 0 day .. 1 night (daylight.ts, nightAmount). */
    night: number
    /** The fire: 0 out .. 1 burning. */
    lit: number
    camera: THREE.Vector3
  }) => void
  /** Give it the models whose lamps and windows it lights up at night. */
  adopt: (...roots: THREE.Object3D[]) => void
}

/**
 * `smooth` is the smooth look (full resolution): the stars are drawn bigger
 * there, since a pixel is much smaller.
 */
export function createNightFx(smooth: boolean): NightFx {
  const world = new THREE.Group()
  world.name = 'NightFx'
  const rand = seeded(7)

  // ------------------------------------------------------------- the fire
  const fire = new THREE.Group()
  fire.position.set(FIRE.x, 0.1, FIRE.z)
  fire.visible = false
  world.add(fire)

  // the bed of embers in the ring
  const bedMat = new THREE.MeshBasicMaterial({ color: '#b93a1c' })
  const bed = new THREE.Mesh(new THREE.CircleGeometry(0.4, 9), bedMat)
  bed.rotation.x = -Math.PI / 2
  bed.position.y = 0.012
  bed.userData.noOutline = true
  fire.add(bed)

  // tongues of flame, in layers: big red-orange ones outside, yellow inside
  const geo = tongueGeometry()
  const mats = FLAME_COLOURS.map(
    (c) =>
      new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, fog: false }),
  )
  const tongues: Tongue[] = []
  const layers = [
    { n: 5, ring: 0.21, h: 0.92, w: 0.32 },
    { n: 4, ring: 0.14, h: 0.72, w: 0.25 },
    { n: 3, ring: 0.07, h: 0.5, w: 0.17 },
    { n: 1, ring: 0.0, h: 0.3, w: 0.12 },
  ]
  layers.forEach((layer, li) => {
    for (let i = 0; i < layer.n; i++) {
      const a = (i / layer.n) * Math.PI * 2 + li * 0.9
      const mesh = new THREE.Mesh(geo, mats[li])
      mesh.renderOrder = 10 + li
      mesh.userData.noOutline = true
      mesh.raycast = () => {}
      fire.add(mesh)
      tongues.push({
        mesh,
        x: Math.cos(a) * layer.ring,
        z: Math.sin(a) * layer.ring,
        h: layer.h * (0.85 + rand() * 0.3),
        w: layer.w,
        speed: 5.5 + rand() * 4,
        phase: rand() * 20,
      })
    }
  })

  // sparks going up
  const sparkMat = new THREE.SpriteMaterial({ color: EMBER, fog: false, depthWrite: false })
  const sparks: Spark[] = Array.from({ length: 12 }, () => {
    const sprite = new THREE.Sprite(sparkMat)
    sprite.userData.noOutline = true
    sprite.raycast = () => {}
    fire.add(sprite)
    return {
      sprite,
      phase: rand(),
      speed: 0.22 + rand() * 0.2,
      drift: rand() * Math.PI * 2,
      swirl: 1.5 + rand() * 2,
    }
  })

  // ------------------------------------------------------------- the lights
  // (All of them are there from the start, dark: adding a light later would
  // make every material compile again.)
  const firelight = new THREE.PointLight('#ff8a3a', 0, 16, 1.6)
  firelight.position.set(FIRE.x, 0.85, FIRE.z)
  world.add(firelight)
  const lamp = (x: number, y: number, z: number, reach: number) => {
    const l = new THREE.PointLight(LAMP, 0, reach, 1.8)
    l.position.set(x, y, z)
    world.add(l)
    return l
  }
  // the string lights along the cabin's east eave, over the deck
  // (hung out from the wall a little, so they wash it evenly instead of burning a spot into it)
  const eave = [lamp(3.3, 2.7, -1.3, 9), lamp(3.3, 2.7, 1.4, 9)]
  // the lanterns: on the deck's corner, and on the picnic table
  const lanterns = [lamp(DECK_LANTERN.x, 0.62, DECK_LANTERN.z, 4.5), lamp(3.63, 1.0, 5.44, 4.5)]
  // inside the cabin: the lamp that's on in the window (and lights the room
  // if the guest goes in after dark)
  const indoors = lamp(0.1, 2.0, 0.0, 6.5)

  // ------------------------------------------------------------- the stars
  const starCount = 150
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    // over the whole sky, thinner towards the horizon
    const y = 0.1 + rand() * 0.9
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(1 - y * y)
    positions.set([Math.cos(a) * r * 110, y * 110, Math.sin(a) * r * 110], i * 3)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const starMat = new THREE.PointsMaterial({
    color: '#e9eefc',
    size: smooth ? 1.6 : 3,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  })
  const sky = new THREE.Points(starGeo, starMat)
  sky.frustumCulled = false
  sky.userData.noOutline = true
  sky.raycast = () => {}
  sky.visible = false

  // ------------------------------------------------------------- lamps and windows
  /** The bulbs' and the glass's materials, and how bright each was to begin with. */
  const bulbs: { mat: THREE.MeshToonMaterial; base: number }[] = []
  const panes: THREE.MeshToonMaterial[] = []
  const seen = new Set<THREE.Material>()
  const adopt = (...roots: THREE.Object3D[]) => {
    for (const root of roots)
      root.traverse((o) => {
        const m = (o as THREE.Mesh).material
        for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
          if (seen.has(mat)) continue
          seen.add(mat)
          const toon = mat as THREE.MeshToonMaterial
          if (mat.name.startsWith('string_light')) {
            bulbs.push({ mat: toon, base: toon.emissiveIntensity })
          } else if (mat.name === 'glass') {
            toon.emissive = new THREE.Color(LAMP)
            toon.emissiveIntensity = 0
            panes.push(toon)
          }
        }
      })
  }

  const flicker = (t: number) =>
    0.82 +
    0.1 * Math.sin(t * 11.3) +
    0.06 * Math.sin(t * 23.7 + 1.3) +
    0.05 * Math.sin(t * 5.1 + 0.4)

  const update: NightFx['update'] = ({ t, night, lit, camera }) => {
    // the fire
    fire.visible = lit > 0.01
    if (fire.visible) {
      const grow = lit * lit * (3 - 2 * lit)
      for (const f of tongues) {
        const lick =
          0.78 +
          0.2 * Math.sin(t * f.speed + f.phase) +
          0.12 * Math.sin(t * f.speed * 2.3 + f.phase)
        const sway = Math.sin(t * 2.2 + f.phase) * 0.1
        f.mesh.position.set(
          f.x + Math.sin(t * 3.1 + f.phase) * 0.02,
          0,
          f.z + Math.cos(t * 2.7 + f.phase) * 0.02,
        )
        f.mesh.scale.set(f.w * grow * (1.08 - lick * 0.1), f.h * grow * lick, f.w * grow)
        f.mesh.rotation.set(sway * 0.7, f.phase + t * 0.6, sway)
      }
      const glow = flicker(t * 0.7)
      bedMat.color.set('#b93a1c').lerp(tmpColor.set('#ff8a34'), (glow - 0.6) * 1.6 * grow)
      bed.scale.setScalar(0.4 + 0.6 * grow)
      for (const s of sparks) {
        // each one rises from the flames, wanders, shrinks and goes out
        const k = (t * s.speed + s.phase) % 1
        const out = 0.1 + k * 0.5
        s.sprite.position.set(
          Math.cos(s.drift + k * s.swirl) * out,
          0.35 + k * 2.3,
          Math.sin(s.drift + k * s.swirl) * out,
        )
        const size = 0.05 * (1 - k) * (k < 0.08 ? k / 0.08 : 1) * grow
        s.sprite.scale.set(size, size, 1)
        s.sprite.visible = size > 0.004
      }
    }
    // Its light: strong enough to be the yard's light at night; by day (if
    // it's ever lit then) it only warms what's right beside it.
    firelight.intensity = lit * flicker(t) * (2.5 + 6 * night)
    firelight.position.y = 0.85 + Math.sin(t * 9.7) * 0.03
    // the lamps come on as it gets dark
    for (const l of eave) l.intensity = 3.4 * night
    for (const l of lanterns)
      l.intensity = 1.1 * night * (0.92 + 0.08 * Math.sin(t * 13 + l.position.x))
    indoors.intensity = 4.5 * night
    // (the string lights are on all day, as they were; the lanterns' candles
    // are the brighter ones in the models, and those are only lit after dark)
    for (const b of bulbs)
      b.mat.emissiveIntensity =
        b.base > 1.8 ? b.base * (0.12 + 1.1 * night) : b.base * (1 + 1.3 * night)
    for (const p of panes) p.emissiveIntensity = 0.8 * night
    // the stars
    sky.visible = night > 0.02
    starMat.opacity = night
    sky.position.copy(camera)
  }

  return { world, sky, update, adopt }
}

const tmpColor = new THREE.Color()

/** A marshmallow's colours, fresh on the stick and toasted golden. */
const MALLOW_WHITE = new THREE.Color('#fbf6ea')
const MALLOW_GOLD = new THREE.Color('#c98a3c')

/**
 * Eduard's toasting stick, with a marshmallow on the end (scene 7; Eduard:
 * "me sitting nearby toasting up a marshmallow"). It goes in his right hand:
 * the group's origin is the grip, and the stick runs out along +Z.
 */
export function createToastingStick() {
  const group = new THREE.Group()
  group.name = 'ToastingStick'
  const stickGeo = new THREE.CylinderGeometry(0.008, 0.013, 1.02, 5)
  stickGeo.rotateX(Math.PI / 2)
  stickGeo.translate(0, 0, 0.41)
  const stick = new THREE.Mesh(
    stickGeo,
    toToon(new THREE.MeshStandardMaterial({ color: '#6b4a2e', name: 'toasting-stick' })),
  )
  const mallowMat = toToon(
    new THREE.MeshStandardMaterial({ color: MALLOW_WHITE, name: 'marshmallow' }),
  ) as THREE.MeshToonMaterial
  // (bigger than life, like the things in the boxes, so it reads on the end of the stick)
  const mallowGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.095, 8)
  mallowGeo.rotateX(Math.PI / 2)
  const mallow = new THREE.Mesh(mallowGeo, mallowMat)
  mallow.position.z = 0.88
  for (const m of [stick, mallow]) {
    m.castShadow = true
    m.raycast = () => {}
  }
  group.add(stick, mallow)
  group.visible = false
  return {
    group,
    /** `brown` 0 white .. 1 golden; `gone` while it's been eaten. */
    update: (o: { brown: number; gone: boolean }) => {
      mallow.visible = !o.gone
      mallowMat.color.copy(MALLOW_WHITE).lerp(MALLOW_GOLD, o.brown * o.brown)
    },
  }
}

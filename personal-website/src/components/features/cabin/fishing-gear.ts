// The things for casting a line (fishing.ts): the rod in the guest's right
// hand, the line, the bobber, the catch on the end of it, and the rings on
// the water. Made here rather than in Blender: they're small, and the rod has
// to hang off whichever guest the visitor picked.

import * as THREE from 'three'
import { toToon } from './pixel-look'
import { FISHING_CATCH, GOLD_FISH, bobberAt, holdsRod, type Fishing } from './fishing'
import { WATER_Y } from './brook'

const ROD_LENGTH = 1.35
const LINE_POINTS = 18
const RIPPLES = 4

const toon = (color: string) =>
  toToon(new THREE.MeshStandardMaterial({ color, name: `fish-${color}` }))
const noRaycast = () => {}

export function createFishingGear() {
  // the rod: along +Z from the hand, the cork handle behind it, the reel under it
  const rod = new THREE.Group()
  rod.name = 'GuestRod'
  const blankGeo = new THREE.CylinderGeometry(0.008, 0.016, ROD_LENGTH, 6)
  blankGeo.rotateX(Math.PI / 2)
  blankGeo.translate(0, 0, ROD_LENGTH / 2)
  const blank = new THREE.Mesh(blankGeo, toon('#3b3f45'))
  const handleGeo = new THREE.CylinderGeometry(0.024, 0.022, 0.26, 7)
  handleGeo.rotateX(Math.PI / 2)
  handleGeo.translate(0, 0, -0.02)
  const handle = new THREE.Mesh(handleGeo, toon('#c49a62'))
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), toon('#9aa0a8'))
  reel.rotation.z = Math.PI / 2
  reel.position.set(0, -0.05, 0.06)
  const tip = new THREE.Object3D()
  tip.position.set(0, 0, ROD_LENGTH)
  rod.add(blank, handle, reel, tip)
  rod.visible = false

  // things in the world: the line, the bobber, the catch, the rings
  const world = new THREE.Group()
  world.name = 'FishingGear'
  const linePos = new Float32Array(LINE_POINTS * 3)
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  const line = new THREE.Line(
    lineGeo,
    new THREE.LineBasicMaterial({
      color: '#f6f1e4',
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    }),
  )
  line.frustumCulled = false
  line.userData.noOutline = true
  const bobber = new THREE.Group()
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    toon('#d8382e'),
  )
  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    toon('#f4f1ea'),
  )
  bobber.add(top, bottom)

  // the catch: a plain fish shape in neutral greys (FISHING_CATCH: what Eduard
  // catches there is still to be decided, so nothing that reads as a species)
  const fish = new THREE.Group()
  const L = FISHING_CATCH.length
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), toon(FISHING_CATCH.back))
  body.scale.set(L * 0.28, L * 0.36, L)
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), toon(FISHING_CATCH.belly))
  belly.scale.set(L * 0.24, L * 0.25, L * 0.86)
  belly.position.set(0, -L * 0.07, 0.01)
  const tailGeo = new THREE.ConeGeometry(L * 0.2, L * 0.3, 4)
  tailGeo.rotateX(-Math.PI / 2)
  const tail = new THREE.Mesh(tailGeo, toon(FISHING_CATCH.back))
  tail.scale.set(0.25, 1, 1)
  tail.position.set(0, 0, -L * 0.6)
  const fin = new THREE.Mesh(new THREE.ConeGeometry(L * 0.08, L * 0.2, 3), toon(FISHING_CATCH.back))
  fin.position.set(0, L * 0.2, -L * 0.05)
  const eye = new THREE.Mesh(new THREE.SphereGeometry(L * 0.035, 6, 4), toon('#1d1a19'))
  eye.position.set(L * 0.12, L * 0.05, L * 0.33)
  const eye2 = eye.clone()
  eye2.position.x = -L * 0.12
  fish.add(body, belly, tail, fin, eye, eye2)
  fish.visible = false
  // the one in a hundred: the same fish in gold (its paint is swapped in when it's landed)
  const plain = { back: body.material, belly: belly.material }
  const gold = { back: toon(GOLD_FISH.back), belly: toon(GOLD_FISH.belly) }
  const paint = (isGold: boolean) => {
    const p = isGold ? gold : plain
    body.material = tail.material = fin.material = p.back
    belly.material = p.belly
  }

  const ringGeo = new THREE.RingGeometry(0.85, 1, 20)
  ringGeo.rotateX(-Math.PI / 2)
  const ripples = Array.from({ length: RIPPLES }, () => {
    const m = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: '#f1f3ea', transparent: true, depthWrite: false }),
    )
    m.visible = false
    m.userData.noOutline = true
    m.userData.age = 1
    return m
  })
  world.add(line, bobber, fish, ...ripples)
  for (const g of [rod, world])
    g.traverse((o) => {
      ;(o as THREE.Mesh).raycast = noRaycast
      o.castShadow = o !== line && !(ripples as THREE.Object3D[]).includes(o)
    })

  return {
    rod,
    tip,
    world,
    line,
    linePos,
    bobber,
    paint,
    fish,
    ripples,
    nextRipple: 0,
    /** The catch dropping back into the water after it's been held up (0..1, -1 off). */
    release: -1,
    releaseFrom: new THREE.Vector3(),
    /** Where the catch came out of the water. */
    landFrom: new THREE.Vector3(),
    lastPhase: 'off' as Fishing['phase'],
  }
}

export type FishingGear = ReturnType<typeof createFishingGear>

const tipWorld = new THREE.Vector3()

function ripple(g: FishingGear, x: number, z: number, size: number) {
  const m = g.ripples[g.nextRipple]
  g.nextRipple = (g.nextRipple + 1) % g.ripples.length
  m.position.set(x, WATER_Y + 0.015, z)
  m.userData.age = 0
  m.userData.size = size
  m.visible = true
}

/** Lay out the rod, line, bobber and catch for this frame (after the guest is posed). */
export function updateFishingGear(
  g: FishingGear,
  f: Fishing,
  dt: number,
  time: number,
  /** Where the guest holds the catch up: in front of them, at chest height. */
  holdAt: { x: number; y: number; z: number; yaw: number },
) {
  const holding = holdsRod(f)
  g.rod.visible = holding
  g.world.visible = holding || g.release >= 0 || g.ripples.some((r) => r.visible)
  g.tip.getWorldPosition(tipWorld)

  // rings where the bobber lands, on a nibble and on the bite
  if (f.event === 'nibble' || f.event === 'bite') ripple(g, f.target.x, f.target.z, 0.35)
  if (f.phase === 'waiting' && g.lastPhase === 'cast') ripple(g, f.target.x, f.target.z, 0.5)
  // the catch goes back in once it's been held up
  if (g.lastPhase === 'reel' && f.phase === 'landed') g.landFrom.copy(g.fish.position)
  if (g.lastPhase === 'landed' && f.phase !== 'landed') {
    g.release = 0
    g.releaseFrom.copy(g.fish.position)
  }
  g.lastPhase = f.phase

  const b = bobberAt(f, tipWorld, time)
  const lineOut = holding && f.phase !== 'putaway'
  g.line.visible = lineOut
  g.bobber.visible = lineOut && f.phase !== 'landed'
  g.bobber.position.set(b.x, b.y, b.z)
  // the catch: wriggling on the end of the line as it's reeled in, then held up
  const showFish = f.phase === 'reel' || f.phase === 'landed'
  g.paint(f.phase === 'landed' && f.gold)
  let end = g.bobber.position
  if (showFish) {
    g.fish.visible = true
    if (f.phase === 'reel') {
      g.fish.position.set(b.x, WATER_Y - 0.06 + f.reel * 0.04, b.z)
      g.fish.rotation.set(
        0.1,
        Math.atan2(tipWorld.x - b.x, tipWorld.z - b.z),
        Math.sin(time * 14) * 0.5,
      )
    } else {
      // lifted out of the water and held up in front of the guest, wriggling
      const k = Math.min(1, f.t * 2.5)
      const hang = new THREE.Vector3(holdAt.x, holdAt.y, holdAt.z)
      g.fish.position.lerpVectors(g.landFrom, hang, k * k * (3 - 2 * k))
      g.fish.position.y += Math.sin(k * Math.PI) * 0.3
      // (side-on to the camera, so it reads as a fish and not a blob)
      g.fish.rotation.set(Math.sin(time * 9) * 0.2, holdAt.yaw, Math.sin(time * 13) * 0.35)
      end = g.fish.position
    }
  } else if (g.release >= 0) {
    // dropped back into the water, a little way out from the landing
    g.release = Math.min(1, g.release + dt * 1.8)
    const k = g.release
    g.fish.visible = k < 1
    g.fish.position.set(
      g.releaseFrom.x + (f.target.x - g.releaseFrom.x) * 0.35 * k,
      g.releaseFrom.y + (WATER_Y - 0.1 - g.releaseFrom.y) * k * k + Math.sin(k * Math.PI) * 0.25,
      g.releaseFrom.z + (f.target.z - g.releaseFrom.z) * 0.35 * k,
    )
    g.fish.rotation.x += dt * 6
    if (k >= 1) {
      ripple(g, g.fish.position.x, g.fish.position.z, 0.6)
      g.release = -1
    }
  } else g.fish.visible = false

  // the line: from the rod's tip to the bobber (or the catch), sagging when slack
  if (lineOut) {
    const tight = f.phase === 'reel' || f.phase === 'bite' || f.phase === 'landed' ? 1 : 0.35
    const sag = (1 - tight) * Math.min(0.5, tipWorld.distanceTo(end) * 0.12)
    for (let i = 0; i < LINE_POINTS; i++) {
      const u = i / (LINE_POINTS - 1)
      g.linePos[i * 3] = tipWorld.x + (end.x - tipWorld.x) * u
      g.linePos[i * 3 + 1] =
        tipWorld.y + (end.y + 0.05 - tipWorld.y) * u - Math.sin(u * Math.PI) * sag
      g.linePos[i * 3 + 2] = tipWorld.z + (end.z - tipWorld.z) * u
    }
    g.line.geometry.attributes.position.needsUpdate = true
  }

  for (const m of g.ripples) {
    if (!m.visible) continue
    m.userData.age += dt / 1.3
    const age = m.userData.age as number
    if (age >= 1) {
      m.visible = false
      continue
    }
    const s = 0.08 + age * (m.userData.size as number)
    m.scale.set(s, 1, s)
    ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - age) * 0.9
  }
}

// HUGO's teleport (Eduard: "make HUGO teleport back to the player, but make it
// look like its actual teleportation ability"): what's left where he vanishes
// and where he appears. He himself draws up into a thin streak (the scene
// scales him); this is the streak of light, the white rings that open round
// it (his O-rings, like the vacuum's) and the few sparks. Three.js only.

import * as THREE from 'three'

const WHITE = '#fffaf0'
const BLUE = '#9fd0ff'

export type TeleportFx = {
  group: THREE.Group
  /**
   * `k` is 0..1 through the phase: vanishing at `from`, or appearing at `to`.
   */
  update: (phase: 'none' | 'out' | 'in', k: number, from: THREE.Vector3, to: THREE.Vector3) => void
}

export function createTeleportFx(): TeleportFx {
  const group = new THREE.Group()
  group.name = 'HugoTeleport'
  group.visible = false
  const part = <T extends THREE.Object3D>(o: T) => {
    o.userData.noOutline = true
    o.raycast = () => {}
    group.add(o)
    return o
  }
  const ringGeo = new THREE.TorusGeometry(0.3, 0.03, 6, 20)
  ringGeo.rotateX(Math.PI / 2) // (lying flat, round him)
  const ringMat = () =>
    new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, depthWrite: false, fog: false })
  const rings = [0, 1, 2].map(() => part(new THREE.Mesh(ringGeo, ringMat())))
  const beamGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 8, 1, true)
  beamGeo.translate(0, 0.5, 0)
  const beam = part(
    new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: BLUE,
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      }),
    ),
  )
  const sparkMat = new THREE.SpriteMaterial({ color: WHITE, depthWrite: false, fog: false })
  const sparks = Array.from({ length: 8 }, () => part(new THREE.Sprite(sparkMat)))

  const update: TeleportFx['update'] = (phase, k, from, to) => {
    group.visible = phase !== 'none'
    if (phase === 'none') return
    const at = phase === 'out' ? from : to
    const kk = Math.min(1, Math.max(0, k))
    group.position.set(at.x, at.y, at.z)
    // The rings: going, they close in on him from wide and rise; coming, they
    // open out from him and drop.
    rings.forEach((r, i) => {
      const lag = Math.min(1, Math.max(0, kk * 1.35 - i * 0.16))
      const wide = phase === 'out' ? 1.7 - 1.45 * lag : 0.25 + 1.6 * lag
      r.scale.set(wide, 1, wide)
      r.position.y = phase === 'out' ? 0.1 + lag * (0.5 + i * 0.35) : 1.1 - lag * (0.5 + i * 0.3)
      ;(r.material as THREE.MeshBasicMaterial).opacity =
        phase === 'out' ? Math.min(1, lag * 3) * (1 - lag * 0.6) : 1 - lag
    })
    // the streak of light he turns into (and comes out of)
    const streak = phase === 'out' ? kk : 1 - kk
    beam.scale.set(1.2 - streak * 0.7, 0.3 + streak * 2.6, 1.2 - streak * 0.7)
    beam.position.y = -0.2
    ;(beam.material as THREE.MeshBasicMaterial).opacity =
      Math.sin(Math.min(1, streak) * Math.PI) * 0.85
    // a few sparks thrown off
    sparks.forEach((sp, i) => {
      const a = (i / sparks.length) * Math.PI * 2 + (phase === 'out' ? 0 : 0.4)
      const out = phase === 'out' ? 0.55 * (1 - kk) + 0.1 : 0.15 + 0.6 * kk
      sp.position.set(Math.cos(a) * out, 0.35 + (i % 3) * 0.28 + kk * 0.25, Math.sin(a) * out)
      const size = 0.06 * Math.sin(kk * Math.PI)
      sp.scale.set(size, size, 1)
    })
  }

  return { group, update }
}

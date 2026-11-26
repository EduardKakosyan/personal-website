import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// Keeping the camera out of the forest round the clearing
// (src/components/features/cabin/forest-edge.ts). Eduard, at the outdoor
// shower: "your camera goes into a tree so then regardless of how much you
// click and where you cant get out". The spots' views stay over the open
// ground wherever the guest stands in them, on a computer and on a phone; a
// camera headed into the trees comes in just far enough; one in the open is
// left where it is.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const B = cabin('brook')
const F = cabin('forest-edge')

const at = (p, off, k = 1) => ({ x: p.x + off.x * k, z: p.z + off.z * k })

test('the open ground takes in the cabin, the yard, the field, the woodshed and the brook, not the woods', () => {
  const open = [
    { x: 0, z: 0 }, // the cabin
    W.SHOWER_SPOT,
    W.WOODSHED,
    W.CHOPPING_BLOCK,
    W.GUEST_START,
    { x: B.STAIRS.x0, z: B.STAIRS.z }, // the top of the stairs to the brook
    { x: 0, z: -8.5 }, // the yard runs further north behind the cabin
  ]
  for (const p of open) assert.ok(F.clearingDepth(p) > 0, `(${p.x}, ${p.z}) should be open`)
  const woods = [
    { x: 12, z: -8 }, // north of the grass field
    { x: 2, z: -11 }, // north of the yard
    { x: -11, z: 5 }, // the tree strip in the west
    { x: B.brookX(0) + 3, z: 0 }, // across the brook
  ]
  for (const p of woods) assert.ok(F.clearingDepth(p) < 0, `(${p.x}, ${p.z}) is in the woods`)
})

test("the shower's and the woodshed's views stay over the open ground wherever the guest stands", () => {
  // the spot camera sits 7 m out along `from` on a computer, 1.3 times that on a phone
  for (const [i, spot] of W.CAMERA_SPOTS.entries()) {
    let checked = 0
    for (let x = spot.at.x - spot.leave; x <= spot.at.x + spot.leave; x += 0.25)
      for (let z = spot.at.z - spot.leave; z <= spot.at.z + spot.leave; z += 0.25) {
        const guest = { x, z }
        if (Math.hypot(x - spot.at.x, z - spot.at.z) > spot.leave) continue
        if (x < W.BOUNDS.x0 || x > W.BOUNDS.x1 || z < W.BOUNDS.z0 || z > W.BOUNDS.z1) continue
        if (W.blockedStatic(guest) || W.insideCabin(guest)) continue
        for (const far of [1, 1.3]) {
          // (with the view's own distance it's never pulled in)
          const off = { x: spot.from.x * 7 * far, z: spot.from.z * 7 * far }
          const cam = at(guest, off)
          assert.ok(
            F.clearingDepth(cam) >= F.CROWN_REACH,
            `spot ${i}: guest at (${x.toFixed(2)}, ${z.toFixed(2)}), camera at (${cam.x.toFixed(2)}, ${cam.z.toFixed(2)}) is in reach of the trees`,
          )
          assert.equal(F.cameraReach(guest, off), 1)
          // eased in closer (by Rusty, say), coming in never leaves it nearer the trees
          for (const zoom of [0.42, 0.6, 0.8]) {
            const eased = { x: off.x * zoom, z: off.z * zoom }
            const k = F.cameraReach(guest, eased)
            assert.ok(
              F.clearingDepth(at(guest, eased, k)) >=
                Math.min(F.CROWN_REACH, F.clearingDepth(at(guest, eased))),
            )
          }
        }
        checked++
      }
    assert.ok(checked > 50, `spot ${i}: only ${checked} places checked`)
  }
})

test('a camera turned towards the trees comes in just far enough to be clear of them', () => {
  // in the grass field, turned to look south: the camera goes out north of the guest
  const guest = { x: 13, z: 2 }
  const off = { x: 0, z: -12.5 }
  assert.ok(F.clearingDepth(at(guest, off)) < 0)
  const k = F.cameraReach(guest, off)
  assert.ok(k < 1 && k >= 0.3)
  assert.ok(F.clearingDepth(at(guest, off, k)) >= F.CROWN_REACH)
  assert.ok(
    F.clearingDepth(at(guest, off, k + 0.02)) < F.CROWN_REACH,
    'it came in further than it had to',
  )
  // in the yard, turned to look east: the camera goes out towards the tree strip
  const west = { x: 2, z: 8 }
  const kw = F.cameraReach(west, { x: -12.5, z: 2.6 })
  assert.ok(kw < 1 && F.clearingDepth(at(west, { x: -12.5, z: 2.6 }, kw)) >= F.CROWN_REACH)
})

test('a camera in the open is left alone, and none comes in closer than the least it may', () => {
  // the everyday view, from behind the guest on the driveway and in the yard
  for (const guest of [W.GUEST_START, W.GUEST_SKIP, { x: 3, z: 3 }, { x: 12, z: 6 }])
    assert.equal(F.cameraReach(guest, { x: -2.6, z: 12.5 }), 1)
  // right at the north edge of the field with the camera turned into the woods:
  // nothing is clear, so it comes in as far as it may (the furthest from the trees)
  assert.equal(F.cameraReach({ x: 13, z: -5.6 }, { x: 0, z: -12.5 }), 0.3)
  assert.equal(F.cameraReach({ x: 13, z: -5.6 }, { x: 0, z: -12.5 }, 0.5), 0.5)
  // there with the camera out over the field instead, it stays where it is
  assert.equal(F.cameraReach({ x: 13, z: -5.6 }, { x: 0, z: 2 }), 1)
})

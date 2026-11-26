import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The set views out in the yard (src/components/features/cabin/camera-framing.ts):
// the woodshed's and the shower's turned-round views and the bench's view of
// the boxes hold the camera on arrival, let it go to the visitor once they
// turn it (or walk off from the bench), and don't flip back and forth.
// (Eduard, on a phone: "you can get stuck at the woodshed because you can't
// control where your camera looks in there".)

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const C = cabin('camera-framing')

const SHED = W.CAMERA_SPOTS[0]
const free = { own: false, atBench: false, atBox: false }
/** A point `d` metres from the woodshed, out along the way its view looks from. */
const fromShed = (d) => ({ x: SHED.at.x + SHED.from.x * d, z: SHED.at.z + SHED.from.z * d })

test('walking up to the woodshed, its view turns round; walking off, it lets go', () => {
  const f = C.newFraming()
  assert.equal(C.holdCamera(f, fromShed(8), free).spot, -1)
  assert.equal(C.holdCamera(f, fromShed(SHED.enter - 0.1), free).spot, 0)
  assert.equal(C.holdCamera(f, fromShed(SHED.leave - 0.1), free).spot, 0, 'it held on past `enter`')
  assert.equal(C.holdCamera(f, fromShed(SHED.leave + 0.1), free).spot, -1)
})

test("walking along the edge of the woodshed's range, the view doesn't flip", () => {
  const f = C.newFraming()
  C.holdCamera(f, fromShed(3), free)
  const r = (SHED.enter + SHED.leave) / 2
  for (let a = 0; a < Math.PI * 2; a += 0.1) {
    const p = { x: SHED.at.x + Math.cos(a) * r, z: SHED.at.z + Math.sin(a) * r }
    assert.equal(C.holdCamera(f, p, free).spot, 0)
  }
})

test('turning the camera by the woodshed lets its view go until the guest walks out of range', () => {
  const f = C.newFraming()
  C.holdCamera(f, fromShed(3), free)
  C.letGo(f)
  // wandering about near the shed, the camera stays the visitor's
  for (const d of [3, 2, 4, SHED.leave - 0.2, 3])
    assert.equal(C.holdCamera(f, fromShed(d), free).spot, -1)
  // out of range and back: it turns round again
  C.holdCamera(f, fromShed(SHED.leave + 1), free)
  assert.equal(C.holdCamera(f, fromShed(3), free).spot, 0)
})

test('the same goes for the outdoor shower', () => {
  const shower = W.CAMERA_SPOTS[1]
  const near = { x: shower.at.x + shower.from.x * 2, z: shower.at.z + shower.from.z * 2 }
  const f = C.newFraming()
  assert.equal(C.holdCamera(f, near, free).spot, 1)
  C.letGo(f)
  assert.equal(C.holdCamera(f, near, free).spot, -1)
})

test("at the bench: its view holds until the visitor turns the camera, and comes back next time they're at it", () => {
  const f = C.newFraming()
  const at = W.BENCH_SPOT
  assert.deepEqual(C.holdCamera(f, at, { ...free, atBench: true }), { spot: 0, bench: true })
  C.letGo(f)
  const held = C.holdCamera(f, at, { ...free, atBench: true })
  assert.equal(held.bench, false)
  assert.equal(held.spot, -1, "the woodshed's view doesn't take over instead")
  // a step away and back to the bench
  C.holdCamera(f, at, free)
  assert.equal(C.holdCamera(f, at, { ...free, atBench: true }).bench, true)
})

test("walking off from the bench lets the woodshed's view go (it doesn't swing back to the shed)", () => {
  const f = C.newFraming()
  C.holdCamera(f, W.BENCH_SPOT, { ...free, atBench: true })
  const out = { x: W.BENCH_SPOT.x + 1.5, z: W.BENCH_SPOT.z - 1.5 }
  assert.equal(C.holdCamera(f, out, free).spot, -1)
  assert.equal(C.holdCamera(f, fromShed(3), free).spot, -1)
})

test("going from the bench to one of its boxes and back keeps to the bench's views", () => {
  const f = C.newFraming()
  const at = W.BENCH_SPOT
  C.holdCamera(f, at, { ...free, atBench: true })
  // walking to the box (the woodshed's view, as before), then looking in it (its own camera)
  assert.equal(C.holdCamera(f, W.crateSpot(1), { ...free, atBox: true }).spot, 0)
  C.holdCamera(f, W.crateSpot(1), { own: true, atBench: false, atBox: true })
  assert.deepEqual(C.holdCamera(f, W.crateSpot(1), { ...free, atBench: true }), {
    spot: 0,
    bench: true,
  })
})

test('a moment with its own camera (the chopping block) hands back to the woodshed view after', () => {
  const f = C.newFraming()
  const block = W.SPLIT_SPOT
  C.holdCamera(f, block, free)
  C.letGo(f)
  assert.equal(C.holdCamera(f, block, { ...free, own: true }).spot, -1)
  assert.equal(C.holdCamera(f, block, free).spot, 0)
})

test('taking over, the everyday camera faces the way the set view faced', () => {
  // the everyday camera, unturned: behind the guest and a little west, looking past them
  const facing = { x: 2.6, z: -17.5 }
  // (the scene turns its offsets like this)
  const turn = (v, yaw) => ({
    x: v.x * Math.cos(yaw) + v.z * Math.sin(yaw),
    z: -v.x * Math.sin(yaw) + v.z * Math.cos(yaw),
  })
  const dir = (v) => Math.atan2(v.x, v.z)
  // the bench's view: in front of it, looking back at the boxes
  const from = {
    x: W.BOXES_CENTRE.x + W.BENCH_FRONT.x * 3.2,
    z: W.BOXES_CENTRE.z + W.BENCH_FRONT.z * 3.2,
  }
  for (const [a, b] of [
    [from, W.BOXES_CENTRE],
    [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ],
    [
      { x: 0, z: 0 },
      { x: -1, z: 1 },
    ],
  ]) {
    const yaw = C.yawFacing(a, b, facing)
    const want = dir({ x: b.x - a.x, z: b.z - a.z })
    const got = dir(turn(facing, yaw))
    assert.ok(Math.abs(Math.atan2(Math.sin(got - want), Math.cos(got - want))) < 1e-9)
    assert.ok(Math.abs(yaw) <= Math.PI)
  }
})

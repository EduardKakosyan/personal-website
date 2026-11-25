import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The cabin scene's walking (src/components/features/cabin/nav.ts): every
// spot an interaction walks the guest to can actually be reached, and every
// planned leg is clear of walls, things and Eduard.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const N = cabin('nav')

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/** Plan a walk and check each leg is clear; returns the waypoints. */
function walk(from, to, exact = false) {
  const way = N.findPath(from, to, exact)
  assert.ok(way && way.length > 0, `no way from (${from.x}, ${from.z}) to (${to.x}, ${to.z})`)
  let at = from
  for (const p of way) {
    assert.ok(
      N.clearLine(at, p, p.pad ?? N.GUEST_PAD),
      `leg (${at.x.toFixed(2)}, ${at.z.toFixed(2)}) → (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) runs into something`,
    )
    at = p
  }
  return way
}

const SPLIT_STANCE = { x: W.CHOPPING_BLOCK.x - 0.82, z: W.CHOPPING_BLOCK.z }

test('the door steps and the "go out" spot are clear of Eduard at his spot on the deck', () => {
  for (const p of [W.DOOR.outside, W.DOOR.mouth, W.DOOR.inside, W.DOOR.out])
    assert.equal(W.blocked(p), false, `(${p.x}, ${p.z}) is blocked`)
})

test('the outside door step is beyond the swing of the storm door', () => {
  assert.ok(dist(W.DOOR.outside, W.DOOR.hinge) > W.DOOR.leaf + 0.1)
})

test('the guest can get to the door from the driveway and the yard', () => {
  for (const from of [W.GUEST_SKIP, { x: 3.0, z: 3.2 }, { x: -3.0, z: -1.0 }, { x: 6.5, z: 6.8 }]) {
    const way = walk(from, W.DOOR.outside, true)
    assert.ok(dist(way.at(-1), W.DOOR.outside) < 0.01)
  }
})

test('every spot inside the cabin is reachable from the doorway', () => {
  const spots = [
    { x: -0.18, z: -1.0 }, // résumé
    { x: 0.85, z: -1.6 }, // to-do
    { x: 0.85, z: -1.03 }, // basket
    { x: 1.05, z: 0.75 }, // rod
    { x: 0.95, z: 0.12 }, // tackle box
  ]
  for (const spot of spots) {
    const way = walk(W.DOOR.inside, spot, true)
    assert.ok(dist(way.at(-1), spot) < 0.01)
  }
})

test('the chopping block and the crates on the bench can be walked right up to', () => {
  for (const spot of [SPLIT_STANCE, W.BENCH_SPOT, ...W.CRATES.map((_, i) => W.crateSpot(i))]) {
    const way = walk({ x: 3.0, z: 3.2 }, spot, true)
    assert.ok(dist(way.at(-1), spot) < 0.01, `ended ${dist(way.at(-1), spot).toFixed(2)} m off`)
  }
})

test('walks go round the picnic table and the woodshed, not into them', () => {
  walk({ x: 3.8, z: 6.4 }, { x: 3.8, z: 3.3 })
  walk({ x: 7.8, z: 9.6 }, { x: 4.4, z: 6.6 })
  walk({ x: 20, z: 25 }, { x: -3, z: -1 })
})

test('a tap on something solid walks to the nearest spot beside it', () => {
  const inWoodshed = { x: 5.8, z: 8.8 }
  const way = walk({ x: 3.0, z: 3.2 }, inWoodshed)
  const end = way.at(-1)
  assert.equal(W.blocked(end), false)
  assert.ok(dist(end, inWoodshed) < 2.2)
})

test('planning a long walk is quick enough for a tap', () => {
  N.warmNav()
  // Best of three: a shared CI runner can stall one run, and that isn't the planner.
  let best = Infinity
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now()
    walk({ x: 20, z: 25 }, { x: -3, z: -1 })
    best = Math.min(best, performance.now() - t0)
  }
  assert.ok(best < 120, `${best.toFixed(0)} ms`)
})

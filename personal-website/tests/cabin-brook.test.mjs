import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The brook (scene 6): the walk down the stairs to the landing and the tap,
// the banks and the water staying out of bounds, the floor heights on the
// way down, casting a line at the fishing hole, HUGO's cue to lead there,
// and the light turning to sunset on the way.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const N = cabin('nav')
const B = cabin('brook')
const F = cabin('fishing')
const D = cabin('daylight')

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

function walk(from, to, exact = false) {
  const way = N.findPath(from, to, exact)
  assert.ok(way && way.length > 0, `no way from (${from.x}, ${from.z}) to (${to.x}, ${to.z})`)
  let at = from
  for (const p of way) {
    assert.ok(
      N.clearLine(at, p, p.pad ?? N.GUEST_PAD),
      `leg to (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) runs into something`,
    )
    at = p
  }
  return way
}

test('the guest can walk from the camp down the stairs to the landing, and to the tap', () => {
  for (const spot of [B.STAIRS_TOP, B.CAST_SPOT, B.TAP_SPOT]) {
    const way = walk({ x: 9.5, z: 0.6 }, spot, true)
    assert.ok(dist(way.at(-1), spot) < 0.01, `ended ${dist(way.at(-1), spot).toFixed(2)} m off`)
  }
})

test('the bank and the water are out of bounds, except the stairs and the landing', () => {
  for (const z of [-5, -1.5, 2, 8, 15, 25]) {
    const middle = { x: B.brookX(z), z }
    assert.equal(W.blocked(middle), true, `the water at z ${z} is walkable`)
    assert.equal(
      W.blocked({ x: B.brookX(z) - B.BANK_TOP + 0.1, z }),
      true,
      `the bank at z ${z} is walkable`,
    )
  }
  assert.equal(W.blocked(B.CAST_SPOT), false)
  assert.equal(W.blocked({ x: (B.STAIRS.x0 + B.STAIRS.x1) / 2, z: B.STAIRS.z }), false)
  // a tap out in the water walks to somewhere dry
  const way = walk(B.STAIRS_TOP, { x: B.brookX(4), z: 4 })
  assert.equal(W.blocked(way.at(-1)), false)
})

test('the stairs step down to the landing, which is below the field', () => {
  const tread = (B.STAIRS.x1 - B.STAIRS.x0) / B.STAIRS.steps
  let last = W.groundHeight({ x: B.STAIRS.x0 - 0.2, z: B.STAIRS.z })
  assert.equal(last, 0)
  for (let k = 0; k < B.STAIRS.steps; k++) {
    const y = W.groundHeight({ x: B.STAIRS.x0 + tread * (k + 0.5), z: B.STAIRS.z })
    assert.ok(y < last, `step ${k} isn't lower than the one before`)
    last = y
  }
  assert.equal(W.groundHeight(B.CAST_SPOT), B.LANDING.y)
  assert.ok(B.LANDING.y < last && B.LANDING.y > B.WATER_Y)
})

test('a tap on the water by the fishing hole is found under the field-height ground', () => {
  const eye = { x: B.CAST_SPOT.x - 3, y: 4, z: B.CAST_SPOT.z + 6 }
  const aim = (p) => {
    const d = { x: p.x - eye.x, y: p.y - eye.y, z: p.z - eye.z }
    const l = Math.hypot(d.x, d.y, d.z)
    return { x: d.x / l, y: d.y / l, z: d.z / l }
  }
  const hole = B.brookTap(eye, aim({ x: B.FISHING_HOLE.x, y: B.WATER_Y, z: B.FISHING_HOLE.z }))
  assert.equal(hole?.hole, true)
  const landing = B.brookTap(eye, aim({ x: B.CAST_SPOT.x, y: B.LANDING.y, z: B.CAST_SPOT.z }))
  assert.equal(landing?.hole, false)
  assert.ok(dist(landing.at, B.CAST_SPOT) < 0.05)
})

/** Steps a fishing go along with fixed rolls of the dice. */
function run(f, seconds, rnd = () => 0.5) {
  for (let t = 0; t < seconds; t += 1 / 60) F.updateFishing(f, 1 / 60, rnd)
}

test('a go at the fishing hole: cast, wait for the bite, strike, reel it in', () => {
  const f = F.createFishing()
  F.startFishing(f)
  F.arriveAtHole(f)
  assert.equal(
    F.press(f, () => 0.5),
    true,
  )
  run(f, 1.2)
  assert.equal(f.phase, 'waiting')
  // wait for the bite (it comes within a few seconds)
  for (let k = 0; k < 600 && f.phase === 'waiting'; k++) F.updateFishing(f, 1 / 60, () => 0.5)
  assert.equal(f.phase, 'bite')
  F.press(f)
  assert.equal(f.phase, 'reel')
  let caught = false
  for (let k = 0; k < 200 && !caught; k++) {
    F.press(f)
    for (let i = 0; i < 9; i++) {
      F.updateFishing(f, 1 / 60)
      if (f.event === 'caught') caught = true
    }
  }
  assert.ok(caught, 'never landed it')
  assert.equal(f.caught, 1)
  run(f, 3)
  assert.equal(f.phase, 'ready')
})

test('striking too soon, or too late, loses it', () => {
  const soon = F.createFishing()
  F.startFishing(soon)
  F.arriveAtHole(soon)
  F.press(soon)
  run(soon, 1.2)
  F.press(soon)
  assert.equal(soon.phase, 'missed')
  assert.equal(soon.event, 'soon')

  const late = F.createFishing()
  F.startFishing(late)
  F.arriveAtHole(late)
  F.press(late)
  run(late, 1.2)
  for (let k = 0; k < 600 && late.phase === 'waiting'; k++) F.updateFishing(late, 1 / 60, () => 0.5)
  let away = false
  for (let t = 0; t < F.BITE_WINDOW + 0.2; t += 1 / 60) {
    F.updateFishing(late, 1 / 60)
    if (late.event === 'away') away = true
  }
  assert.ok(away)
  assert.equal(late.caught, 0)
})

test('reeling too slowly lets it get away', () => {
  const f = F.createFishing()
  F.startFishing(f)
  F.arriveAtHole(f)
  F.press(f)
  run(f, 1.2)
  for (let k = 0; k < 600 && f.phase === 'waiting'; k++) F.updateFishing(f, 1 / 60, () => 0.5)
  F.press(f)
  run(f, 3)
  assert.notEqual(f.phase, 'reel')
  assert.equal(f.caught, 0)
})

test('the catch is a neutral one: no species named until Eduard says', () => {
  assert.equal(F.FISHING_CATCH.label, 'a fish')
})

test('HUGO leads on to the brook after the woodshed, not before', () => {
  const base = {
    reachedWoodshed: true,
    reachedBrook: false,
    didSomethingAtShed: true,
    busy: false,
    freeFor: 3,
    fromWoodshed: 2,
  }
  assert.equal(B.readyForBrook(base), true)
  assert.equal(B.readyForBrook({ ...base, reachedWoodshed: false }), false)
  assert.equal(B.readyForBrook({ ...base, reachedBrook: true }), false)
  assert.equal(B.readyForBrook({ ...base, busy: true }), false)
  assert.equal(B.readyForBrook({ ...base, freeFor: 1 }), false)
  // walked off without doing anything there
  assert.equal(B.readyForBrook({ ...base, didSomethingAtShed: false, fromWoodshed: 4 }), false)
  const off = { ...base, didSomethingAtShed: false, fromWoodshed: 10 }
  assert.equal(B.readyForBrook({ ...off, eastOfWoodshed: 8 }), true)
  // ...but back towards the cabin isn't the brook's way
  assert.equal(B.readyForBrook({ ...off, eastOfWoodshed: -5 }), false)
  // HUGO waits ahead of the guest: one point on when they catch up, and
  // past every point they're already beyond if they went their own way
  assert.equal(B.brookLeadIndex(0, { x: 6.6, z: 5.8 }), 1)
  assert.equal(B.brookLeadIndex(0, { x: 2, z: 9 }), 0)
  const skipped = B.brookLeadIndex(0, { x: 15, z: -3 })
  assert.ok(B.BROOK_LEAD_PATH[skipped].x > 15, `waits at ${skipped}`)
  assert.equal(B.brookLeadIndex(0, { x: 22.5, z: 0.4 }), B.BROOK_LEAD_PATH.length - 1)
  // every point of HUGO's way is walkable ground
  for (const p of B.BROOK_LEAD_PATH) assert.equal(W.blocked(p, 0.2), false)
})

test('the light: afternoon at the cabin, golden by the woodshed, sunset at the brook', () => {
  assert.equal(D.eveningAt({ x: 0, z: 0 }), 0)
  const shed = D.eveningAt(W.WOODSHED)
  assert.ok(shed > 0.5 && shed <= 1, `woodshed ${shed}`)
  assert.equal(D.eveningAt(B.STAIRS_TOP), 2)
  // and back again on the way back
  assert.equal(D.eveningAt({ x: 1, z: 2 }), 0)
})

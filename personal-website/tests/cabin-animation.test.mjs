import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The animations' plain maths: where a leg meets the ground (legs.ts), and
// Eduard building the deck (eduard.ts): standing before he walks, the
// hammer landing on the board, the board going down into its row.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const L = cabin('legs')
const E = cabin('eduard')
const W = cabin('world')

const dt = 1 / 60
const far = { x: 20, z: 20 }
const ctx = (watching) => ({ guest: far, dog: far, hugo: far, greeting: false, watching })

test('a straight leg reaches the ground from the hip, and standing straight drops nothing', () => {
  // the hip is 0.4 up (guest_model.py, eduard_model.py)
  assert.ok(L.STAND_REACH > 0.37 && L.STAND_REACH < 0.41, `soles ${L.STAND_REACH} below the hip`)
  assert.equal(L.legDrop(0, 0), 0)
  // mid-stride (one leg forward, the other back and bent) the hip moves only a little
  const stride = L.legDrop(0.55, 0, -0.55, 0.6)
  assert.ok(Math.abs(stride) < 0.06, `a stride moves the hip ${stride}`)
})

test('kneeling, both the knee and the toe of the boot rest on the ground', () => {
  const drop = L.legDrop(L.KNEEL.thigh, L.KNEEL.shin)
  const hip = 0.4 - drop
  assert.ok(drop > 0.08 && drop < 0.16, `kneeling drops the hip ${drop.toFixed(3)}`)
  // the front of the knee and the toe, from the hip (the same points legs.ts uses)
  const t = L.KNEEL.thigh
  const a = t + L.KNEEL.shin
  const kneeY = -0.2 * Math.cos(t)
  const at = (y, z) => hip + kneeY + y * Math.cos(a) - z * Math.sin(a)
  const knee = at(0, 0.07)
  const toe = at(-0.17, 0.165)
  assert.ok(Math.abs(knee) < 0.02, `knee ${knee.toFixed(3)} off the ground`)
  assert.ok(Math.abs(toe) < 0.03, `toe ${toe.toFixed(3)} off the ground`)
})

test('turned to work, the hammer lands on the board he has just laid', () => {
  // (the boards are 15 cm wide and run north–south over the joists, z 1.235..2.33)
  for (let k = 0; k < W.DECK_BOARDS.length; k++) {
    const spot = W.boardSpot(k)
    const board = W.DECK_BOARDS[k]
    const hit = E.strikePoint(spot, E.workYaw(spot, board.x))
    // (the last three are out of his reach from the spot clear of the door: see below)
    if (Math.abs(board.x - spot.x) > 0.43) continue
    assert.ok(hit.z > 1.3 && hit.z < 2.3, `board ${k}: the strike at z ${hit.z.toFixed(2)}`)
    assert.ok(
      Math.abs(hit.x - board.x) < 0.06,
      `board ${k}: the strike ${(hit.x - board.x).toFixed(3)} off it`,
    )
  }
})

test('every strike of the deck, watched start to finish, lands on a laid board', () => {
  const e = E.createEduard()
  let strikes = 0
  for (let t = 0; t < 200 && e.placed < W.DECK_BOARDS.length; t += dt) {
    E.updateEduard(e, dt, ctx(true))
    // on his knees, turned to his work, hammering
    const turn = Math.abs(Math.atan2(Math.sin(e.yaw - e.workYaw), Math.cos(e.yaw - e.workYaw)))
    if (e.activity !== 'hammer' || e.stand > 0.05 || turn > 0.02) continue
    const hit = E.strikePoint(e.pos, e.yaw)
    // (before any are laid, the loose board lying across the joists at x 2.89..3.11)
    const boards =
      e.placed === 0
        ? [{ x: 3.0, half: 0.1 }]
        : W.DECK_BOARDS.slice(0, e.placed).map((b) => ({ x: b.x, half: 0.075 }))
    assert.ok(
      boards.some((b) => Math.abs(hit.x - b.x) < b.half) && hit.z > 1.3 && hit.z < 2.3,
      `board ${e.placed}: the strike at ${hit.x.toFixed(2)}, ${hit.z.toFixed(2)} misses the boards`,
    )
    strikes++
  }
  assert.ok(strikes > 100)
})

test('watched, he gets up before each board trip and lays every board down in its row', () => {
  const e = E.createEduard()
  let laid = 0
  let lastLay = 0
  for (let t = 0; t < 200 && e.placed < W.DECK_BOARDS.length; t += dt) {
    const placed = e.placed
    const carrying = e.carrying
    E.updateEduard(e, dt, ctx(true))
    if (e.walking)
      assert.ok(
        e.stand > 0.9,
        `walking (${e.activity}) while on his knees (stand ${e.stand.toFixed(2)})`,
      )
    if (e.placed > placed) {
      laid++
      // the board was all the way down in its row when it left his hands
      assert.ok(carrying && lastLay > 0.97, `board ${placed} let go at lay ${lastLay.toFixed(2)}`)
    }
    lastLay = E.layAmount(e)
  }
  assert.equal(laid, W.DECK_BOARDS.length, 'the deck gets finished')
})

test('his boots stand on the boards, and kneeling his knees rest on them', () => {
  const e = E.createEduard()
  const deck = W.groundHeight(e.pos)
  // kneeling (where he starts)
  let pose = E.eduardPose(e, 0, false)
  assert.ok(
    Math.abs(deck - L.legDrop(-0, Math.PI / 2 + 0.5) - pose.y) < 0.01,
    'kneeling on the deck',
  )
  // standing up (the welcome)
  e.stand = 1
  pose = E.eduardPose(e, 0, 'guest')
  assert.ok(Math.abs(pose.y - deck) < 0.005, `standing ${(pose.y - deck).toFixed(3)} off the deck`)
})

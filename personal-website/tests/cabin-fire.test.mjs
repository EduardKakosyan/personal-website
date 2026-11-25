import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'
import { findHiddenTerms, localHiddenTerms } from '../scripts/lib/hidden-terms.mts'

// The fire (scene 7): the chairs round it, HUGO's call back from the brook,
// night falling, Eduard lighting it and sitting down, Rusty settling beside
// it, and the questions the guest can ask Eduard.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const N = cabin('nav')
const B = cabin('brook')
const F = cabin('fire')
const D = cabin('daylight')
const E = cabin('eduard')
const R = cabin('rusty')
const S = cabin('hugo-stops')
const Q = cabin('fire-questions')
const HQ = cabin('hugo-questions')
const C = cabin('checklist')
const { projects } = loadTs(new URL('../src/content/projects.ts', import.meta.url))
const { profile } = loadTs(new URL('../src/content/profile.ts', import.meta.url))

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const dt = 1 / 60

test('the camp chairs sit round the fire, facing it, clear of the stones', () => {
  const seats = Object.values(F.FIRE_SEATS)
  assert.equal(seats.length, 3)
  for (const s of seats) {
    const out = dist(s, F.FIRE)
    assert.ok(out > F.FIRE_RADIUS + 0.6 && out < 2.2, `a chair ${out.toFixed(2)} m from the fire`)
    // a step the way it faces is a step nearer the fire
    const ahead = { x: s.x + Math.sin(s.yaw) * 0.5, z: s.z + Math.cos(s.yaw) * 0.5 }
    assert.ok(dist(ahead, F.FIRE) < out - 0.45, 'the chair faces the fire')
    // and the spot to sit down from is on the ground, outside the ring of stones
    const stand = F.seatStand(s)
    assert.ok(dist(stand, F.FIRE) > F.FIRE_RADIUS + 0.2, 'room to stand in front of it')
  }
  // no two chairs on top of each other
  for (let i = 0; i < seats.length; i++)
    for (let j = i + 1; j < seats.length; j++)
      assert.ok(dist(seats[i], seats[j]) > 0.9, 'chairs apart')
  // they're obstacles; the middle of the fire is too
  for (const s of seats) assert.ok(W.blockedStatic(s, 0.2))
  assert.ok(W.blockedStatic(F.FIRE, 0.2))
})

test('the guest can walk from the brook path, the deck and the woodshed to their chair', () => {
  const stand = F.seatStand(F.FIRE_SEATS.guest)
  for (const from of [F.FIRE_LEAD_PATH.at(-1), W.DOOR.out, { x: 6.6, z: 6.0 }, B.STAIRS_TOP]) {
    const way = N.findPath(from, stand, true)
    assert.ok(way && way.length > 0, `no way from (${from.x}, ${from.z})`)
    assert.ok(dist(way.at(-1), stand) < 0.01)
  }
  // and to the Yahtzee set on the picnic table
  const way = N.findPath(W.DOOR.out, F.YAHTZEE_SPOT, true)
  assert.ok(way && dist(way.at(-1), F.YAHTZEE_SPOT) < 0.01)
  assert.ok(dist(F.YAHTZEE_SPOT, F.YAHTZEE) < 1.5, 'near enough to look at it')
})

test('HUGO calls the guest back once they have done something at the brook, or been there a while', () => {
  const base = {
    reachedBrook: true,
    busy: false,
    didSomethingAtBrook: false,
    freeFor: 5,
    atBrookFor: 10,
    backFromStairs: 0,
  }
  assert.equal(F.readyForFire(base), false, 'just got there')
  assert.equal(F.readyForFire({ ...base, didSomethingAtBrook: true }), true, 'fished or got water')
  assert.equal(
    F.readyForFire({ ...base, didSomethingAtBrook: true, freeFor: 1 }),
    false,
    'a moment first',
  )
  assert.equal(
    F.readyForFire({ ...base, didSomethingAtBrook: true, busy: true }),
    false,
    'not mid-cast',
  )
  assert.equal(F.readyForFire({ ...base, atBrookFor: 60 }), true, 'been there a while')
  assert.equal(F.readyForFire({ ...base, backFromStairs: 8 }), true, 'started back on their own')
  assert.equal(
    F.readyForFire({ ...base, reachedBrook: false, backFromStairs: 20 }),
    false,
    'not before the brook',
  )
  assert.ok(F.backFromStairs({ x: B.STAIRS_TOP.x - 8, z: 0 }) > 7)
  assert.equal(F.HUGO_FIRE_LEAD_LINE, 'Looks like the fire’s going. Come on!')
})

test('night falls on the way back, comes on by itself, and never lifts', () => {
  // walking back west across the field
  let night = 0
  let last = 0
  for (let x = B.STAIRS_TOP.x; x >= F.FIRE.x; x -= 0.25) {
    night = F.nightfall(night, { x, z: 0.5 }, 0.1)
    assert.ok(night >= last, 'never lighter')
    last = night
  }
  assert.equal(night, 1, 'dark by the camp')
  // walking back east again doesn't bring the day back
  assert.equal(F.nightfall(1, B.STAIRS_TOP, 0.1), 1)
  // standing at the brook, it still gets dark, in under a minute and a half
  night = 0
  let seconds = 0
  while (night < 1 && seconds < 200) {
    night = F.nightfall(night, { x: 25.6, z: 0 }, 0.5)
    seconds += 0.5
  }
  assert.ok(seconds > 20 && seconds < 90, `${seconds} s`)
  // the light: nothing of the night at sunset, all of it at night
  assert.equal(D.nightAmount(D.EVENING_SUNSET), 0)
  assert.equal(D.nightAmount(D.EVENING_NIGHT), 1)
  assert.ok(D.nightAmount(2.5) > 0.2 && D.nightAmount(2.5) < 0.8)
})

test('HUGO stays ahead of the guest on the way back to the fire', () => {
  let i = 0
  let from = B.STAIRS_TOP
  for (let x = B.STAIRS_TOP.x; x >= F.FIRE.x + 2; x -= 0.5) {
    const guest = { x, z: 0.6 }
    i = F.fireLeadIndex(i, guest)
    const wp = F.FIRE_LEAD_PATH[i]
    if (i < F.FIRE_LEAD_PATH.length - 1)
      assert.ok(dist(wp, F.FIRE) < dist(guest, F.FIRE) + 0.5, `behind the guest at x ${x}`)
    from = guest
  }
  assert.equal(i, F.FIRE_LEAD_PATH.length - 1)
  assert.ok(dist(from, F.FIRE) < 4)
  // the way back runs west, each point nearer the fire, and none of it is in anything
  for (let k = 1; k < F.FIRE_LEAD_PATH.length; k++)
    assert.ok(dist(F.FIRE_LEAD_PATH[k], F.FIRE) < dist(F.FIRE_LEAD_PATH[k - 1], F.FIRE))
  for (const p of F.FIRE_LEAD_PATH) assert.ok(!W.blockedStatic(p, 0.28), `(${p.x}, ${p.z})`)
})

test('by the fire is its own stop for HUGO at night, with questions of his own', () => {
  for (const s of Object.values(F.FIRE_SEATS)) {
    assert.equal(S.hugoStopAt(s, false, null, { night: true }), 'fire')
    assert.equal(S.hugoStopAt(s, false, null), 'arrival')
  }
  const fire = HQ.HUGO_QUESTIONS.fire
  assert.ok(fire && fire.questions.length >= 2)
  // off-script goes to HUGO (A30): he says where the rest is and how to get in touch
  const said = fire.questions.map((q) => q.a).join(' ')
  assert.match(said, /Contact/)
  assert.match(said, /Work/)
})

test('at nightfall Eduard is in his chair by the fire, toasting a marshmallow', () => {
  const far = { x: 23, z: 0 }
  const e = E.createEduard()
  // (in the middle of fetching a board when HUGO calls the guest back)
  for (let t = 0; t < 34; t += dt)
    E.updateEduard(e, dt, { guest: far, dog: far, hugo: far, greeting: false })
  assert.equal(e.fire, false)
  assert.equal(e.lit, false)
  E.seatAtFire(e)
  assert.equal(e.carrying, false, 'he puts the board down')
  assert.equal(e.activity, 'fireside')
  assert.equal(e.lit, true, 'the fire is going')
  assert.equal(e.sit, 1)
  assert.ok(dist(e.pos, F.FIRE_SEATS.eduard) < 0.01, 'in his own chair')
  // sitting: his legs are out along the seat and he's up on the chair, the
  // stick arm out towards the fire
  let pose = E.eduardPose(e, 3, false)
  assert.ok(pose.thighL < -1.2 && pose.thighR < -1.2)
  assert.ok(pose.y > 0.05)
  assert.ok(pose.armR < 0.2, 'the stick is held out')
  // the marshmallow browns, he takes it off and eats it, and a new one goes on
  let m = E.marshmallow(e)
  assert.equal(m.gone, false)
  const pale = m.brown
  let ate = false
  let fresh = false
  for (let t = 0; t < E.TOAST_TIME + 8; t += dt) {
    E.updateEduard(e, dt, { guest: far, dog: far, hugo: far, greeting: false })
    m = E.marshmallow(e)
    if (m.gone) ate = true
    if (ate && !m.gone && m.brown < 0.2) fresh = true
    assert.ok(dist(e.pos, F.FIRE_SEATS.eduard) < 0.01, 'he stays in his chair')
  }
  assert.ok(pale < 0.5)
  assert.ok(ate, 'he eats it')
  assert.ok(fresh, 'and puts another on')
  // answering, he turns to the guest and brings the stick in a little
  const beside = F.FIRE_SEATS.guest
  const reachBefore = E.eduardPose(e, 3, false).armR
  for (let t = 0; t < 2; t += dt)
    E.updateEduard(e, dt, {
      guest: beside,
      dog: beside,
      hugo: beside,
      greeting: false,
      talking: true,
    })
  assert.equal(e.talking, true)
  assert.ok(Math.abs(e.headTurn) > 0.3, 'he looks at the guest')
  pose = E.eduardPose(e, 3, false)
  assert.ok(
    pose.armR > reachBefore || E.marshmallow(e).out > 0,
    'the stick comes in while he talks',
  )
})

function runRusty(r, guest, seconds) {
  for (let t = 0; t < seconds; t += dt) {
    const mouth = {
      x: r.pos.x + Math.sin(r.yaw) * 0.7,
      y: 0.38 - r.headDown * 0.25,
      z: r.pos.z + Math.cos(r.yaw) * 0.7,
    }
    R.updateRusty(r, dt, guest, Math.PI / 2, false, mouth, () => {})
  }
}

test('Rusty takes the cow over to the fire and lies down there, wherever he was', () => {
  const settled = (r, what) => {
    assert.equal(r.state, 'lying', what)
    assert.ok(r.lie > 0.95, `${what}: lying down`)
    assert.ok(
      dist(r.pos, F.RUSTY_FIRE_BED) < 0.5,
      `${what}: ${dist(r.pos, F.RUSTY_FIRE_BED).toFixed(2)} m off`,
    )
    assert.equal(r.cow.state, 'ground', `${what}: the cow is beside him`)
    assert.ok(dist(r.cow.pos, r.pos) < 1.3, `${what}: the cow is beside him`)
    assert.ok(dist(r.pos, F.FIRE) > F.FIRE_RADIUS + 0.5, `${what}: not in the fire`)
    assert.ok(dist(r.cow.pos, F.FIRE) > F.FIRE_RADIUS, `${what}: the cow is not in the fire`)
  }
  // waiting by the guest at the brook, the cow at their feet
  const atBrook = { x: 23.4, z: 0.4 }
  let r = R.createRusty({ x: 20, z: 1.2 }, Math.PI / 2)
  r.pets = 1
  R.startApproach(r)
  runRusty(r, atBrook, 8)
  assert.equal(r.state, 'waiting')
  R.callToBed(r, F.RUSTY_FIRE_BED)
  runRusty(r, atBrook, 25)
  settled(r, 'from the brook')
  // lying at his spot by the deck, done playing
  r = R.createRusty(W.RUSTY_START, 0)
  R.settleInBed(r, { ...W.RUSTY_START, yaw: 0 })
  assert.equal(r.lie, 1)
  R.callToBed(r, F.RUSTY_FIRE_BED)
  runRusty(r, atBrook, 0.2)
  assert.ok(dist(r.pos, W.RUSTY_START) < 0.05, 'he gets up before he sets off')
  runRusty(r, atBrook, 15)
  settled(r, 'from his spot by the deck')
  // and his belly can still be rubbed there
  assert.ok(R.canRubBelly(r, { x: r.pos.x + 0.5, z: r.pos.z + 0.5 }))
})

test('the questions for Eduard: a handful, each with an approved answer', () => {
  const qs = Q.FIRE_QUESTIONS
  assert.ok(qs.length >= 4 && qs.length <= 8, `${qs.length} questions`)
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, 'ids are unique')
  const slugs = new Set(projects.map((p) => p.slug))
  for (const q of qs) {
    assert.ok(q.q.trim().endsWith('?'), q.id)
    assert.ok(q.a.length >= 1 && q.a.length <= 4, `${q.id}: ${q.a.length} paragraphs`)
    for (const p of q.a) assert.ok(p.trim().length > 20 && p.length <= 320, `${q.id}: ${p.length}`)
    assert.ok(q.sources.trim(), `${q.id}: no sources`)
    // A30: no generated text in his voice; every answer is approved.
    assert.equal(q.draft, false, `${q.id}: approved before it ships`)
    if (q.link)
      assert.ok(
        q.link.href === '/projects' || slugs.has(q.link.href.replace('/projects/', '')),
        `${q.id}: ${q.link.href}`,
      )
  }
  // the fire is where Keeper and Keystone are told, and HUGO only briefly (A9, A23)
  const all = qs.map((q) => q.a.join(' ')).join(' ')
  assert.match(all, /Keystone/)
  assert.match(all, /Keeper/)
  const hugo = qs.find((q) => q.id === 'hugo')
  assert.ok(hugo && hugo.a.join(' ').length < 420, 'HUGO stays a small mention')
  // nothing hidden, and none of the facts Eduard hasn't settled
  const text = [...qs.flatMap((q) => [q.q, ...q.a]), ...Object.values(Q.EDUARD_FIRE_LINES)].join(
    '\n',
  )
  assert.equal(
    findHiddenTerms(text, [...profile.hidden, ...localHiddenTerms()]).length,
    0,
    'a hidden term by the fire',
  )
  assert.doesNotMatch(text, /MDI|never leaves my laptop|quietly/i)
  assert.doesNotMatch(text, /\b(four|4)[- ](person|developers)/i)
  // HUGO's lines at the fire talk about Eduard, never as him
  for (const line of [Q.HUGO_GOODBYE_LINE, Q.HUGO_YAHTZEE_LINE])
    assert.ok(HQ.checkHugoReply(line).ok, line)
})

test('the checklist has the fire and the Yahtzee set', () => {
  const ids = C.GOALS.map((g) => g.id)
  assert.ok(ids.includes('fire'))
  assert.ok(ids.includes('yahtzee'))
  assert.equal(new Set(ids).size, ids.length)
})

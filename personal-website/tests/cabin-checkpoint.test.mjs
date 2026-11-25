import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The tour's checkpoints (checkpoint.ts): what's saved as the guest gets
// round, where coming back puts them, and the notes that links to the
// projects' pages open instead of leaving the cabin (cabin-content.ts).

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const B = cabin('brook')
const F = cabin('fire')
const S = cabin('hugo-stops')
const N = cabin('nav')
const K = cabin('checkpoint')
const C = cabin('cabin-content')
const FQ = cabin('fire-questions')
const HQ = cabin('hugo-questions')
const { projects } = loadTs(new URL('../src/content/projects.ts', import.meta.url))

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

test('the checkpoints go round in the order of the tour', () => {
  assert.deepEqual([...K.CHECKPOINTS], ['cabin', 'woodshed', 'brook', 'fire'])
  for (const at of K.CHECKPOINTS) assert.ok(K.CHECKPOINT_NAMES[at], at)
})

test('a checkpoint never goes back', () => {
  let cp = K.reach(null, 'cabin')
  assert.deepEqual(cp, { at: 'cabin', asked: [] })
  cp = K.reach(cp, 'brook')
  assert.equal(cp.at, 'brook')
  // (walking past the woodshed on the way back to the fire)
  assert.equal(K.reach(cp, 'woodshed').at, 'brook')
  assert.equal(K.reach(cp, 'cabin'), cp)
  assert.ok(K.reached(cp, 'woodshed'))
  assert.ok(K.reached(cp, 'brook'))
  assert.ok(!K.reached(cp, 'fire'))
  assert.ok(!K.reached(null, 'cabin'))
})

test('what was asked by the fire is kept, once each, and means the fire was reached', () => {
  let cp = K.withAsked(K.reach(null, 'woodshed'), 'hugo')
  assert.deepEqual(cp, { at: 'fire', asked: ['hugo'] })
  cp = K.withAsked(cp, 'next')
  cp = K.withAsked(cp, 'hugo')
  assert.deepEqual(cp.asked, ['hugo', 'next'])
  // (and stays through reaching a checkpoint again)
  assert.deepEqual(K.reach(cp, 'fire').asked, ['hugo', 'next'])
})

test('a saved checkpoint reads back; anything else is no checkpoint', () => {
  const cp = { at: 'brook', asked: ['working-on'] }
  assert.deepEqual(K.parseCheckpoint(JSON.stringify(cp)), cp)
  assert.deepEqual(K.parseCheckpoint('{"at":"fire"}'), { at: 'fire', asked: [] })
  assert.deepEqual(K.parseCheckpoint('{"at":"fire","asked":["hugo",3,null]}'), {
    at: 'fire',
    asked: ['hugo'],
  })
  for (const raw of [null, '', 'nope', '{', '[]', '42', 'null', '{"at":"moon"}', '{"asked":[]}'])
    assert.equal(K.parseCheckpoint(raw), null, String(raw))
})

test('coming back puts the guest somewhere they can stand, at the right stop', () => {
  for (const at of K.CHECKPOINTS) {
    const spot = K.RESUME_SPOTS[at].at
    assert.ok(!W.blocked(spot, N.GUEST_PAD), `${at}: (${spot.x}, ${spot.z}) is blocked`)
    assert.ok(!W.insideCabin(spot), `${at}: inside the cabin`)
  }
  // (by day; the fire's is the night start, a few steps short of the fire's stop)
  const stop = (at) => S.hugoStopAt(K.RESUME_SPOTS[at].at, false)
  assert.equal(stop('cabin'), 'arrival')
  assert.equal(stop('woodshed'), 'woodshed')
  assert.equal(stop('brook'), 'brook')
})

test('coming back to a place counts as getting there again (its line plays, it says where they are)', () => {
  const { woodshed, brook, fire } = K.RESUME_SPOTS
  assert.ok(dist(woodshed.at, W.WOODSHED) < W.WOODSHED_DISTANCE)
  assert.ok(dist(brook.at, B.STAIRS_TOP) < B.BROOK_REACHED)
  assert.ok(dist(fire.at, F.FIRE) < F.FIRE_REACHED)
  // (the fire's is the night start, ?night=1)
  assert.deepEqual(fire.at, F.NIGHT_START)
})

test('a link to a project’s page is a note in the cabin; other links are links', () => {
  assert.equal(C.projectSlug('/projects/hugo'), 'hugo')
  assert.equal(C.projectSlug('/projects/volta-sep26/'), 'volta-sep26')
  for (const href of [
    '/projects',
    '/contact',
    '/resume.pdf',
    'https://www.nsbeaches.ca',
    '/projects/hugo/extra',
    'https://example.com/projects/hugo',
  ])
    assert.equal(C.projectSlug(href), null, href)
})

test('every project Eduard or HUGO links to has a note to open', () => {
  const slugs = new Set(projects.map((p) => p.slug))
  const links = [
    ...FQ.FIRE_QUESTIONS.flatMap((q) => (q.link ? [q.link] : [])),
    ...Object.values(HQ.HUGO_QUESTIONS).flatMap((s) =>
      (s?.questions ?? []).flatMap((q) => q.links ?? []),
    ),
  ]
  const toProjects = links.filter((l) => C.projectSlug(l.href) !== null)
  assert.ok(toProjects.some((l) => l.href === '/projects/hugo'))
  for (const l of toProjects) assert.ok(slugs.has(C.projectSlug(l.href)), l.href)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// HUGO's suggested questions at each stop (A48): which stop the guest is at
// (src/components/features/cabin/hugo-stops.ts) and what HUGO may say there
// (hugo-questions.ts).

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const S = cabin('hugo-stops')
const Q = cabin('hugo-questions')
const { projects } = loadTs(new URL('../src/content/projects.ts', import.meta.url))
const { profile, resumePdfPath } = loadTs(new URL('../src/content/profile.ts', import.meta.url))

const at = (p, previous = null, opts) => S.hugoStopAt(p, W.insideCabin(p), previous, opts)

test('the road, the driveway and the yard are the arrival', () => {
  for (const p of [
    W.GUEST_START,
    W.GUEST_SKIP,
    W.RUSTY_RUN_START,
    W.WELCOME_POINT,
    W.DOOR.out,
    W.BENCH_STAND,
    W.SHOWER_SPOT,
  ])
    assert.equal(at(p), 'arrival', `(${p.x}, ${p.z})`)
  // the driveway runs past the woodshed behind the trees: still the arrival
  for (let z = 4; z <= 23; z += 0.5) assert.equal(at({ x: 0.7, z }), 'arrival', `driveway z ${z}`)
})

test('inside the cabin is the cabin', () => {
  assert.equal(at({ x: 0.3, z: 0.4 }), 'cabin')
  assert.equal(at(W.DOOR.inside), 'cabin')
  // the scene says whether the guest is inside; that wins
  assert.equal(S.hugoStopAt(W.WOODSHED, true), 'cabin')
})

test('the shed, the chopping block and the workbench are the woodshed', () => {
  const spots = [W.WOODSHED, W.CHOPPING_BLOCK, W.SPLIT_SPOT, W.BENCH_SPOT, W.LEAD_PATH.at(-1)]
  W.CRATES.forEach((_, i) => spots.push(W.crateSpot(i)))
  for (const p of spots) assert.equal(at(p), 'woodshed', `(${p.x}, ${p.z})`)
})

test('the east end of the field is the brook', () => {
  assert.equal(at({ x: 21.5, z: -0.3 }), 'brook') // top of the stairs
  assert.equal(at({ x: 23.3, z: 12 }), 'brook')
  assert.equal(at({ x: 14, z: -0.6 }), 'arrival') // halfway across the field
})

test('a stop holds until the guest is clearly somewhere else', () => {
  const edge = { x: 16.0, z: 0 }
  assert.equal(at(edge), 'arrival')
  assert.equal(at(edge, 'brook'), 'brook')
  assert.equal(at({ x: 15.2, z: 0 }, 'brook'), 'arrival')
})

test('the fire only counts at night (scene 7 is not built)', () => {
  assert.equal(at(S.FIRE_RING), 'arrival')
  assert.equal(at(S.FIRE_RING, null, { night: true }), 'fire')
  assert.equal(Q.HUGO_QUESTIONS.fire, null)
})

const stops = Object.entries(Q.HUGO_QUESTIONS).filter(([, v]) => v !== null)
const all = stops.flatMap(([stop, v]) => v.questions.map((q) => ({ stop, ...q })))

test('every built stop has two or three questions, each with an answer', () => {
  assert.deepEqual(
    stops.map(([s]) => s),
    ['arrival', 'cabin', 'woodshed', 'brook'],
  )
  for (const [stop, v] of stops) {
    assert.ok(v.name.trim() && v.about.trim(), stop)
    assert.ok(v.questions.length >= 2 && v.questions.length <= 3, `${stop}: ${v.questions.length}`)
  }
  assert.equal(new Set(all.map((q) => q.id)).size, all.length, 'question ids are unique')
  for (const q of all) {
    assert.ok(q.q.trim().endsWith('?'), q.id)
    assert.ok(q.a.trim().length > 20, `${q.id}: empty answer`)
    assert.ok(q.sources.trim(), `${q.id}: no sources`)
    assert.equal(q.draft, true, `${q.id}: answers are drafts until Eduard approves them`)
  }
})

test('answers are short, about Eduard (never as him), and state nothing unconfirmed', () => {
  for (const q of all) {
    const check = Q.checkHugoReply(q.a)
    assert.ok(check.ok, `${q.id}: ${check.reason}`)
    assert.ok(q.a.length <= 240, `${q.id}: ${q.a.length} characters`)
    assert.ok(q.a.split(/(?<=[.!?])\s+/).length <= 3, `${q.id}: more than three sentences`)
    // A49: nothing obvious like "Eduard built this"
    assert.doesNotMatch(
      q.a,
      /\b(?:he|eduard) built (?:this|it|the (?:cabin|woodshed|deck|shower))\b/i,
      q.id,
    )
  }
  for (const line of Object.values(Q.HUGO_ASK_LINES)) assert.ok(Q.checkHugoReply(line).ok, line)
})

test('no answer names what he catches at the brook or ties Shoreline to striper trips', () => {
  for (const q of all) {
    assert.deepEqual(Q.unconfirmedIn(q.a), [], q.id)
    for (const sentence of q.a.split(/(?<=[.!?])\s+/))
      assert.ok(!(/shoreline/i.test(sentence) && /striper/i.test(sentence)), `${q.id}: ${sentence}`)
  }
})

test('the brook covers Shoreline and Is the Beach Open (A51)', () => {
  const brook = Q.HUGO_QUESTIONS.brook.questions.map((q) => q.a).join(' ')
  assert.match(brook, /Shoreline/)
  assert.match(brook, /Is the Beach Open/)
})

test('links go to real project pages or the résumé', () => {
  const slugs = new Set(projects.map((p) => p.slug))
  for (const q of all)
    for (const l of q.links ?? []) {
      assert.ok(l.label.trim(), q.id)
      if (l.href.startsWith('/projects/'))
        assert.ok(slugs.has(l.href.slice(10)), `${q.id}: ${l.href}`)
      else if (l.href.startsWith('/')) assert.equal(l.href, resumePdfPath, q.id)
      else assert.match(l.href, /^https:\/\//, q.id)
    }
})

test('no hidden ventures in anything HUGO says', () => {
  const text = [...all.flatMap((q) => [q.q, q.a]), ...Object.values(Q.HUGO_ASK_LINES)].join('\n')
  for (const term of profile.hidden)
    assert.ok(!text.toLowerCase().includes(term.toLowerCase()), term)
})

test('the checks catch the unconfirmed facts in a model reply', () => {
  const flagged = {
    'team-size': 'He leads a team of five developers at AI-First.',
    'shoreline-stripers': 'Eduard checks Shoreline before striper trips.',
    'brook-catch': 'They catch brook trout right by the stairs.',
    'keeper-data': 'Client conversations never leave his laptop.',
    'keystone-interviews': 'He interviewed each of the ten staff first.',
    'mdi-or-ux': 'He worked with a UX researcher on it.',
    'staff-performance': 'The scorecard shows staff performance.',
    'scorecard-shipped': 'The first scorecard shipped in October.',
  }
  for (const [id, text] of Object.entries(flagged))
    assert.ok(Q.unconfirmedIn(text).includes(id), id)
  // other teams of five, and stripers on the beach, are fine
  assert.deepEqual(
    Q.unconfirmedIn('Sky Painters was built by a team of five at NASA Space Apps.'),
    [],
  )
  assert.deepEqual(Q.unconfirmedIn('For stripers, Eduard and his friends head to the beach.'), [])
  // HUGO is never Eduard (A24)
  assert.ok(Q.speaksAsEduard('I built the deck myself.'))
  assert.ok(Q.speaksAsEduard("I'm Eduard, welcome!"))
  assert.ok(!Q.speaksAsEduard('I’m HUGO, your guide for the day.'))
})

test('a typed suggested question gets its written answer, from any stop', () => {
  assert.equal(Q.matchPrewritten('who is eduard', 'arrival')?.id, 'who-is-eduard')
  assert.equal(Q.matchPrewritten('Where’s the good fishing?', 'cabin')?.id, 'good-fishing')
  assert.equal(Q.matchPrewritten('did any of them win', 'woodshed')?.id, 'any-wins')
  assert.equal(Q.matchPrewritten('What is his favourite colour?', 'cabin'), null)
  assert.equal(Q.matchPrewritten('   ', 'cabin'), null)
})

test('the model only picks one of HUGO’s approved answers (it never writes one)', () => {
  const picks = Q.hugoPicks(projects)
  const ids = picks.map((p) => p.id)
  assert.equal(new Set(ids).size, ids.length, 'pick ids are unique')
  for (const q of all) assert.ok(ids.includes(`q:${q.id}`), q.id)
  for (const p of projects) assert.ok(ids.includes(`p:${p.slug}`), p.slug)
  const prompt = Q.hugoPickPrompt('brook', picks.slice(0, 3))
  assert.match(prompt, /the brook/)
  assert.match(prompt, /Never write an answer yourself/)
  // the model sees a short list (best keyword matches first) and answers with a letter
  const short = Q.shortlist('Which app tells you about the tides?', picks)
  assert.ok(
    short.some((p) => p.id === 'p:shoreline'),
    short.map((p) => p.id).join(),
  )
  assert.ok(short.length <= 4)
  assert.deepEqual(Q.shortlist('What does he do for fun?', picks), [])
  assert.deepEqual(Q.shortlist('How big is his team?', picks), [])
  const enumIds = JSON.parse(Q.hugoPickSchema(short)).properties.pick.enum
  assert.equal(enumIds.length, short.length + 1)
  assert.equal(Q.parsePick('{"pick":"A"}', short), short[0].id)
  assert.equal(Q.parsePick('{"pick":"none"}', short), Q.PICK_NONE)
  assert.equal(Q.parsePick('{"pick":"Z"}', short), null)
  assert.equal(Q.parsePick('{"pick":"Eduard loves movies"}', short), null)
  assert.equal(Q.parsePick('not json', short), null)
  assert.equal(Q.questionById('beach-open')?.q, 'Is the beach open today?')
})

test('every project HUGO can talk about gets a line that passes the checks', () => {
  for (const p of projects) {
    const a = Q.projectAnswer(p)
    const check = Q.checkHugoReply(a.text)
    assert.ok(check.ok, `${p.slug}: ${check.reason}`)
    assert.ok(a.text.startsWith(p.title), `${p.slug}: ${a.text}`)
    assert.equal(a.links[0].href, `/projects/${p.slug}`)
  }
  // Keystone's own description touches who the interviews covered: HUGO has his own line
  assert.doesNotMatch(
    Q.projectAnswer(projects.find((p) => p.slug === 'keystone')).text,
    /interview/i,
  )
})

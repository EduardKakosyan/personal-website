import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// The fairy trail (Eduard: "perhaps lets add like a little fairy trail to show
// where they should be going next in sequence"): which place of the tour it
// leads to at each point of the visit, the way there round things and
// through the cabin door, and when the lights come out.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const T = cabin('trail')
const W = cabin('world')
const N = cabin('nav')

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/** Nothing done yet: on the gravel road. */
const START = {
  inside: false,
  welcomed: false,
  enteredCabin: false,
  resumeRead: false,
  boxesSeen: false,
  blockTried: false,
  brookLead: false,
  brookReached: false,
  brookDone: false,
  fireCalled: false,
  satByFire: false,
}
const next = (facts) => T.nextStop({ ...START, ...facts })?.id ?? null

test('the trail follows the tour: Eduard, the cabin, the woodshed, the brook, the fire', () => {
  const steps = [
    [{}, 'welcome'],
    [{ welcomed: true }, 'door'],
    // inside, the arrow over the résumé shows the way; once it's read, out to the woodshed
    [{ welcomed: true, enteredCabin: true, inside: true }, null],
    [{ welcomed: true, enteredCabin: true, inside: true, resumeRead: true }, 'bench'],
    // walked out without reading it: HUGO leads them on, and so does the trail
    [{ welcomed: true, enteredCabin: true }, 'bench'],
    [{ welcomed: true, enteredCabin: true, boxesSeen: true }, 'block'],
    [{ welcomed: true, enteredCabin: true, boxesSeen: true, blockTried: true }, 'landing'],
    [
      { welcomed: true, enteredCabin: true, boxesSeen: true, blockTried: true, brookReached: true },
      'landing',
    ],
    // done at the brook: nothing until HUGO calls them back
    [
      {
        welcomed: true,
        enteredCabin: true,
        boxesSeen: true,
        blockTried: true,
        brookReached: true,
        brookDone: true,
      },
      null,
    ],
    [
      {
        welcomed: true,
        enteredCabin: true,
        boxesSeen: true,
        blockTried: true,
        brookReached: true,
        brookDone: true,
        fireCalled: true,
      },
      'fire',
    ],
    [
      {
        welcomed: true,
        enteredCabin: true,
        boxesSeen: true,
        blockTried: true,
        brookReached: true,
        brookDone: true,
        fireCalled: true,
        satByFire: true,
      },
      null,
    ],
  ]
  for (const [facts, want] of steps) assert.equal(next(facts), want, JSON.stringify(facts))
})

test('at the woodshed it is the boxes and the block, one after the other, either way round', () => {
  const shed = { welcomed: true, enteredCabin: true }
  assert.equal(next(shed), 'bench')
  assert.equal(next({ ...shed, boxesSeen: true }), 'block')
  // split some wood first: then the boxes
  assert.equal(next({ ...shed, blockTried: true }), 'bench')
  assert.equal(next({ ...shed, boxesSeen: true, blockTried: true }), 'landing')
})

test('HUGO leading on wins over anything left behind', () => {
  const shed = { welcomed: true, enteredCabin: true }
  // he leads them to the brook (they walked off into the field): the trail goes too
  assert.equal(next({ ...shed, brookLead: true }), 'landing')
  assert.equal(next({ ...shed, boxesSeen: true, brookReached: true }), 'landing')
  // his call back to the fire wins over the brook, and over the cabin at night (?night=1)
  assert.equal(next({ ...shed, brookReached: true, fireCalled: true }), 'fire')
  assert.equal(next({ welcomed: true, fireCalled: true }), 'fire')
  assert.equal(next({ welcomed: true, fireCalled: true, inside: true }), 'fire')
})

test('every place on the trail is somewhere the guest can stand', () => {
  for (const stop of Object.values(T.TRAIL_STOPS)) {
    // (the block's spot is tight between it and the picnic table: the last
    // small step onto it brushes closer, as the guest's own walk does)
    assert.equal(
      W.blocked(stop.at, N.EXACT_PAD),
      false,
      `${stop.id} at (${stop.at.x}, ${stop.at.z})`,
    )
    assert.ok(stop.reach >= 1 && stop.reach <= 2, `${stop.id} reach ${stop.reach}`)
  }
})

test('the way goes round things, and in and out of the cabin through the door', () => {
  N.warmNav()
  const legsClear = (way) => {
    for (let i = 1; i < way.length; i++) {
      // (the door's own waypoints are walked by the scene's door routine)
      const door = [W.DOOR.outside, W.DOOR.mouth, W.DOOR.inside].some(
        (d) => dist(d, way[i]) < 0.01 || dist(d, way[i - 1]) < 0.01,
      )
      if (!door)
        assert.ok(
          N.clearLine(way[i - 1], way[i], N.EXACT_PAD),
          `leg ${i} (${way[i].x.toFixed(2)}, ${way[i].z.toFixed(2)}) runs into something`,
        )
    }
  }
  const cases = [
    // the driveway to the door step, round the cabin's corner
    [{ x: 0.2, z: 9.4 }, T.TRAIL_STOPS.door.at],
    // out of the cabin to the workbench
    [{ x: -0.4, z: -0.6 }, T.TRAIL_STOPS.bench.at],
    // from the workbench round the woodshed to the block
    [{ x: 8.69, z: 11.36 }, T.TRAIL_STOPS.block.at],
    // across the field and down the stairs to the landing
    [{ x: 6.2, z: 5.2 }, T.TRAIL_STOPS.landing.at],
    // back to the chair by the fire
    [{ x: 21.5, z: 1.2 }, T.TRAIL_STOPS.fire.at],
  ]
  for (const [from, to] of cases) {
    const way = T.trailWay(from, to)
    assert.deepEqual(way[0], from)
    assert.ok(dist(way.at(-1), to) < 0.01, `ends ${dist(way.at(-1), to).toFixed(2)} m off`)
    legsClear(way)
  }
  // out of the cabin: through the doorway, not the wall
  const out = T.trailWay({ x: -0.4, z: -0.6 }, T.TRAIL_STOPS.bench.at)
  assert.ok(out.some((p) => dist(p, W.DOOR.mouth) < 0.01))
  // the block from the bench goes round the woodshed, not through it
  const round = T.measure(T.trailWay({ x: 8.69, z: 11.36 }, T.TRAIL_STOPS.block.at))
  assert.ok(round.length > dist({ x: 8.69, z: 11.36 }, T.TRAIL_STOPS.block.at) + 0.5)
})

test('a way can be followed along: points, which way it runs, and where the guest is on it', () => {
  const way = T.measure([
    { x: 0, z: 0 },
    { x: 4, z: 0 },
    { x: 4, z: 3 },
  ])
  assert.equal(way.length, 7)
  const p = T.pointAt(way, 5)
  assert.ok(dist(p, { x: 4, z: 1 }) < 1e-9)
  assert.deepEqual([p.dx, p.dz], [0, 1])
  assert.deepEqual(T.pointAt(way, 99), { x: 4, z: 3, dx: 0, dz: 1 })
  const near = T.nearestOnWay(way, { x: 2, z: 0.5 })
  assert.ok(Math.abs(near.s - 2) < 1e-9 && Math.abs(near.off - 0.5) < 1e-9)
})

test('the lights come out once the guest is lost for a few seconds, and stay till they get there', () => {
  const stop = T.TRAIL_STOPS.block
  const st = T.createShow()
  const run = (guest, seconds, o = {}) => {
    let on = false
    for (let t = 0; t < seconds; t += 0.1)
      on = T.stepShow(st, {
        stop,
        guest: typeof guest === 'function' ? guest(t) : guest,
        dt: 0.1,
        busy: false,
        ...o,
      })
    return on
  }
  const far = { x: stop.at.x + 8, z: stop.at.z }
  // standing about: not straight away, then on after the wait
  assert.equal(run(far, stop.wait - 0.5), false)
  assert.equal(run(far, 1), true)
  // once out it stays, even walking towards it
  assert.equal(
    run((t) => ({ x: far.x - t * 3, z: far.z }), 1.5),
    true,
  )
  // getting there puts it out
  assert.equal(run(stop.at, 0.2), false)

  // heading the right way keeps it in
  const st2 = T.createShow()
  let on = false
  for (let t = 0; t < 2.5; t += 0.1)
    on = T.stepShow(st2, {
      stop,
      guest: { x: far.x - t * 3, z: far.z },
      dt: 0.1,
      busy: false,
    })
  assert.equal(on, false)

  // busy (splitting, a box open, reading...): never, and the wait starts again after
  const st3 = T.createShow()
  for (let t = 0; t < 10; t += 0.1) on = T.stepShow(st3, { stop, guest: far, dt: 0.1, busy: true })
  assert.equal(on, false)
  assert.equal(T.stepShow(st3, { stop, guest: far, dt: 0.1, busy: false }), false)

  // a new place starts the wait again
  const st4 = T.createShow()
  for (let t = 0; t < 6; t += 0.1) T.stepShow(st4, { stop, guest: far, dt: 0.1, busy: false })
  assert.equal(st4.on, true)
  assert.equal(
    T.stepShow(st4, { stop: T.TRAIL_STOPS.landing, guest: far, dt: 0.1, busy: false }),
    false,
  )
})

test('by default (always) the lights come out after a moment, walking or not', () => {
  const stop = T.TRAIL_STOPS.bench
  const st = T.createShow()
  const far = { x: stop.at.x - 10, z: stop.at.z }
  let on = false
  for (let t = 0; t < 1.5; t += 0.1)
    on = T.stepShow(st, {
      stop,
      guest: { x: far.x + t * 3, z: far.z },
      dt: 0.1,
      busy: false,
      always: true,
    })
  assert.equal(on, true)
})

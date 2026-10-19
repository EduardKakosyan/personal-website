import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

const { stageRig, storyPosition, keyframes } = loadTs(
  new URL('../src/lib/stage-rig.ts', import.meta.url),
)
const { stageCapable } = loadTs(new URL('../src/lib/use-idle-capability.ts', import.meta.url))
const { chapters, personaOrder } = loadTs(new URL('../src/content/story.ts', import.meta.url))

const ids = chapters.map((chapter) => chapter.id)
const samples = Array.from({ length: 81 }, (_, i) => i / 80)
const numbers = (rig) => [
  ...rig.camera.position,
  ...rig.camera.target,
  rig.character.pose.turn,
  rig.character.pose.reach,
  rig.spark.glow,
]
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

test('every chapter has a keyframe', () => {
  assert.deepEqual(Object.keys(keyframes).sort(), [...ids].sort())
})

test('camera stays in bounds for every chapter, transition and progress', () => {
  for (const chapter of ids)
    for (const next of [undefined, ...ids])
      for (const progress of [-1, Number.NaN, ...samples, 2]) {
        const { camera, spark } = stageRig(chapter, progress, 'idle', next)
        const [x, y, z] = camera.position
        assert.ok(
          Math.abs(x) <= 3 && y >= 0.3 && y <= 2.5 && z >= 5,
          `${chapter}->${next} ${x},${y},${z}`,
        )
        const range = distance(camera.position, camera.target)
        assert.ok(range >= 5 && range <= 9, `${chapter}->${next} range ${range}`)
        assert.ok(spark.glow >= 0 && spark.glow <= 1)
        for (const value of numbers(stageRig(chapter, progress, 'idle', next)))
          assert.ok(Number.isFinite(value))
      }
})

test('poses are continuous across chapter edges in every persona order', () => {
  for (const order of Object.values(personaOrder))
    for (let i = 0; i < order.length - 1; i++) {
      const end = numbers(stageRig(order[i], 1, 'idle', order[i + 1]))
      const start = numbers(stageRig(order[i + 1], 0, 'idle', order[i + 2]))
      end.forEach((value, k) => assert.ok(Math.abs(value - start[k]) < 1e-9, `${order[i]} edge`))
    }
})

test('poses change smoothly within a chapter (no jumps between nearby scroll positions)', () => {
  for (const chapter of ids)
    for (const next of ids) {
      let previous = numbers(stageRig(chapter, 0, 'idle', next))
      for (const progress of samples.slice(1)) {
        const current = numbers(stageRig(chapter, progress, 'idle', next))
        current.forEach((value, k) => assert.ok(Math.abs(value - previous[k]) < 0.35))
        previous = current
      }
    }
})

test('mood mapping: chapter moods by default, a live guide mood overrides', () => {
  assert.equal(stageRig('systems', 0.2).character.mood, 'thinking')
  assert.equal(stageRig('private-local', 0.2).character.mood, 'ready')
  assert.equal(stageRig('private-local', 0.2).character.pose.pointing, true)
  assert.equal(stageRig('adoption', 0.2).character.mood, 'presenting')
  assert.equal(stageRig('next-step', 0.2).character.mood, 'listening')
  assert.equal(stageRig('systems', 0.95, 'idle', 'adoption').character.mood, 'presenting')
  assert.equal(stageRig('systems', 0.2, 'navigating').character.mood, 'navigating')
})

test('storyPosition maps the reading line to chapter and progress', () => {
  const rects = [{ top: 100, bottom: 600 }, null, { top: 700, bottom: 1200 }]
  assert.deepEqual(storyPosition(rects, 50), { index: 0, progress: 0 })
  assert.deepEqual(storyPosition(rects, 350), { index: 0, progress: 0.5 })
  assert.deepEqual(storyPosition(rects, 650), { index: 0, progress: 1 })
  assert.deepEqual(storyPosition(rects, 950), { index: 2, progress: 0.5 })
  assert.deepEqual(storyPosition(rects, 5000), { index: 2, progress: 1 })
  assert.deepEqual(storyPosition([], 10), { index: 0, progress: 0 })
})

test('3D stage loads only on capable desktop layouts', () => {
  const ok = {
    stickyLayout: true,
    reducedMotion: false,
    saveData: false,
    deviceMemory: 8,
    webgl2: true,
  }
  assert.equal(stageCapable(ok), true)
  assert.equal(stageCapable({ ...ok, deviceMemory: undefined }), true)
  for (const change of [
    { stickyLayout: false },
    { reducedMotion: true },
    { saveData: true },
    { deviceMemory: 2 },
    { webgl2: false },
  ])
    assert.equal(stageCapable({ ...ok, ...change }), false, JSON.stringify(change))
})

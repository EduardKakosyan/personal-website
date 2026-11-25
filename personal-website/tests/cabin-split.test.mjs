import test from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './helpers/load-ts.mjs'

// Splitting wood at the chopping block (split.ts): where the pieces land.

const cabin = (name) =>
  loadTs(new URL(`../src/components/features/cabin/${name}.ts`, import.meta.url))
const W = cabin('world')
const S = cabin('split')

const dt = 1 / 60
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/** Play the game: `clean` clean splits (and a miss first, if asked), then let everything settle. */
function play({ missFirst = false } = {}) {
  const s = S.createSplit()
  const yaw = S.splitStance().yaw
  S.startSplit(s)
  S.arriveAtBlock(s)
  let missed = !missFirst
  for (let t = 0; t < 60 && !s.done; t += dt) {
    S.updateSplit(s, dt, yaw)
    if (s.phase !== 'ready' || !s.log) continue
    if (!missed && s.marker < 0.08) {
      missed = true
      S.swing(s)
    } else if (missed) {
      // (the marker stops where it is when the swing starts)
      if (Math.abs(s.marker - 0.5) < 0.03) S.swing(s)
    }
  }
  assert.equal(s.done, true, 'five clean splits')
  for (let t = 0; t < 6; t += dt) S.updateSplit(s, dt, yaw)
  return s
}

test('the split wood lands spread out round the block, not in a heap', () => {
  const guest = S.splitStance().at
  // (the spots are picked at random: several games, and every one has to hold)
  for (let game = 0; game < 12; game++) {
    const s = play()
    assert.equal(s.chunks.length, 10, 'ten halves')
    const at = s.chunks.map((c) => ({ x: c.pos.x, z: c.pos.z }))
    for (const c of s.chunks) assert.ok(c.settled, 'every piece has come to rest')
    for (let i = 0; i < at.length; i++) {
      const fromBlock = dist(at[i], W.CHOPPING_BLOCK)
      assert.ok(
        fromBlock > 0.5 && fromBlock < 2.4,
        `a piece ${fromBlock.toFixed(2)} m from the block`,
      )
      assert.ok(dist(at[i], guest) > 0.45, 'not under the guest’s feet')
      assert.ok(!W.blockedStatic(at[i], 0.05), 'not inside anything')
      for (let j = i + 1; j < at.length; j++)
        assert.ok(
          dist(at[i], at[j]) > 0.27,
          `game ${game}: two pieces ${dist(at[i], at[j]).toFixed(2)} m apart`,
        )
    }
    // all round the block: both sides of the swing, near the guest's side and beyond the block
    const north = at.filter((p) => p.z < W.CHOPPING_BLOCK.z).length
    assert.equal(north, 5, 'each half goes to its own side')
    const east = at.filter((p) => p.x > W.CHOPPING_BLOCK.x + 0.3).length
    const west = at.filter((p) => p.x < W.CHOPPING_BLOCK.x - 0.3).length
    assert.ok(
      east >= 2 && west >= 1,
      `game ${game}: ${east} beyond the block, ${west} on the guest's side`,
    )
    // spread out: on average they're well apart from their nearest neighbour
    const nearest = at.map((p, i) =>
      Math.min(...at.filter((_, j) => j !== i).map((q) => dist(p, q))),
    )
    const mean = nearest.reduce((a, b) => a + b, 0) / nearest.length
    assert.ok(mean > 0.5, `game ${game}: nearest neighbours ${mean.toFixed(2)} m apart on average`)
  }
})

test('a log knocked off by a bad swing lands clear of the others too', () => {
  for (let game = 0; game < 6; game++) {
    const s = play({ missFirst: true })
    // (ten is the most that lie about: the oldest goes when there are more)
    assert.equal(s.chunks.length, 10)
    const at = s.chunks.map((c) => ({ x: c.pos.x, z: c.pos.z }))
    for (let i = 0; i < at.length; i++)
      for (let j = i + 1; j < at.length; j++)
        assert.ok(dist(at[i], at[j]) > 0.25, `two pieces ${dist(at[i], at[j]).toFixed(2)} m apart`)
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const fixtureModule = { exports: {} }
new Function(
  'module',
  'exports',
  ts.transpileModule(readFileSync(new URL('../src/lib/agent-layout.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
)(fixtureModule, fixtureModule.exports)
const { agentLayout } = fixtureModule.exports
const rect = (left, top, width, height) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

test('a phone keeps both the speech bubble and the 3D body visible', () => {
  for (const [width, height, bubbleHeight] of [
    [320, 568, 260],
    [402, 874, 350],
    [390, 390, 145],
    [768, 600, 330],
    [1280, 874, 330],
  ]) {
    for (const target of [
      null,
      rect(20, 110, width - 40, 90),
      rect(20, height - 250, width - 40, 150),
    ]) {
      const p = agentLayout({ width, height, bubbleHeight, open: true, target, landing: null })
      const bubble = {
        left: p.x + p.bubbleX,
        top: p.y + p.bubbleY,
        right: p.x + p.bubbleX + Math.min(350, width - 32),
        bottom: p.y + p.bubbleY + bubbleHeight,
      }
      assert.ok(p.x >= 0 && p.x + 128 <= width, `body horizontal bounds at ${width}x${height}`)
      assert.ok(p.y >= 0 && p.y + 128 <= height, `body vertical bounds at ${width}x${height}`)
      assert.ok(bubble.left >= 0 && bubble.right <= width)
      assert.ok(bubble.top >= 70 && bubble.bottom <= height)
      assert.ok(
        bubble.right <= p.x ||
          bubble.left >= p.x + 128 ||
          bubble.bottom <= p.y ||
          bubble.top >= p.y + 128,
        `bubble covers body at ${width}x${height}`,
      )
    }
  }
})
test('the agent leaves its landing spot to point at visible evidence', () => {
  const landing = rect(680, 180, 440, 340)
  const dock = agentLayout({
    width: 1280,
    height: 874,
    open: false,
    target: null,
    landing,
    bubbleHeight: 330,
  })
  assert.equal(dock.docked, true)
  const focused = agentLayout({
    width: 1280,
    height: 874,
    open: false,
    target: rect(48, 120, 600, 140),
    landing,
    bubbleHeight: 330,
  })
  assert.equal(focused.docked, false)
  assert.equal(focused.pointing, true)
  assert.equal(focused.direction, -1)
  assert.notEqual(focused.x, dock.x)
})
test('offscreen or detached targets do not draw the agent outside the viewport', () => {
  const p = agentLayout({
    width: 1280,
    height: 874,
    open: false,
    target: rect(48, -900, 600, 140),
    landing: null,
    bubbleHeight: 330,
  })
  assert.equal(p.pointing, false)
  assert.equal(p.x, 1138)
  assert.equal(p.y, 720)
})

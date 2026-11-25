'use client'

import { useRef } from 'react'
import styles from './cabin.module.css'
import { useKeepOnScreen } from './use-keep-on-screen'

/**
 * Rusty's name tag (A68), hanging from his collar: a red bone with his name and
 * the round silver tag behind it (photo 05), drawn as pixel art and shown big
 * enough to read. It swings a little, like a tag does.
 */

const W = 36
const H = 22
/** Screen pixels per art pixel. */
const CELL = 3
const OUTLINE = '#3b2a1e'

type Shape = {
  inside: (x: number, y: number) => boolean
  fill: string
  light: string
  dark: string
  outline: boolean
}

const circle = (cx: number, cy: number, r: number) => (x: number, y: number) =>
  Math.hypot(x - cx, y - cy) <= r

const SHAPES: Shape[] = [
  {
    // the round silver tag, behind the bone and a little to the left
    inside: circle(11, 7.5, 4.3),
    fill: '#b8c0c8',
    light: '#eef2f5',
    dark: '#7d8791',
    outline: true,
  },
  {
    // the ring both tags hang from (at the top, where it meets the collar)
    inside: (x, y) => {
      const d = Math.hypot(x - 18, y - 3)
      return d >= 1.2 && d <= 2.6
    },
    fill: '#b8c0c8',
    light: '#eef2f5',
    dark: '#7d8791',
    outline: true,
  },
  {
    // the red bone with his name
    inside: (x, y) =>
      (x >= 5.5 && x <= 30.5 && y >= 9 && y <= 17) ||
      [
        [5.5, 9.4],
        [5.5, 16.6],
        [30.5, 9.4],
        [30.5, 16.6],
      ].some(([cx, cy]) => Math.hypot(x - cx, y - cy) <= 3.4),
    fill: '#c0392f',
    light: '#e2614f',
    dark: '#8a2620',
    outline: true,
  },
]

/** Paint the shapes in order onto a grid, then merge each row into runs of one colour. */
function paint() {
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array(W).fill(null))
  for (const shape of SHAPES) {
    const at = (x: number, y: number) =>
      x >= 0 && x < W && y >= 0 && y < H && shape.inside(x + 0.5, y + 0.5)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (at(x, y)) {
          // lit from above: a light top edge, a dark bottom edge
          grid[y][x] = !at(x, y - 1) ? shape.light : !at(x, y + 1) ? shape.dark : shape.fill
        } else if (
          shape.outline &&
          (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))
        ) {
          grid[y][x] = OUTLINE
        }
      }
    }
  }
  const runs: { x: number; y: number; w: number; color: string }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < W) {
      const color = row[x]
      let end = x + 1
      while (end < W && row[end] === color) end++
      if (color) runs.push({ x, y, w: end - x, color })
      x = end
    }
  })
  return runs
}

const RUNS = paint()

export function NameTag() {
  const ref = useRef<HTMLDivElement>(null)
  useKeepOnScreen(ref)
  return (
    <div ref={ref} className={`${styles.tagHang} ${styles.pixel}`} role="status" aria-live="polite">
      <div className={styles.tagSwing}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W * CELL}
          height={H * CELL}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {RUNS.map((r) => (
            <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
          ))}
        </svg>
        {/* stamped on the bone */}
        <span className={styles.tagName} aria-hidden="true">
          RUSTY
        </span>
      </div>
      <span className="sr-only">Rusty&apos;s name tag says Rusty.</span>
    </div>
  )
}

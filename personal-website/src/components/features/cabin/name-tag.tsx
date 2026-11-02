'use client'

import { useRef } from 'react'
import styles from './cabin.module.css'
import { useKeepOnScreen } from './use-keep-on-screen'

/**
 * A close-up of Rusty's collar (A68), drawn as pixel art: the orange collar,
 * a red bone-shaped tag with his name, and the round silver tag beside it
 * (photo 05).
 */

const W = 54
const H = 30
/** Screen pixels per art pixel. */
const CELL = 4
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
    // the collar, running across the top
    inside: (_x, y) => y >= 1 && y < 6,
    fill: '#e0702a',
    light: '#f29a55',
    dark: '#a84a17',
    outline: true,
  },
  {
    // the ring the tags hang from
    inside: (x, y) => {
      const d = Math.hypot(x - 30, y - 7.5)
      return d >= 1.4 && d <= 2.9
    },
    fill: '#b8c0c8',
    light: '#eef2f5',
    dark: '#7d8791',
    outline: false,
  },
  {
    // the round silver tag, behind the bone
    inside: circle(47.5, 13.5, 5.2),
    fill: '#b8c0c8',
    light: '#eef2f5',
    dark: '#7d8791',
    outline: true,
  },
  {
    // the red bone with his name
    inside: (x, y) =>
      (x >= 10 && x <= 38 && y >= 14.5 && y <= 23.5) ||
      [
        [9.5, 14.5],
        [9.5, 23.5],
        [38.5, 14.5],
        [38.5, 23.5],
      ].some(([cx, cy]) => Math.hypot(x - cx, y - cy) <= 4.1),
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
    <div ref={ref} className={`${styles.tagCard} ${styles.pixel}`} role="status" aria-live="polite">
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
      {/* engraved on the bone */}
      <span className={styles.tagName} aria-hidden="true">
        RUSTY
      </span>
      <span className="sr-only">Rusty&apos;s name tag says Rusty.</span>
    </div>
  )
}

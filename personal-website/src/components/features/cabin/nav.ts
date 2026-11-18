// Finding the guest's way round things (Eduard: "every interaction is
// completely fucked, most likely path finding"). The guest used to walk
// straight at whatever they'd tapped and turn aside a little when something
// was in the way, so anything not in a straight line made them shake against
// it. Now a tap plans a real path: A* over a grid of the walkable ground,
// straightened into a few waypoints.
// No three.js here: the tests load it directly.

import { BOUNDS, blocked, blockedByEduard, blockedStatic, type Vec2 } from './world'

/** A point on the way. `pad` overrides how close the guest may brush past things on the leg to it. */
export type Waypoint = Vec2 & { pad?: number }

/** The guest's radius (what everything is padded by). */
export const GUEST_PAD = 0.28
/** For the last little step onto a spot that's tight against something (the chopping block, a crate). */
export const EXACT_PAD = 0.12

const CELL = 0.1
const NX = Math.ceil((BOUNDS.x1 - BOUNDS.x0) / CELL)
const NZ = Math.ceil((BOUNDS.z1 - BOUNDS.z0) / CELL)

/** Which cells are free of walls and things that don't move (built once, on the first walk). */
let staticFree: Uint8Array | null = null
function freeGrid() {
  if (staticFree) return staticFree
  staticFree = new Uint8Array(NX * NZ)
  for (let j = 0; j < NZ; j++)
    for (let i = 0; i < NX; i++)
      staticFree[j * NX + i] = blockedStatic(centre(i, j), GUEST_PAD) ? 0 : 1
  return staticFree
}

function centre(i: number, j: number): Vec2 {
  return { x: BOUNDS.x0 + (i + 0.5) * CELL, z: BOUNDS.z0 + (j + 0.5) * CELL }
}

function cellOf(p: Vec2) {
  return {
    i: Math.min(NX - 1, Math.max(0, Math.floor((p.x - BOUNDS.x0) / CELL))),
    j: Math.min(NZ - 1, Math.max(0, Math.floor((p.z - BOUNDS.z0) / CELL))),
  }
}

/** Free now: no wall or thing, and not where Eduard is standing. */
function free(i: number, j: number) {
  return (
    i >= 0 &&
    j >= 0 &&
    i < NX &&
    j < NZ &&
    freeGrid()[j * NX + i] === 1 &&
    !blockedByEduard(centre(i, j), GUEST_PAD)
  )
}

/** The free cell nearest to a point (searching out to `reach` metres). */
function nearestFreeCell(p: Vec2, reach = 3) {
  const c = cellOf(p)
  if (free(c.i, c.j)) return c
  const rings = Math.ceil(reach / CELL)
  let best: { i: number; j: number } | null = null
  let bestD = Infinity
  for (let r = 1; r <= rings; r++) {
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue
        const i = c.i + di
        const j = c.j + dj
        if (!free(i, j)) continue
        const q = centre(i, j)
        const d = Math.hypot(q.x - p.x, q.z - p.z)
        if (d < bestD) {
          bestD = d
          best = { i, j }
        }
      }
    // anything found in this ring beats every cell of the next one, near enough
    if (best) return best
  }
  return null
}

/** Whether the guest can walk straight from a to b without touching anything. */
export function clearLine(a: Vec2, b: Vec2, pad = GUEST_PAD) {
  const d = Math.hypot(b.x - a.x, b.z - a.z)
  const n = Math.max(1, Math.ceil(d / 0.04))
  for (let k = 1; k <= n; k++) {
    const t = k / n
    if (blocked({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, pad)) return false
  }
  return true
}

const SQRT2 = Math.SQRT2
const DIRS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
] as const

/** A* from one cell to another; the cells on the way, or null if there's no way. */
function search(from: { i: number; j: number }, to: { i: number; j: number }) {
  const start = from.j * NX + from.i
  const goal = to.j * NX + to.i
  if (start === goal) return [start]
  const g = new Float32Array(NX * NZ).fill(Infinity)
  const came = new Int32Array(NX * NZ).fill(-1)
  const closed = new Uint8Array(NX * NZ)
  const h = (n: number) => {
    const dx = Math.abs((n % NX) - to.i)
    const dz = Math.abs(Math.floor(n / NX) - to.j)
    return Math.max(dx, dz) + (SQRT2 - 1) * Math.min(dx, dz)
  }
  // a binary heap of [f, node]
  const heapF: number[] = []
  const heapN: number[] = []
  const push = (f: number, n: number) => {
    let k = heapF.length
    heapF.push(f)
    heapN.push(n)
    while (k > 0) {
      const p = (k - 1) >> 1
      if (heapF[p] <= heapF[k]) break
      ;[heapF[p], heapF[k]] = [heapF[k], heapF[p]]
      ;[heapN[p], heapN[k]] = [heapN[k], heapN[p]]
      k = p
    }
  }
  const pop = () => {
    const n = heapN[0]
    const lastF = heapF.pop() as number
    const lastN = heapN.pop() as number
    if (heapF.length > 0) {
      heapF[0] = lastF
      heapN[0] = lastN
      let k = 0
      for (;;) {
        const l = 2 * k + 1
        const r = l + 1
        let m = k
        if (l < heapF.length && heapF[l] < heapF[m]) m = l
        if (r < heapF.length && heapF[r] < heapF[m]) m = r
        if (m === k) break
        ;[heapF[m], heapF[k]] = [heapF[k], heapF[m]]
        ;[heapN[m], heapN[k]] = [heapN[k], heapN[m]]
        k = m
      }
    }
    return n
  }
  g[start] = 0
  push(h(start), start)
  let expanded = 0
  while (heapF.length > 0) {
    const n = pop()
    if (closed[n]) continue
    if (n === goal) break
    closed[n] = 1
    if (++expanded > 120000) return null
    const i = n % NX
    const j = Math.floor(n / NX)
    for (const [di, dj, cost] of DIRS) {
      const ni = i + di
      const nj = j + dj
      if (!free(ni, nj)) continue
      // no cutting corners past a blocked cell
      if (di !== 0 && dj !== 0 && (!free(i + di, j) || !free(i, j + dj))) continue
      const m = nj * NX + ni
      if (closed[m]) continue
      const ng = g[n] + cost
      if (ng < g[m]) {
        g[m] = ng
        came[m] = n
        push(ng + h(m), m)
      }
    }
  }
  if (came[goal] === -1) return null
  const cells: number[] = []
  for (let n = goal; n !== -1; n = came[n]) cells.push(n)
  return cells.reverse()
}

/**
 * A walkable way from one point to another, as a few waypoints (not
 * including the start). It ends exactly at \`to\` when the guest fits there;
 * when \`to\` is tight against something it ends at the nearest spot they fit,
 * then (with \`exact\`) takes a last small step onto \`to\` brushing closer.
 * Null when there's no way at all.
 */
export function findPath(from: Vec2, to: Vec2, exact = false): Waypoint[] | null {
  // already a clear straight line (most taps in the open): just go
  if (clearLine(from, to)) return [{ x: to.x, z: to.z }]
  const a = nearestFreeCell(from, 1.5)
  const b = nearestFreeCell(to)
  if (!a || !b) return null
  const cells = search(a, b)
  if (!cells) return null
  const pts: Vec2[] = cells.map((n) => centre(n % NX, Math.floor(n / NX)))
  // the end: the tapped point itself if they fit there
  const fits = !blocked(to, GUEST_PAD)
  pts[pts.length - 1] = fits ? { x: to.x, z: to.z } : pts[pts.length - 1]
  // Straighten: walk along the cells and only keep a corner where the
  // straight line from the last corner stops being clear.
  const way: Waypoint[] = []
  let anchor: Vec2 = from
  let anchorAt = 0
  for (let m = 1; m < pts.length; m++) {
    if (clearLine(anchor, pts[m])) continue
    // the cell before this one is the farthest we can see: a corner
    // (or, squeezed somewhere tight, just the next cell)
    const corner = m - 1 > anchorAt ? m - 1 : m
    way.push(pts[corner])
    anchor = pts[corner]
    anchorAt = corner
    if (corner === m - 1) m-- // look at this cell again from the new corner
  }
  const end = pts[pts.length - 1]
  if (way[way.length - 1] !== end) way.push(end)
  if (!fits && exact && !blocked(to, EXACT_PAD)) way.push({ x: to.x, z: to.z, pad: EXACT_PAD })
  return way
}

/** Build the walking grid ahead of the first tap. */
export function warmNav() {
  freeGrid()
}

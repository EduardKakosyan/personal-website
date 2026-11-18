'use client'

// Pixel icons for the project boxes on the workbench, one per archive
// project, matching the thing inside each box in the 3D scene. Drawn as
// 14x14 grids; each letter is a colour from the palette below.

const COLORS: Record<string, string> = {
  '.': 'transparent',
  k: '#3b2a1e', // outline
  w: '#fbf6ea', // paper / white
  r: '#c0392f', // red
  R: '#e2614f', // red, lit
  y: '#f2c43b', // yolk
  l: '#dcb57e', // lumber
  L: '#b98a57', // lumber, dark
  s: '#c9ccd2', // steel
  d: '#3a3f47', // dark metal
  b: '#2a4fa3', // blue
  g: '#a9cfe0', // glass
  p: '#c56aa8', // pink
  P: '#cf8a78', // pink, dark folds
  n: '#5f9c42', // green
  o: '#e0702a', // orange
  c: '#7cc0e8', // light blue
  t: '#2a2624', // tyre
}

const ICONS: Record<string, string[]> = {
  // a rubber stamp: handle, knob, base, red rubber
  'dev-template': [
    '......kk......',
    '.....kllk.....',
    '.....kllk.....',
    '......kk......',
    '.....kLLk.....',
    '.....kLLk.....',
    '.....kLLk.....',
    '....kkLLkk....',
    '..kkddddddkk..',
    '.kddddddddddk.',
    '.kssssssssssk.',
    '.krrrrrrrrrrk.',
    '.kRRRRRRRRRRk.',
    '..kkkkkkkkkk..',
  ],
  // a folded newspaper with a heart on it
  healthbyte: [
    '..kkkkkkkkkk..',
    '.kwwwwwwwwwwk.',
    '.kwkkkkkkkwwk.',
    '.kwwwwwwwwwwk.',
    '.kwkkkwwkkkwk.',
    '.kwwwwwwwwwwk.',
    '.kwkkkwrrwrrk.',
    '.kwwwwrRrrRrk.',
    '.kwkkkrrrrrrk.',
    '.kwwwwwrrrrwk.',
    '.kwkkkwwrrwwk.',
    '.kwwwwwwwwwwk.',
    '.kkkkkkkkkkkk.',
    '..............',
  ],
  // a little network: coloured nodes joined by rods
  'network-sim': [
    '..............',
    '..kk......kk..',
    '.kcck....kyyk.',
    '.kcckss..kyyk.',
    '..kk..s...kk..',
    '...s...s..s...',
    '...s....skk...',
    '..kk....kook..',
    '.kppk.sskook..',
    '.kppks...kk...',
    '..kk.....s....',
    '...s....kk....',
    '....ss.knnk...',
    '.......knnk...',
  ],
  // a toy car, side on
  cargrep: [
    '..............',
    '..............',
    '.....kkkkk....',
    '....kggggrk...',
    '...kgggggrrk..',
    '..kkkkkkkkkkk.',
    '.krrrrrrrrrrrk',
    '.krrrrrrrrrrrk',
    '.kyrrrrrrrrryk',
    '.kkkkkkkkkkkkk',
    '..kttk...kttk.',
    '.ktsstk.ktsstk',
    '..kttk...kttk.',
    '...kk.....kk..',
  ],
  // a brain: two pink halves with folds
  'second-brain': [
    '..............',
    '....kkk.kkk...',
    '..kkpppkpppkk.',
    '.kpPppppppPppk',
    '.kppPpppppppPk',
    'kpppppPkppPppk',
    'kpPpppppkppppk',
    'kppppPppkpPppk',
    '.kppppppkppppk',
    '.kpPpppPkpppk.',
    '..kkppppkppk..',
    '....kkppkk....',
    '.....kkkk.....',
    '..............',
  ],
  // a small telescope on a tripod
  exosky: [
    '.............k',
    '...........kkb',
    '..........kbbk',
    '.........kbbk.',
    '........kbbk..',
    '.......kbbk...',
    '......kbbk....',
    '.....ksbk.....',
    '....kssk......',
    '.....kk.......',
    '....kdk.......',
    '...kd.dk......',
    '..kd...dk.....',
    '.kd.....dk....',
  ],
}

/** Each icon as rows of same-colour runs, so the SVG stays small. */
function runs(rows: string[]) {
  const out: { x: number; y: number; w: number; fill: string }[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      if (ch !== '.') out.push({ x, y, w: end - x, fill: COLORS[ch] ?? '#f0f' })
      x = end
    }
  })
  return out
}

const RUNS = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [k, runs(v)]))

export function hasBoxIcon(slug: string) {
  return slug in ICONS
}

/** The pixel icon for a project box, `size` screen pixels square. */
export function BoxIcon({ slug, size = 56 }: { slug: string; size?: number }) {
  const r = RUNS[slug]
  if (!r) return null
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {r.map((s) => (
        <rect key={`${s.x}-${s.y}`} x={s.x} y={s.y} width={s.w} height={1} fill={s.fill} />
      ))}
    </svg>
  )
}

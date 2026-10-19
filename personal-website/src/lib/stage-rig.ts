import type { ChapterId } from '@/content/story'
import type { GuideMood } from '@/components/providers/guide-provider'

// Pure scroll → pose maths for the 3D story stage. No three.js, no DOM.
export type Vec3 = [number, number, number]
export interface Pose {
  turn: number // body yaw in radians
  reach: number // 0 = arms resting, 1 = pointing
  pointing: boolean
  direction: -1 | 1
}
export interface StageRig {
  camera: { position: Vec3; target: Vec3 }
  character: { pose: Pose; mood: GuideMood }
  spark: { glow: number }
}

interface Keyframe {
  camera: Vec3
  target: Vec3
  turn: number
  reach: number
  glow: number
  mood: GuideMood
}

// One pose per chapter, matching the captured stills. `turn` is body yaw; positive turns
// EK—01 toward +x, so a camera on the left needs a negative turn to keep the face visible.
export const keyframes: Record<ChapterId, Keyframe> = {
  systems: {
    camera: [0, 1.5, 7.6],
    target: [0, -0.1, 0],
    turn: -0.12,
    reach: 0,
    glow: 0.45,
    mood: 'thinking',
  },
  'private-local': {
    camera: [-2.4, 1.1, 7],
    target: [0, -0.3, 0],
    turn: -0.5,
    reach: 1,
    glow: 1,
    mood: 'ready',
  },
  adoption: {
    camera: [2.2, 1.6, 7.4],
    target: [0, -0.15, 0],
    turn: 0.25,
    reach: 0,
    glow: 0.35,
    mood: 'presenting',
  },
  'next-step': {
    camera: [0, 1.1, 6.9],
    target: [0, 0, 0],
    turn: 0,
    reach: 0,
    glow: 0.6,
    mood: 'listening',
  },
}

// The first half of a chapter holds its pose; the second half eases into the next chapter's.
const HOLD = 0.5
const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0)
const smoothstep = (value: number) => value * value * (3 - 2 * value)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mixVec = (a: Vec3, b: Vec3, t: number): Vec3 => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
]

export function stageRig(
  chapter: ChapterId,
  progress: number,
  mood: GuideMood = 'idle',
  next?: ChapterId,
): StageRig {
  const from = keyframes[chapter]
  const to = next ? keyframes[next] : from
  const t = smoothstep(clamp01((clamp01(progress) - HOLD) / (1 - HOLD)))
  const reach = mix(from.reach, to.reach, t)
  return {
    camera: {
      position: mixVec(from.camera, to.camera, t),
      target: mixVec(from.target, to.target, t),
    },
    character: {
      pose: { turn: mix(from.turn, to.turn, t), reach, pointing: reach >= 0.5, direction: 1 },
      // A live guide mood (thinking, answering) overrides the chapter's authored mood.
      mood: mood !== 'idle' ? mood : t < 0.5 ? from.mood : to.mood,
    },
    spark: { glow: mix(from.glow, to.glow, t) },
  }
}

// Where the reading line sits in the chapter list: chapter index plus progress through it.
// Before the first chapter reads as its start; after the last, as its end.
export function storyPosition(
  rects: ({ top: number; bottom: number } | null)[],
  anchor: number,
): { index: number; progress: number } {
  let index = 0
  let progress = 0
  rects.forEach((rect, i) => {
    if (!rect || rect.top > anchor) return
    index = i
    progress = clamp01((anchor - rect.top) / Math.max(1, rect.bottom - rect.top))
  })
  return { index, progress }
}

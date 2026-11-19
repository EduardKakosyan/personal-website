// The guest's checklist (Eduard: "a little easter egg to-do list for them as
// part of the game that they can complete, like find the mushroom basket").
// Plain data and storage; the cards are in checklist-card.tsx.

export type GoalId =
  | 'pet'
  | 'throw'
  | 'rub'
  | 'tag'
  | 'resume'
  | 'todo'
  | 'basket'
  | 'rod'
  | 'tackle'
  | 'shower'
  | 'split'
  | 'boxes'
  | 'fish'

export type Goal = {
  id: GoalId
  label: string
  /** For goals with several parts (the six boxes): how many make it done. */
  parts?: number
}

export const GOALS: Goal[] = [
  { id: 'pet', label: 'Give Rusty a pet' },
  { id: 'throw', label: 'Throw the cow for Rusty' },
  { id: 'rub', label: 'Rub Rusty’s belly' },
  { id: 'tag', label: 'Read Rusty’s name tag' },
  { id: 'resume', label: 'Read Eduard’s résumé' },
  { id: 'todo', label: 'Read the to-do list' },
  { id: 'basket', label: 'Find the mushroom basket' },
  { id: 'rod', label: 'Find the striper rod' },
  { id: 'tackle', label: 'Find the tackle box' },
  { id: 'shower', label: 'Find the outdoor shower' },
  { id: 'split', label: 'Split five logs' },
  { id: 'boxes', label: 'Look in every box on the workbench', parts: 6 },
  // DRAFT label (the agent's): the brook's fishing hole (scene 6). No species
  // is named until Eduard says what he catches there (fishing.ts, FISHING_CATCH).
  { id: 'fish', label: 'Catch something at the fishing hole' },
]

/** What's been done: for most goals `true`; for the boxes, which ones. */
export type Progress = Partial<Record<GoalId, true | string[]>>

const KEY = 'cabin.checklist.v1'

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Progress) : {}
  } catch {
    return {}
  }
}

export function saveProgress(p: Progress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // private mode: the list just won't be remembered
  }
}

export function isDone(p: Progress, goal: Goal) {
  const v = p[goal.id]
  if (v === true) return true
  return Array.isArray(v) && goal.parts !== undefined && v.length >= goal.parts
}

export function countDone(p: Progress) {
  return GOALS.filter((g) => isDone(p, g)).length
}

/** Progress text for a goal with parts, e.g. "3/6". */
export function partsText(p: Progress, goal: Goal) {
  if (!goal.parts) return null
  const v = p[goal.id]
  const n = Array.isArray(v) ? v.length : v === true ? goal.parts : 0
  return `${n}/${goal.parts}`
}

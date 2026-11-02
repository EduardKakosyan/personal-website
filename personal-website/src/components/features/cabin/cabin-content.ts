// Words for the cabin (storyboard scene 4). No three.js here: the overlay uses it.

/** The résumé as the panel shows it. Built on the server from src/content/profile.ts. */
export type CabinResume = {
  name: string
  title: string
  company: string
  location: string
  headline: string
  roles: { title: string; org: string; location: string; dates: string; summary: string }[]
  education: { degree: string; school: string; dates: string; details: string[] }[]
  skills: { label: string; items: string[] }[]
  pdfPath: string
}

export type TodoItem = {
  text: string
  /** Work items have a short line that opens when tapped; the full story is saved for the fire. */
  note?: string
}

/**
 * DRAFT, from content-draft.md section 3: Eduard is to replace this with his
 * real list. Camp jobs and work mixed together, because that's what his list
 * looks like (storyboard scene 4).
 */
export const TODO_DRAFT: TodoItem[] = [
  { text: 'Finish the deck' },
  { text: 'Finish the outdoor shower' },
  { text: 'Split wood for tonight' },
  { text: 'Pick blueberries' },
  {
    text: 'Keystone: next sprint with the team',
    note: 'Keystone is the company’s operations software. Eduard leads the developers building it, one phase at a time.',
  },
  {
    text: 'Keystone: get the delivery lead’s input',
    note: 'Some of Keystone’s pipeline definitions stay open until the delivery lead has had a say.',
  },
  {
    text: 'Get the team using Keeper',
    note: 'Teammates are testing Keeper now. A week-long pilot decides whether the team can cancel Fireflies.',
  },
  {
    text: 'HUGO: echo cancellation',
    note: 'Right now HUGO can hear its own voice, so only the wake word can interrupt it. Fixing that is next.',
  },
]

/** HUGO's line when the guest steps into the cabin (Eduard's wording, A48). */
export const HUGO_CABIN_LINE =
  'Here’s the cabin, where all the magic happens. Feel free to look around.'

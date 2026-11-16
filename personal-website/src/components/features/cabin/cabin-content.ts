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

/**
 * A project box on the workbench (scene 5, A84). Built on the server from the
 * archive projects in src/content/projects.ts.
 */
export type BenchProject = {
  slug: string
  title: string
  /** The name on the box's tag (short enough to fit). */
  tag: string
  when: string
  role: string
  /** What it is, in a sentence or two. */
  what: string
  /** Who built it, when, and Eduard's part. */
  detail: string
  links: { label: string; href: string }[]
}

/** HUGO's line when the guest steps into the cabin (Eduard's wording, A48). */
export const HUGO_CABIN_LINE =
  'Here’s the cabin, where all the magic happens. Feel free to look around.'

/**
 * HUGO's line when he sets off to lead the guest from the cabin to the
 * woodshed (A86). DRAFT, the agent's wording: Eduard to replace.
 */
export const HUGO_LEAD_LINE = 'Come on, I’ll show you the woodshed. Eduard built it himself.'

/** HUGO's line when the guest reaches the woodshed (Eduard's wording, A48). */
export const HUGO_WOODSHED_LINE =
  'Here’s where all the wood is, in case you need to warm up. We’ll get the fire going later.'

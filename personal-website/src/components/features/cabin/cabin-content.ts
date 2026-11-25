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
 * The to-do list on the cabin wall (content-draft.md section 3, approved
 * 2026-11-25). Camp jobs and work mixed together, because that's what his
 * list looks like (storyboard scene 4).
 */
export const TODO_LIST: TodoItem[] = [
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
    note: 'Keeper replaced the team’s old notetaker and dictation app in November. Now it’s about everyone using all of it.',
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

/**
 * The slug of a link to one of the projects' own pages ("/projects/hugo"), or
 * null. In the cabin those links open a note about the project over the scene
 * instead of leaving it (Eduard: HUGO's page "should be just a note that opens
 * up on the page instead of going to like projects/Hugo").
 */
export function projectSlug(href: string): string | null {
  return /^\/projects\/([a-z0-9-]+)\/?$/.exec(href)?.[1] ?? null
}

/** HUGO's line when the guest steps into the cabin (Eduard's wording, A48). */
export const HUGO_CABIN_LINE =
  'Here’s the cabin, where all the magic happens. Feel free to look around.'

/**
 * HUGO's line when the guest walks out of the cabin and he sets off to lead
 * them to the workbench by the woodshed. Eduard's wording (2026-11-24: "Let's
 * go on a little walk." didn't say where to: "it should be, lets go check
 * out his workbench and look at some of his past projects").
 */
export const HUGO_LEAD_LINE =
  'Let’s go check out his workbench and look at some of his past projects.'

/** HUGO's line when the guest reaches the woodshed (Eduard's wording, A48). */
export const HUGO_WOODSHED_LINE =
  'Here’s where all the wood is, in case you need to warm up. We’ll get the fire going later.'

/**
 * HUGO's next line at the woodshed: he floats over to the workbench and points
 * the project boxes out (Eduard: "make HUGO point out the workbench where
 * they can see my past projects"). Approved 2026-11-25.
 */
export const HUGO_WORKBENCH_LINE =
  'Here’s the workbench. His past projects are in the boxes. Open one up!'

/**
 * In the cabin, after his line about it, HUGO floats over to the table and
 * points the résumé out (Eduard: "let's make my resume easier to find, its
 * the whole point of the website"). Approved 2026-11-25.
 */
export const HUGO_RESUME_LINE = 'His résumé is right here on the table. Pick it up and have a read!'

/**
 * When HUGO has been left behind and teleports back to the guest, he says
 * where the tour goes next (Eduard: "reset its dialog to be pointing to the
 * next activity in sequence"). The cabin's was approved 2026-11-25; the
 * others are the lines he leads with.
 */
export const HUGO_CATCH_UP_CABIN = 'There you are! Let’s start with the cabin.'

/**
 * What HUGO says when the guest looks at one of the easter eggs in the cabin,
 * from the brief's facts (approved 2026-11-25).
 */
export const HUGO_LOOK_LINES = {
  basket: 'Eduard’s foraging basket. Golden chanterelles and king boletes, his go-tos.',
  rod: 'His surf rod. Endless hours on the beach with that one, fishing for stripers.',
  tackle: 'The tackle box. Everything in there has a story, and most of them got away.',
} as const

/** HUGO, when the guest has split the night's firewood (approved 2026-11-25). */
export const HUGO_SPLIT_DONE_LINE = 'That’s plenty for tonight. Eduard will be pleased.'

/**
 * Eduard's welcome, in two beats (Eduard: he "should acknowledge our guest
 * and not just say Hey HUGO show them around"). The second line is his own
 * wording (A44); he approved the first on 2026-11-25.
 */
export const EDUARD_HELLO_LINE = 'Hey, you made it! Welcome. Make yourself at home.'
export const EDUARD_HANDOVER_LINE = 'HUGO, show them around, I’ll finish up here.'

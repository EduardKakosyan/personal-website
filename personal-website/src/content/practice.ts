// How Eduard works, in his own voice: where he uses AI and where he doesn't, and how a piece of
// work moves from a problem to merged code. Shown on /about. HUGO's and the fireside answers on
// the same subjects should be cut from this, so the site says one thing in every place.
// No `@/` imports: Node tests load this file directly.

export interface Principle {
  id: string
  title: string
  body: string
  /** The project that shows it: a `projects.ts` slug. */
  example: string
}

/** Where AI fits. Each one is something a project on this site does. */
export const principles: Principle[] = [
  {
    id: 'problem-first',
    title: 'Start with the problem',
    body: 'Before Keystone I interviewed the people who own each part of the business and measured what they used in the old dashboard. A good share of the design is what we chose not to build.',
    example: 'keystone',
  },
  {
    id: 'build-or-buy',
    title: 'Buy only what I can’t build',
    body: 'I pay for a bank, a brokerage and accounting software. An app for my own routines and goals I can build, and then it does exactly what I need and the data lives on a machine I run.',
    example: 'lyfe',
  },
  {
    id: 'small-jobs',
    title: 'A small job gets a small model',
    body: 'Turning speech into text doesn’t need a frontier model or a bill per seat. Keeper does it on each Mac and writes its summaries on a machine we own.',
    example: 'keeper',
  },
  {
    id: 'rules',
    title: 'Rules where a wrong answer costs more than no answer',
    body: 'In Keystone every number is SQL and every alert is a rule. In lyfe a model estimates a meal from a photo, but streaks, reminders and spending categories are rules I can read.',
    example: 'keystone',
  },
  {
    id: 'no-self-marking',
    title: 'A model never marks its own work',
    body: 'When my local coding agent says it is done, that is a claim. Tests it can’t edit check the claim, and then I look at the result myself.',
    example: 'dgx-autonomy',
  },
  {
    id: 'not-me',
    title: 'AI doesn’t speak as me',
    body: 'The guide on this site only gives answers written ahead of time. A small model picks which one fits your question. It never writes one.',
    example: 'personal-website',
  },
]

export interface Stage {
  id: string
  name: string
  /** What happens at this stage. */
  what: string
  /** What stays with Eduard. */
  mine: string
}

/** How a piece of work moves. Agents do most of the typing; the decisions stay with a person. */
export const workflow: Stage[] = [
  {
    id: 'questions',
    name: 'Questions',
    what: 'I write down what I need to learn before proposing anything. An agent then researches the code and the facts and reports what is there, with no recommendations.',
    mine: 'which questions matter.',
  },
  {
    id: 'requirements',
    name: 'Requirements',
    what: 'On larger work, a short requirements document: the problem, what success looks like and what is out of scope. The agent brings me one decision at a time.',
    mine: 'every decision in it.',
  },
  {
    id: 'design',
    name: 'Design',
    what: 'A technical design and a phased outline. Each phase lists checks a machine can run and checks I do by hand.',
    mine: 'where the phases end, and what proves each one.',
  },
  {
    id: 'build',
    name: 'Build',
    what: 'Agents write most of the code. Each task gets its own branch and working copy, so several can run at once without touching each other’s files.',
    mine: 'the order of work, and when to stop a run.',
  },
  {
    id: 'check',
    name: 'Check',
    what: 'Secret scans, lint and tests run before every commit. A second agent reviews the branch in a separate copy. Anything a person will use, I run on the real device.',
    mine: 'whether it is good, not only whether it passes.',
  },
  {
    id: 'team',
    name: 'With the team',
    what: 'On Keystone the same documents become tickets for the developers on my team, and the plan lives in the repository where they and their agents can read it.',
    mine: 'the review that closes each phase.',
  },
]

/** The tools, named once. */
export const toolsLine =
  'The tools: HumanLayer’s CodeLayer to run agents side by side, Claude Code as the main agent, Linear for the team’s tickets, and a glossary and decision records in each repository so the agent and I use the same words.'

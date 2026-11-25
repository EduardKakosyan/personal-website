// The questions the guest can ask Eduard at the fire (scene 7; A26, A30): they
// pick from a handful, and he answers "in words he wrote himself. No generated
// text in his voice." Anything off-script goes to HUGO (his card, Q).
//
// Eduard approved every answer here on 2026-11-25, and rewrote the first and
// the last. `draft` stays on the type so a new answer can be marked until he
// has approved it; a draft shows a DRAFT stamp on its card.
//
// No `@/` imports and no React: the Node tests load this file directly.

export type FireLink = { label: string; href: string }

export type FireQuestion = {
  id: string
  /** What the guest asks. */
  q: string
  /** Eduard's answer, a short paragraph each. */
  a: string[]
  /** Where to read more (a page on this site). */
  link?: FireLink
  /** Where each fact in the answer comes from. */
  sources: string
  /** True until Eduard has written the answer himself. */
  draft: boolean
}

export const FIRE_QUESTIONS: FireQuestion[] = [
  {
    id: 'working-on',
    q: 'So what are you working on these days?',
    a: [
      'Helping AI-First stay AI-first. I lead tech and AI on our leadership team, so I set our technical direction and build the software our own team runs on, like Keystone and Keeper.',
      'The rest of my time goes to clients: helping organizations here work out where AI fits in their work, and building it with them.',
      'The tools change every few months, so that job never really finishes. What doesn’t change is starting with the problem and getting people to use what we build.',
    ],
    link: { label: 'All my work', href: '/projects' },
    sources:
      'Eduard, 2026-11-25 (about keeping AI-First AI-first and helping others adopt AI, not only Keystone, which is wrapping up); profile.ts headline (leads tech and AI at AI-First, works with local organizations, builds the software the team runs on, starts with the problem); resume/content.ts ("set technical direction")',
    draft: false,
  },
  {
    id: 'note-taker',
    q: 'Why build your own note-taker?',
    a: [
      'We were paying for a bot that joins every call and keeps the transcripts on someone else’s servers. I wanted those conversations on hardware we own.',
      'Taking notes doesn’t need a giant model. Small ones on our own machine do it, with no bill per meeting, and I can make it fit how we work.',
      'Building Keeper took weeks, not months. We switched the old tools off in November. Getting everyone to use all of it is the hard part, same as always.',
    ],
    link: { label: 'The Keeper story', href: '/projects/keeper' },
    sources:
      'projects.ts keeper (Fireflies: a bot that joins each meeting, transcripts on the vendor’s servers; hardware the company owns; Fireflies and Wispr Flow switched off in November 2026); brief Section 5 (Keeper: small local models, adoption is the hard part)',
    draft: false,
  },
  {
    id: 'dashboard',
    q: 'What did you learn from your first try?',
    a: [
      'Before Keystone there was a dashboard, and I built most of it. I built it without sitting down with the people who’d use it.',
      'By the middle of the year the team was skipping its scorecard in the weekly meeting. Each stage squeezed a lot of work into one percentage nobody could act on, and when I audited it some of the numbers were wrong.',
      'So now it starts with people. And we wrote down what not to build: no view without a meeting that uses it.',
    ],
    link: { label: 'How Keystone started', href: '/projects/keystone' },
    sources:
      'projects.ts keystone (problem: "Eduard built most of AI-First’s first internal dashboard, and by mid-2026 the team skipped its scorecard", one percentage per stage, the audit found wrong numbers; decisions: "any view without a meeting that uses it"); brief Section 5 (the Dashboard lesson)',
    draft: false,
  },
  {
    id: 'leading',
    q: 'What’s it like leading the dev team?',
    a: [
      'I’m still learning it. There are three developers on my team. I designed Keystone’s architecture and built the first phase myself; now they build most of it, and I review the Linear issues and what merges to main.',
      'The hardest parts aren’t code. Some numbers wait on a person to agree what they mean or to own them, and if nobody will own one, we cut it.',
      'Early on I said change management would matter more than the software. It did.',
    ],
    sources:
      'Eduard, 2026-11-24 (the team is four including him); projects.ts keystone (team: designed the architecture and built the first phase, reviews the Linear issues and the merges to main; hard: definitions owed by people, a metric is cut if its owner declines, "it mattered more than the software. It did.")',
    draft: false,
  },
  {
    id: 'hugo',
    q: 'What’s the deal with HUGO?',
    // kept short: brief Section 5, "maybe don't talk about it too much yet"
    a: [
      'You’ve been walking round with a version of him all day. The real HUGO is a voice assistant I’m building into a Reachy Mini, a little desk robot, with every model running on hardware we own.',
      'The first version took more than forty seconds to answer "What can you do?" and then read out its own instructions. He’s a lot quicker now, but he’s still a prototype.',
    ],
    link: { label: 'The real HUGO', href: '/projects/hugo' },
    sources:
      'projects.ts hugo (Reachy Mini, models on hardware the team owns, "more than 40 seconds of silence and then a reply that recited its own instructions", "a working prototype"); brief A9 and A42 (HUGO only a small mention)',
    draft: false,
  },
  {
    id: 'next',
    q: 'What’s next for you?',
    a: [
      'Finishing Keystone and getting the whole team using all of Keeper. After that, whatever comes next. AI changes every few months, and keeping up with it is part of the job.',
      'And I should probably finish the deck out front.',
    ],
    sources:
      'Eduard, 2026-11-25 (Keystone is wrapping up; no HUGO line here); projects.ts keeper (in use; adoption page); brief A7 (the deck he’s building)',
    draft: false,
  },
]

/** Eduard's lines by the fire (approved 2026-11-25). */
export const EDUARD_FIRE_LINES = {
  /** When the guest comes up to the fire. */
  welcome: 'There you are. Grab a chair.',
  /** When they get up to go, having asked him something (storyboard scene 7). */
  goodbye: 'Come back anytime.',
} as const

/** HUGO, after Eduard's goodbye: points at the corner bar (content-draft.md section 8). */
export const HUGO_GOODBYE_LINE =
  'If you want to reach Eduard, Contact is in the little bar. His résumé is there too.'

/** HUGO, when the guest looks at the Yahtzee set on the picnic table (Eduard's wording). */
export const HUGO_YAHTZEE_LINE = 'Camp Yahtzee. That’s one of Eduard’s favourite games.'

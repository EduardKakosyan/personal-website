// HUGO's suggested questions at each stop (A48): tap HUGO and he offers two or
// three questions about the place, each with an answer written in advance,
// plus a box to ask anything (that goes to the small model on the device).
//
// Eduard approved every answer here on 2026-11-25. They're built only from
// src/content/profile.ts, projects.ts and the design brief. HUGO talks about Eduard, never as him (A24), and doesn't
// state the obvious about the place (A49).
//
// No `@/` imports and no React: the Node tests load this file directly.
import { resumePdfPath } from '../../../content/profile'
import type { HugoStop } from './hugo-stops'

export type HugoLink = { label: string; href: string }

export type HugoQuestion = {
  id: string
  /** What the guest taps. */
  q: string
  /** Other ways of typing the same question that should get the same answer. */
  also?: string[]
  /** HUGO's answer, 1–3 short sentences. */
  a: string
  /** The first link is the main one (a page on this site); the rest open in a new tab. */
  links?: HugoLink[]
  /** Where each fact in the answer comes from. */
  sources: string
  /** False once Eduard has approved the answer; a new one starts as a draft. */
  draft: boolean
}

export type StopQuestions = {
  /** The heading on HUGO's card. */
  name: string
  /** Where the guest is, for the model's context. */
  about: string
  questions: HugoQuestion[]
}

/**
 * The questions at each stop. At the fire (scene 7) the questions about his
 * work go to Eduard himself (A30, fire-questions.ts); HUGO's are for anything
 * else: where to find the rest, and how to get in touch.
 */
export const HUGO_QUESTIONS: Record<HugoStop, StopQuestions | null> = {
  // Scene 1–3: the gravel road, the driveway and the yard (deck, Eduard, Rusty).
  arrival: {
    name: 'The way in',
    about:
      'the gravel road, the driveway and the yard in front of the cabin, where Eduard is building the deck and Rusty has his plush cow',
    questions: [
      {
        id: 'who-is-eduard',
        q: 'Who’s Eduard?',
        also: ['who is eduard', 'who is he', 'whos eduard', 'who is eduard kakosyan'],
        a: 'He leads tech and AI at AI-First Solutions in Halifax, and he’s on the company’s leadership team. Out here there’s always a project on the go: the deck, the outdoor shower, the firewood.',
        sources:
          'profile.ts headline ("I lead tech and AI at AI-First Solutions") and the AI-First role’s scope ("leadership team"); brief Section 3 (deck, shower, splitting wood)',
        draft: false,
      },
      {
        id: 'what-are-you',
        q: 'What are you?',
        also: ['who are you', 'what is hugo', 'who is hugo', 'are you a robot'],
        a: 'I’m HUGO, your guide for the day. There’s a real HUGO too: a voice assistant Eduard is building into a little Reachy Mini robot. That one’s still a prototype, so go easy on us both.',
        links: [{ label: 'The real HUGO', href: '/projects/hugo' }],
        sources:
          'projects.ts hugo ("a voice assistant for a Reachy Mini robot", "a working prototype"); brief A42 (the narrator is called HUGO), A9 (HUGO only a small mention)',
        draft: false,
      },
      {
        id: 'skip-ahead',
        q: 'Can I skip ahead?',
        also: [
          'can i skip',
          'how do i skip',
          'i am in a hurry',
          'im in a hurry',
          'how can i contact him',
          'how do i contact eduard',
          'how do i get in touch',
          'where is his resume',
        ],
        a: 'Sure. Work, Résumé and Contact are in the little bar the whole time. Or stick with me and I’ll show you around.',
        sources: 'corner-bar.tsx (Work, Résumé, Contact); brief A43 (3), P2',
        draft: false,
      },
    ],
  },

  // Scene 4: inside the cabin (the résumé and the to-do list).
  cabin: {
    name: 'The cabin',
    about: 'inside the cabin, with Eduard’s résumé on the table and his to-do list on the wall',
    questions: [
      {
        id: 'what-does-he-do',
        q: 'What does Eduard do?',
        also: [
          'what does he do',
          'what is his job',
          'whats his job',
          'what does eduard do for work',
        ],
        a: 'He’s the Lead AI Developer at AI-First Solutions and sits on the leadership team. He works with local organizations from discovery through to rollout: 39 client projects across 31 organizations so far.',
        sources:
          'profile.ts identity.title, the AI-First role’s scope, headline ("I work with local organizations"), metric `projects` (site surface: "39 … across 31 organizations"); resume/content.ts summary ("from discovery and architecture through integration and rollout")',
        draft: false,
      },
      {
        id: 'where-worked',
        q: 'Where has he worked?',
        also: ['where has eduard worked', 'where did he work', 'what is his experience'],
        a: 'AI-First Solutions, since February 2025. Before that he co-founded CarGrep, a used-car search startup, and he also co-taught an agentic AI course at Dalhousie with ShiftKey Labs. The résumé on the table has the details.',
        links: [{ label: 'Résumé (PDF)', href: resumePdfPath }],
        sources:
          'profile.ts roles (AI-First from 2025-02; CarGrep co-founder 2024-10 to 2025-01; AI Instructor, ShiftKey Labs, Dalhousie, 2025-08 to 2026-04, "an agentic AI course for non-CS students"); projects.ts cargrep ("a used-car search app")',
        draft: false,
      },
      {
        id: 'where-studied',
        q: 'Where did he study?',
        also: [
          'where did eduard study',
          'what did he study',
          'where did he go to school',
          'education',
        ],
        a: 'Dalhousie University in Halifax: a Bachelor of Computer Science (Co-op), finished in May 2025 with a 3.8 GPA. He picked up the Future Tech Leaders and Sexton Scholar awards along the way.',
        sources: 'profile.ts education (degree, end 2025-05, GPA 3.8, awards)',
        draft: false,
      },
    ],
  },

  // Scene 5: the woodshed, the chopping block and the workbench with the boxes.
  woodshed: {
    name: 'The woodshed',
    about:
      'the woodshed with its chopping block, and Eduard’s workbench beside it with six boxes, one for each of his past projects',
    questions: [
      {
        id: 'what-else-built',
        q: 'What else has Eduard built?',
        also: [
          'what has he built',
          'what else has he built',
          'what is in the boxes',
          'whats in the boxes',
        ],
        a: 'Six of them are in the boxes on the bench: three hackathon entries, a used-car search startup, a university research project and the starter kit his company uses for new projects. Open any box for the story.',
        sources:
          'page.tsx BENCH_SLUGS and projects.ts (HealthByte, Second Brain and Sky Painters are hackathon entries; CarGrep; the Q-Learning Network Simulator, a Dalhousie group research project; Dev Template, "for starting projects at AI-First Solutions")',
        draft: false,
      },
      {
        id: 'any-wins',
        q: 'Did any of them win?',
        also: ['did he win anything', 'has he won anything', 'any awards', 'did any win'],
        a: 'Two did. HealthByte took first place at the Atlantic AI Summit hackathon in 2025, and Second Brain took second at the Volta Agentic AI Hackathon in Halifax in 2024.',
        links: [{ label: 'HealthByte', href: '/projects/healthbyte' }],
        sources:
          'projects.ts healthbyte (first place, May 2025), second-brain (second place, November 2024)',
        draft: false,
      },
      {
        id: 'who-splits',
        q: 'Who splits all this wood?',
        also: ['who splits the wood', 'who chops the wood', 'who cut all this wood'],
        a: 'Eduard and his friends, mostly in the fall. It’s one of the jobs that comes round every year out here, like seeding the grass in spring and picking blueberries in August.',
        sources:
          'brief Section 3 ("With friends: … splitting wood"; "splitting wood (fall), spreading grass seed (spring), picking blueberries (August)")',
        draft: false,
      },
    ],
  },

  // Scene 6: the brook (Shoreline and Is the Beach Open, A51). Not stated,
  // because Eduard hasn't confirmed them: that he uses Shoreline for striper
  // trips, and what he catches at the brook.
  brook: {
    name: 'The brook',
    about:
      'the brook at the east edge of the grass field, with wooden stairs down to a little fishing hole and a tap where you get water',
    questions: [
      {
        id: 'good-fishing',
        q: 'Where’s the good fishing?',
        also: [
          'where is the good fishing',
          'where does he fish',
          'is there fishing here',
          'can you fish here',
        ],
        a: 'There’s a little fishing hole right by the stairs. For stripers, Eduard and his friends head to the beach. He also had his local coding agent build Shoreline, an app that rates the day for the beach and for fishing, with the tides.',
        links: [
          { label: 'Shoreline', href: '/projects/shoreline' },
          { label: 'Live app', href: 'https://eduardkakosyan.github.io/shoreline/' },
        ],
        sources:
          'brief A21 (the fishing hole by the stairs), Section 3 ("fishing for stripers on the beach" with friends); projects.ts shoreline (built by a local coding agent in dgx-autonomy at Eduard’s request; beach and fishing verdicts, tides)',
        draft: false,
      },
      {
        id: 'why-here',
        q: 'Why does Eduard come here?',
        also: ['why does he come here', 'why this place', 'why does he like it here'],
        a: 'To be outside with the people he loves, and to learn to do things without everyday appliances: fishing, foraging for mushrooms, getting his own water.',
        sources:
          'brief Section 3, Eduard’s own words ("being with people I love … learning how to do things without depending on everyday appliances … foraging for mushrooms or fishing … getting your water"); A21 (the tap)',
        draft: false,
      },
      {
        id: 'beach-open',
        q: 'Is the beach open today?',
        also: ['is the beach open', 'can i swim at the beach', 'where can i swim'],
        a: 'Depends on the beach. Eduard and a teammate built Is the Beach Open at a Claude hackathon in Halifax: a map of the 35 Nova Scotia beaches where a government tests the water, with the official notice behind each status.',
        links: [
          { label: 'Is the Beach Open', href: '/projects/volta-sep26' },
          { label: 'nsbeaches.ca', href: 'https://www.nsbeaches.ca' },
        ],
        sources:
          'projects.ts volta-sep26 (built with @Harshil-varia at the Halifax Claude Hackathon at Volta; "a map of the 35 Nova Scotia beaches where a government tests the water, with the official notice behind each status"; live at nsbeaches.ca)',
        draft: false,
      },
    ],
  },

  // Scene 7: the fire, at night. (Eduard answers for himself there; these are HUGO's.)
  fire: {
    name: 'The fire',
    about:
      'the fire by the deck at night, where Eduard sits with the guest and answers their questions himself, with Rusty lying beside it',
    questions: [
      {
        id: 'get-in-touch',
        q: 'How do I get in touch with Eduard?',
        also: [
          'how do i contact him',
          'how can i reach eduard',
          'contact',
          'can i hire him',
          'email',
        ],
        a: 'Contact is in the little bar, and his résumé is right beside it.',
        links: [
          { label: 'Contact', href: '/contact' },
          { label: 'Résumé (PDF)', href: resumePdfPath },
        ],
        sources:
          'the corner bar (A43: Work, Résumé, Contact always visible); storyboard scene 7 (the ending points at Résumé and Contact)',
        draft: false,
      },
      {
        id: 'rest-of-work',
        q: 'Where’s the rest of his work?',
        also: ['where is his work', 'show me his projects', 'what else has he done', 'portfolio'],
        a: 'Work, in the little bar, has every project written up. Keystone and Keeper are the main two, and Eduard’s the one to ask about those.',
        links: [
          { label: 'All his work', href: '/projects' },
          { label: 'Keystone', href: '/projects/keystone' },
          { label: 'Keeper', href: '/projects/keeper' },
        ],
        sources:
          'the corner bar (A43); brief A9 (Keeper and Keystone are the main work stories), A30 (Eduard answers for himself at the fire)',
        draft: false,
      },
      {
        id: 'picnic-table',
        q: 'What’s on the picnic table?',
        also: ['what is on the table', 'yahtzee', 'what are the dice for', 'camp yahtzee'],
        a: 'Camp Yahtzee. That’s one of Eduard’s favourite games. He had an app made that keeps score for it, for camp trips with no signal.',
        links: [
          { label: 'Camp Yahtzee', href: '/projects/yahtzee' },
          { label: 'Play it', href: 'https://eduardkakosyan.github.io/yahtzee/' },
        ],
        sources:
          'Eduard, 2026-11-24 ("that’s one of eduards favourite games"; he didn’t want "they roll real dice", it sounded like gambling); projects.ts yahtzee ("Eduard wanted Yahtzee for a camp trip with no signal"; the phone’s main job is to keep score; built by his local coding agent; live app link); brief A51',
        draft: false,
      },
    ],
  },
}

/** HUGO's own lines around the ask-anything box, in HUGO's voice (approved 2026-11-25). */
export const HUGO_ASK_LINES = {
  placeholder: 'Ask HUGO anything…',
  // the model can't run here (no WebGPU, not a secure page, or it failed to load)
  unavailable:
    'My thinking cap doesn’t fit on this device, sorry. Try one of the questions above, or Work and Contact in the little bar.',
  // the guardrails turned the question away (off topic)
  offTopic:
    'I only really know about Eduard and his place. Ask me about his work, or try one of the questions above.',
  // the guardrails turned the question away (prompt extraction, jailbreak)
  refuse:
    'I’ll stick to showing you around, if that’s alright. Ask me anything about Eduard’s work.',
  // the model's reply touched something Eduard hasn't confirmed, or spoke as him
  unsure: 'That’s one to ask Eduard himself. I’d rather not guess.',
  // the model's reply didn't come back in shape, or timed out
  lost: 'I lost my train of thought there. Could you ask that another way?',
  tooLong: 'That’s a lot for a little robot. Could you ask it in fewer words?',
  // status while the model downloads (first time only)
  waking: 'Waking up my thinking cap',
  thinking: 'Thinking…',
  // under the box
  privacy: 'Typed questions stay on your device.',
} as const

/** The longest typed question HUGO takes (the guide's own limit is 1000). */
export const ASK_MAX_LENGTH = 300

// ------------------------------------------------------------ what HUGO must not say

/**
 * Facts that aren't settled (handoff, "content-draft.md fact conflicts", and
 * this task): no answer may state them, and a model reply that does is
 * replaced with `HUGO_ASK_LINES.unsure`. Checked per sentence.
 */
export const UNCONFIRMED: { id: string; why: string; test: (sentence: string) => boolean }[] = [
  {
    id: 'team-size',
    why: 'Dev team size: Eduard said 4, profile.ts says five',
    test: (s) =>
      /\b(?:four|five|4|5)[\s-]+(?:person\s+)?(?:dev(?:eloper)?s?|engineers?)\b/i.test(s) ||
      /\bleads?\s+(?:a|his|the)\s+team\s+of\s+(?:four|five|4|5)\b/i.test(s),
  },
  {
    id: 'shoreline-stripers',
    why: 'Unconfirmed that he uses Shoreline for striper trips',
    test: (s) =>
      /\bshoreline\b/i.test(s) &&
      /\bstripers?\b|\bfishing trips?\b|\bbefore (?:he|they) (?:go|goes|head)/i.test(s),
  },
  {
    id: 'brook-catch',
    why: 'Unconfirmed what he catches at the brook',
    test: (s) =>
      /\b(?:trout|brookies?|salmon|perch|eels?|smelts?|gaspereau|minnows?|suckers?|bass)\b/i.test(
        s,
      ),
  },
  {
    id: 'keeper-data',
    why: 'Keeper: "never leaves my laptop" and "records quietly" conflict with projects.ts',
    test: (s) =>
      /\b(?:conversations?|recordings?|meetings?|calls?|data)\b[^.]*\bnever leaves?\b[^.]*\b(?:laptop|mac)\b/i.test(
        s,
      ) || /\brecord\w*\s+(?:quietly|secretly|silently)\b/i.test(s),
  },
  {
    id: 'keystone-interviews',
    why: 'Keystone: whether the interviews covered all ~10 staff or leadership',
    test: (s) =>
      /\binterview\w*\b[^.]{0,60}\b(?:staff|leadership|leaders|ceo|everyone|employees)\b/i.test(
        s,
      ) || /\b(?:staff|leadership|ceo|employees)\b[^.]{0,40}\binterview/i.test(s),
  },
  {
    id: 'mdi-or-ux',
    why: 'Keystone: an MDI student or a UX researcher',
    test: (s) => /\bMDI\b|\bdigital innovation\b|\bUX researcher\b/i.test(s),
  },
  {
    id: 'staff-performance',
    why: 'Keystone: whether the scorecard is about staff performance',
    test: (s) =>
      /\bstaff performance\b|\bperformance of (?:the )?staff\b|\bhow people are performing\b/i.test(
        s,
      ),
  },
  {
    id: 'scorecard-shipped',
    why: 'Keystone: whether the first scorecard shipped',
    test: (s) =>
      /\bscorecard\b[^.]{0,40}\b(?:shipped|launched|went live|is live|released|rolled out)\b/i.test(
        s,
      ),
  },
]

/** HUGO is never Eduard and never speaks for him (A24). */
export function speaksAsEduard(text: string): boolean {
  return /\bI(?:’|')?m Eduard\b|\bI am Eduard\b|\bmy (?:team|company|cabin|dog|deck|property|girlfriend|friends|résumé|resume|work)\b|\bI (?:built|founded|co-founded|lead|work at)\b/i.test(
    text,
  )
}

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/)

/** Which unconfirmed facts a text states, if any. */
export function unconfirmedIn(text: string): string[] {
  return UNCONFIRMED.filter((u) => sentences(text).some((s) => u.test(s))).map((u) => u.id)
}

/** Whether HUGO may say this (every prewritten answer and project line is checked). */
export function checkHugoReply(text: string): { ok: true } | { ok: false; reason: string } {
  if (!text.trim()) return { ok: false, reason: 'empty' }
  if (speaksAsEduard(text)) return { ok: false, reason: 'speaks as Eduard' }
  const bad = unconfirmedIn(text)
  return bad.length ? { ok: false, reason: `unconfirmed: ${bad.join(', ')}` } : { ok: true }
}

// ------------------------------------------------------------ typed questions

const QUESTION_WORDS = new Set(
  "a an the is are was does do did what whats what's who whos who's where wheres where's why how can could i me you he his him eduard eduards eduard's of to any this that here it has have there about tell please".split(
    ' ',
  ),
)
const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
const words = (s: string) =>
  new Set(
    normalise(s)
      .split(' ')
      .filter((w) => w && !QUESTION_WORDS.has(w)),
  )

/**
 * A typed question that's really one of the suggested ones gets the answer
 * written for it (no model needed). The guest's stop first, then the others.
 */
export function matchPrewritten(typed: string, stop: HugoStop): HugoQuestion | null {
  const t = normalise(typed)
  if (!t) return null
  const tw = words(typed)
  const order = [stop, ...(Object.keys(HUGO_QUESTIONS) as HugoStop[]).filter((s) => s !== stop)]
  for (const s of order) {
    for (const q of HUGO_QUESTIONS[s]?.questions ?? []) {
      const forms = [q.q, ...(q.also ?? [])]
      if (forms.some((f) => normalise(f) === t)) return q
      for (const f of forms) {
        const fw = words(f)
        if (!fw.size || !tw.size) continue
        let both = 0
        fw.forEach((w) => {
          if (tw.has(w)) both += 1
        })
        if (both / (fw.size + tw.size - both) >= 0.75) return q
      }
    }
  }
  return null
}

/** A question by its id. */
export function questionById(id: string): HugoQuestion | null {
  for (const s of Object.keys(HUGO_QUESTIONS) as HugoStop[])
    for (const q of HUGO_QUESTIONS[s]?.questions ?? []) if (q.id === id) return q
  return null
}

// ------------------------------------------------------------ the small model picks

/**
 * HUGO's own line for a project where the site's one-line description won't
 * do (approved 2026-11-25).
 */
export const HUGO_PROJECT_LINES: Record<string, string> = {
  keystone:
    'Keystone is internal operations software at AI-First Solutions, where staff and Claude share one registry of operations. Eduard designed its architecture and leads its development.',
}

type ProjectLike = {
  slug: string
  title: string
  description: string
  detail: string
  aliases: string[]
  facts: { when: string }
}

/** HUGO on a project: the site's own description (or his line above), and a link to its page. */
export function projectAnswer(p: ProjectLike): { text: string; links: HugoLink[] } {
  const d = p.description.trim()
  const rest = `${d.charAt(0).toLowerCase()}${d.slice(1)}`
  const text =
    HUGO_PROJECT_LINES[p.slug] ??
    (/^an? /i.test(d) ? `${p.title} is ${rest}` : `${p.title}: ${rest}`)
  return { text, links: [{ label: p.title, href: `/projects/${p.slug}` }] }
}

/**
 * What a typed question can get: one of HUGO's answers, or a project's line.
 * `label` is what the model sees; `text` is what the shortlist searches.
 */
export type HugoPick = { id: string; label: string; text: string }
export const PICK_NONE = 'none'

export function hugoPicks(projects: ProjectLike[]): HugoPick[] {
  const asked = (Object.keys(HUGO_QUESTIONS) as HugoStop[]).flatMap(
    (s) => HUGO_QUESTIONS[s]?.questions ?? [],
  )
  return [
    ...asked.map((q) => ({
      id: `q:${q.id}`,
      label: `${q.q} → ${q.a}`,
      text: [q.q, ...(q.also ?? []), q.a].join(' '),
    })),
    ...projects.map((p) => ({
      id: `p:${p.slug}`,
      label: `What is ${p.title}? → ${projectAnswer(p).text}`,
      text: [p.title, ...p.aliases, p.description, p.detail].join(' '),
    })),
  ]
}

// Words that say nothing about what's being asked.
const FILLER = new Set(
  'a an the and or but of to in on at for with from by about as is are was were be been being am do does did done doing have has had having can could would should will shall may might must what whats which who whom whose where when why how this that these those it its there here out up down over just so very really much many any some all each every more most other into than then too also not no yes eduard eduards kakosyan he him his hes himself i me my you your we our they them their she her one ones thing things tell know like get got go goes make made use used please hugo good live now ever called working bit lot'.split(
    ' ',
  ),
)
/** Lower case, no punctuation, no filler, plurals folded ("robots" → "robot"). */
export function keywords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘']/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !FILLER.has(w))
    .map((w) =>
      w.length > 4 && w.endsWith('ies')
        ? `${w.slice(0, -3)}y`
        : w.length > 3 && w.endsWith('s') && !w.endsWith('ss')
          ? w.slice(0, -1)
          : w,
    )
}

/** How much a shortlisted entry has to share with the question (rare words count more). */
export const SHORTLIST_MIN = 1.9

/**
 * The few entries that share the most (and the rarest) words with a typed
 * question, best first; empty when nothing really matches (then HUGO doesn't
 * bother the model). The model then judges between just these.
 */
export function shortlist(question: string, picks: HugoPick[], n = 4): HugoPick[] {
  const docs = picks.map((p) => new Set(keywords(p.text)))
  const df = new Map<string, number>()
  docs.forEach((d) => d.forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)))
  const q = new Set(keywords(question))
  return picks
    .map((p, i) => {
      let score = 0
      q.forEach((w) => {
        if (docs[i].has(w)) score += Math.log(1 + picks.length / (df.get(w) ?? 1))
      })
      return { p, score }
    })
    .filter((x) => x.score >= SHORTLIST_MIN)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p)
}

/**
 * The small model doesn't write what HUGO says: it only picks which of his
 * approved answers fits a typed question. (Asked to answer in its own words,
 * the 0.5B model spoke as Eduard and made up his hobbies.) So HUGO only ever
 * says vetted words, and "none" becomes "one to ask Eduard himself".
 */
const LETTERS = 'ABCDEFGH'

export function hugoPickPrompt(stop: HugoStop, picks: HugoPick[]): string {
  const here = HUGO_QUESTIONS[stop]
  return [
    'A guest visiting Eduard Kakosyan’s cabin property asks HUGO, the guide robot, a question.',
    `The guest is at ${here ? `${here.name.toLowerCase()}: ${here.about}` : 'the cabin property'}.`,
    'HUGO can only reply with one of the prepared answers below. Choose the letter of the answer that best fits the guest’s question, even if it only answers part of it.',
    `Choose "${PICK_NONE}" only if every answer is about a different subject. Never write an answer yourself.`,
    'Return JSON: {"pick": "<letter>"}.',
    ...picks.map((p, i) => `${LETTERS[i]}) ${p.label}`),
  ].join('\n')
}

/** The JSON schema the model's reply must follow (one of the letters, or none). */
export function hugoPickSchema(picks: HugoPick[]): string {
  return JSON.stringify({
    type: 'object',
    properties: {
      pick: { type: 'string', enum: [...LETTERS.slice(0, picks.length).split(''), PICK_NONE] },
    },
    required: ['pick'],
    additionalProperties: false,
  })
}

/** The id the model picked (or none), or null if its reply isn't one of those. */
export function parsePick(output: string, picks: HugoPick[]): string | null {
  try {
    const pick = (JSON.parse(output) as { pick?: unknown }).pick
    if (pick === PICK_NONE) return PICK_NONE
    const i = typeof pick === 'string' && pick.length === 1 ? LETTERS.indexOf(pick) : -1
    return i >= 0 && i < picks.length ? picks[i].id : null
  } catch {
    return null
  }
}

export type Persona = 'recruiter' | 'hiring-manager' | 'engineer'
export type ChapterId = 'systems' | 'private-local' | 'adoption' | 'next-step'
export interface Chapter {
  id: ChapterId
  kicker: string
  headline: string
  line: string
  proof: string[]
  learnMore: string
  learnMoreLabel: string
  still: { light: string; dark: string; alt: string }
}
const still = (id: ChapterId, alt: string) => ({
  light: `/images/story/${id}-light.webp`,
  dark: `/images/story/${id}-dark.webp`,
  alt,
})
export const chapters: Chapter[] = [
  {
    id: 'systems',
    kicker: 'At AI-First',
    headline: 'Keystone started with interviews.',
    line: 'Our old dashboard had inaccurate numbers and saw little use. A UX researcher and I interviewed leadership and checked what people used, then I designed Keystone so staff and Claude share one set of operations. I lead development, and we’re rolling it out now.',
    proof: ['keystone', 'hvac-rfq-triage', 'consulting-rfp-triage'],
    learnMore: '/projects/keystone',
    learnMoreLabel: 'Read the Keystone case study',
    still: still('systems', 'The portfolio guide considering a system above a stylized DGX Spark.'),
  },
  {
    id: 'private-local',
    kicker: 'My own projects',
    headline: 'Meeting tools and a local coding agent.',
    line: "Keeper is a private meeting archive I'm building to replace our cloud notetaker, with summaries from a local model. On AI-First's DGX Spark, dgx-autonomy runs a coding agent whose work is checked against tests it can't edit; it wrote Keeper's first version. I set the direction, and a supervising Claude session writes the briefs and reviews the results.",
    proof: ['keeper', 'dgx-autonomy'],
    learnMore: '/projects/keeper',
    learnMoreLabel: 'Read the Keeper case study',
    still: still('private-local', 'The portfolio guide pointing beside a stylized DGX Spark.'),
  },
  {
    id: 'adoption',
    kicker: 'Teaching',
    headline: 'I’ve also written curriculum and taught AI.',
    line: 'Through AI-First, I built and managed a client’s data science and ML curriculum: {metric:learners} learners, {metric:learners.detail}. In a separate role at ShiftKey Labs, I co-taught an agentic AI course for students outside computer science at Dalhousie. They built agents with n8n and Bolt.',
    proof: ['workforce-ml-curriculum'],
    learnMore: '/about',
    learnMoreLabel: 'See my experience',
    still: still('adoption', 'The portfolio guide presenting with open arms above the Spark.'),
  },
  {
    id: 'next-step',
    kicker: 'Get in touch',
    headline: 'More about my work.',
    line: 'My résumé has a short overview of my experience. You can find code and build records on GitHub, or email me with a question about a project.',
    proof: ['keystone', 'dgx-autonomy'],
    learnMore: '/contact',
    learnMoreLabel: 'Contact me',
    still: still('next-step', 'The portfolio guide listening, ready for a question.'),
  },
]
export const portfolioAudience: Persona = 'hiring-manager'
export const portfolioOrder: ChapterId[] = ['systems', 'private-local', 'adoption', 'next-step']

export const personaOrder: Record<Persona, ChapterId[]> = {
  recruiter: ['adoption', 'systems', 'private-local', 'next-step'],
  'hiring-manager': portfolioOrder,
  engineer: ['private-local', 'systems', 'adoption', 'next-step'],
}
export function parsePersona(value: unknown): Persona {
  return value === 'recruiter' || value === 'engineer' ? value : 'hiring-manager'
}
export const narratorLines: Record<Persona, Record<ChapterId, string>> = {
  recruiter: {
    adoption:
      'The About page lists the teaching role separately from his client work, with dates for each role.',
    systems:
      'Eduard leads a team of five developers and works on the code with them. The Keystone case study covers his architecture and development work.',
    'private-local':
      'Shoreline and the original Camp Yahtzee release were built with his local coding-agent setup. Later Camp Yahtzee controls were added through CodeLayer.',
    'next-step': 'The résumé is one page. The contact page has his email and LinkedIn.',
  },
  'hiring-manager': {
    systems:
      'The case study explains how interviews with the team shaped the scorecard. Keystone is still rolling out; there are no adoption results yet.',
    adoption:
      'The client-work section distinguishes projects Eduard managed from those he contributed to, including AI Accelerator engagements.',
    'private-local':
      'Keeper’s write-up explains who can access a meeting and what happens when an external AI assistant retrieves it.',
    'next-step':
      'The About page has his work history. For questions about a role or project, email is the best way to reach him.',
  },
  engineer: {
    'private-local':
      "The dgx-autonomy repo includes build records and acceptance tests. Keeper's write-up covers a search-ranking bug that its paging tests missed.",
    systems:
      'Staff and AI agents use the same registry of operations in Keystone. The case study diagrams that design; the code is private.',
    adoption:
      'The learner and completion figures here refer to the client curriculum, not the Dalhousie course.',
    'next-step': 'Public code is on GitHub. Keeper and Keystone are write-ups only.',
  },
}

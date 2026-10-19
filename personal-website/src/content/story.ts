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
    kicker: 'Revenue and operations',
    headline: 'Keystone: one scorecard for sales and delivery.',
    line: 'The old metrics were inaccurate and barely used. A UX researcher and I ran discovery so the team could agree on what each number means, then I designed the system that tracks them. Rolling out now.',
    proof: ['keystone', 'hvac-rfq-triage', 'consulting-rfp-triage'],
    learnMore: '/projects/keystone',
    learnMoreLabel: 'Read the Keystone case study',
    still: still('systems', 'The portfolio guide considering a system above a stylized DGX Spark.'),
  },
  {
    id: 'private-local',
    kicker: 'Private AI',
    headline: 'AI that runs on hardware you control.',
    line: "Keeper keeps meeting transcripts in a private archive you can search and summarize. dgx-autonomy runs a coding agent on my own DGX Spark, and its code has to pass tests it can't edit.",
    proof: ['keeper', 'dgx-autonomy'],
    learnMore: '/projects/keeper',
    learnMoreLabel: 'Read the Keeper case study',
    still: still('private-local', 'The portfolio guide pointing beside a stylized DGX Spark.'),
  },
  {
    id: 'adoption',
    kicker: 'Teaching and adoption',
    headline: 'Software only counts if people use it.',
    line: 'I built the curriculum for a provincial data science program: {metric:learners} learners, {metric:learners.detail}. I also co-taught an agentic AI course at Dalhousie.',
    proof: ['workforce-ml-curriculum'],
    learnMore: '/about',
    learnMoreLabel: 'See my experience',
    still: still('adoption', 'The portfolio guide presenting with open arms above the Spark.'),
  },
  {
    id: 'next-step',
    kicker: 'Get in touch',
    headline: 'Want something like this for your team?',
    line: 'Tell me what your team is stuck on, or grab the résumé first.',
    proof: ['keystone', 'dgx-autonomy'],
    learnMore: '/contact',
    learnMoreLabel: 'Contact me',
    still: still('next-step', 'The portfolio guide listening, ready for a question.'),
  },
]
export const personaLabels: Record<Persona, string> = {
  recruiter: "I'm recruiting",
  'hiring-manager': "I'm hiring for my team",
  engineer: "I'm an engineer",
}
export const personaOrder: Record<Persona, ChapterId[]> = {
  recruiter: ['adoption', 'systems', 'private-local', 'next-step'],
  'hiring-manager': ['systems', 'adoption', 'private-local', 'next-step'],
  engineer: ['private-local', 'systems', 'adoption', 'next-step'],
}
export function parsePersona(value: unknown): Persona {
  return value === 'recruiter' || value === 'engineer' ? value : 'hiring-manager'
}
export const narratorLines: Record<Persona, Record<ChapterId, string>> = {
  recruiter: {
    adoption:
      'Quick facts: Eduard is Lead AI Developer at AI-First Consulting, and he co-taught an AI course at Dalhousie. The résumé has the dates.',
    systems:
      'Keystone is the system he leads now. He designed it; two co-op developers build from his architecture.',
    'private-local':
      "He also builds AI that runs on private hardware. Each project page says what's public and what isn't.",
    'next-step': 'The résumé is one page. His email is right below.',
  },
  'hiring-manager': {
    systems:
      "Start here. The case study covers why the old metrics went unused, how the team agreed on new ones, and what's still rolling out.",
    adoption:
      'Building the tool is half the job. This is the other half: getting people to use it.',
    'private-local': "If your data can't leave the building, this is the relevant work.",
    'next-step':
      'Every case study says what Eduard did himself and what the team did. Have a similar problem? Get in touch.',
  },
  engineer: {
    'private-local':
      "Start with dgx-autonomy: the agent's code has to pass tests it can't edit, and the build records are public. Keeper's write-up includes a search bug and how it was fixed.",
    systems:
      "Keystone's code is private, so the case study uses diagrams. Look at the shared capability registry.",
    adoption:
      'This is the teaching side: a course at Dalhousie and a provincial data science curriculum.',
    'next-step': 'Public code is on GitHub. Keeper and Keystone are write-ups only.',
  },
}

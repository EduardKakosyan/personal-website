export type Persona = 'recruiter' | 'hiring-manager' | 'engineer'
export type ChapterId = 'systems' | 'private-local' | 'adoption' | 'next-step'
export interface Chapter {
  id: ChapterId
  headline: string
  line: string
  proof: string[]
  learnMore: string
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
    headline: 'Build the systems behind the work.',
    line: 'I led and architected Keystone: discovery-led revenue and operations software, now rolling out.',
    proof: ['keystone', 'hvac-rfq-triage', 'consulting-rfp-triage'],
    learnMore: '/projects/keystone',
    still: still('systems', 'The portfolio guide considering a system above a stylized DGX Spark.'),
  },
  {
    id: 'private-local',
    headline: 'Keep control of the data.',
    line: 'Keeper makes meeting knowledge searchable; dgx-autonomy runs a coding loop with independent verification on my own hardware.',
    proof: ['keeper', 'dgx-autonomy'],
    learnMore: '/projects/keeper',
    still: still('private-local', 'The portfolio guide pointing beside a stylized DGX Spark.'),
  },
  {
    id: 'adoption',
    headline: 'Make the work usable by people.',
    line: 'I built and managed the curriculum for a data science and ML program serving {metric:learners} learners, with {metric:learners.detail}.',
    proof: ['workforce-ml-curriculum'],
    learnMore: '/about',
    still: still('adoption', 'The portfolio guide presenting with open arms above the Spark.'),
  },
  {
    id: 'next-step',
    headline: 'Take a closer look.',
    line: 'Read the experience, inspect a build, or tell me about the system your team needs.',
    proof: ['keystone', 'dgx-autonomy'],
    learnMore: '/contact',
    still: still('next-step', 'The portfolio guide listening, ready for a question.'),
  },
]
export const personaLabels: Record<Persona, string> = {
  recruiter: 'Recruiter',
  'hiring-manager': 'Hiring manager',
  engineer: 'Engineer',
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
    systems:
      'Eduard leads the architecture, not just the implementation. Keystone connects discovery to a revenue and operations scorecard.',
    'private-local':
      'His private and local AI work is documented as case studies. Keeper remains described-only; the coding loop has public build records.',
    adoption:
      'His official title is Lead AI Developer. Teaching and curriculum work show the adoption side of his engineering practice.',
    'next-step':
      'The resume is a short account of his experience. About adds the dates, scope and definitions behind the numbers.',
  },
  'hiring-manager': {
    systems:
      'Start with Keystone: why the old metrics were underused, how discovery shaped the definitions, and what is still rolling out.',
    'private-local':
      'These systems make the boundaries explicit: where data lives, who can retrieve it, and how generated code is checked.',
    adoption:
      'Shipping software and helping people use it are different jobs. The curriculum work is evidence of the latter.',
    'next-step':
      'The case studies separate personal ownership from team contributions. Contact Eduard to discuss your own revenue or operations problem.',
  },
  engineer: {
    systems:
      'Keystone exposes capabilities through a shared registry. Its case study includes synthetic diagrams, not private code or company data.',
    'private-local':
      'Inspect the independent evaluation boundary in dgx-autonomy, or the search-ranking failure documented in Keeper.',
    adoption:
      'The teaching work connects implementation to explanation. The published program evidence is linked without identifying clients here.',
    'next-step':
      'Follow the public build records from dgx-autonomy. Keeper and Keystone have case studies rather than public source links.',
  },
}

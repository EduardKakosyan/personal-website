import { z } from 'zod'

// The facts every public artifact draws on: the site, the résumé PDF, the GitHub profile README
// and HUGO's answers in the cabin. Each artifact writes its own copy from these facts.
// No `@/` imports: Node scripts (scripts/render-resume.mts) load this file without a bundler.

export type Surface = 'resume' | 'site' | 'github'
export type MetricId =
  | 'projects'
  | 'builds'
  | 'learners'
  | 'oppsWon'
  | 'keystoneOps'
  | 'keystoneTests'
  | 'keeperSaving'

export interface Metric {
  id: MetricId
  /** The number as it is printed, e.g. '39' or '18 of 40'. */
  value: string
  /** Optional qualifier printed with `{metric:id.detail}`, e.g. '88% completion'. */
  detail?: string
  label: string
  /** Where the number comes from, so every count can be traced. */
  definition: string
  /** The artifacts allowed to print the number. */
  surfaces: Surface[]
}

export interface Role {
  id: string
  title: string
  scope?: string
  org: string
  orgUrl?: string
  location: string
  /** 'YYYY-MM' */
  start: string
  /** 'YYYY-MM'; absent while the role is current. */
  end?: string
  /** One line for /about. Résumé bullets live in resume/content.ts. */
  summary: string
}

export interface Education {
  school: string
  degree: string
  location: string
  /** 'YYYY-MM' graduation month. */
  end: string
  gpa?: string
  awards: string[]
}

/** Client work is anonymised: sector + engagement type, never the client's name. */
export interface ClientWork {
  slug: string
  /** e.g. 'Broadcast-equipment manufacturer: AI Accelerator' */
  title: string
  /** Always the case-study index; per-study URLs contain client names. */
  url: string
  /** 'managed': Eduard managed the project; 'team': he worked on it. */
  role: 'managed' | 'team'
}

export interface Profile {
  identity: {
    name: string
    title: string
    company: string
    companyUrl: string
    location: string
    country: string
    citizenship: string
    website: string
    github: string
    linkedin: string
    email: string
  }
  headline: string
  roles: Role[]
  education: Education[]
  skills: { label: string; items: string[] }[]
  certificates: string[]
  metrics: Metric[]
  /** The case studies published on ai-first.ca/work (the only client work the site may cite), anonymised. */
  clientWork: ClientWork[]
  /**
   * Terms that must not appear in any artifact. Empty on purpose: this repo is public, so client
   * names and Eduard's own ventures live in the gitignored hidden-terms.local.txt (or the
   * HIDDEN_TERMS env var), which the tests read to scan every tracked file.
   */
  hidden: string[]
}

/** Public path of the résumé PDF that `pnpm resume` writes into public/. */
export const resumePdfPath = '/eduard-kakosyan-resume.pdf'

/** Where every client-work entry links: the index, because per-study URLs name the client. */
export const clientWorkIndex = 'https://www.ai-first.ca/work'

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM')
const httpsUrl = z.string().url().startsWith('https://')
const nonEmpty = z.string().trim().min(1)

const metricSchema = z
  .object({
    id: z.enum([
      'projects',
      'builds',
      'learners',
      'oppsWon',
      'keystoneOps',
      'keystoneTests',
      'keeperSaving',
    ]),
    value: nonEmpty,
    detail: nonEmpty.optional(),
    label: nonEmpty,
    definition: z.string().trim().min(20),
    surfaces: z.array(z.enum(['resume', 'site', 'github'])).min(1),
  })
  .strict()

const roleSchema = z
  .object({
    id: nonEmpty,
    title: nonEmpty,
    scope: nonEmpty.optional(),
    org: nonEmpty,
    orgUrl: httpsUrl.optional(),
    location: nonEmpty,
    start: yearMonth,
    end: yearMonth.optional(),
    summary: nonEmpty,
  })
  .strict()
  .refine((role) => !role.end || role.end >= role.start, 'a role cannot end before it starts')

const profileSchema = z
  .object({
    identity: z
      .object({
        name: nonEmpty,
        title: nonEmpty,
        company: nonEmpty,
        companyUrl: httpsUrl,
        location: nonEmpty,
        country: nonEmpty,
        citizenship: nonEmpty,
        website: httpsUrl,
        github: httpsUrl.startsWith('https://github.com/'),
        linkedin: httpsUrl.startsWith('https://www.linkedin.com/in/'),
        email: z.string().email(),
      })
      .strict(),
    headline: nonEmpty,
    roles: z.array(roleSchema).min(1),
    education: z
      .array(
        z
          .object({
            school: nonEmpty,
            degree: nonEmpty,
            location: nonEmpty,
            end: yearMonth,
            gpa: nonEmpty.optional(),
            awards: z.array(nonEmpty),
          })
          .strict(),
      )
      .min(1),
    skills: z.array(z.object({ label: nonEmpty, items: z.array(nonEmpty).min(1) }).strict()).min(1),
    certificates: z.array(nonEmpty),
    metrics: z
      .array(metricSchema)
      .refine(
        (metrics) => new Set(metrics.map((metric) => metric.id)).size === metrics.length,
        'metric ids must be unique',
      ),
    clientWork: z.array(
      z
        .object({
          slug: nonEmpty,
          title: nonEmpty,
          url: z.literal(clientWorkIndex),
          role: z.enum(['managed', 'team']),
        })
        .strict(),
    ),
    hidden: z.array(nonEmpty),
  })
  .strict()

export const profile: Profile = profileSchema.parse({
  identity: {
    name: 'Eduard Kakosyan',
    title: 'Lead AI Developer',
    company: 'AI-First Solutions',
    companyUrl: 'https://www.ai-first.ca',
    location: 'Halifax, Nova Scotia',
    country: 'Canada',
    citizenship: 'Canadian Citizen',
    website: 'https://kakosyaneduard.ca',
    github: 'https://github.com/EduardKakosyan',
    linkedin: 'https://www.linkedin.com/in/eduard-kakosyan',
    email: 'kakosyaneduard@gmail.com',
  },
  headline:
    'I lead tech and AI at AI-First Solutions, where I work with local organizations and build the software our own team runs on. I start with the problem and use AI only where it fits. This site covers that work, along with my own projects in loop engineering, local AI systems and anything else new in AI.',
  roles: [
    {
      id: 'ai-first',
      title: 'Lead AI Developer',
      scope: 'Tech & AI lead, leadership team',
      org: 'AI-First Solutions',
      orgUrl: 'https://www.ai-first.ca',
      location: 'Halifax, NS',
      start: '2025-02',
      summary:
        'I lead a four-person development team and sit on the leadership team. I designed Keystone, our operations software, and built Keeper, the meeting-notes and dictation app our team runs on our own hardware. For clients we build document-review agents, chat tools built around their content and an assistant that runs on a client’s own GPU. I also built and managed a data science and ML curriculum for a client’s workforce program through AI-First.',
    },
    {
      id: 'teaching',
      title: 'AI Instructor',
      org: 'ShiftKey Labs, Dalhousie University',
      location: 'Halifax, NS',
      start: '2025-08',
      end: '2026-04',
      summary:
        'I co-taught an agentic AI course for non-CS students at Dalhousie, helping them build agents with n8n and Bolt.',
    },
    {
      id: 'cargrep',
      title: 'Co-Founder',
      org: 'CarGrep (ShiftKey Build)',
      location: 'Halifax, NS',
      start: '2024-10',
      end: '2025-01',
      summary: 'I co-founded and built an AI car-recommendation platform for the Canadian market.',
    },
  ],
  education: [
    {
      school: 'Dalhousie University',
      degree: 'Bachelor of Computer Science (Co-op)',
      location: 'Halifax, NS',
      end: '2025-05',
      gpa: '3.8',
      awards: ['Future Tech Leaders Award', 'Sexton Scholar Award', 'Dean’s List'],
    },
  ],
  skills: [
    {
      label: 'AI & LLMs',
      items: [
        'Anthropic Claude',
        'Claude Code',
        'MCP',
        'RAG',
        'pgvector',
        'Voyage',
        'Vercel AI SDK',
        'evals',
        'vLLM',
        'SGLang',
        'Ollama',
        'llama.cpp',
        'MLX',
        'OpenHands',
        'LangChain',
      ],
    },
    {
      label: 'Languages & Frameworks',
      items: [
        'Python',
        'TypeScript',
        'SQL',
        'Go',
        'JavaScript',
        'Swift',
        'Rust',
        'Java',
        'C',
        'Next.js',
        'React',
        'Node.js',
        'FastAPI',
      ],
    },
    {
      label: 'Cloud & Infrastructure',
      items: [
        'Supabase',
        'PostgreSQL',
        'Azure',
        'AWS',
        'Vercel',
        'Docker',
        'Linux',
        'Git',
        'NVIDIA DGX Spark',
      ],
    },
    {
      label: 'Integrations & Automation',
      items: [
        'Microsoft Graph',
        'Power Automate',
        'Copilot Studio',
        'Dataverse',
        'n8n',
        'Vapi',
        'Fireflies',
        'Linear',
        'QuickBooks Online',
        'CRM pipelines',
      ],
    },
  ],
  certificates: [
    'AWS Cloud Practitioner',
    'Communication Technologies & Cyber Security (Dalhousie)',
  ],
  metrics: [
    {
      id: 'projects',
      value: '39',
      detail: 'across 31 organizations',
      label: 'client projects',
      definition:
        'Client project records in the AI-First Dashboard that Eduard managed (18), worked on (14) or logged time to (7), across 31 organizations. Counted 2026-10-19.',
      surfaces: ['resume', 'site'],
    },
    {
      id: 'builds',
      value: '5',
      label: 'custom client builds delivered',
      definition:
        'Custom software builds for clients that Eduard managed and that were handed over to the client: an RFQ agent for an HVAC firm, a contract-review agent for a recruitment firm, a voice agent that logs sales debriefs, and two RAG assistants. Not counted: an RFP agent that was built but never deployed (the client was acquired), two builds in progress and one that never started. Nothing here claims daily production use. From AI-First Dashboard projects and meeting records, counted 2026-11-27.',
      surfaces: ['resume'],
    },
    {
      id: 'learners',
      value: '226',
      detail: '88% completion',
      label: 'learners',
      definition:
        'Learners in the Skills for Hire Atlantic data science and ML program whose curriculum Eduard built and managed through AI-First Solutions, with 88% completion. This was a client engagement, separate from his teaching at ShiftKey Labs. Published in the AI-First case studies (https://www.ai-first.ca/work).',
      surfaces: ['resume', 'site'],
    },
    {
      id: 'oppsWon',
      value: '18 of 40',
      detail: '67% of decided deals',
      label: 'sales opportunities won',
      definition:
        'AI-First Dashboard opportunities with owner = Eduard: 18 won of 40 owned; 67% of the 27 decided (won or lost). No dollar value is published. Counted 2026-10-19.',
      surfaces: ['resume'],
    },
    {
      id: 'keystoneOps',
      value: '150',
      label: 'Keystone operations',
      definition:
        'Entries in the Keystone capability registry (src/registry.ts) on main: 148 on 2026-11-25. Each one is served to both the web app and Claude over MCP. Copy says “about”.',
      surfaces: ['resume'],
    },
    {
      id: 'keystoneTests',
      value: '1,300',
      label: 'row-level security tests',
      definition:
        'Test cases declared under tests/rls in the Keystone repository on main (80 files), which run against a real database to check the row-level rules. Counted from the source on 2026-11-27; parameterised cases run more. Copy says “over”.',
      surfaces: ['resume'],
    },
    {
      id: 'keeperSaving',
      value: '$3,132',
      detail: '9 seats at $29 a month',
      label: 'a year in notetaker fees',
      definition:
        'What the Fireflies notetaker costs AI-First a year: $29 a seat a month for 9 seats, times 12 (Eduard, 2026-11-27). The cost grows with each person the company adds. Keeper replaced it and the Wispr Flow dictation subscription in November 2026; the dictation saving is not counted.',
      surfaces: ['resume'],
    },
  ],
  clientWork: [
    {
      slug: 'workforce-ml-curriculum',
      title: 'Provincial workforce program: data science and ML curriculum',
      url: clientWorkIndex,
      role: 'managed',
    },
    {
      slug: 'hvac-rfq-triage',
      title: 'HVAC engineering and contracting firm: RFQ triage',
      url: clientWorkIndex,
      role: 'managed',
    },
    {
      slug: 'recruitment-legal-review',
      title: 'National recruitment and executive search firm: legal review',
      url: clientWorkIndex,
      role: 'managed',
    },
    {
      slug: 'consulting-rfp-triage',
      title: 'Management consulting firm: RFP triage',
      url: clientWorkIndex,
      role: 'managed',
    },
    {
      slug: 'broadcast-equipment-accelerator',
      title: 'Broadcast-equipment manufacturer: AI Accelerator',
      url: clientWorkIndex,
      role: 'team',
    },
    {
      slug: 'fermentation-biotech-accelerator',
      title: 'Fermentation biotech company: AI Accelerator',
      url: clientWorkIndex,
      role: 'team',
    },
    {
      slug: 'cabinet-manufacturer-micro-accelerator',
      title: 'Cabinet manufacturer: Micro Accelerator',
      url: clientWorkIndex,
      role: 'team',
    },
  ],
  // empty on purpose: the names are in hidden-terms.local.txt (see Profile.hidden)
  hidden: [],
})

export const identity = profile.identity

/** The metrics an artifact may print. */
export function metricsFor(surface: Surface): Metric[] {
  return profile.metrics.filter((metric) => metric.surfaces.includes(surface))
}

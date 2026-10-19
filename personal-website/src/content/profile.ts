import { z } from 'zod'

// The facts every public artifact draws on: the site, the résumé PDF, the GitHub profile README
// and the guide. Each artifact writes its own copy from these facts.
// No `@/` imports: Node scripts (scripts/render-resume.mts) load this file without a bundler.

export type Surface = 'resume' | 'site' | 'github'
export type MetricId = 'projects' | 'learners' | 'oppsWon'

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
  /** GTM and automation first. */
  skills: { label: string; items: string[] }[]
  certificates: string[]
  metrics: Metric[]
  /** The case studies published on ai-first.ca/work (the only client work the site may cite), anonymised. */
  clientWork: ClientWork[]
  /**
   * Eduard's own ventures that must not appear in any artifact. Client names never go in this
   * repo, not even here: they live in the gitignored hidden-terms.local.txt (or the HIDDEN_TERMS
   * env var), which the tests read to scan every tracked file.
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
    id: z.enum(['projects', 'learners', 'oppsWon']),
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
    company: 'AI-First Consulting',
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
    'I build AI tools that sales and operations teams actually use, connect them to the team’s own data, and stay until people use them.',
  roles: [
    {
      id: 'ai-first',
      title: 'Lead AI Developer',
      scope: 'Tech & AI lead, leadership team',
      org: 'AI-First Consulting',
      orgUrl: 'https://www.ai-first.ca',
      location: 'Halifax, NS',
      start: '2025-02',
      summary:
        'I run the dev team, build our internal systems and client AI projects, and sit on the leadership team.',
    },
    {
      id: 'teaching',
      title: 'AI Instructor & Curriculum Developer',
      org: 'ShiftKey Labs, Dalhousie University',
      location: 'Halifax, NS',
      start: '2025-08',
      end: '2026-04',
      summary:
        'I co-taught an agentic AI course at Dalhousie and built and managed the curriculum for a provincial data science and machine learning program.',
    },
    {
      id: 'cargrep',
      title: 'Co-Founder',
      org: 'CarGrep (ShiftKey Build)',
      orgUrl: 'https://www.cargrep.com',
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
      label: 'GTM & Automation',
      items: [
        'CRM pipelines',
        'Power Automate',
        'Copilot Studio',
        'Dataverse',
        'n8n',
        'Vapi',
        'Fireflies',
        'Linear',
        'QuickBooks Online',
        'Microsoft Graph',
      ],
    },
    {
      label: 'AI & LLMs',
      items: [
        'Anthropic Claude',
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
      id: 'learners',
      value: '226',
      detail: '88% completion',
      label: 'learners',
      definition:
        'Learners in the Skills for Hire Atlantic data science and ML program whose curriculum Eduard built and managed, with 88% completion, as published in the AI-First Consulting case studies (https://www.ai-first.ca/work).',
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
  hidden: ['Sideline', 'Breakwater'],
})

export const identity = profile.identity

/** The metrics an artifact may print. */
export function metricsFor(surface: Surface): Metric[] {
  return profile.metrics.filter((metric) => metric.surfaces.includes(surface))
}

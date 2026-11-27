// Résumé copy. Facts (names, titles, dates, links, skills, education) come from
// src/content/profile.ts; this file holds only the wording the résumé uses.
// Numbers are never typed here: use {metric:id} or {metric:id.detail} so a count can only
// appear if profile.ts defines it for the résumé. The résumé names no clients.
// `[text](/path)` links to a page on the site; the path must be a real route.
// Run `pnpm resume` after editing.

export interface ResumeGroup {
  label: string
  bullets: string[]
}

export interface ResumeRole {
  /** A `profile.roles[].id`. */
  roleId: string
  groups?: ResumeGroup[]
  bullets?: string[]
  /**
   * Instead of a heading and bullets, the role takes one line: title, organization, this
   * text and the dates. For a role that should take less space than the main one.
   */
  line?: string
}

export interface ResumeProject {
  name: string
  /** A `projects[].slug`; the name links to its page, or to the home page for `'/'`. */
  slug?: string
  /** One line after the name; the heading does not wrap, so keep it short. */
  description: string
  /** Bold, after the description, e.g. '1st Place, Atlantic AI Summit'. */
  award?: string
  when: string
}

export interface ResumeContent {
  summary: string
  experience: ResumeRole[]
  projects: ResumeProject[]
  /**
   * The résumé's subset of profile.skills, one line per group. Labels and items must exist in
   * profile.ts, so the résumé can't claim a skill the profile doesn't list.
   */
  skills: { label: string; items: string[] }[]
}

export const resumeContent: ResumeContent = {
  summary:
    'AI engineering lead. I start with the problem and use a model only where it fits, and I lead a four-person development team building AI systems for clients and for our own company.',
  experience: [
    {
      roleId: 'ai-first',
      groups: [
        {
          label: 'Internal products',
          bullets: [
            'Architect and lead of [Keystone](/projects/keystone), our operations system: about {metric:keystoneOps} operations, each declared once and served to both the web app and Claude over MCP under the same row-level permissions, checked by over {metric:keystoneTests} database tests (Next.js, Supabase).',
            'Ran discovery first: interviewed the leadership team and audited how the old dashboard was used.',
            'Replaced two paid subscriptions (the notetaker alone cost {metric:keeperSaving} a year, {metric:keeperSaving.detail}) with [Keeper](/projects/keeper), the meeting-notes and dictation app I built for our team: speech recognition on each Mac, summaries from an open-weights model on our own DGX Spark (Swift, Python).',
          ],
        },
        {
          label:
            'Client engineering: {metric:projects} projects {metric:projects.detail}, including {metric:builds} custom builds I led to delivery',
          bullets: [
            'Cut manual first-pass review of RFQs and contracts for HVAC and recruitment firms with triage agents I built to sort, score and flag each document (Power Automate, Copilot Studio).',
            'Led RAG assistants that answer from clients’ own content with cited sources; retrieval evals run on every build, with LLM-judged baselines before release (Next.js, pgvector).',
            'Leading an on-prem build: a local-model assistant on the client’s own GPU, so the data stays on site.',
          ],
        },
        {
          label: 'Engineering leadership & enablement',
          bullets: [
            'Hold the leadership team’s tech and AI seat; set technical direction and lead delivery across the team.',
            'Set how the team builds with coding agents: requirements and design are reviewed before code, each task runs in its own branch, and secret scans, lint and tests gate every commit.',
            'Designed and managed a client’s Skills for Hire data science and ML curriculum: {metric:learners} learners, {metric:learners.detail}.',
            'Ran AI Accelerator sprints, cohort programs and workshops for client teams, CPA firms and a college.',
          ],
        },
      ],
    },
    {
      roleId: 'teaching',
      line: 'co-taught agentic AI to non-CS students',
    },
    {
      roleId: 'cargrep',
      bullets: [
        'Built an AI car-recommendation platform with conversational search and streaming answers (GPT-4o).',
      ],
    },
  ],
  projects: [
    {
      name: 'dgx-autonomy',
      slug: 'dgx-autonomy',
      description:
        'a local model built Keeper’s first version unattended, graded by tests it can’t edit',
      when: '2026',
    },
    {
      name: 'lyfe',
      slug: 'lyfe',
      description:
        'iPhone app and Rust backend for my routines and goals; a model estimates meals, rules decide',
      when: '2026',
    },
    {
      name: 'kakosyaneduard.ca',
      slug: '/',
      description: 'my site as a small game at my cabin; a model only picks from answers I wrote',
      when: '2026',
    },
    {
      name: 'HealthByte',
      slug: 'healthbyte',
      description: 'LLM personas reacting to real and fake health news',
      award: '1st Place, Atlantic AI Summit',
      when: 'May 2025',
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
        'evals',
        'vLLM',
        'SGLang',
        'Ollama',
        'llama.cpp',
        'OpenHands',
      ],
    },
    {
      label: 'Languages & Frameworks',
      items: [
        'Python',
        'TypeScript',
        'SQL',
        'Swift',
        'Rust',
        'Go',
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
        'NVIDIA DGX Spark',
      ],
    },
    {
      label: 'Integrations & Automation',
      items: [
        'Microsoft Graph',
        'Power Automate',
        'Copilot Studio',
        'n8n',
        'Linear',
        'QuickBooks Online',
      ],
    },
  ],
}

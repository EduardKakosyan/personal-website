// Résumé copy. Facts (names, titles, dates, links, skills, education) come from
// src/content/profile.ts; this file holds only the wording the résumé uses.
// Numbers are never typed here: use {metric:id} or {metric:id.detail} so a count can only
// appear if profile.ts defines it for the résumé. The résumé names no clients.
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
}

export interface ResumeProject {
  name: string
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
            'Architect and lead of Keystone, our operations system: each operation is declared once and served to both the web app and Claude over MCP, under the same row-level permissions (Next.js, Supabase).',
            'Ran discovery first: interviewed the leadership team and audited how the old dashboard was used.',
            'Built Keeper, the meeting-notes and dictation app our team uses in place of two paid subscriptions: speech recognition on each Mac, summaries from an open-weights model on our own DGX Spark (Swift, Python).',
          ],
        },
        {
          label:
            'Client engineering: {metric:projects} projects {metric:projects.detail}, spanning AI Accelerator sprints and custom builds',
          bullets: [
            'Delivered RFQ, RFP and legal-review triage agents for HVAC, consulting and recruitment firms (Power Automate).',
            'Led RAG chat platforms grounded in clients’ own content, released only after passing evals (Next.js, pgvector).',
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
      bullets: [
        'Co-taught an agentic AI course for non-CS students at Dalhousie, who built agents with n8n and Bolt.',
      ],
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
      description:
        'a local open-weights model builds apps unattended, graded by tests it can’t edit',
      when: '2026',
    },
    {
      name: 'lyfe',
      description:
        'iPhone app and Rust backend for my routines and goals; a model estimates meals, rules decide',
      when: '2026',
    },
    {
      name: 'kakosyaneduard.ca',
      description: 'my site as a small game at my cabin; a model only picks from answers I wrote',
      when: '2026',
    },
    {
      name: 'HealthByte',
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

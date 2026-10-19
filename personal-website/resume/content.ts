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
    'Hands-on AI engineering lead working directly with clients, from discovery and architecture through integration and rollout. I lead a team of five developers building AI applications, workflow integrations and local-model systems.',
  experience: [
    {
      roleId: 'ai-first',
      groups: [
        {
          label:
            'Client engineering: {metric:projects} projects {metric:projects.detail}, spanning AI Accelerator sprints and custom builds',
          bullets: [
            'Built RFQ, RFP and legal-review triage agents for HVAC, consulting and recruitment firms (Power Automate).',
            'Led RAG chat platforms grounded in clients’ own content, with eval-gated releases (Next.js, pgvector, Claude).',
            'Leading an on-prem build: a local-model assistant on the client’s own GPU, so the data stays on site.',
          ],
        },
        {
          label: 'Architecture & systems integration',
          bullets: [
            'Lead architecture and development of Keystone (rolling out), connecting SharePoint, Linear and QuickBooks through a shared capability registry for staff and Claude via MCP.',
            'Ran discovery with a UX researcher to define workflows and shared metrics before building the system.',
            'Cut proposals from days to 30 minutes and connected client meetings to Linear tasks (Fireflies, Claude).',
          ],
        },
        {
          label: 'Engineering leadership & enablement',
          bullets: [
            'Hold the leadership team’s tech and AI seat; lead development, technical direction and delivery across the team.',
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
      name: 'Keeper',
      description:
        'self-hosted meeting memory on a local model, served over REST, MCP and a web UI',
      when: '2026',
    },
    {
      name: 'dgx-autonomy',
      description: 'a coding agent that runs unattended on a DGX Spark against tests it can’t edit',
      when: '2026',
    },
    {
      name: 'HUGO',
      description:
        'voice assistant for a Reachy Mini robot, with speech and the LLM local on a DGX Spark',
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
        'MCP',
        'RAG',
        'pgvector',
        'Voyage',
        'Vercel AI SDK',
        'evals',
        'vLLM',
        'SGLang',
        'Ollama',
      ],
    },
    {
      label: 'Languages & Frameworks',
      items: ['Python', 'TypeScript', 'SQL', 'Go', 'Next.js', 'React', 'Node.js', 'FastAPI'],
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

export interface ChatbotFunction {
  name: string
  description: string
  keywords: string[]
}

export interface FunctionCallResult {
  function: string
  args: Record<string, string>
  displayText: string
}

const FUNCTIONS: ChatbotFunction[] = [
  {
    name: 'navigate_to_page',
    description: 'Navigate to a page on the website',
    keywords: ['go to', 'show me', 'take me to', 'navigate to', 'open', 'visit'],
  },
  {
    name: 'show_project',
    description: 'Show a specific project',
    keywords: [
      'show project',
      'tell me about project',
      'healthbyte',
      'cargrep',
      'second brain',
      'q-learning',
    ],
  },
  {
    name: 'scroll_to_section',
    description: 'Scroll to a section on the current page',
    keywords: [
      'scroll to',
      'go to section',
      'show section',
      'expertise',
      'achievements',
      'contact section',
    ],
  },
]

const PAGE_MAP: Record<string, string> = {
  home: '/',
  projects: '/projects',
  contact: '/contact',
  blog: '/blog',
}

const PROJECT_MAP: Record<string, string> = {
  healthbyte: '/projects/healthbyte',
  cargrep: '/projects/cargrep',
  'second brain': '/projects/second-brain',
  'q-learning': '/projects/q-learning-network-simulator',
}

const SECTION_MAP: Record<string, string> = {
  hero: '[data-section="hero"]',
  expertise: '[data-section="expertise"]',
  achievements: '[data-section="achievements"]',
  'ai assistant': '[data-section="ai-assistant"]',
  assistant: '[data-section="ai-assistant"]',
  cta: '[data-section="cta"]',
  contact: '[data-section="cta"]',
}

export function detectFunctionCall(message: string): FunctionCallResult | null {
  const lower = message.toLowerCase()

  // Check for navigation intent
  for (const [pageName, path] of Object.entries(PAGE_MAP)) {
    if (
      lower.includes(`go to ${pageName}`) ||
      lower.includes(`show me ${pageName}`) ||
      lower.includes(`take me to ${pageName}`) ||
      lower.includes(`navigate to ${pageName}`) ||
      lower.includes(`open ${pageName}`)
    ) {
      return {
        function: 'navigate_to_page',
        args: { page: path },
        displayText: `Navigating to ${pageName}`,
      }
    }
  }

  // Check for project intent
  for (const [projectName, path] of Object.entries(PROJECT_MAP)) {
    if (
      lower.includes(projectName) &&
      (lower.includes('show') ||
        lower.includes('view') ||
        lower.includes('open') ||
        lower.includes('go to'))
    ) {
      return {
        function: 'show_project',
        args: { project: path },
        displayText: `Opening ${projectName} project`,
      }
    }
  }

  // Check for scroll intent
  for (const [sectionName, selector] of Object.entries(SECTION_MAP)) {
    if (
      (lower.includes('scroll to') || lower.includes('go to') || lower.includes('show')) &&
      lower.includes(sectionName)
    ) {
      return {
        function: 'scroll_to_section',
        args: { selector },
        displayText: `Scrolling to ${sectionName}`,
      }
    }
  }

  return null
}

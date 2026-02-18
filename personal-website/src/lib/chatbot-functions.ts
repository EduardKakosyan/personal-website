export interface FunctionCallResult {
  function: string
  args: Record<string, string>
  displayText: string
}

const PAGE_MAP: Record<string, string> = {
  home: '/',
  projects: '/projects',
  contact: '/contact',
  blog: '/blog',
}

const PROJECT_MAP: Record<string, string> = {
  healthbyte: '/projects/healthbyte',
  cargrep: '/projects/cargrep',
  'second-brain': '/projects/second-brain',
  'network-sim': '/projects/network-sim',
  hugo: '/projects/hugo',
  'acdc-dashboard': '/projects/acdc-dashboard',
  'dev-template': '/projects/dev-template',
}

const SECTION_MAP: Record<string, string> = {
  hero: '[data-section="hero"]',
  expertise: '[data-section="expertise"]',
  achievements: '[data-section="achievements"]',
  'ai-assistant': '[data-section="ai-assistant"]',
  cta: '[data-section="cta"]',
}

const pageNames = Object.keys(PAGE_MAP).join(', ')
const projectNames = Object.keys(PROJECT_MAP).join(', ')
const sectionNames = Object.keys(SECTION_MAP).join(', ')

export const TOOL_SYSTEM_PROMPT = `
You have access to navigation tools on this website. When the user wants to navigate somewhere, output a tool call using the exact format below. Do NOT include any other text when calling a tool.

TOOLS:

1. navigate_to_page - Navigate to a page on the website
   Parameters: { "page": one of [${pageNames}] }

2. show_project - Open a specific project page
   Parameters: { "project": one of [${projectNames}] }

3. scroll_to_section - Scroll to a section on the homepage
   Parameters: { "section": one of [${sectionNames}] }

FORMAT: When you decide to use a tool, output ONLY:
<function>{"name":"TOOL_NAME","parameters":{...}}</function>

EXAMPLES:
- User says "take me to your projects" -> <function>{"name":"navigate_to_page","parameters":{"page":"projects"}}</function>
- User says "show me the healthbyte project" -> <function>{"name":"show_project","parameters":{"project":"healthbyte"}}</function>
- User says "scroll to expertise" -> <function>{"name":"scroll_to_section","parameters":{"section":"expertise"}}</function>

IMPORTANT: Only use tools for navigation requests. For questions about Eduard, respond with normal text.
`

interface ToolCall {
  name: string
  parameters: Record<string, string>
}

/**
 * Try to parse a structured <function> tool call from the LLM output.
 */
function parseStructuredToolCall(output: string): FunctionCallResult | null {
  const match = output.match(/<function>([\s\S]*?)<\/function>/)
  if (!match) return null

  let parsed: ToolCall
  try {
    parsed = JSON.parse(match[1])
  } catch {
    return null
  }

  if (!parsed.name || !parsed.parameters) return null

  switch (parsed.name) {
    case 'navigate_to_page': {
      const page = parsed.parameters.page
      const path = PAGE_MAP[page]
      if (!path) return null
      return {
        function: 'navigate_to_page',
        args: { page: path },
        displayText: `Navigating to ${page}`,
      }
    }
    case 'show_project': {
      const project = parsed.parameters.project
      const path = PROJECT_MAP[project]
      if (!path) return null
      return {
        function: 'show_project',
        args: { project: path },
        displayText: `Opening ${project} project`,
      }
    }
    case 'scroll_to_section': {
      const section = parsed.parameters.section
      const selector = SECTION_MAP[section]
      if (!selector) return null
      return {
        function: 'scroll_to_section',
        args: { selector },
        displayText: `Scrolling to ${section}`,
      }
    }
    default:
      return null
  }
}

const NAV_INTENT = /\b(show me|go to|take me|navigate|open|visit|scroll to)\b/i

/**
 * Fallback: detect navigation intent from the user's input when the LLM
 * doesn't use the structured <function> format. Requires a navigation verb
 * plus a known target in the user message.
 */
function parseFallbackFromUserInput(userMessage: string): FunctionCallResult | null {
  const lower = userMessage.toLowerCase()
  if (!NAV_INTENT.test(lower)) return null

  // Check pages
  for (const [pageName, path] of Object.entries(PAGE_MAP)) {
    if (lower.includes(pageName)) {
      return {
        function: 'navigate_to_page',
        args: { page: path },
        displayText: `Navigating to ${pageName}`,
      }
    }
  }

  // Check projects (match slug or common name variants)
  for (const [projectName, path] of Object.entries(PROJECT_MAP)) {
    // Match "healthbyte", "second-brain" / "second brain", "network-sim" / "network sim", etc.
    const nameVariant = projectName.replace(/-/g, '[\\s-]?')
    if (new RegExp(`\\b${nameVariant}\\b`, 'i').test(lower)) {
      return {
        function: 'show_project',
        args: { project: path },
        displayText: `Opening ${projectName} project`,
      }
    }
  }

  // Check sections
  for (const [sectionName, selector] of Object.entries(SECTION_MAP)) {
    const nameVariant = sectionName.replace(/-/g, '[\\s-]?')
    if (new RegExp(`\\b${nameVariant}\\b`, 'i').test(lower)) {
      return {
        function: 'scroll_to_section',
        args: { selector },
        displayText: `Scrolling to ${sectionName}`,
      }
    }
  }

  return null
}

/**
 * Parse a tool call from LLM output. Tries structured <function> tags first,
 * then falls back to user-input intent detection for small models that don't
 * follow the structured format.
 */
export function parseToolCallFromOutput(
  output: string,
  userMessage: string,
): FunctionCallResult | null {
  return parseStructuredToolCall(output) ?? parseFallbackFromUserInput(userMessage)
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, AlertTriangle, ArrowRight, Smartphone } from 'lucide-react'
import { useWebLLMContext } from '@/components/providers/webllm-provider'
import { useChatbotActions } from '@/lib/hooks/use-chatbot-actions'
import { TOOL_SYSTEM_PROMPT, parseToolCallFromOutput } from '@/lib/chatbot-functions'
import { validateChatMessage } from '@/lib/validation'
import { sanitizeUserInput } from '@/lib/sanitizer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  validateUserInput,
  validateAIResponse,
  getEnhancedContext,
  getSuggestedPrompts,
  isLikelyEduardRelated,
} from '@/lib/guardrails'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  id: string
  isStreaming?: boolean
  functionCall?: {
    name: string
    displayText: string
  }
}

const BASE_CHATBOT_CONTEXT = `You are Eduard's personal website assistant. Keep responses short, friendly, and conversational. Never use markdown formatting - just plain text.

ABOUT EDUARD:
Eduard is a Lead AI Developer with 3+ years of experience who graduated from Dalhousie University with a computer science degree. He builds AI apps that solve real problems, teaches AI courses, develops curriculum, and helps businesses figure out how to use AI effectively.

WHAT HE'S UP TO:
- Teaching AI courses and developing curriculum (Dalhousie, Digital Nova Scotia, Shiftkey Labs)
- Building and deploying AI agents for 20+ clients across consulting, engineering, and legal industries
- Running AI workshops for executive search companies globally
- Developing the Advanced Data Science & Machine Learning curriculum for Digital Nova Scotia (150+ participants)

PERSONAL STUFF:
He enjoys hiking, camping, and photography when not coding. He's into hackathons and loves sharing what he learns with others.

TECH SKILLS:
Languages: Python, Java, C, Rust, SQL, TypeScript, JavaScript
AI Tools: OpenAI SDK, Anthropic Claude, Azure OpenAI, Ollama, LangChain, LangGraph, LangSmith, CrewAI, Pinecone, ChromaDB, ElevenLabs, HuggingFace Transformers, Whisper, MLX, Claude Code
Web Dev: Next.js, React, Vercel, Vercel AI SDK, Supabase, Tailwind CSS
Other Tools: Git, Docker, Linux, macOS, AWS, Azure, OpenHands, n8n

RECENT ACTIVITY (newest first):
- Feb 2026: AI Workshops for Executive Search - Demonstrated AI capabilities to executive search companies globally through 4 workshops
- Nov 2025 to Present: Digital Nova Scotia SFHA-DS & ML - Developing Advanced Data Science & ML curriculum for 150+ participants with Shiftkey Labs
- Sep to Oct 2025: Agentic AI Course at Dalhousie - Taught generative AI and agents to 70+ students with Shiftkey Labs
- 2025 to Present: 20+ Client Agent Deployments - Built live agents for consulting firms, engineering companies, and legal document processing

PROJECTS:

HealthByte - Won first place at Atlantic AI Summit 2025. It's a platform that helps fight health misinformation by testing how people might react to medical content before it gets published. Uses AI agents to simulate public reactions. Built with Python and OpenAI. You can check it out at healthbyte-dashboard.vercel.app

CarGrep - An AI car recommendation platform that helps people find cars in Canada. It has a chat interface and monitors car markets in real-time. Live at cargrep.com

Q-Learning Network Simulator - A research project comparing different network routing methods. Tests how AI-based routing performs against traditional algorithms in changing network conditions.

Second Brain - Got second place at Volta Hackathon Dec 2024. It's a smart assistant for university students that connects to Google Drive and calendars to help with time management and learning.

RESPONSE STYLE:
- Keep answers under 3 sentences when possible
- Be casual and friendly, not formal
- No bullet points, lists, or markdown formatting
- If someone asks about something not related to Eduard, just redirect politely
- Mention live demos when relevant
- Don't oversell or use buzzwords
- When you are asked about how to reach Eduard, just say "You can reach him at eduard@ai-first.ca or check out Contact page for more info"
- His website is https://kakosyaneduard.ca
- He is employed at AI-First Consulting, a company that helps small/medium Atlantic Canadian businesses use AI effectively.
- If you are asked about anything not about Eduard, just say "I'm sorry, I can only answer questions about Eduard."
- Do not engage in political, religious, or other controversial discussions.
`

const CHATBOT_CONTEXT = getEnhancedContext(BASE_CHATBOT_CONTEXT) + TOOL_SYSTEM_PROMPT

const generateMessageId = () => `emsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export function EmbeddedChat() {
  const {
    engine,
    isInitializing,
    isSupported,
    isMobile,
    downloadProgress,
    estimatedTimeRemaining,
    error,
    generateStreamingResponse,
  } = useWebLLMContext()

  const { executeAction } = useChatbotActions()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [inputError, setInputError] = useState('')
  const [isOffTopicInput, setIsOffTopicInput] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const welcomeSet = useRef(false)

  // Set welcome message once engine is ready
  useEffect(() => {
    if (engine && !welcomeSet.current) {
      welcomeSet.current = true
      setMessages([
        {
          id: generateMessageId(),
          role: 'assistant',
          content: "Hey! Ask me anything about Eduard's projects or background.",
          timestamp: new Date(),
        },
      ])
    }
  }, [engine])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !engine) return

    setInputError('')

    const validation = validateChatMessage({ content: inputMessage.trim() })
    if (!validation.success) {
      setInputError(validation.errors[0] || 'Invalid message')
      return
    }

    const guardrailCheck = validateUserInput(inputMessage.trim())
    if (!guardrailCheck.allowed) {
      const userMsg: Message = {
        id: generateMessageId(),
        role: 'user',
        content: inputMessage.trim(),
        timestamp: new Date(),
      }
      const guardMsg: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content:
          guardrailCheck.suggestedResponse ||
          "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg, guardMsg])
      setInputMessage('')
      return
    }

    const sanitizedContent = sanitizeUserInput(validation.data.content)

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: sanitizedContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')

    setIsLoading(true)

    const streamingId = generateMessageId()
    const streamingMessage: Message = {
      id: streamingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages((prev) => [...prev, streamingMessage])

    try {
      const conversationMessages: ChatCompletionMessageParam[] = [
        { role: 'system', content: CHATBOT_CONTEXT },
        ...messages.map(
          (msg) => ({ role: msg.role, content: msg.content }) as ChatCompletionMessageParam,
        ),
        { role: 'user', content: userMessage.content },
      ]

      const responseContent = await generateStreamingResponse(
        conversationMessages.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : '',
        })),
        (chunk) => {
          // Hide <function> tags from streaming display
          const displayChunk = chunk.replace(/<function>[\s\S]*$/, '').trim()
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamingId ? { ...msg, content: displayChunk } : msg)),
          )
        },
      )

      // Check if the LLM output a tool call
      const toolCall = parseToolCallFromOutput(responseContent, userMessage.content)

      if (toolCall) {
        // Replace streaming message with action card
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingId
              ? {
                  ...msg,
                  content: toolCall.displayText,
                  isStreaming: false,
                  functionCall: {
                    name: toolCall.function,
                    displayText: toolCall.displayText,
                  },
                }
              : msg,
          ),
        )
        setTimeout(() => executeAction(toolCall), 500)
      } else {
        const responseValidation = validateAIResponse(responseContent)
        let finalResponse = responseContent

        if (!responseValidation.allowed) {
          finalResponse =
            responseValidation.suggestedResponse ||
            "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?"
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingId ? { ...msg, content: finalResponse, isStreaming: false } : msg,
          ),
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingId
            ? {
                ...msg,
                content: "I'm sorry, I encountered an error. Please try again.",
                isStreaming: false,
              }
            : msg,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputMessage(newValue)
    if (inputError) setInputError('')
    if (newValue.trim()) {
      setIsOffTopicInput(!isLikelyEduardRelated(newValue.trim()))
    } else {
      setIsOffTopicInput(false)
    }
  }

  const quickActions = getSuggestedPrompts().slice(0, 4)

  return (
    <div className="glass-card rounded-xl h-[500px] flex flex-col overflow-hidden">
      {/* Loading state */}
      {isInitializing && (
        <div className="p-4 border-b border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span>Loading AI model...</span>
            {estimatedTimeRemaining && downloadProgress > 0 && downloadProgress < 100 && (
              <span className="ml-auto text-xs font-mono text-[var(--accent-neon)]">
                {Math.round(downloadProgress)}% &mdash; {estimatedTimeRemaining}
              </span>
            )}
          </div>
          {downloadProgress > 0 && downloadProgress < 100 && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent-neon)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${downloadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && !isInitializing && (
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Not supported state */}
      {!isSupported && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          {isMobile ? (
            <div className="space-y-2">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium text-sm">Not available on this device yet</p>
              <p className="text-xs text-muted-foreground">
                This AI runs entirely in your browser using WebGPU, which your mobile browser
                doesn&apos;t support yet.
              </p>
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <p>
                  <strong>Android:</strong> Update Chrome to 121+
                </p>
                <p>
                  <strong>iPhone/iPad:</strong> Requires iOS 26+ with Safari
                </p>
                <p>
                  <strong>Desktop:</strong> Works on Chrome, Edge, Firefox, or Safari
                </p>
              </div>
            </div>
          ) : (
            <div>
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="font-medium text-sm">WebGPU Required</p>
              <p className="text-xs text-muted-foreground mt-1">
                This AI assistant runs entirely in your browser and requires WebGPU. Please use a
                recent version of Chrome, Edge, Firefox, or Safari.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      {isSupported && (
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-[var(--accent-neon)]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-[var(--accent-neon)]" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] md:max-w-[80%] rounded-lg p-3 text-sm break-words whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/50',
                  )}
                >
                  {message.functionCall && (
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent-neon)] mb-1">
                      <ArrowRight className="h-3 w-3" />
                      {message.functionCall.displayText}
                    </div>
                  )}
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-0.5 h-4 bg-[var(--accent-neon)] ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Quick actions for new conversations */}
          {messages.length === 1 && !isLoading && engine && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left justify-start"
                    onClick={() => setInputMessage(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder when loading and no messages */}
          {isInitializing && messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Preparing your AI assistant...
            </div>
          )}

          <div />
        </div>
      )}

      {/* Input area */}
      {isSupported && (
        <div className="border-t border-border/50 p-4 flex-shrink-0">
          {inputError && (
            <div className="mb-2 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {inputError}
            </div>
          )}

          {isOffTopicInput && inputMessage.trim() && (
            <div className="mb-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              This doesn&apos;t seem to be about Eduard. Try asking about his projects or
              background!
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={
                !engine
                  ? isInitializing
                    ? 'Loading model...'
                    : 'Initializing...'
                  : "Ask about Eduard's projects..."
              }
              disabled={!engine || isLoading}
              className={cn(
                'flex-1 resize-none border rounded-md px-3 py-2 text-sm bg-background/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[100px] disabled:opacity-50 transition-colors',
                isOffTopicInput && inputMessage.trim() && 'border-yellow-400 focus:ring-yellow-400',
              )}
              rows={1}
              maxLength={1000}
              aria-label="Chat message input"
            />
            <Button
              onClick={sendMessage}
              disabled={!engine || !inputMessage.trim() || isLoading}
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

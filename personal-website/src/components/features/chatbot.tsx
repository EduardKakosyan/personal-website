'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  AlertTriangle,
  Trash2,
  ChevronDown,
  Maximize2,
  Minimize2,
  ArrowRight,
  Zap,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useWebLLM, MODEL_TIERS } from '@/lib/hooks/use-webllm'
import { useChatbotActions } from '@/lib/hooks/use-chatbot-actions'
import { detectFunctionCall } from '@/lib/chatbot-functions'
import { validateChatMessage } from '@/lib/validation'
import { sanitizeUserInput } from '@/lib/sanitizer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { TokenDisplay } from '@/components/ui/token-display'
import { useTokenSession } from '@/lib/hooks/use-token-session'
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

interface RateLimit {
  count: number
  resetTime: number
}

const BASE_CHATBOT_CONTEXT = `You are Eduard's personal website assistant. Keep responses short, friendly, and conversational. Never use markdown formatting - just plain text.

ABOUT EDUARD:
Eduard is an AI developer who graduated from Dalhousie University with a computer science degree. He likes building AI apps that actually solve real problems and helps businesses figure out how to use AI effectively.

WHAT HE'S UP TO:
- Helping small and medium businesses understand and use AI
- Running workshops on AI topics
- Building practical AI solutions

PERSONAL STUFF:
He enjoys hiking, camping, and photography when not coding. He's into hackathons and loves sharing what he learns with others.

TECH SKILLS:
Languages: Python, Java, C, Rust, SQL, TypeScript, JavaScript
AI Tools: OpenAI SDK, Azure OpenAI, Ollama, LangChain, LangGraph, Pinecone
Web Dev: Next.js, React, Vercel, Supabase, Tailwind CSS
Other Tools: Git, Docker, Linux, macOS, AWS, Azure

PROJECTS:

HealthByte - Won first place at Atlantic AI Conference Hackathon 2025. It's a platform that helps fight health misinformation by testing how people might react to medical content before it gets published. Uses AI agents to simulate public reactions. Built with Python and OpenAI. You can check it out at healthbyte-dashboard.vercel.app

CarGrep - An AI car recommendation platform that helps people find cars in Canada. It has a chat interface and monitors car markets in real-time. Live at cargrep.com

Q-Learning Network Simulator - A research project comparing different network routing methods. Tests how AI-based routing performs against traditional algorithms in changing network conditions.

Second Brain - Got second place at Volta Hackathon. It's a smart assistant for university students that connects to Google Drive and calendars to help with time management and learning.

RESPONSE STYLE:
- Keep answers under 3 sentences when possible
- Be casual and friendly, not formal
- No bullet points, lists, or markdown formatting
- If someone asks about something not related to Eduard, just redirect politely
- Mention live demos when relevant
- Don't oversell or use buzzwords
- When you are asked about how to reach Eduard, just say "You can reach him at eduard@ai-first.ca or check out Contact page for more info"
- His website is https://kakosyaneduard.ca
- He is employed at AI First, a company that helps small/medium Atlantic Canadian businesses use AI effectively.
- If you are asked about anything not about Eduard, just say "I'm sorry, I can only answer questions about Eduard."
- Do not engage in political, religious, or other controversial discussions.
`

const CHATBOT_CONTEXT = getEnhancedContext(BASE_CHATBOT_CONTEXT)

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60000

const MODEL_ICONS = {
  fast: Zap,
  balanced: Scale,
  quality: Sparkles,
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimit, setRateLimit] = useState<RateLimit>({
    count: 0,
    resetTime: Date.now() + RATE_LIMIT_WINDOW,
  })
  const [inputError, setInputError] = useState('')
  const [isOffTopicInput, setIsOffTopicInput] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)

  const { executeAction } = useChatbotActions()

  const {
    session,
    currentInputTokens,
    currentInputAnalysis,
    conversationTokens,
    warningLevel,
    remainingContext,
    updateInput,
    addMessage,
    resetSession,
    exportSession,
    importSession,
  } = useTokenSession(
    messages.map((msg) => ({ role: msg.role, content: msg.content })),
    CHATBOT_CONTEXT,
    'llama3.2',
  )

  const {
    engine,
    isInitializing,
    isSupported,
    currentModel,
    downloadProgress,
    initialize,
    switchModel,
    generateStreamingResponse,
  } = useWebLLM({
    onInitialized: () => {
      const welcomeMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: "Hey! Ask me anything about Eduard's projects or background.",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: `Sorry, I'm having trouble starting up: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages([errorMessage])
    },
  })

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const checkRateLimit = (): boolean => {
    const now = Date.now()
    if (now > rateLimit.resetTime) {
      setRateLimit({ count: 0, resetTime: now + RATE_LIMIT_WINDOW })
      return true
    }
    if (rateLimit.count >= RATE_LIMIT_MAX) {
      return false
    }
    return true
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    updateInput(inputMessage)
  }, [inputMessage, updateInput])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isFullscreen])

  const clearConversation = () => {
    setMessages([
      {
        id: generateMessageId(),
        role: 'assistant',
        content: "Hey! Ask me anything about Eduard's projects or background.",
        timestamp: new Date(),
      },
    ])
    resetSession()
  }

  const handleExportSession = () => {
    const data = exportSession()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-session-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !engine) return

    setInputError('')

    const validation = validateChatMessage({ content: inputMessage.trim() })
    if (!validation.success) {
      setInputError(validation.errors[0] || 'Invalid message')
      return
    }

    // Check for function calls
    const functionCall = detectFunctionCall(inputMessage.trim())

    const guardrailCheck = validateUserInput(inputMessage.trim())
    if (!guardrailCheck.allowed && !functionCall) {
      const guardrailMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content:
          guardrailCheck.suggestedResponse ||
          "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?",
        timestamp: new Date(),
      }
      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content: inputMessage.trim(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage, guardrailMessage])
      setInputMessage('')
      addMessage(userMessage.content, guardrailMessage.content)
      return
    }

    if (!checkRateLimit()) {
      setInputError('Rate limit exceeded. Please wait before sending another message.')
      return
    }

    setRateLimit((prev) => ({ ...prev, count: prev.count + 1 }))

    const sanitizedContent = sanitizeUserInput(validation.data.content)

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: sanitizedContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')

    // Handle function call
    if (functionCall) {
      const actionMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: functionCall.displayText,
        timestamp: new Date(),
        functionCall: {
          name: functionCall.function,
          displayText: functionCall.displayText,
        },
      }
      setMessages((prev) => [...prev, actionMessage])
      addMessage(userMessage.content, actionMessage.content)

      // Execute the action after a brief delay
      setTimeout(() => executeAction(functionCall), 500)
      return
    }

    setIsLoading(true)

    // Create a streaming message placeholder
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
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamingId ? { ...msg, content: chunk } : msg)),
          )
        },
      )

      // Validate final response
      const responseValidation = validateAIResponse(responseContent)
      let finalResponse = responseContent

      if (!responseValidation.allowed) {
        finalResponse =
          responseValidation.suggestedResponse ||
          "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?"
      }

      // Finalize the streaming message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingId ? { ...msg, content: finalResponse, isStreaming: false } : msg,
        ),
      )

      addMessage(userMessage.content, finalResponse)
    } catch (error) {
      console.error('Error generating response:', error)
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
      addMessage(userMessage.content, "I'm sorry, I encountered an error. Please try again.")
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

  const toggleChat = () => {
    if (!isOpen && !engine && !isInitializing && isSupported) {
      initialize()
    }
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setIsMinimized(false)
  }

  const quickActions = getSuggestedPrompts().slice(0, 4)

  const currentTier = MODEL_TIERS.find((t) => t.modelId === currentModel) || MODEL_TIERS[1]

  const getChatWindowClasses = () => {
    const baseClasses = 'fixed shadow-2xl flex flex-col overflow-hidden'

    if (isFullscreen) {
      return `${baseClasses} inset-0 z-50 rounded-none`
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (isMinimized) {
        return `${baseClasses} bottom-20 left-4 right-4 h-16 z-40 rounded-t-xl border border-b-0`
      }
      return `${baseClasses} bottom-20 left-4 right-4 h-[70vh] max-h-[600px] z-40 rounded-t-xl border border-b-0`
    }

    if (isMinimized) {
      return `${baseClasses} bottom-24 right-6 w-80 h-16 z-40 rounded-lg border`
    }
    return `${baseClasses} bottom-24 right-6 w-96 h-[500px] z-40 rounded-lg border`
  }

  return (
    <ErrorBoundary>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={toggleChat}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200',
            !isOpen && 'ring-2 ring-[var(--accent-neon)]/30 ring-offset-2 ring-offset-background',
          )}
          size="icon"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
        {/* Pulsing ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[var(--accent-neon)]/20 pointer-events-none" />
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card ref={chatWindowRef} className={getChatWindowClasses()}>
              {/* Header */}
              <CardHeader className={cn('pb-3 border-b flex-shrink-0', isMinimized && 'pb-2')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent-neon)]/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-[var(--accent-neon)]" />
                    </div>
                    <div className={cn(isMinimized && 'hidden sm:block')}>
                      <CardTitle className="text-lg">Eduard&apos;s Assistant</CardTitle>
                      {!isMinimized && (
                        <button
                          onClick={() => setShowModelSelector(!showModelSelector)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          {currentTier.label} mode
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 transition-transform',
                              showModelSelector && 'rotate-180',
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="md:hidden flex items-center gap-1">
                      <Button
                        onClick={toggleChat}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="Close chat"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="hidden md:flex items-center gap-1">
                      <Button
                        onClick={clearConversation}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="Clear conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={toggleChat}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="Close chat"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Model selector dropdown */}
                <AnimatePresence>
                  {showModelSelector && !isMinimized && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 pt-2">
                        {MODEL_TIERS.map((tier) => {
                          const Icon = MODEL_ICONS[tier.id as keyof typeof MODEL_ICONS]
                          return (
                            <button
                              key={tier.id}
                              onClick={() => {
                                switchModel(tier.modelId)
                                setShowModelSelector(false)
                              }}
                              disabled={isInitializing}
                              className={cn(
                                'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                                currentModel === tier.modelId
                                  ? 'border-[var(--accent-neon)] bg-[var(--accent-neon)]/10'
                                  : 'border-border hover:border-[var(--accent-neon)]/50',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span className="font-medium">{tier.label}</span>
                              <span className="text-muted-foreground text-[10px]">
                                {tier.description}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status indicators */}
                {!isMinimized && (
                  <>
                    {isInitializing && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <LoadingSpinner size="sm" />
                          Loading model...
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
                    {!isSupported && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        WebGPU not supported
                      </div>
                    )}
                  </>
                )}
              </CardHeader>

              {/* Messages Area */}
              {!isMinimized && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!isSupported && messages.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground p-4">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                        <p className="font-medium">WebGPU Required</p>
                        <p>
                          This AI assistant requires a WebGPU-compatible browser like Chrome or
                          Edge.
                        </p>
                      </div>
                    )}

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
                                : 'bg-muted',
                            )}
                          >
                            {/* Function call action card */}
                            {message.functionCall && (
                              <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent-neon)] mb-1">
                                <ArrowRight className="h-3 w-3" />
                                {message.functionCall.displayText}
                              </div>
                            )}
                            {message.content}
                            {/* Streaming cursor */}
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

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-4 flex-shrink-0">
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
                          !isSupported
                            ? 'WebGPU required...'
                            : engine
                              ? "Ask about Eduard's projects..."
                              : 'Initializing...'
                        }
                        disabled={!engine || isLoading || !isSupported}
                        className={cn(
                          'flex-1 resize-none border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[100px] disabled:opacity-50 transition-colors',
                          isOffTopicInput &&
                            inputMessage.trim() &&
                            'border-yellow-400 focus:ring-yellow-400',
                        )}
                        rows={1}
                        maxLength={1000}
                        aria-label="Chat message input"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!engine || !inputMessage.trim() || isLoading || !isSupported}
                        size="icon"
                        className="h-11 w-11 flex-shrink-0"
                        aria-label="Send message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {!engine && !isInitializing && isSupported && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Click the chat button to initialize the AI assistant
                      </p>
                    )}

                    {/* Token Display */}
                    <div className="mt-2">
                      {currentInputAnalysis && (
                        <TokenDisplay
                          currentTokens={currentInputTokens}
                          analysis={currentInputAnalysis}
                          session={session}
                          conversationTokens={conversationTokens}
                          warningLevel={warningLevel}
                          remainingContext={remainingContext}
                          modelName="llama3.2"
                          compact={true}
                          showDetails={true}
                          onExport={handleExportSession}
                          onImport={importSession}
                          onReset={resetSession}
                        />
                      )}
                      {!currentInputAnalysis && currentInputTokens > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Tokens: {currentInputTokens}
                        </div>
                      )}
                    </div>

                    {rateLimit.count > 0 && (
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-muted-foreground">
                          Messages: {rateLimit.count}/{RATE_LIMIT_MAX}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}

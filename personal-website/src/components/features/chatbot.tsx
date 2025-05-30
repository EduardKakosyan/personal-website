'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, Bot, User, AlertTriangle, Trash2, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { useWebLLM } from '@/lib/hooks/use-webllm'
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
	isLikelyEduardRelated 
} from '@/lib/guardrails'
import { cn } from '@/lib/utils'

interface Message {
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	id: string
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

// Enhanced context with guardrails
const CHATBOT_CONTEXT = getEnhancedContext(BASE_CHATBOT_CONTEXT)

// Rate limiting constants
const RATE_LIMIT_MAX = 10 // messages per window
const RATE_LIMIT_WINDOW = 60000 // 1 minute in milliseconds

export function Chatbot() {
	const [isOpen, setIsOpen] = useState(false)
	const [isMinimized, setIsMinimized] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [inputMessage, setInputMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [rateLimit, setRateLimit] = useState<RateLimit>({ count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW })
	const [inputError, setInputError] = useState('')
	const [isOffTopicInput, setIsOffTopicInput] = useState(false)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const chatWindowRef = useRef<HTMLDivElement>(null)

	// Token session hook
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
		importSession
	} = useTokenSession(
		messages.map(msg => ({ role: msg.role, content: msg.content })),
		CHATBOT_CONTEXT,
		'llama3.2'
	)

	const { engine, isInitializing, isSupported, initialize, generateResponse } = useWebLLM({
		onInitialized: () => {
			const welcomeMessage: Message = {
				id: generateMessageId(),
				role: 'assistant',
				content: "Hey! Ask me anything about Eduard's projects or background.",
				timestamp: new Date()
			}
			setMessages([welcomeMessage])
		},
		onError: (error) => {
			const errorMessage: Message = {
				id: generateMessageId(),
				role: 'assistant',
				content: `Sorry, I'm having trouble starting up: ${error.message}`,
				timestamp: new Date()
			}
			setMessages([errorMessage])
		}
	})

	// Generate unique message IDs
	const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

	// Check rate limit
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

	// Scroll to bottom of messages
	const scrollToBottom = () => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}, 100)
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	// Update token session when input changes
	useEffect(() => {
		updateInput(inputMessage)
	}, [inputMessage, updateInput])

	// Handle escape key
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

	// Clear conversation
	const clearConversation = () => {
		setMessages([{
			id: generateMessageId(),
			role: 'assistant',
			content: "Hey! Ask me anything about Eduard's projects or background.",
			timestamp: new Date()
		}])
		resetSession()
	}

	// Export session data
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

		// Clear any previous input errors
		setInputError('')

		// Validate input
		const validation = validateChatMessage({ content: inputMessage.trim() })
		if (!validation.success) {
			setInputError(validation.errors[0] || 'Invalid message')
			return
		}

		// Guardrail validation - check if input is appropriate
		const guardrailCheck = validateUserInput(inputMessage.trim())
		if (!guardrailCheck.allowed) {
			console.log('Guardrail blocked input:', guardrailCheck.reason)
			
			// Provide immediate guardrail response without calling AI
			const guardrailMessage: Message = {
				id: generateMessageId(),
				role: 'assistant',
				content: guardrailCheck.suggestedResponse || "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?",
				timestamp: new Date()
			}
			
			const userMessage: Message = {
				id: generateMessageId(),
				role: 'user',
				content: inputMessage.trim(),
				timestamp: new Date()
			}
			
			setMessages(prev => [...prev, userMessage, guardrailMessage])
			setInputMessage('')
			
			// Add to token session
			addMessage(userMessage.content, guardrailMessage.content)
			return
		}

		// Check rate limiting
		if (!checkRateLimit()) {
			setInputError('Rate limit exceeded. Please wait before sending another message.')
			return
		}

		// Update rate limit
		setRateLimit(prev => ({ ...prev, count: prev.count + 1 }))

		// Sanitize input
		const sanitizedContent = sanitizeUserInput(validation.data.content)

		const userMessage: Message = {
			id: generateMessageId(),
			role: 'user',
			content: sanitizedContent,
			timestamp: new Date()
		}

		setMessages(prev => [...prev, userMessage])
		setInputMessage('')
		setIsLoading(true)

		try {
			const conversationMessages: ChatCompletionMessageParam[] = [
				{ role: 'system', content: CHATBOT_CONTEXT },
				...messages.map(msg => ({ role: msg.role, content: msg.content } as ChatCompletionMessageParam)),
				{ role: 'user', content: userMessage.content }
			]

			const responseContent = await generateResponse(
				conversationMessages.map(msg => ({
					role: msg.role,
					content: typeof msg.content === 'string' ? msg.content : ''
				}))
			)

			// Validate AI response
			const responseValidation = validateAIResponse(responseContent)
			let finalResponse = responseContent
			
			if (!responseValidation.allowed) {
				console.log('AI response blocked by guardrails:', responseValidation.reason)
				finalResponse = responseValidation.suggestedResponse || "I'm sorry, I can only answer questions about Eduard. What would you like to know about his projects or background?"
			}

			const assistantMessage: Message = {
				id: generateMessageId(),
				role: 'assistant',
				content: finalResponse,
				timestamp: new Date()
			}

			setMessages(prev => [...prev, assistantMessage])
			
			// Add message to token session
			addMessage(userMessage.content, assistantMessage.content)
		} catch (error) {
			console.error('Error generating response:', error)
			const errorMessage: Message = {
				id: generateMessageId(),
				role: 'assistant',
				content: "I'm sorry, I encountered an error. Please try again.",
				timestamp: new Date()
			}
			setMessages(prev => [...prev, errorMessage])
			
			// Add error message to token session
			addMessage(userMessage.content, errorMessage.content)
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
		
		// Clear error when user starts typing
		if (inputError) {
			setInputError('')
		}
		
		// Real-time guardrail feedback
		if (newValue.trim()) {
			const isLikelyValid = isLikelyEduardRelated(newValue.trim())
			setIsOffTopicInput(!isLikelyValid)
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

	// Touch handling for mobile drag
	const handleTouchStart = (e: React.TouchEvent) => {
		if (window.innerWidth >= 768) return // Only on mobile
		const touch = e.touches[0]
		setDragOffset({
			x: touch.clientX,
			y: touch.clientY
		})
		setIsDragging(true)
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging || window.innerWidth >= 768) return
		e.preventDefault()
	}

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (!isDragging || window.innerWidth >= 768) return
		const touch = e.changedTouches[0]
		const deltaY = touch.clientY - dragOffset.y
		
		// Swipe down to minimize
		if (deltaY > 100) {
			setIsMinimized(true)
		}
		// Swipe up to maximize  
		else if (deltaY < -100) {
			setIsFullscreen(true)
		}
		
		setIsDragging(false)
	}

	// Quick action buttons - use guardrail suggested prompts
	const quickActions = getSuggestedPrompts().slice(0, 4)

	// Mobile-specific chat window classes
	const getChatWindowClasses = () => {
		const baseClasses = 'fixed shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out'
		
		if (isFullscreen) {
			return `${baseClasses} inset-0 z-50 rounded-none`
		}
		
		if (window.innerWidth < 768) {
			// Mobile layout
			if (isMinimized) {
				return `${baseClasses} bottom-20 left-4 right-4 h-16 z-40 rounded-t-xl border border-b-0`
			}
			return `${baseClasses} bottom-20 left-4 right-4 h-[70vh] max-h-[600px] z-40 rounded-t-xl border border-b-0`
		}
		
		// Desktop layout
		if (isMinimized) {
			return `${baseClasses} bottom-24 right-6 w-80 h-16 z-40 rounded-lg border`
		}
		return `${baseClasses} bottom-24 right-6 w-96 h-[500px] z-40 rounded-lg border`
	}

	return (
		<ErrorBoundary>
			{/* Chat Toggle Button */}
			<Button
				onClick={toggleChat}
				className={cn(
					'fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50',
					'bottom-6 right-6 md:bottom-6 md:right-6',
					isOpen && 'scale-110'
				)}
				size='icon'
				aria-label={isOpen ? 'Close chat' : 'Open chat'}
			>
				{isOpen ? <X className='h-6 w-6' /> : <MessageCircle className='h-6 w-6' />}
			</Button>

			{/* Chat Window */}
			{isOpen && (
				<Card 
					ref={chatWindowRef}
					className={getChatWindowClasses()}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleTouchEnd}
				>
					{/* Header */}
					<CardHeader className={cn('pb-3 border-b flex-shrink-0', isMinimized && 'pb-2')}>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
									<Bot className='h-4 w-4 text-primary' />
								</div>
								<div className={cn(isMinimized && 'hidden sm:block')}>
									<CardTitle className='text-lg'>Eduard's Assistant</CardTitle>
									{!isMinimized && (
										<p className='text-sm text-muted-foreground'>Ask me about his projects & background</p>
									)}
								</div>
							</div>
							
							<div className='flex items-center gap-1'>
								{/* Mobile controls */}
								<div className='md:hidden flex items-center gap-1'>
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
										{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
									</Button>
								</div>
								
								{/* Desktop controls */}
								<div className='hidden md:flex items-center gap-1'>
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
						
						{/* Status indicators */}
						{!isMinimized && (
							<>
								{isInitializing && (
									<div className='flex items-center gap-2 text-sm text-muted-foreground'>
										<LoadingSpinner size="sm" />
										Loading Llama 3.2...
									</div>
								)}
								{!isSupported && (
									<div className='flex items-center gap-2 text-sm text-destructive'>
										<AlertTriangle className='h-4 w-4' />
										WebGPU not supported
									</div>
								)}
							</>
						)}
						
						{/* Mobile drag indicator */}
						<div className='md:hidden flex justify-center pt-2'>
							<div className='w-8 h-1 bg-muted-foreground/30 rounded-full' />
						</div>
					</CardHeader>

					{/* Messages Area - Only show when not minimized */}
					{!isMinimized && (
						<>
							<div className='flex-1 overflow-y-auto p-4 space-y-4'>
								{!isSupported && messages.length === 0 && (
									<div className='text-center text-sm text-muted-foreground p-4'>
										<AlertTriangle className='h-8 w-8 mx-auto mb-2 text-destructive' />
										<p className='font-medium'>WebGPU Required</p>
										<p>This AI assistant requires a WebGPU-compatible browser like Chrome or Edge.</p>
										<p className='mt-2'>Please switch to a supported browser to use this feature.</p>
									</div>
								)}
								
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
									>
										{message.role === 'assistant' && (
											<div className='h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1'>
												<Bot className='h-3 w-3 text-primary' />
											</div>
										)}
										<div
											className={cn(
												'max-w-[85%] md:max-w-[80%] rounded-lg p-3 text-sm break-words whitespace-pre-wrap',
												message.role === 'user'
													? 'bg-primary text-primary-foreground ml-auto'
													: 'bg-muted'
											)}
										>
											{message.content}
										</div>
										{message.role === 'user' && (
											<div className='h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1'>
												<User className='h-3 w-3' />
											</div>
										)}
									</div>
								))}
								
								{isLoading && (
									<div className='flex gap-3 justify-start'>
										<div className='h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1'>
											<Bot className='h-3 w-3 text-primary' />
										</div>
										<div className='bg-muted rounded-lg p-3 text-sm'>
											<LoadingSpinner size="sm" text="Thinking..." />
										</div>
									</div>
								)}
								
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

							{/* Input Area - Fixed at bottom */}
							<div className='border-t p-4 flex-shrink-0'>
								{inputError && (
									<div className="mb-2 text-xs text-destructive flex items-center gap-1">
										<AlertTriangle className="h-3 w-3" />
										{inputError}
									</div>
								)}
								
								{/* Off-topic input warning */}
								{isOffTopicInput && inputMessage.trim() && (
									<div className="mb-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
										<AlertTriangle className="h-3 w-3" />
										This doesn't seem to be about Eduard. Try asking about his projects or background!
									</div>
								)}
								
								<div className='flex gap-2'>
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
											isOffTopicInput && inputMessage.trim() && 'border-yellow-400 focus:ring-yellow-400'
										)}
										rows={1}
										maxLength={1000}
										aria-label="Chat message input"
									/>
									<Button
										onClick={sendMessage}
										disabled={!engine || !inputMessage.trim() || isLoading || !isSupported}
										size='icon'
										className='h-11 w-11 flex-shrink-0'
										aria-label="Send message"
									>
										<Send className='h-4 w-4' />
									</Button>
								</div>
								
								{!engine && !isInitializing && isSupported && (
									<p className='text-xs text-muted-foreground mt-2'>
										Click the chat button to initialize the AI assistant
									</p>
								)}
								
								{/* Token Display - replaces character counter */}
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
								
								{/* Rate limit display */}
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
			)}
		</ErrorBoundary>
	)
} 
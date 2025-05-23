'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X, Send, Loader2, Bot, User, AlertTriangle } from 'lucide-react'
import { useWebLLM } from '@/lib/hooks/use-webllm'

interface Message {
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
}

const CHATBOT_CONTEXT = `You are Eduard Kakosyan's personal website assistant. You are helpful, friendly, and knowledgeable about Eduard's background, projects, and skills.

ABOUT EDUARD:
Eduard is an AI Developer who recently graduated from Dalhousie University with a Bachelor of Computer Science. He focuses on building practical AI applications that solve real problems, developing robust, scalable solutions from concept through deployment.

CURRENT FOCUS:
- Bridging the gap between AI and small/medium businesses
- Working on projects that help businesses use AI to their advantage
- Conducting workshops on AI topics, from basic concepts to advanced model deployment techniques

PERSONAL INTERESTS:
- Hiking, camping, and photography
- Participating in hackathons (especially local ones)
- Knowledge sharing and teaching

TECHNICAL SKILLS:
Programming Languages: Python, Java, C, Rust, SQL, TypeScript, JavaScript
AI & Machine Learning: OpenAI SDK, Azure OpenAI, Ollama, LangChain, LangGraph, Pinecone, SimPy, NetworkX
Web Development: Next.js, React, Vercel, Supabase, Tailwind CSS, shadcn/ui, Clerk, Stripe
Tools & Environment: Git, GitHub, Docker, Linux, macOS, Cursor, NVIM, Tmux, n8n, OrbStack
Cloud & Infrastructure: AWS, Azure, Vercel, Google Cloud, Docker, API Design, Database Design

FEATURED PROJECTS:

1. HealthByte (🏆 First Place Winner - Atlantic AI Conference Hackathon 2025)
- AI-powered platform that combats healthcare misinformation
- Simulates public reactions to medical content before publication using reinforcement learning agents
- Novel two-agent system: Persona Agent and Editor Agent for content optimization
- Built with Python, OpenAI o4-mini, Gemini 2.5 flash, Reinforcement Learning
- Won 1st place among 20 university teams (48-hour hackathon, team of 4)
- Live demo: https://healthbyte-dashboard.vercel.app/

2. CarGrep
- AI-driven car recommendation platform that transforms the car-buying experience
- Conversational AI assistant with real-time market monitoring
- Aggregates data from major Canadian automotive marketplaces
- Built with Next.js 15, Azure OpenAI, Supabase, Tailwind CSS
- Live platform serving real users: https://www.cargrep.com

3. Q-Learning Network Simulator
- Comparative study of reinforcement learning-based routing vs traditional algorithms
- Implements Q-routing, Dijkstra, and OSPF in dynamic network environments
- Advanced discrete event simulation using SimPy and NetworkX
- Research project with comprehensive performance metrics
- Built with Python 3.13, SimPy, NetworkX for network simulation

4. Second Brain (🥈 Second Place - Volta Hackathon)
- Intelligent time management and learning assistant for university students
- Integrates with Google Drive and calendar systems
- Automated document processing with vector-based knowledge retrieval
- Built with n8n, Pinecone, Google Drive API
- Automated document processing every 10 minutes

INSTRUCTIONS:
- Answer questions about Eduard's background, skills, projects, and experience
- Be conversational and engaging
- If asked about topics outside Eduard's profile, politely redirect to relevant topics
- Highlight achievements and technical innovations in projects
- Encourage users to check out live demos and GitHub repositories
- Keep responses focused but informative`

export function Chatbot() {
	const [isOpen, setIsOpen] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [inputMessage, setInputMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const { engine, isInitializing, isSupported, initialize, generateResponse, error } = useWebLLM({
		onInitialized: () => {
			setMessages([{
				role: 'assistant',
				content: "Hello! I'm Eduard's AI assistant. I can tell you about his projects, background, and technical skills. What would you like to know?",
				timestamp: new Date()
			}])
		},
		onError: (error) => {
			setMessages([{
				role: 'assistant',
				content: `Sorry, I'm having trouble starting up: ${error.message}`,
				timestamp: new Date()
			}])
		}
	})

	const scrollToBottom = () => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}, 100)
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const sendMessage = async () => {
		if (!inputMessage.trim() || isLoading || !engine) return

		const userMessage: Message = {
			role: 'user',
			content: inputMessage.trim(),
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

			const assistantMessage: Message = {
				role: 'assistant',
				content: responseContent,
				timestamp: new Date()
			}

			setMessages(prev => [...prev, assistantMessage])
		} catch (error) {
			console.error('Error generating response:', error)
			const errorMessage: Message = {
				role: 'assistant',
				content: "I'm sorry, I encountered an error. Please try again.",
				timestamp: new Date()
			}
			setMessages(prev => [...prev, errorMessage])
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

	const toggleChat = () => {
		if (!isOpen && !engine && !isInitializing) {
			initialize()
		}
		setIsOpen(!isOpen)
	}

	return (
		<>
			{/* Chat Toggle Button */}
			<Button
				onClick={toggleChat}
				className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50'
				size='icon'
				aria-label='Open chat'
			>
				{isOpen ? <X className='h-6 w-6' /> : <MessageCircle className='h-6 w-6' />}
			</Button>

			{/* Chat Window */}
			{isOpen && (
				<Card className='fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-40 flex flex-col overflow-hidden'>
					<CardHeader className='pb-3 border-b flex-shrink-0'>
						<div className='flex items-center gap-3'>
							<div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
								<Bot className='h-4 w-4 text-primary' />
							</div>
							<div>
								<CardTitle className='text-lg'>Eduard's Assistant</CardTitle>
								<p className='text-sm text-muted-foreground'>Ask me about his projects & background</p>
							</div>
						</div>
						{isInitializing && (
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<Loader2 className='h-4 w-4 animate-spin' />
								Loading Llama 3.2...
							</div>
						)}
						{!isSupported && (
							<div className='flex items-center gap-2 text-sm text-destructive'>
								<AlertTriangle className='h-4 w-4' />
								WebGPU not supported
							</div>
						)}
					</CardHeader>

					{/* Messages Area - Scrollable */}
					<div className='flex-1 overflow-y-auto p-4 space-y-4'>
						{!isSupported && messages.length === 0 && (
							<div className='text-center text-sm text-muted-foreground p-4'>
								<AlertTriangle className='h-8 w-8 mx-auto mb-2 text-destructive' />
								<p className='font-medium'>WebGPU Required</p>
								<p>This AI assistant requires a WebGPU-compatible browser like Chrome or Edge.</p>
								<p className='mt-2'>Please switch to a supported browser to use this feature.</p>
							</div>
						)}
						{messages.map((message, index) => (
							<div
								key={index}
								className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								{message.role === 'assistant' && (
									<div className='h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1'>
										<Bot className='h-3 w-3 text-primary' />
									</div>
								)}
								<div
									className={`max-w-[80%] rounded-lg p-3 text-sm break-words ${
										message.role === 'user'
											? 'bg-primary text-primary-foreground ml-auto'
											: 'bg-muted'
									}`}
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
									<Loader2 className='h-4 w-4 animate-spin' />
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area - Fixed at bottom */}
					<div className='border-t p-4 flex-shrink-0'>
						<div className='flex gap-2'>
							<textarea
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder={
									!isSupported 
										? 'WebGPU required...' 
										: engine 
										? 'Ask about Eduard\'s projects...' 
										: 'Initializing...'
								}
								disabled={!engine || isLoading || !isSupported}
								className='flex-1 resize-none border rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] max-h-[100px] disabled:opacity-50'
								rows={1}
							/>
							<Button
								onClick={sendMessage}
								disabled={!engine || !inputMessage.trim() || isLoading || !isSupported}
								size='icon'
								className='h-10 w-10'
							>
								<Send className='h-4 w-4' />
							</Button>
						</div>
						{!engine && !isInitializing && isSupported && (
							<p className='text-xs text-muted-foreground mt-2'>
								Click to initialize the AI assistant
							</p>
						)}
						{error && (
							<p className='text-xs text-destructive mt-2'>
								{error}
							</p>
						)}
					</div>
				</Card>
			)}

			{/* Browser Compatibility Notice */}
			{isOpen && !isSupported && (
				<div className='fixed bottom-2 right-6 z-30'>
					<Badge variant='destructive' className='text-xs bg-background/90 backdrop-blur'>
						WebGPU required - Use Chrome/Edge
					</Badge>
				</div>
			)}
		</>
	)
} 
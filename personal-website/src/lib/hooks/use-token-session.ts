import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
	TokenSession, 
	createTokenSession, 
	updateTokenSession, 
	countTokensSync,
	analyzeTokens,
	getTokenWarningLevel,
	getRemainingContext,
	ModelName,
	MODEL_CONFIGS,
	TokenAnalysis
} from '@/lib/token-utils'

const SESSION_STORAGE_KEY = 'chatbot-token-session'

interface TokenSessionHook {
	session: TokenSession
	currentInputTokens: number
	currentInputAnalysis: TokenAnalysis | null
	conversationTokens: number
	warningLevel: 'safe' | 'warning' | 'danger'
	remainingContext: number
	updateInput: (input: string) => void
	addMessage: (inputText: string, outputText: string) => void
	resetSession: () => void
	exportSession: () => string
	importSession: (data: string) => boolean
}

export function useTokenSession(
	messages: Array<{ role: string; content: string }> = [],
	systemPrompt: string = '',
	modelName: ModelName = 'llama3.2'
): TokenSessionHook {
	// Initialize session from localStorage or create new
	const [session, setSession] = useState<TokenSession>(() => {
		if (typeof window === 'undefined') return createTokenSession()
		
		try {
			const stored = localStorage.getItem(SESSION_STORAGE_KEY)
			if (stored) {
				const parsed = JSON.parse(stored)
				// Convert date strings back to Date objects
				return {
					...parsed,
					startTime: new Date(parsed.startTime),
					lastActivity: new Date(parsed.lastActivity)
				}
			}
		} catch (error) {
			console.warn('Failed to load token session from localStorage:', error)
		}
		
		return createTokenSession()
	})

	const [currentInput, setCurrentInput] = useState('')
	const [currentInputAnalysis, setCurrentInputAnalysis] = useState<TokenAnalysis | null>(null)

	// Persist session to localStorage
	useEffect(() => {
		if (typeof window === 'undefined') return
		
		try {
			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
		} catch (error) {
			console.warn('Failed to save token session to localStorage:', error)
		}
	}, [session])

	// Calculate current input tokens
	const currentInputTokens = useMemo(() => {
		if (!currentInput.trim()) return 0
		return countTokensSync(currentInput, modelName)
	}, [currentInput, modelName])

	// Calculate conversation tokens (system + messages)
	const conversationTokens = useMemo(() => {
		const systemTokens = countTokensSync(systemPrompt, modelName)
		const messageTokens = messages.reduce((total, msg) => {
			return total + countTokensSync(`${msg.role}: ${msg.content}`, modelName) + 4
		}, 0)
		return systemTokens + messageTokens
	}, [messages, systemPrompt, modelName])

	// Calculate total tokens including current input
	const totalTokens = conversationTokens + currentInputTokens

	// Get warning level
	const warningLevel = getTokenWarningLevel(totalTokens, MODEL_CONFIGS[modelName].maxTokens)

	// Get remaining context
	const remainingContext = getRemainingContext(totalTokens, modelName)

	// Update current input and analyze it
	const updateInput = useCallback(async (input: string) => {
		setCurrentInput(input)
		
		if (input.trim()) {
			try {
				const analysis = await analyzeTokens(input, modelName)
				setCurrentInputAnalysis(analysis)
			} catch (error) {
				console.warn('Failed to analyze tokens:', error)
				// Fallback analysis
				const tokens = countTokensSync(input, modelName)
				const words = input.trim().split(/\s+/).length
				const characters = input.length
				const charactersNoSpaces = input.replace(/\s/g, '').length
				const avgTokensPerWord = words > 0 ? tokens / words : 0
				const efficiency = characters > 0 ? tokens / characters : 0
				
				let complexity: 'low' | 'medium' | 'high'
				if (avgTokensPerWord < 1.2) complexity = 'low'
				else if (avgTokensPerWord < 1.5) complexity = 'medium'
				else complexity = 'high'
				
				setCurrentInputAnalysis({
					count: tokens,
					words,
					characters,
					charactersNoSpaces,
					avgTokensPerWord,
					efficiency,
					complexity
				})
			}
		} else {
			setCurrentInputAnalysis(null)
		}
	}, [modelName])

	// Add message to session
	const addMessage = useCallback((inputText: string, outputText: string) => {
		const inputTokens = countTokensSync(inputText, modelName)
		const outputTokens = countTokensSync(outputText, modelName)
		
		setSession(prevSession => 
			updateTokenSession(prevSession, inputTokens, outputTokens, modelName)
		)
	}, [modelName])

	// Reset session
	const resetSession = useCallback(() => {
		setSession(createTokenSession())
		setCurrentInput('')
		setCurrentInputAnalysis(null)
		
		// Clear from localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem(SESSION_STORAGE_KEY)
		}
	}, [])

	// Export session data
	const exportSession = useCallback(() => {
		const exportData = {
			session,
			messages,
			systemPrompt,
			modelName,
			timestamp: new Date().toISOString()
		}
		return JSON.stringify(exportData, null, 2)
	}, [session, messages, systemPrompt, modelName])

	// Import session data
	const importSession = useCallback((data: string): boolean => {
		try {
			const parsed = JSON.parse(data)
			if (parsed.session && typeof parsed.session === 'object') {
				setSession(parsed.session)
				return true
			}
			return false
		} catch (error) {
			console.error('Failed to import session:', error)
			return false
		}
	}, [])

	return {
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
	}
} 
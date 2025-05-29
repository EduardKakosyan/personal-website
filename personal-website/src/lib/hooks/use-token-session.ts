import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
	TokenSession, 
	createTokenSession, 
	updateTokenSession, 
	countTokens, 
	analyzeTokens,
	calculateConversationTokens,
	getTokenWarningLevel,
	getRemainingContext,
	ModelName,
	MODEL_CONFIGS,
	TokenAnalysis
} from '@/lib/token-utils'

const SESSION_STORAGE_KEY = 'chatbot-token-session'

interface UseTokenSessionReturn {
	session: TokenSession
	currentInputTokens: number
	currentInputAnalysis: TokenAnalysis
	conversationTokens: number
	warningLevel: 'safe' | 'warning' | 'danger'
	remainingContext: number
	updateInput: (text: string) => void
	addMessage: (inputText: string, outputText: string) => void
	resetSession: () => void
	exportSession: () => string
	importSession: (data: string) => boolean
}

export function useTokenSession(
	messages: Array<{ role: string; content: string }> = [],
	systemPrompt: string = '',
	modelName: ModelName = 'llama3.2'
): UseTokenSessionReturn {
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

	const [currentInputText, setCurrentInputText] = useState('')

	// Persist session to localStorage
	useEffect(() => {
		if (typeof window === 'undefined') return
		
		try {
			localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
		} catch (error) {
			console.warn('Failed to save token session to localStorage:', error)
		}
	}, [session])

	// Calculate current input tokens and analysis
	const currentInputTokens = useMemo(() => {
		return countTokens(currentInputText, modelName)
	}, [currentInputText, modelName])

	const currentInputAnalysis = useMemo(() => {
		return analyzeTokens(currentInputText, modelName)
	}, [currentInputText, modelName])

	// Calculate total conversation tokens
	const conversationTokens = useMemo(() => {
		return calculateConversationTokens(messages, systemPrompt, modelName)
	}, [messages, systemPrompt, modelName])

	// Get warning level for current context usage
	const warningLevel = useMemo(() => {
		const totalTokens = conversationTokens + currentInputTokens
		return getTokenWarningLevel(totalTokens, MODEL_CONFIGS[modelName].maxTokens)
	}, [conversationTokens, currentInputTokens, modelName])

	// Calculate remaining context window
	const remainingContext = useMemo(() => {
		const totalTokens = conversationTokens + currentInputTokens
		return getRemainingContext(totalTokens, modelName)
	}, [conversationTokens, currentInputTokens, modelName])

	// Update current input text for token counting
	const updateInput = useCallback((text: string) => {
		setCurrentInputText(text)
	}, [])

	// Add a new message exchange to the session
	const addMessage = useCallback((inputText: string, outputText: string) => {
		const inputTokens = countTokens(inputText, modelName)
		const outputTokens = countTokens(outputText, modelName)
		
		setSession(prevSession => 
			updateTokenSession(prevSession, inputTokens, outputTokens, modelName)
		)
		
		// Clear current input after adding message
		setCurrentInputText('')
	}, [modelName])

	// Reset the session
	const resetSession = useCallback(() => {
		const newSession = createTokenSession()
		setSession(newSession)
		setCurrentInputText('')
		
		// Clear from localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem(SESSION_STORAGE_KEY)
		}
	}, [])

	// Export session data as JSON string
	const exportSession = useCallback(() => {
		const exportData = {
			session,
			modelName,
			exportDate: new Date().toISOString(),
			version: '1.0'
		}
		return JSON.stringify(exportData, null, 2)
	}, [session, modelName])

	// Import session data from JSON string
	const importSession = useCallback((data: string): boolean => {
		try {
			const importData = JSON.parse(data)
			
			if (!importData.session || !importData.version) {
				throw new Error('Invalid session data format')
			}
			
			const importedSession = {
				...importData.session,
				startTime: new Date(importData.session.startTime),
				lastActivity: new Date(importData.session.lastActivity)
			}
			
			setSession(importedSession)
			return true
		} catch (error) {
			console.error('Failed to import session data:', error)
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
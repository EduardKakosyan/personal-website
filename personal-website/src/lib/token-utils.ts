// Dynamic import to handle WebAssembly loading
let tiktokenModule: typeof import('tiktoken') | null = null

// Initialize tiktoken module asynchronously
const initializeTiktoken = async () => {
	if (typeof window === 'undefined') return null // Server-side guard
	
	try {
		if (!tiktokenModule) {
			tiktokenModule = await import('tiktoken')
		}
		return tiktokenModule
	} catch (error) {
		console.warn('Failed to load tiktoken module:', error)
		return null
	}
}

// Model configurations for token counting
export const MODEL_CONFIGS = {
	'llama3.2': {
		// Llama models use similar tokenization to GPT-4, so we approximate
		encoding: 'cl100k_base',
		maxTokens: 8192,
		costPer1kInput: 0.0001, // Approximate cost for local models
		costPer1kOutput: 0.0001,
		displayName: 'Llama 3.2'
	},
	'gpt-4': {
		encoding: 'cl100k_base',
		maxTokens: 8192,
		costPer1kInput: 0.03,
		costPer1kOutput: 0.06,
		displayName: 'GPT-4'
	}
} as const

export type ModelName = keyof typeof MODEL_CONFIGS

// Token counting cache to avoid repeated encoding
const tokenCache = new Map<string, number>()

// Session token statistics
export interface TokenSession {
	inputTokens: number
	outputTokens: number
	totalTokens: number
	estimatedCost: number
	messageCount: number
	startTime: Date
	lastActivity: Date
}

// Initialize empty session
export const createTokenSession = (): TokenSession => ({
	inputTokens: 0,
	outputTokens: 0,
	totalTokens: 0,
	estimatedCost: 0,
	messageCount: 0,
	startTime: new Date(),
	lastActivity: new Date()
})

// Token counting function with caching and graceful WebAssembly handling
export const countTokens = async (text: string, modelName: ModelName = 'llama3.2'): Promise<number> => {
	if (!text || text.trim().length === 0) return 0
	
	// Create cache key
	const cacheKey = `${modelName}:${text}`
	
	// Check cache first
	if (tokenCache.has(cacheKey)) {
		return tokenCache.get(cacheKey)!
	}
	
	try {
		const tiktoken = await initializeTiktoken()
		if (!tiktoken) {
			// Fallback: rough estimation (4 characters per token average)
			const fallbackCount = Math.ceil(text.length / 4)
			tokenCache.set(cacheKey, fallbackCount)
			return fallbackCount
		}

		const config = MODEL_CONFIGS[modelName]
		const encoder = tiktoken.encoding_for_model(config.encoding as 'gpt-4')
		const tokens = encoder.encode(text)
		const count = tokens.length
		
		// Cache result
		tokenCache.set(cacheKey, count)
		
		// Cleanup encoder to prevent memory leaks
		encoder.free()
		
		return count
	} catch (error) {
		console.warn('Token counting failed, using fallback estimation:', error)
		// Fallback: rough estimation (4 characters per token average)
		const fallbackCount = Math.ceil(text.length / 4)
		tokenCache.set(cacheKey, fallbackCount)
		return fallbackCount
	}
}

// Synchronous version for backward compatibility (uses cache or fallback)
export const countTokensSync = (text: string, modelName: ModelName = 'llama3.2'): number => {
	if (!text || text.trim().length === 0) return 0
	
	const cacheKey = `${modelName}:${text}`
	
	// Check cache first
	if (tokenCache.has(cacheKey)) {
		return tokenCache.get(cacheKey)!
	}
	
	// Fallback estimation for synchronous calls
	const fallbackCount = Math.ceil(text.length / 4)
	tokenCache.set(cacheKey, fallbackCount)
	return fallbackCount
}

// Advanced token analysis
export interface TokenAnalysis {
	count: number
	words: number
	characters: number
	charactersNoSpaces: number
	avgTokensPerWord: number
	efficiency: number // tokens per character ratio
	complexity: 'low' | 'medium' | 'high'
}

export const analyzeTokens = async (text: string, modelName: ModelName = 'llama3.2'): Promise<TokenAnalysis> => {
	const tokens = await countTokens(text, modelName)
	const words = text.trim().split(/\s+/).length
	const characters = text.length
	const charactersNoSpaces = text.replace(/\s/g, '').length
	const avgTokensPerWord = words > 0 ? tokens / words : 0
	const efficiency = characters > 0 ? tokens / characters : 0
	
	// Determine complexity based on tokens per word ratio
	let complexity: 'low' | 'medium' | 'high'
	if (avgTokensPerWord < 1.2) complexity = 'low'
	else if (avgTokensPerWord < 1.5) complexity = 'medium'
	else complexity = 'high'
	
	return {
		count: tokens,
		words,
		characters,
		charactersNoSpaces,
		avgTokensPerWord,
		efficiency,
		complexity
	}
}

// Update session with new tokens
export const updateTokenSession = (
	session: TokenSession,
	inputTokens: number,
	outputTokens: number,
	modelName: ModelName = 'llama3.2'
): TokenSession => {
	const config = MODEL_CONFIGS[modelName]
	const inputCost = (inputTokens / 1000) * config.costPer1kInput
	const outputCost = (outputTokens / 1000) * config.costPer1kOutput
	
	return {
		...session,
		inputTokens: session.inputTokens + inputTokens,
		outputTokens: session.outputTokens + outputTokens,
		totalTokens: session.totalTokens + inputTokens + outputTokens,
		estimatedCost: session.estimatedCost + inputCost + outputCost,
		messageCount: session.messageCount + 1,
		lastActivity: new Date()
	}
}

// Format token count for display
export const formatTokenCount = (count: number): string => {
	if (count < 1000) return count.toString()
	if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
	return `${(count / 1000000).toFixed(1)}M`
}

// Format cost for display
export const formatCost = (cost: number): string => {
	if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}‰` // per mille for very small costs
	return `$${cost.toFixed(4)}`
}

// Get token limit warning level
export const getTokenWarningLevel = (
	currentTokens: number,
	maxTokens: number
): 'safe' | 'warning' | 'danger' => {
	const percentage = currentTokens / maxTokens
	if (percentage < 0.7) return 'safe'
	if (percentage < 0.9) return 'warning'
	return 'danger'
}

// Estimate remaining context window
export const getRemainingContext = (
	currentTokens: number,
	modelName: ModelName = 'llama3.2'
): number => {
	const config = MODEL_CONFIGS[modelName]
	return Math.max(0, config.maxTokens - currentTokens)
}

// Clear token cache (useful for memory management)
export const clearTokenCache = (): void => {
	tokenCache.clear()
}

// Get cache statistics
export const getCacheStats = () => ({
	size: tokenCache.size,
	memoryUsage: `${(JSON.stringify([...tokenCache]).length / 1024).toFixed(2)} KB`
})

// Batch token counting for multiple texts
export const countTokensBatch = async (
	texts: string[],
	modelName: ModelName = 'llama3.2'
): Promise<number[]> => {
	return Promise.all(texts.map(text => countTokens(text, modelName)))
}

// Token-aware text truncation
export const truncateToTokenLimit = async (
	text: string,
	maxTokens: number,
	modelName: ModelName = 'llama3.2'
): Promise<string> => {
	const currentTokens = await countTokens(text, modelName)
	if (currentTokens <= maxTokens) return text
	
	// Binary search for optimal truncation point
	let left = 0
	let right = text.length
	let result = ''
	
	while (left <= right) {
		const mid = Math.floor((left + right) / 2)
		const truncated = text.substring(0, mid)
		const tokens = await countTokens(truncated, modelName)
		
		if (tokens <= maxTokens) {
			result = truncated
			left = mid + 1
		} else {
			right = mid - 1
		}
	}
	
	return result
}

// Calculate conversation context tokens
export const calculateConversationTokens = async (
	messages: Array<{ role: string; content: string }>,
	systemPrompt: string,
	modelName: ModelName = 'llama3.2'
): Promise<number> => {
	const systemTokens = await countTokens(systemPrompt, modelName)
	
	const messageTokensPromises = messages.map(async (msg) => {
		// Add tokens for role and content, plus formatting overhead
		return await countTokens(`${msg.role}: ${msg.content}`, modelName) + 4
	})
	
	const messageTokensArray = await Promise.all(messageTokensPromises)
	const messageTokens = messageTokensArray.reduce((total, tokens) => total + tokens, 0)
	
	return systemTokens + messageTokens
} 
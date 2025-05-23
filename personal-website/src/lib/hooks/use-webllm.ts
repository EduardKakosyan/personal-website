'use client'

import { useState, useCallback, useRef } from 'react'
import { ChatCompletionMessageParam, CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'

interface UseWebLLMOptions {
	model?: string
	onInitialized?: () => void
	onError?: (error: Error) => void
}

interface UseWebLLMReturn {
	engine: MLCEngine | null
	isInitializing: boolean
	isSupported: boolean
	initialize: () => Promise<void>
	generateResponse: (messages: Array<{ role: string; content: string }>) => Promise<string>
	error: string | null
}

export function useWebLLM({
	model = 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
	onInitialized,
	onError,
}: UseWebLLMOptions = {}): UseWebLLMReturn {
	const [engine, setEngine] = useState<MLCEngine | null>(null)
	const [isInitializing, setIsInitializing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const initializationAttempted = useRef(false)

	const isSupported = typeof navigator !== 'undefined' && 'gpu' in navigator

	const initialize = useCallback(async () => {
		if (engine || isInitializing || initializationAttempted.current) return
		
		if (!isSupported) {
			const errorMsg = 'WebGPU is not supported in this browser. Please use Chrome or Edge.'
			setError(errorMsg)
			onError?.(new Error(errorMsg))
			return
		}

		setIsInitializing(true)
		setError(null)
		initializationAttempted.current = true

		try {
			const mlcEngine = await CreateMLCEngine(model, {
				initProgressCallback: (progress) => {
					console.log('WebLLM initialization progress:', progress)
				}
			})
			
			setEngine(mlcEngine)
			onInitialized?.()
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to initialize WebLLM'
			console.error('WebLLM initialization error:', error)
			setError(errorMsg)
			onError?.(error instanceof Error ? error : new Error(errorMsg))
		} finally {
			setIsInitializing(false)
		}
	}, [engine, isInitializing, isSupported, model, onInitialized, onError])

	const generateResponse = useCallback(async (messages: Array<{ role: string; content: string }>): Promise<string> => {
		if (!engine) {
			throw new Error('Engine not initialized')
		}

		try {
			const response = await engine.chatCompletion({
				messages: messages as ChatCompletionMessageParam[],
				temperature: 0.7,
				max_tokens: 512,
			})

			return response.choices[0].message.content || "I'm sorry, I couldn't generate a response."
		} catch (error) {
			console.error('Error generating response:', error)
			throw error
		}
	}, [engine])

	return {
		engine,
		isInitializing,
		isSupported,
		initialize,
		generateResponse,
		error,
	}
} 
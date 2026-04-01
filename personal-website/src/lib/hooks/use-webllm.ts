'use client'

import { useState, useCallback, useRef } from 'react'
import {
  ChatCompletionMessageParam,
  CreateMLCEngine,
  MLCEngine,
  ResponseFormat,
} from '@mlc-ai/web-llm'

export interface ModelTier {
  id: string
  label: string
  description: string
  modelId: string
}

export const MODEL_TIERS: ModelTier[] = [
  {
    id: 'fast',
    label: 'Fast',
    description: '~200MB, instant responses',
    modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: '~800MB, good quality',
    modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'quality',
    label: 'Quality',
    description: '~1.7GB, best responses',
    modelId: 'Hermes-3-Llama-3.2-3B-q4f16_1-MLC',
  },
]

interface UseWebLLMOptions {
  model?: string
  onInitialized?: () => void
  onError?: (error: Error) => void
}

interface UseWebLLMReturn {
  engine: MLCEngine | null
  isInitializing: boolean
  isSupported: boolean
  currentModel: string
  downloadProgress: number
  initialize: () => Promise<void>
  switchModel: (modelId: string) => Promise<void>
  generateResponse: (
    messages: Array<{ role: string; content: string }>,
    options?: { maxTokens?: number; responseFormat?: ResponseFormat },
  ) => Promise<string>
  generateStreamingResponse: (
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    options?: { maxTokens?: number },
  ) => Promise<string>
  error: string | null
}

export function useWebLLM({
  model = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  onInitialized,
  onError,
}: UseWebLLMOptions = {}): UseWebLLMReturn {
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState(model)
  const [downloadProgress, setDownloadProgress] = useState(0)
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
    setDownloadProgress(0)
    initializationAttempted.current = true

    try {
      const mlcEngine = await CreateMLCEngine(model, {
        initProgressCallback: (progress) => {
          console.log('WebLLM initialization progress:', progress)
          // Parse progress percentage if available
          if (progress.text) {
            const match = progress.text.match(/(\d+(?:\.\d+)?)%/)
            if (match) {
              setDownloadProgress(parseFloat(match[1]))
            }
          }
        },
      })

      setEngine(mlcEngine)
      setDownloadProgress(100)
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

  const switchModel = useCallback(
    async (modelId: string) => {
      if (!isSupported || isInitializing) return

      setIsInitializing(true)
      setError(null)
      setDownloadProgress(0)

      try {
        // Dispose old engine if exists
        if (engine) {
          engine.unload()
        }

        const mlcEngine = await CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            if (progress.text) {
              const match = progress.text.match(/(\d+(?:\.\d+)?)%/)
              if (match) {
                setDownloadProgress(parseFloat(match[1]))
              }
            }
          },
        })

        setEngine(mlcEngine)
        setCurrentModel(modelId)
        setDownloadProgress(100)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to switch model'
        console.error('Model switch error:', error)
        setError(errorMsg)
      } finally {
        setIsInitializing(false)
      }
    },
    [engine, isSupported, isInitializing],
  )

  const generateResponse = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      options?: { maxTokens?: number; responseFormat?: ResponseFormat },
    ): Promise<string> => {
      if (!engine) {
        throw new Error('Engine not initialized')
      }

      try {
        const response = await engine.chatCompletion({
          messages: messages as ChatCompletionMessageParam[],
          temperature: 0.7,
          max_tokens: options?.maxTokens ?? 256,
          ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
        })

        return response.choices[0].message.content || "I'm sorry, I couldn't generate a response."
      } catch (error) {
        console.error('Error generating response:', error)
        throw error
      }
    },
    [engine],
  )

  const generateStreamingResponse = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      onChunk: (chunk: string) => void,
      options?: { maxTokens?: number },
    ): Promise<string> => {
      if (!engine) {
        throw new Error('Engine not initialized')
      }

      try {
        const stream = await engine.chatCompletion({
          messages: messages as ChatCompletionMessageParam[],
          temperature: 0.7,
          max_tokens: options?.maxTokens ?? 256,
          stream: true,
        })

        let fullResponse = ''
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || ''
          if (delta) {
            fullResponse += delta
            onChunk(fullResponse)
          }
        }

        return fullResponse || "I'm sorry, I couldn't generate a response."
      } catch (error) {
        console.error('Error generating streaming response:', error)
        throw error
      }
    },
    [engine],
  )

  return {
    engine,
    isInitializing,
    isSupported,
    currentModel,
    downloadProgress,
    initialize,
    switchModel,
    generateResponse,
    generateStreamingResponse,
    error,
  }
}

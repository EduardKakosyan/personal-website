'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { ChatCompletionMessageParam, CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'
import { MODEL_TIERS } from '@/lib/hooks/use-webllm'

interface ProgressSnapshot {
  progress: number
  timestamp: number
}

interface WebLLMContextValue {
  engine: MLCEngine | null
  isInitializing: boolean
  isSupported: boolean
  currentModel: string
  downloadProgress: number
  estimatedTimeRemaining: string | null
  error: string | null
  generateStreamingResponse: (
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
  ) => Promise<string>
  switchModel: (modelId: string) => Promise<void>
}

const WebLLMContext = createContext<WebLLMContextValue | null>(null)

export function useWebLLMContext(): WebLLMContextValue {
  const ctx = useContext(WebLLMContext)
  if (!ctx) {
    throw new Error('useWebLLMContext must be used within a WebLLMProvider')
  }
  return ctx
}

const DEFAULT_MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'

function formatTimeRemaining(seconds: number): string {
  if (seconds < 5) return 'almost done'
  if (seconds < 60) return `~${Math.round(seconds)}s remaining`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (secs === 0) return `~${minutes}m remaining`
  return `~${minutes}m ${secs}s remaining`
}

export function WebLLMProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null)

  const [isSupported, setIsSupported] = useState(false)

  const initRef = useRef(false)
  const progressSnapshots = useRef<ProgressSnapshot[]>([])
  const smoothedSpeed = useRef<number | null>(null)

  // Defer WebGPU check to after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'gpu' in navigator)
  }, [])

  const updateTimeEstimate = useCallback((progress: number) => {
    const now = Date.now()
    progressSnapshots.current.push({ progress, timestamp: now })

    // Keep last 5 samples for averaging
    if (progressSnapshots.current.length > 5) {
      progressSnapshots.current = progressSnapshots.current.slice(-5)
    }

    const snaps = progressSnapshots.current
    if (snaps.length < 2) return

    // Calculate speeds from last 3 intervals
    const recentSpeeds: number[] = []
    const startIdx = Math.max(0, snaps.length - 4)
    for (let i = startIdx + 1; i < snaps.length; i++) {
      const dp = snaps[i].progress - snaps[i - 1].progress
      const dt = (snaps[i].timestamp - snaps[i - 1].timestamp) / 1000
      if (dt > 0 && dp > 0) {
        recentSpeeds.push(dp / dt)
      }
    }

    if (recentSpeeds.length === 0) return

    const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length

    // Exponential moving average (alpha = 0.3)
    if (smoothedSpeed.current === null) {
      smoothedSpeed.current = avgSpeed
    } else {
      smoothedSpeed.current = 0.3 * avgSpeed + 0.7 * smoothedSpeed.current
    }

    const remaining = 100 - progress
    if (smoothedSpeed.current > 0) {
      const seconds = remaining / smoothedSpeed.current
      setEstimatedTimeRemaining(formatTimeRemaining(seconds))
    }
  }, [])

  const initializeEngine = useCallback(
    async (modelId: string) => {
      if (!isSupported) {
        setError('WebGPU is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      setIsInitializing(true)
      setError(null)
      setDownloadProgress(0)
      setEstimatedTimeRemaining(null)
      progressSnapshots.current = []
      smoothedSpeed.current = null

      try {
        const mlcEngine = await CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            if (progress.text) {
              const match = progress.text.match(/(\d+(?:\.\d+)?)%/)
              if (match) {
                const pct = parseFloat(match[1])
                setDownloadProgress(pct)
                updateTimeEstimate(pct)
              }
            }
          },
        })

        setEngine(mlcEngine)
        setCurrentModel(modelId)
        setDownloadProgress(100)
        setEstimatedTimeRemaining(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize WebLLM'
        setError(errorMsg)
      } finally {
        setIsInitializing(false)
      }
    },
    [isSupported, updateTimeEstimate],
  )

  // Auto-initialize on mount
  useEffect(() => {
    if (initRef.current || !isSupported) return
    initRef.current = true
    initializeEngine(DEFAULT_MODEL)
  }, [isSupported, initializeEngine])

  const switchModel = useCallback(
    async (modelId: string) => {
      if (!isSupported || isInitializing) return

      // Dispose old engine
      if (engine) {
        engine.unload()
        setEngine(null)
      }

      await initializeEngine(modelId)
    },
    [engine, isSupported, isInitializing, initializeEngine],
  )

  const generateStreamingResponse = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      onChunk: (chunk: string) => void,
    ): Promise<string> => {
      if (!engine) {
        throw new Error('Engine not initialized')
      }

      const stream = await engine.chatCompletion({
        messages: messages as ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 512,
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
    },
    [engine],
  )

  return (
    <WebLLMContext.Provider
      value={{
        engine,
        isInitializing,
        isSupported,
        currentModel,
        downloadProgress,
        estimatedTimeRemaining,
        error,
        generateStreamingResponse,
        switchModel,
      }}
    >
      {children}
    </WebLLMContext.Provider>
  )
}

export { MODEL_TIERS }

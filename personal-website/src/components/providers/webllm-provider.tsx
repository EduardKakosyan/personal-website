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
import type { MLCEngineInterface, ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { MODEL_TIERS } from '@/lib/local-models'
import { checkLocalAISupport, type LocalAISupport } from '@/lib/webgpu-support'

interface WebLLMContextValue {
  engine: MLCEngineInterface | null
  isInitializing: boolean
  isGenerating: boolean
  isSupported: boolean
  support: LocalAISupport
  isMobile: boolean
  currentModel: string
  downloadProgress: number
  estimatedTimeRemaining: string | null
  error: string | null
  initialize: () => Promise<void>
  cancel: () => void
  generateStructuredResponse: (
    messages: ChatCompletionMessageParam[],
    schema: string,
  ) => Promise<string>
  generateStreamingResponse: (
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
  ) => Promise<string>
  switchModel: (modelId: string) => Promise<void>
}

const WebLLMContext = createContext<WebLLMContextValue | null>(null)
export function useWebLLMContext() {
  const context = useContext(WebLLMContext)
  if (!context) throw new Error('WebLLMProvider is required')
  return context
}

export function WebLLMProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<MLCEngineInterface | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [support, setSupport] = useState<LocalAISupport>({ status: 'checking' })
  const isSupported = support.status === 'supported'
  const [isMobile, setIsMobile] = useState(false)
  const [currentModel, setCurrentModel] = useState(MODEL_TIERS[0].modelId)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const engineRef = useRef<MLCEngineInterface | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const initRef = useRef<Promise<void> | null>(null)
  const generationRef = useRef(false)
  const epoch = useRef(0)

  useEffect(() => {
    let active = true
    setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    void checkLocalAISupport(window.isSecureContext, navigator.gpu).then((result) => {
      if (active) setSupport(result)
    })
    return () => {
      active = false
      epoch.current += 1
      workerRef.current?.terminate()
      workerRef.current = null
      engineRef.current = null
    }
  }, [])

  const load = useCallback(
    async (modelId: string) => {
      if (initRef.current) return initRef.current
      if (generationRef.current) throw new Error('Stop the current reply before changing models.')
      if (!MODEL_TIERS.some((model) => model.modelId === modelId))
        throw new Error('Unknown local model.')
      if (!isSupported)
        throw new Error(
          support.status === 'unsupported'
            ? support.reason
            : 'Checking local AI compatibility. Try again in a moment.',
        )
      const requestEpoch = ++epoch.current
      setIsInitializing(true)
      setError(null)
      setDownloadProgress(0)
      setEngine(null)
      engineRef.current = null
      workerRef.current?.terminate()

      const task = (async () => {
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
          const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
          const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), {
            type: 'module',
          })
          workerRef.current = worker
          const failure = new Promise<never>((_, reject) => {
            worker.onerror = () =>
              reject(
                new Error('The local AI worker stopped. Please retry or choose a smaller model.'),
              )
            timer = setTimeout(
              () => reject(new Error('Model loading timed out. Check your connection and retry.')),
              300_000,
            )
          })
          const loaded = await Promise.race([
            CreateWebWorkerMLCEngine(
              worker,
              modelId,
              {
                initProgressCallback: ({ progress }) => {
                  if (epoch.current === requestEpoch)
                    setDownloadProgress(Math.round(progress * 100))
                },
              },
              { context_window_size: 4096 },
            ),
            failure,
          ])
          if (epoch.current !== requestEpoch) {
            worker.terminate()
            return
          }
          engineRef.current = loaded
          setEngine(loaded)
          setCurrentModel(modelId)
          setDownloadProgress(100)
        } catch (cause) {
          console.warn('Local model initialization failed:', cause)
          if (epoch.current === requestEpoch) {
            workerRef.current?.terminate()
            workerRef.current = null
            const message =
              cause instanceof Error
                ? cause.message
                : typeof cause === 'string'
                  ? cause
                  : 'Local AI could not load. Try a browser with full WebGPU support.'
            setError(message)
            throw new Error(message)
          }
          throw cause
        } finally {
          if (timer) clearTimeout(timer)
          if (epoch.current === requestEpoch) setIsInitializing(false)
          initRef.current = null
        }
      })()
      initRef.current = task
      return task
    },
    [isSupported, support],
  )

  const initialize = useCallback(async () => {
    if (engineRef.current) return
    return load(currentModel)
  }, [load, currentModel])
  const cancel = useCallback(() => {
    engineRef.current?.interruptGenerate()
  }, [])

  const run = useCallback(
    async <T,>(generate: (local: MLCEngineInterface) => Promise<T>): Promise<T> => {
      const local = engineRef.current
      if (!local) throw new Error('Enable local AI first.')
      if (generationRef.current) throw new Error('A reply is already in progress.')
      generationRef.current = true
      setIsGenerating(true)
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        return await Promise.race([
          generate(local),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              local.interruptGenerate()
              workerRef.current?.terminate()
              engineRef.current = null
              setEngine(null)
              setError('The reply timed out. Reload local AI to try again.')
              reject(new Error('The reply timed out. Please retry.'))
            }, 90_000)
          }),
        ])
      } finally {
        if (timer) clearTimeout(timer)
        generationRef.current = false
        setIsGenerating(false)
      }
    },
    [],
  )

  const generateStructuredResponse = useCallback(
    (messages: ChatCompletionMessageParam[], schema: string) =>
      run(async (local) => {
        const response = await local.chat.completions.create({
          messages,
          temperature: 0.2,
          max_tokens: 320,
          response_format: { type: 'json_object', schema },
        })
        return response.choices[0]?.message.content ?? ''
      }),
    [run],
  )

  const generateStreamingResponse = useCallback(
    (messages: Array<{ role: string; content: string }>, onChunk: (chunk: string) => void) =>
      run(async (local) => {
        const stream = await local.chat.completions.create({
          messages: messages as ChatCompletionMessageParam[],
          temperature: 0.3,
          max_tokens: 256,
          stream: true,
        })
        let reply = ''
        for await (const chunk of stream) {
          reply += chunk.choices[0]?.delta?.content ?? ''
          onChunk(reply)
        }
        return reply
      }),
    [run],
  )

  return (
    <WebLLMContext.Provider
      value={{
        engine,
        isInitializing,
        isGenerating,
        isSupported,
        support,
        isMobile,
        currentModel,
        downloadProgress,
        estimatedTimeRemaining: null,
        error,
        initialize,
        cancel,
        generateStructuredResponse,
        generateStreamingResponse,
        switchModel: load,
      }}
    >
      {children}
    </WebLLMContext.Provider>
  )
}

export { MODEL_TIERS }

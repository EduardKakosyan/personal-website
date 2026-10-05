export type LocalAISupport =
  | { status: 'checking' }
  | { status: 'supported' }
  | { status: 'unsupported'; reason: string }

type BrowserGPU = Pick<GPU, 'requestAdapter'>

export async function checkLocalAISupport(
  secureContext: boolean,
  gpu?: BrowserGPU,
): Promise<LocalAISupport> {
  if (!secureContext)
    return {
      status: 'unsupported',
      reason: 'Local AI needs a secure connection. Open this site over HTTPS or localhost.',
    }
  if (!gpu)
    return {
      status: 'unsupported',
      reason: 'WebGPU is unavailable in this browser. Try opening this page in Chrome or Edge.',
    }
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter)
      return {
        status: 'unsupported',
        reason:
          'The browser could not access a compatible GPU. Check hardware acceleration, then reload the page.',
      }
    // This is a requirement of the installed WebLLM runtime, independent of model size.
    const buffers = adapter.limits.maxStorageBuffersPerShaderStage
    if (buffers < 10)
      return {
        status: 'unsupported',
        reason: `This browser supports ${buffers} GPU storage buffers; local AI needs 10. Try this page in Chrome or Edge.`,
      }
    return { status: 'supported' }
  } catch {
    return {
      status: 'unsupported',
      reason: 'The browser’s GPU check failed. Reload the page or try Chrome or Edge.',
    }
  }
}

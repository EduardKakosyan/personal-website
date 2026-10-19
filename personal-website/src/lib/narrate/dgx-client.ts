import type { CallModel, ModelRequest } from './narrate'

export const MODEL_TIMEOUT_MS = 3000

/** The exact chat request the site sends; shared with the eval recorder. */
export function chatBody({ messages, schema, maxTokens }: ModelRequest, model?: string) {
  return {
    model: model ?? 'qwen3.6-35b-a3b',
    messages,
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'guide_action', schema: JSON.parse(schema) },
    },
    // Qwen3 thinks by default; a 3-second budget has no room for it.
    chat_template_kwargs: { enable_thinking: false },
  }
}

/**
 * An OpenAI-compatible chat call to the DGX Spark (SGLang or llama.cpp's llama-server) behind a
 * Cloudflare Tunnel protected by a Cloudflare Access service token. Throws on anything other
 * than a well-formed reply within MODEL_TIMEOUT_MS; narrate() turns that into null.
 */
export function dgxModel(
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch,
): CallModel {
  return async (request) => {
    const base = env.DGX_NARRATE_URL
    const id = env.CF_ACCESS_CLIENT_ID
    const secret = env.CF_ACCESS_CLIENT_SECRET
    if (!base || !id || !secret) throw new Error('narrator is not configured')
    const url = new URL('v1/chat/completions', base.endsWith('/') ? base : `${base}/`)
    if (url.protocol !== 'https:') throw new Error('narrator URL must be https')
    const response = await fetcher(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'CF-Access-Client-Id': id,
        'CF-Access-Client-Secret': secret,
      },
      body: JSON.stringify(chatBody(request, env.DGX_NARRATE_MODEL)),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      cache: 'no-store',
      redirect: 'error', // an Access login redirect means the token is wrong
    })
    if (!response.ok) throw new Error(`narrator returned ${response.status}`)
    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] }
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('narrator reply had no content')
    return content
  }
}

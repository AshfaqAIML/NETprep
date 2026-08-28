/**
 * AIService — provider-neutral AI abstraction.
 *
 * AI is OPTIONAL. The core educational platform works fully without any AI
 * provider configured. This adapter enables future AI-enhanced features
 * (study assistant, doubt solver, quiz generator) without coupling the app
 * to a single vendor.
 *
 * Providers:
 *   - "none" (default): no-op, returns graceful "not configured" responses
 *   - "openai": OpenAI Chat Completions API
 *   - "anthropic": Anthropic Messages API
 *   - "google": Google Generative AI (Gemini)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AICompletionResponse {
  content: string
  model: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export interface AIAdapter {
  readonly provider: string
  complete(req: AICompletionRequest): Promise<AICompletionResponse>
  isConfigured(): boolean
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

let _instance: AIAdapter | null = null

export function getAIProvider(): AIAdapter {
  if (_instance) return _instance

  const provider = (process.env.AI_PROVIDER ?? 'none').toLowerCase()

  switch (provider) {
    case 'openai':
      _instance = new OpenAIAdapter()
      break
    case 'anthropic':
      _instance = new AnthropicAdapter()
      break
    case 'google':
      _instance = new GoogleAIAdapter()
      break
    case 'none':
    default:
      _instance = new NoopAIAdapter()
      break
  }

  return _instance
}

// ---------------------------------------------------------------------------
// Noop adapter (default — app works fully without AI)
// ---------------------------------------------------------------------------

export class NoopAIAdapter implements AIAdapter {
  readonly provider = 'none'

  isConfigured() {
    return false
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    return {
      content:
        'AI features are not configured. Set AI_PROVIDER=openai|anthropic|google and the corresponding API key in your .env file to enable AI-powered features. The core platform works fully without AI.',
      model: 'none',
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI adapter (https://platform.openai.com)
// ---------------------------------------------------------------------------

export class OpenAIAdapter implements AIAdapter {
  readonly provider = 'openai'
  private apiKey: string
  private defaultModel: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? ''
    this.defaultModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    if (!this.apiKey) {
      console.warn('[AIService:openai] OPENAI_API_KEY not set — AI features disabled')
    }
  }

  isConfigured() {
    return !!this.apiKey
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured')
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model ?? this.defaultModel,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1000,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${err}`)
    }
    const data = await res.json()
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }
}

// ---------------------------------------------------------------------------
// Anthropic adapter (https://docs.anthropic.com)
// ---------------------------------------------------------------------------

export class AnthropicAdapter implements AIAdapter {
  readonly provider = 'anthropic'
  private apiKey: string
  private defaultModel: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? ''
    this.defaultModel = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022'
    if (!this.apiKey) {
      console.warn('[AIService:anthropic] ANTHROPIC_API_KEY not set — AI features disabled')
    }
  }

  isConfigured() {
    return !!this.apiKey
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured')
    }
    // Anthropic separates system from conversation messages
    const systemMsg = req.messages.find((m) => m.role === 'system')
    const convMsgs = req.messages.filter((m) => m.role !== 'system')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model ?? this.defaultModel,
        max_tokens: req.maxTokens ?? 1000,
        temperature: req.temperature ?? 0.7,
        system: systemMsg?.content,
        messages: convMsgs,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error: ${err}`)
    }
    const data = await res.json()
    return {
      content: data.content[0].text,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    }
  }
}

// ---------------------------------------------------------------------------
// Google AI adapter (Gemini — https://ai.google.dev)
// ---------------------------------------------------------------------------

export class GoogleAIAdapter implements AIAdapter {
  readonly provider = 'google'
  private apiKey: string
  private defaultModel: string

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY ?? ''
    this.defaultModel = process.env.GOOGLE_AI_MODEL ?? 'gemini-1.5-flash'
    if (!this.apiKey) {
      console.warn('[AIService:google] GOOGLE_AI_API_KEY not set — AI features disabled')
    }
  }

  isConfigured() {
    return !!this.apiKey
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('Google AI API key not configured')
    }
    const model = req.model ?? this.defaultModel
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`

    // Convert chat messages to Gemini format
    const contents = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemMsg = req.messages.find((m) => m.role === 'system')

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 1000,
        },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google AI API error: ${err}`)
    }
    const data = await res.json()
    return {
      content: data.candidates[0].content.parts[0].text,
      model,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience singleton
// ---------------------------------------------------------------------------

export const ai = getAIProvider()

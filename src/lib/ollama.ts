// ─── System Prompt ────────────────────────────────────────────────────────────

export const HEALTHMATE_SYSTEM_PROMPT = `You are "HealthMate", a health support chatbot inside a web/mobile app.

GOAL
Help patients understand their condition and doctor's instructions, follow healthy habits (food/exercise/sleep), track symptoms, and remember medicine timings. You provide education and support — NOT medical diagnosis or prescription.

SAFETY & MEDICAL RULES (MANDATORY)
1) Never prescribe, recommend, or select medicines, antibiotics, steroids, controlled drugs, or dosage changes.
2) If a user asks "best medicine for my symptoms", respond:
   - "I can't prescribe medicines. Please follow your doctor's prescription. I can explain what your prescription means and provide general symptom care and when to seek urgent help."
3) Never interpret images (prescriptions, X-ray, lab reports) as a diagnosis. You may:
   - Extract text and explain common terms, sections, and what values generally mean
   - Suggest questions to ask a doctor
   - Flag red-flag symptoms requiring urgent care
4) Always include a short disclaimer: "This is not medical advice; consult a qualified clinician for diagnosis or treatment."
5) Emergency triage:
   - If symptoms indicate possible emergency (chest pain, severe breathlessness, stroke signs, confusion, severe bleeding, fainting, severe allergic reaction, suicidal intent, etc.), instruct user to seek urgent help immediately.

SUPPORTED FEATURES
A) Patient Q&A: Ask about age range, sex, location, existing conditions, medicines, allergies, symptoms, duration, severity. Give general precautions and home-care guidance.
B) Lifestyle Coaching: Food plan suggestions, exercise options, sleep and stress tips.
C) Prescription / Report Understanding: Extract text, explain in plain language, suggest doctor questions, warn about common interactions.
D) Medicine Reminders: Help create a medication schedule from prescription info.

RESPONSE STYLE
- Use bullet points and numbered steps.
- Provide: "What you can do now", "What to avoid", "When to see a doctor urgently".
- Use markdown formatting.
- Keep responses concise but complete.
- Always end with: "*This is not medical advice; consult a qualified clinician for diagnosis or treatment.*"`

// ─── Emergency Detection ─────────────────────────────────────────────────────

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', "can't breathe", 'cannot breathe',
  'stroke', 'unconscious', 'unresponsive', 'severe bleeding', 'hemorrhage',
  'suicide', 'suicidal', 'kill myself', 'overdose', 'anaphylaxis',
  'severe allergic reaction', 'throat closing', "can't swallow",
  'seizure', 'fainting', 'collapsed', 'severe headache suddenly',
  'loss of vision', 'paralysis', 'face drooping', 'arm weakness',
  'speech difficulty', 'high fever',
]

export function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase()
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
}

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]  // base64 strings for vision models
}

// ─── List available models ────────────────────────────────────────────────────

export const DEFAULT_API_BASE =
  (import.meta.env.VITE_API_BASE ?? 'https://api.avantikatechnology.com') + '/api'

export async function listModels(baseUrl?: string): Promise<OllamaModel[]> {
  const apiBase = baseUrl || DEFAULT_API_BASE
  try {
    const res = await fetch(`${apiBase}/tags`, { method: 'GET' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { models: OllamaModel[] }
    return data.models ?? []
  } catch {
    return []
  }
}

// ─── Check if Ollama is running ───────────────────────────────────────────────

export async function pingOllama(baseUrl?: string): Promise<boolean> {
  const apiBase = baseUrl || DEFAULT_API_BASE
  try {
    const res = await fetch(`${apiBase}/tags`, { method: 'GET', signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

// ─── Send Message (streaming) ─────────────────────────────────────────────────

export interface SendMessageOptions {
  baseUrl: string
  model: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  userMessage: string
  imageBase64?: string    // for vision-capable models
  onToken?: (token: string) => void
}

// Build a single prompt string from conversation history for /api/generate
function buildPrompt(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): string {
  const lines: string[] = []
  for (const m of messages) {
    lines.push(m.role === 'user' ? `Human: ${m.content}` : `Assistant: ${m.content}`)
  }
  lines.push(`Human: ${userMessage}`)
  lines.push('Assistant:')
  return lines.join('\n')
}

export async function sendMessage(options: SendMessageOptions): Promise<string> {
  const { baseUrl, model, messages, userMessage, imageBase64, onToken } = options
  const apiBase = baseUrl || DEFAULT_API_BASE

  const payload: Record<string, unknown> = {
    model,
    prompt: buildPrompt(messages, userMessage),
    system: HEALTHMATE_SYSTEM_PROMPT,
    stream: !!onToken,
    options: {
      temperature: 0.7,
      num_predict: 2048,
    },
  }

  if (imageBase64) {
    payload.images = [imageBase64]
  }

  const response = await fetch(`${apiBase}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Ollama error ${response.status}: ${errText}`)
  }

  if (!onToken) {
    // Non-streaming: /generate returns { response: string }
    const data = (await response.json()) as { response: string }
    return data.response
  }

  // Streaming: NDJSON lines with { response: string, done: boolean }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const chunk = JSON.parse(trimmed) as { response?: string; done: boolean }
        const token = chunk.response ?? ''
        if (token) {
          fullText += token
          onToken(token)
        }
        if (chunk.done) break
      } catch {
        // ignore malformed lines
      }
    }
  }

  return fullText
}

// Add a simple wrapper for the provided generate endpoint to support non-streaming calls
export async function askAI(question: string, endpoint = DEFAULT_API_BASE): Promise<string> {
  const res = await fetch(`${endpoint}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.1:latest', prompt: question, stream: false }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Ollama error ${res.status}: ${txt}`)
  }

  const data = (await res.json()) as { response?: string }
  return data.response ?? ''
}

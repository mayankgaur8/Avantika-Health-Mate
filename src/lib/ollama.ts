// ─── System Prompt ────────────────────────────────────────────────────────────
// Kept here so both ChatPage and UploadPage share the same safety rules.
// The backend (api/chat/index.js) also embeds this prompt so the AI always
// receives it — this copy is for reference only.

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

// ─── API endpoint ─────────────────────────────────────────────────────────────
// Always use the relative /api path — Azure Static Web Apps routes it to the
// bundled Azure Functions.  Vite dev server proxies it to the Functions emulator
// on port 7071.

const CHAT_ENDPOINT = '/api/chat'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SendMessageOptions {
  messages: OllamaChatMessage[]
  userMessage: string
  imageBase64?: string
  modelPreference?: 'cheap' | 'premium'
  onToken?: (token: string) => void
}

// ─── Send message to /api/chat ────────────────────────────────────────────────

export async function sendMessage(options: SendMessageOptions): Promise<string> {
  const { messages, userMessage, imageBase64, modelPreference = 'cheap', onToken } = options

  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      messages,   // conversation history
      imageBase64,
      modelPreference,
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    let errMsg = `AI service error (${res.status})`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) errMsg = body.error
    } catch { /* ignore */ }
    throw new Error(errMsg)
  }

  const data = await res.json() as { response: string; model?: string; provider?: string }
  const text = data.response ?? ''

  // Simulate streaming: deliver full text to onToken in one shot
  // This keeps ChatPage's streaming-update pattern working while the backend
  // returns a complete response (non-streaming keeps Azure Function costs low).
  if (onToken && text) onToken(text)

  return text
}

// ─── Simple one-shot wrapper ─────────────────────────────────────────────────

export async function askAI(question: string): Promise<string> {
  return sendMessage({ messages: [], userMessage: question })
}

// ─── Health check ─────────────────────────────────────────────────────────────
// Pings the backend by sending a minimal request.

export async function pingAI(): Promise<boolean> {
  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', messages: [] }),
      signal: AbortSignal.timeout(8_000),
    })
    return res.ok || res.status === 400  // 400 = API reachable but bad payload
  } catch {
    return false
  }
}

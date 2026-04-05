// HealthMate AI Chat — Azure Function
// Routes to Groq (cheap/fast) → OpenAI (fallback/premium)
// Uses built-in https module — zero npm dependencies

const https = require('https')

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const HEALTHMATE_SYSTEM_PROMPT = `You are "HealthMate", a health support chatbot inside a web/mobile app.

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

// ─── Provider Config ───────────────────────────────────────────────────────────

// All providers use OpenAI-compatible /chat/completions API
const PROVIDERS = {
  groq: {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    getKey: () => process.env.GROQ_API_KEY || '',
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    // Groq vision model for image analysis
    visionModel: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  openai: {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    getKey: () => process.env.OPENAI_API_KEY || '',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    // gpt-4o-mini supports vision natively
    visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
  },
}

// ─── HTTPS helper ─────────────────────────────────────────────────────────────

function httpsPost(hostname, path, apiKey, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      timeout: 55000,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`))
          return
        }
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`))
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out after 55s'))
    })

    req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)))

    req.write(bodyStr)
    req.end()
  })
}

// ─── Call a single provider ────────────────────────────────────────────────────

async function callProvider(providerName, messages, hasImage) {
  const config = PROVIDERS[providerName]
  if (!config) throw new Error(`Unknown provider: ${providerName}`)

  const apiKey = config.getKey()
  if (!apiKey) throw new Error(`${providerName.toUpperCase()}_API_KEY is not set`)

  const model = hasImage ? config.visionModel : config.chatModel

  const result = await httpsPost(config.hostname, config.path, apiKey, {
    model,
    messages,
    max_tokens: 2048,
    temperature: 0.7,
  })

  const content = result.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from provider')

  return { content, model, provider: providerName }
}

// ─── Azure Function entry ──────────────────────────────────────────────────────

module.exports = async function (context, req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS }
    return
  }

  const {
    message = '',
    messages: history = [],  // prior conversation [ {role, content}, … ]
    imageBase64,
    modelPreference = process.env.DEFAULT_MODEL_PREFERENCE || 'cheap',
  } = req.body || {}

  if (!message && !imageBase64) {
    context.res = {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'message or imageBase64 is required' }),
    }
    return
  }

  // ── Build messages array for the AI provider ───────────────────────────────

  const chatMessages = [{ role: 'system', content: HEALTHMATE_SYSTEM_PROMPT }]

  // Include last 10 turns of history for context (avoid token bloat)
  const safeHistory = Array.isArray(history) ? history.slice(-10) : []
  for (const turn of safeHistory) {
    if (turn.role && turn.content) {
      chatMessages.push({ role: turn.role, content: turn.content })
    }
  }

  // Current user turn — supports vision (multimodal content array)
  if (imageBase64) {
    const mimeType = imageBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png'
    chatMessages.push({
      role: 'user',
      content: [
        { type: 'text', text: message || 'Please analyze this medical document.' },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
      ],
    })
  } else {
    chatMessages.push({ role: 'user', content: message })
  }

  // ── Provider routing: cheap first → premium fallback ──────────────────────

  const hasImage = Boolean(imageBase64)

  // cheap: Groq → OpenAI fallback
  // premium: OpenAI → Groq fallback
  const providerOrder =
    modelPreference === 'premium'
      ? ['openai', 'groq']
      : ['groq', 'openai']

  let lastError = null

  for (const provider of providerOrder) {
    try {
      const result = await callProvider(provider, chatMessages, hasImage)
      context.res = {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: result.content,
          model: result.model,
          provider: result.provider,
        }),
      }
      return
    } catch (err) {
      console.error(`[HealthMate] Provider "${provider}" failed:`, err.message)
      lastError = err
    }
  }

  // All providers exhausted
  console.error('[HealthMate] All providers failed. Last error:', lastError?.message)
  context.res = {
    status: 503,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'AI service temporarily unavailable. Please try again in a moment.',
    }),
  }
}

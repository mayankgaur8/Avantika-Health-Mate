export async function askAI(question: string) {
  const API_BASE = 'https://api.avantikatechnology.com/api'
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.1:latest', prompt: question, stream: false }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Ollama error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  return data.response
}

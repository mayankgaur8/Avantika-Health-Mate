import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageBubble } from '../components/chat/MessageBubble'
import { ChatInput } from '../components/chat/ChatInput'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { EmergencyBanner } from '../components/ui/EmergencyBanner'
import { sendMessage, detectEmergency } from '../lib/ollama'
import { settingsStore } from '../lib/storage'
import type { ChatMessage } from '../types'
import { AlertCircle, Cpu } from 'lucide-react'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `# Welcome to HealthMate! 👋

I'm your personal health support companion powered by a **local AI model** (Ollama). Here's how I can help:

- **💬 Health Q&A** — Understand symptoms and get general guidance
- **📋 Prescription Reading** — Upload and understand your prescriptions
- **🏃 Lifestyle Coaching** — Food, exercise, sleep, and habit tips
- **💊 Medicine Reminders** — Never miss a dose

> *I provide health education and support — not medical diagnosis or treatment. Always consult a qualified clinician.*

**What can I help you with today?**`,
  timestamp: new Date(),
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const handleSend = async (text: string, file?: File) => {
    const { baseUrl, model, visionModel } = settingsStore.getOllamaConfig()
    setError('')

    // Emergency check
    if (detectEmergency(text)) {
      setShowEmergency(true)
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      attachmentName: file?.name,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    // Streaming placeholder
    const assistantId = genId()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
    ])

    try {
      let imageBase64: string | undefined
      let activeModel = model

      if (file && file.type.startsWith('image/')) {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        imageBase64 = btoa(binary)
        // Switch to vision model for image analysis
        activeModel = visionModel
      }

      let fullContent = ''

      await sendMessage({
        baseUrl,
        model: activeModel,
        messages: messages
          .filter((m) => m.id !== 'welcome' && !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })),
        userMessage: text,
        imageBase64,
        onToken: (token) => {
          fullContent += token
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
          )
        },
      })

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      const isConnectionErr = msg.includes('fetch') || msg.includes('Failed') || msg.includes('ECONNREFUSED')
      const hint = isConnectionErr
        ? '\n\n**Is Ollama running?** Open a terminal and run:\n```\nollama serve\n```\nThen make sure you have a model: `ollama pull llama3.1`'
        : '\n\nCheck your model name in **Settings**.'

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Sorry, I couldn't reach Ollama: *${msg}*${hint}`, isStreaming: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const { model } = settingsStore.getOllamaConfig()

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Emergency banner */}
      {showEmergency && <EmergencyBanner />}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex-shrink-0">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Model badge */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-xs">
          <Cpu size={11} />
          <span>Local model: <strong>{model}</strong></span>
        </div>
      </div>

      {/* Messages — scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — fixed at bottom, clears mobile nav bar */}
      <div className="flex-shrink-0 pb-16 md:pb-0">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}

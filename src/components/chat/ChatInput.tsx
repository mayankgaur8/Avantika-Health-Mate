import { useRef, useState, useEffect, type KeyboardEvent } from 'react'
import { Send, Paperclip, X, Mic, MicOff } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string, file?: File) => void
  disabled?: boolean
}

// Browser Speech Recognition API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// Detect support
const SpeechRecognitionAPI =
  (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
    .SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
    .webkitSpeechRecognition ??
  null

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed && !file) return
    onSend(trimmed || (file ? `[Uploaded: ${file.name}]` : ''), file ?? undefined)
    setText('')
    setFile(null)
    if (textRef.current) {
      textRef.current.style.height = 'auto'
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
    e.target.value = ''
  }

  const toggleVoice = () => {
    if (!SpeechRecognitionAPI) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-IN'   // Indian English — good for health context
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) {
          final = e.results[i][0].transcript + ' '
          break
        } else {
          interim = e.results[i][0].transcript
        }
      }
      if (final) {
        setText((prev) => (prev + final).trimStart())
        setInterimText('')
        // Auto-resize textarea
        if (textRef.current) {
          textRef.current.style.height = 'auto'
          textRef.current.style.height = Math.min(textRef.current.scrollHeight, 120) + 'px'
        }
      } else {
        setInterimText(interim)
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are normal — don't alert
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error)
      }
      setListening(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const displayText = text + (interimText ? (text ? ' ' : '') + interimText : '')

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:p-4">
      {/* Listening indicator */}
      {listening && (
        <div className="mb-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-600 dark:text-red-400 flex-1">
            {interimText ? `"${interimText}"` : 'Listening… speak now'}
          </span>
          <button onClick={toggleVoice} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="mb-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-lg">
          <Paperclip size={14} className="text-primary-600" />
          <span className="text-xs text-primary-700 dark:text-primary-300 flex-1 truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-primary-400 hover:text-primary-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File attach */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
          title="Attach prescription / lab report"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />

        {/* Text area */}
        <textarea
          ref={textRef}
          value={displayText}
          onChange={handleTextChange}
          onKeyDown={handleKey}
          placeholder={listening ? 'Listening…' : 'Ask HealthMate anything…'}
          disabled={disabled}
          rows={1}
          inputMode="text"
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />

        {/* Mic button — shown when SpeechRecognition is available */}
        {SpeechRecognitionAPI && (
          <button
            onClick={toggleVoice}
            disabled={disabled}
            title={listening ? 'Stop listening' : 'Speak your question'}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 ${
              listening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            }`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !file)}
          className="flex-shrink-0 w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

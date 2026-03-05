import { useRef, useState, type KeyboardEvent } from 'react'
import { Send, Paperclip, X } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string, file?: File) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

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
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
    e.target.value = ''
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 md:p-4">
      {/* File preview */}
      {file && (
        <div className="mb-2 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-lg">
          <Paperclip size={14} className="text-primary-600" />
          <span className="text-xs text-primary-700 dark:text-primary-300 flex-1 truncate">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-primary-400 hover:text-primary-600 transition-colors"
          >
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFile}
        />

        {/* Text area */}
        <textarea
          ref={textRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKey}
          placeholder="Ask HealthMate anything…"
          disabled={disabled}
          rows={1}
          inputMode="text"
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-base md:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />

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

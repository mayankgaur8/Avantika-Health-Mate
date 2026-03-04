import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import { Paperclip } from 'lucide-react'
import type { ChatMessage } from '../../types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-end gap-2 px-4 py-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs
          ${isUser
            ? 'bg-primary-600 text-white'
            : 'bg-primary-100 dark:bg-primary-900/40'
          }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Attachment label */}
        {message.attachmentName && (
          <div className={`flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'flex-row-reverse' : ''}`}>
            <Paperclip size={11} />
            <span>{message.attachmentName}</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
            ${isUser
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
            }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <span className={`text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  )
}

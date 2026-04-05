import { useState, useRef } from 'react'
import { Upload, FileText, Image, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { settingsStore, reportsStore } from '../lib/storage'
import { sendMessage } from '../lib/ollama'
import type { UploadedReport } from '../types'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const UPLOAD_PROMPT = `You are HealthMate analyzing a medical document (prescription or lab report).

Please:
1. Extract all visible text and entities (medicine names, doses, timings, test names, values, reference ranges)
2. Summarize each medicine's common use, how to take it exactly as written, and common side effects
3. For lab reports: explain what each test measures, what the values mean, and flag any out-of-range values
4. List 5 "Questions to ask your doctor"
5. Mention any important warnings (drug interactions, avoid alcohol, driving caution, etc.)

Format your response clearly with sections. End with the disclaimer.`

export function UploadPage() {
  const [reports, setReports] = useState<UploadedReport[]>(() => reportsStore.getAll())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [apiError, setApiError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    const { modelPreference } = settingsStore.getAIConfig()
    setApiError('')
    setIsAnalyzing(true)

    try {
      let imageBase64: string | undefined
      let textContent = `Please analyze this medical document: ${file.name}\n\n${UPLOAD_PROMPT}`

      if (file.type.startsWith('image/')) {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        imageBase64 = btoa(binary)
        // Backend auto-selects a vision-capable model when imageBase64 is present
        textContent = UPLOAD_PROMPT
      } else if (file.type === 'application/pdf') {
        textContent = `The user has uploaded a PDF prescription/report named "${file.name}". Please inform them that for best results with PDF files, they should take a clear photo of the document and re-upload it, or paste the text content in chat. Ask them to describe what they see or paste the text.`
      }

      const analysis = await sendMessage({
        messages: [],
        userMessage: textContent,
        imageBase64,
        modelPreference,
      })

      const report: UploadedReport = {
        id: genId(),
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        analysis,
      }

      reportsStore.save(report)
      setReports(reportsStore.getAll())
      setExpandedId(report.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setApiError(`Analysis failed: ${msg}. Please try again.`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setApiError('File too large. Maximum size is 10MB.')
      return
    }
    analyze(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDelete = (id: string) => {
    reportsStore.delete(id)
    setReports(reportsStore.getAll())
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Prescription / Report</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Get a plain-language explanation of your medical documents
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6
          ${dragOver
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
          }
          ${isAnalyzing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
        {isAnalyzing ? (
          <div>
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing document with AI…</p>
            <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop your prescription or lab report here
            </p>
            <p className="text-xs text-gray-400 mt-1">or click to browse · JPG, PNG, WEBP, PDF · max 10MB</p>
          </div>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle size={16} className="flex-shrink-0" />
          {apiError}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> HealthMate explains documents in plain language but does not diagnose or prescribe.
        Images are sent securely to the AI service for analysis. This is not medical advice.
      </div>

      {/* Reports list */}
      {reports.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Analyzed Documents ({reports.length})
          </h3>
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                {/* Report header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    {r.fileType.startsWith('image/') ? (
                      <Image size={18} className="text-primary-600" />
                    ) : (
                      <FileText size={18} className="text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.fileName}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(r.uploadedAt), 'MMM d, yyyy · HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="green">Analyzed</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expandedId === r.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded analysis */}
                {expandedId === r.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

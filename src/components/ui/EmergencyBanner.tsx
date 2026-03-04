import { AlertTriangle, Phone, X } from 'lucide-react'
import { useState } from 'react'

export function EmergencyBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mx-4 mt-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse-once">
      <div className="flex-shrink-0 mt-0.5">
        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
          Emergency — Seek Immediate Help
        </p>
        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
          Your symptoms may require urgent medical attention. Please call emergency services immediately.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
          >
            <Phone size={12} />
            Call 112 (India)
          </a>
          <a
            href="tel:911"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
          >
            <Phone size={12} />
            Call 911 (US/Canada)
          </a>
          <a
            href="tel:999"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
          >
            <Phone size={12} />
            Call 999 (UK)
          </a>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

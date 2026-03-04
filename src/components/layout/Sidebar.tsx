import { MessageCircle, Bell, Upload, Activity, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import type { NavPage } from '../../types'

interface SidebarProps {
  current: NavPage
  onChange: (page: NavPage) => void
}

const NAV_ITEMS: { id: NavPage; label: string; icon: typeof MessageCircle }[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'lifestyle', label: 'Lifestyle', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ current, onChange }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
            <img src="/avantika-health-mate.png" alt="Avantika Health Mate" className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Avantika Health Mate</p>
          <p className="text-xs text-gray-400">Your health companion</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              current === id
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer disclaimer */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          HealthMate provides health education only. Not a substitute for professional medical advice.
        </p>
      </div>
    </aside>
  )
}

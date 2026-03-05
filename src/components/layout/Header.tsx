import { MessageCircle, Bell, Upload, Activity, Settings, Heart, Moon, Sun } from 'lucide-react'
import { clsx } from 'clsx'
import type { NavPage } from '../../types'

interface HeaderProps {
  current: NavPage
  onChange: (page: NavPage) => void
  darkMode: boolean
  onToggleDark: () => void
}

const PAGE_TITLES: Record<NavPage, string> = {
  chat: 'Chat',
  reminders: 'Medicine Reminders',
  upload: 'Upload Prescription',
  lifestyle: 'Lifestyle Coaching',
  settings: 'Settings',
}

const NAV_ITEMS: { id: NavPage; icon: typeof MessageCircle }[] = [
  { id: 'chat', icon: MessageCircle },
  { id: 'reminders', icon: Bell },
  { id: 'upload', icon: Upload },
  { id: 'lifestyle', icon: Activity },
  { id: 'settings', icon: Settings },
]

export function Header({ current, onChange, darkMode, onToggleDark }: HeaderProps) {
  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {PAGE_TITLES[current]}
        </h1>
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src="/avantika-health-mate.png" alt="Avantika Health Mate" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">Avantika Health Mate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {PAGE_TITLES[current]}
          </span>
          <button
            onClick={onToggleDark}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors',
              current === id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium capitalize">{id}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

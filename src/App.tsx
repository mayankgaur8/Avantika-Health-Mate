import { useState, useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatPage } from './pages/ChatPage'
import { RemindersPage } from './pages/RemindersPage'
import { UploadPage } from './pages/UploadPage'
import { LifestylePage } from './pages/LifestylePage'
import { SettingsPage } from './pages/SettingsPage'
import { settingsStore } from './lib/storage'
import type { NavPage } from './types'

export default function App() {
  const [page, setPage] = useState<NavPage>('chat')
  const [darkMode, setDarkMode] = useState(() => settingsStore.get().darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleDarkModeChange = (v: boolean) => {
    setDarkMode(v)
  }

  const renderPage = () => {
    switch (page) {
      case 'chat':
        return <ChatPage />
      case 'reminders':
        return <RemindersPage />
      case 'upload':
        return <UploadPage />
      case 'lifestyle':
        return <LifestylePage />
      case 'settings':
        return <SettingsPage onDarkModeChange={handleDarkModeChange} />
      default:
        return <ChatPage />
    }
  }

  return (
    <div className={`flex h-[100dvh] bg-gray-50 dark:bg-gray-950 font-sans overflow-hidden`}>
      {/* Desktop sidebar */}
      <Sidebar current={page} onChange={setPage} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          current={page}
          onChange={setPage}
          darkMode={darkMode}
          onToggleDark={() => {
            const next = !darkMode
            setDarkMode(next)
            const s = settingsStore.get()
            settingsStore.save({ ...s, darkMode: next })
          }}
        />

        {/* Page content */}
        <main
          className={page === 'chat' ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1 overflow-y-auto pb-20 md:pb-0'}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

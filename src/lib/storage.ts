import type {
  MedicineReminder,
  ReminderLog,
  DailyLog,
  UserProfile,
  AppSettings,
  UploadedReport,
} from '../types'

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  REMINDERS: 'hm_reminders',
  REMINDER_LOGS: 'hm_reminder_logs',
  DAILY_LOGS: 'hm_daily_logs',
  PROFILE: 'hm_profile',
  SETTINGS: 'hm_settings',
  REPORTS: 'hm_reports',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export const remindersStore = {
  getAll: (): MedicineReminder[] => get(KEYS.REMINDERS, []),
  save: (reminder: MedicineReminder) => {
    const all = remindersStore.getAll()
    const idx = all.findIndex((r) => r.id === reminder.id)
    if (idx >= 0) all[idx] = reminder
    else all.push(reminder)
    set(KEYS.REMINDERS, all)
  },
  delete: (id: string) => {
    set(KEYS.REMINDERS, remindersStore.getAll().filter((r) => r.id !== id))
  },
}

// ─── Reminder Logs ───────────────────────────────────────────────────────────

export const reminderLogsStore = {
  getAll: (): ReminderLog[] => get(KEYS.REMINDER_LOGS, []),
  add: (log: ReminderLog) => {
    const all = reminderLogsStore.getAll()
    all.push(log)
    set(KEYS.REMINDER_LOGS, all)
  },
  getWeeklyAdherence: (reminderId: string): { taken: number; total: number } => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const logs = reminderLogsStore.getAll().filter(
      (l) => l.reminderId === reminderId && l.scheduledTime >= weekAgo
    )
    return {
      taken: logs.filter((l) => l.action === 'taken').length,
      total: logs.length,
    }
  },
}

// ─── Daily Logs ──────────────────────────────────────────────────────────────

export const dailyLogsStore = {
  getAll: (): DailyLog[] => get(KEYS.DAILY_LOGS, []),
  getToday: (): DailyLog => {
    const today = new Date().toISOString().slice(0, 10)
    const all = dailyLogsStore.getAll()
    return (
      all.find((l) => l.date === today) ?? {
        date: today,
        waterGlasses: 0,
        steps: 0,
        sleepHours: 0,
        mood: 3,
      }
    )
  },
  save: (log: DailyLog) => {
    const all = dailyLogsStore.getAll()
    const idx = all.findIndex((l) => l.date === log.date)
    if (idx >= 0) all[idx] = log
    else all.push(log)
    set(KEYS.DAILY_LOGS, all)
  },
  getLast7Days: (): DailyLog[] => {
    const all = dailyLogsStore.getAll()
    const days: DailyLog[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push(
        all.find((l) => l.date === dateStr) ?? {
          date: dateStr,
          waterGlasses: 0,
          steps: 0,
          sleepHours: 0,
          mood: 3,
        }
      )
    }
    return days
  },
}

// ─── User Profile ────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  ageRange: '',
  sex: '',
  country: '',
  conditions: [],
  medicines: [],
  allergies: [],
  whatsappConsent: false,
  whatsappNumber: '',
}

export const profileStore = {
  get: (): UserProfile => get(KEYS.PROFILE, DEFAULT_PROFILE),
  save: (profile: UserProfile) => set(KEYS.PROFILE, profile),
}

// ─── App Settings ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1',
  ollamaVisionModel: 'llava',
  darkMode: false,
  notificationsEnabled: false,
}

export const settingsStore = {
  get: (): AppSettings => {
    const stored = get(KEYS.SETTINGS, DEFAULT_SETTINGS)
    // Migrate old API-key-based settings if present
    return { ...DEFAULT_SETTINGS, ...stored }
  },
  save: (settings: AppSettings) => set(KEYS.SETTINGS, settings),
  getOllamaConfig: () => {
    const s = settingsStore.get()
    return {
      baseUrl: s.ollamaBaseUrl || 'http://localhost:11434',
      model: s.ollamaModel || 'llama3.1',
      visionModel: s.ollamaVisionModel || 'llava',
    }
  },
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reportsStore = {
  getAll: (): UploadedReport[] => get(KEYS.REPORTS, []),
  save: (report: UploadedReport) => {
    const all = reportsStore.getAll()
    all.unshift(report)
    set(KEYS.REPORTS, all.slice(0, 20)) // keep last 20
  },
  delete: (id: string) => {
    set(KEYS.REPORTS, reportsStore.getAll().filter((r) => r.id !== id))
  },
}

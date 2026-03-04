// ─── Chat ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  attachmentName?: string
  isStreaming?: boolean
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export interface MedicineReminder {
  id: string
  medicineName: string
  dose: string
  times: string[]          // e.g. ["08:00", "14:00", "20:00"]
  withFood: boolean
  startDate: string        // ISO date string
  endDate: string          // ISO date string
  notes?: string
  createdAt: string
}

export interface ReminderLog {
  reminderId: string
  scheduledTime: string    // ISO datetime
  action: 'taken' | 'skipped' | 'snoozed'
  loggedAt: string         // ISO datetime
}

// ─── Lifestyle ───────────────────────────────────────────────────────────────

export interface DailyLog {
  date: string             // YYYY-MM-DD
  waterGlasses: number
  steps: number
  sleepHours: number
  mood: 1 | 2 | 3 | 4 | 5
}

// ─── User Profile ────────────────────────────────────────────────────────────

export type AgeRange = 'under-18' | '18-30' | '31-45' | '46-60' | '60+'

export interface UserProfile {
  name: string
  ageRange: AgeRange | ''
  sex: 'male' | 'female' | 'other' | ''
  country: string
  conditions: string[]     // e.g. ["diabetes", "hypertension"]
  medicines: string[]
  allergies: string[]
  whatsappConsent: boolean
  whatsappNumber: string
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadedReport {
  id: string
  fileName: string
  fileType: string
  uploadedAt: string
  analysis: string         // AI explanation
  extractedText?: string
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  ollamaBaseUrl: string     // e.g. 'http://localhost:11434'
  ollamaModel: string       // e.g. 'llama3.1', 'qwen2.5', 'gemma2'
  ollamaVisionModel: string // e.g. 'llava', 'llama3.2-vision' (for image uploads)
  darkMode: boolean
  notificationsEnabled: boolean
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type NavPage = 'chat' | 'reminders' | 'upload' | 'lifestyle' | 'settings'

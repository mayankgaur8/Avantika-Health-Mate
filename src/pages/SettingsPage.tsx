import { useState, useEffect } from 'react'
import { Save, Server, User, MessageSquare, Bell, CheckCircle, RefreshCw, Wifi, WifiOff, Cpu } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { settingsStore, profileStore } from '../lib/storage'
import { listModels, pingOllama } from '../lib/ollama'
import type { AppSettings, UserProfile } from '../types'
import type { OllamaModel } from '../lib/ollama'

const CONDITIONS_LIST = [
  'Diabetes (Type 1)', 'Diabetes (Type 2)', 'Hypertension (High BP)',
  'Asthma', 'Heart Disease', 'Thyroid Disorder', 'GERD / Acidity',
  'Kidney Disease', 'Pregnancy', 'Arthritis', 'Depression/Anxiety',
]

export function SettingsPage({ onDarkModeChange }: { onDarkModeChange: (v: boolean) => void }) {
  const [settings, setSettings] = useState<AppSettings>(() => settingsStore.get())
  const [profile, setProfile] = useState<UserProfile>(() => profileStore.get())
  const [saved, setSaved] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle')
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([])
  const [medicineInput, setMedicineInput] = useState('')
  const [allergyInput, setAllergyInput] = useState('')

  // Check Ollama on mount
  useEffect(() => {
    checkOllama()
  }, [])

  const checkOllama = async () => {
    setOllamaStatus('checking')
    const ok = await pingOllama(settings.ollamaBaseUrl)
    setOllamaStatus(ok ? 'online' : 'offline')
    if (ok) {
      const models = await listModels(settings.ollamaBaseUrl)
      setAvailableModels(models)
    }
  }

  const handleSave = () => {
    settingsStore.save(settings)
    profileStore.save(profile)
    onDarkModeChange(settings.darkMode)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleCondition = (c: string) => {
    setProfile((p) => ({
      ...p,
      conditions: p.conditions.includes(c)
        ? p.conditions.filter((x) => x !== c)
        : [...p.conditions, c],
    }))
  }

  const addTag = (field: 'medicines' | 'allergies', value: string) => {
    if (!value.trim()) return
    setProfile((p) => ({ ...p, [field]: [...new Set([...p[field], value.trim()])] }))
  }

  const removeTag = (field: 'medicines' | 'allergies', value: string) => {
    setProfile((p) => ({ ...p, [field]: p[field].filter((v) => v !== value) }))
  }

  const modelSizeMB = (bytes: number) => `${(bytes / 1e9).toFixed(1)} GB`

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure your local AI and health profile</p>
      </div>

      {/* ── Ollama Config ────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Ollama (Local AI)</h3>
          </div>
          {ollamaStatus === 'online' && <Badge variant="green">Online</Badge>}
          {ollamaStatus === 'offline' && <Badge variant="red">Offline</Badge>}
          {ollamaStatus === 'checking' && <Badge variant="yellow">Checking…</Badge>}
        </div>

        {/* Quick start instructions */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium text-gray-700 dark:text-gray-300">Quick setup:</p>
          <p>1. Install Ollama → <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama.com</span></p>
          <p>2. In terminal: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama pull llama3.1</span></p>
          <p>3. Start server: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama serve</span></p>
          <p>4. For image uploads: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama pull llava</span></p>
        </div>

        {/* Base URL */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Ollama Server URL
          </label>
          <div className="flex gap-2">
            <input
              value={settings.ollamaBaseUrl}
              onChange={(e) => setSettings((s) => ({ ...s, ollamaBaseUrl: e.target.value }))}
              placeholder="http://localhost:11434"
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={checkOllama}
              loading={ollamaStatus === 'checking'}
            >
              {ollamaStatus === 'checking' ? '' : <RefreshCw size={14} />}
              Test
            </Button>
          </div>
          {ollamaStatus === 'offline' && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <WifiOff size={11} /> Can't reach Ollama. Is it running? Try: <span className="font-mono">ollama serve</span>
            </p>
          )}
          {ollamaStatus === 'online' && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Wifi size={11} /> Connected — {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {/* Chat Model */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Chat Model (for Q&A)
          </label>
          {availableModels.length > 0 ? (
            <select
              value={settings.ollamaModel}
              onChange={(e) => setSettings((s) => ({ ...s, ollamaModel: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
            >
              {availableModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({modelSizeMB(m.size)})
                </option>
              ))}
            </select>
          ) : (
            <input
              value={settings.ollamaModel}
              onChange={(e) => setSettings((s) => ({ ...s, ollamaModel: e.target.value }))}
              placeholder="llama3.1"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white font-mono"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Recommended: llama3.1, qwen2.5, gemma2, mistral
          </p>
        </div>

        {/* Vision Model */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Vision Model (for image/prescription uploads)
          </label>
          {availableModels.length > 0 ? (
            <select
              value={settings.ollamaVisionModel}
              onChange={(e) => setSettings((s) => ({ ...s, ollamaVisionModel: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
            >
              {availableModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({modelSizeMB(m.size)})
                </option>
              ))}
            </select>
          ) : (
            <input
              value={settings.ollamaVisionModel}
              onChange={(e) => setSettings((s) => ({ ...s, ollamaVisionModel: e.target.value }))}
              placeholder="llava"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white font-mono"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Recommended: llava, llama3.2-vision, moondream
          </p>
        </div>

        {/* Current model badge */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Cpu size={12} />
          <span>Active: <strong className="text-gray-700 dark:text-gray-300">{settings.ollamaModel}</strong></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Vision: <strong className="text-gray-700 dark:text-gray-300">{settings.ollamaVisionModel}</strong></span>
        </div>
      </section>

      {/* ── Appearance ────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Preferences</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
            <div
              onClick={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                settings.darkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-5' : ''}`} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">Browser notifications (reminders)</span>
            <div
              onClick={() => setSettings((s) => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                settings.notificationsEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : ''}`} />
            </div>
          </label>
        </div>
      </section>

      {/* ── Health Profile ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Health Profile</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Personalizes HealthMate's responses. Stored locally on your device.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
              <input
                value={profile.country}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder="e.g. India"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Age Range</label>
              <select
                value={profile.ageRange}
                onChange={(e) => setProfile((p) => ({ ...p, ageRange: e.target.value as UserProfile['ageRange'] }))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              >
                <option value="">Select…</option>
                <option value="under-18">Under 18</option>
                <option value="18-30">18–30</option>
                <option value="31-45">31–45</option>
                <option value="46-60">46–60</option>
                <option value="60+">60+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sex</label>
              <select
                value={profile.sex}
                onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value as UserProfile['sex'] }))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Existing Conditions</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS_LIST.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    profile.conditions.includes(c)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current Medicines</label>
            <div className="flex gap-2 mb-2">
              <input
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addTag('medicines', medicineInput); setMedicineInput('') } }}
                placeholder="Type medicine name + Enter"
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              />
              <Button size="sm" variant="outline" onClick={() => { addTag('medicines', medicineInput); setMedicineInput('') }}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.medicines.map((m) => (
                <span key={m} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs">
                  {m}
                  <button onClick={() => removeTag('medicines', m)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Allergies</label>
            <div className="flex gap-2 mb-2">
              <input
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addTag('allergies', allergyInput); setAllergyInput('') } }}
                placeholder="Type allergy + Enter"
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
              />
              <Button size="sm" variant="outline" onClick={() => { addTag('allergies', allergyInput); setAllergyInput('') }}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.allergies.map((a) => (
                <span key={a} className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full text-xs">
                  {a}
                  <button onClick={() => removeTag('allergies', a)} className="hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp ───────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-green-600" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">WhatsApp Notifications</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer mb-3">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Enable WhatsApp reminders</p>
            <p className="text-xs text-gray-400 mt-0.5">Receive medicine reminders via WhatsApp</p>
          </div>
          <div
            onClick={() => setProfile((p) => ({ ...p, whatsappConsent: !p.whatsappConsent }))}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              profile.whatsappConsent ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.whatsappConsent ? 'translate-x-5' : ''}`} />
          </div>
        </label>
        {profile.whatsappConsent && (
          <input
            value={profile.whatsappNumber}
            onChange={(e) => setProfile((p) => ({ ...p, whatsappNumber: e.target.value }))}
            placeholder="+91 9876543210"
            type="tel"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
          />
        )}
        <p className="text-xs text-gray-400 mt-2">
          WhatsApp integration requires backend setup. Saves your preference for future use.
        </p>
      </section>

      {/* Save */}
      <Button className="w-full" size="lg" onClick={handleSave}>
        {saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
      </Button>

      <p className="text-xs text-gray-400 text-center pb-4">
        All data and AI processing is local to your device. Nothing is sent to any external server.
      </p>
    </div>
  )
}

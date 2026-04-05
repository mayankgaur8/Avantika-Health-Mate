import { useState, useEffect } from 'react'
import { Save, Zap, Crown, User, MessageSquare, Bell, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { settingsStore, profileStore } from '../lib/storage'
import { pingAI } from '../lib/ollama'
import type { AppSettings, UserProfile } from '../types'

const CONDITIONS_LIST = [
  'Diabetes (Type 1)', 'Diabetes (Type 2)', 'Hypertension (High BP)',
  'Asthma', 'Heart Disease', 'Thyroid Disorder', 'GERD / Acidity',
  'Kidney Disease', 'Pregnancy', 'Arthritis', 'Depression/Anxiety',
]

export function SettingsPage({ onDarkModeChange }: { onDarkModeChange: (v: boolean) => void }) {
  const [settings, setSettings] = useState<AppSettings>(() => settingsStore.get())
  const [profile, setProfile] = useState<UserProfile>(() => profileStore.get())
  const [saved, setSaved] = useState(false)
  const [aiStatus, setAiStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle')
  const [medicineInput, setMedicineInput] = useState('')
  const [allergyInput, setAllergyInput] = useState('')

  useEffect(() => {
    checkAI()
  }, [])

  const checkAI = async () => {
    setAiStatus('checking')
    const ok = await pingAI()
    setAiStatus(ok ? 'online' : 'offline')
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

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure AI provider and health profile</p>
      </div>

      {/* ── AI Provider ─────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">AI Provider</h3>
          </div>
          {aiStatus === 'online'   && <Badge variant="green">Online</Badge>}
          {aiStatus === 'offline'  && <Badge variant="red">Offline</Badge>}
          {aiStatus === 'checking' && <Badge variant="yellow">Checking…</Badge>}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={checkAI} loading={aiStatus === 'checking'}>
            {aiStatus !== 'checking' && <RefreshCw size={14} />}
            Test connection
          </Button>
          {aiStatus === 'offline' && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <WifiOff size={11} /> Can't reach AI service
            </p>
          )}
          {aiStatus === 'online' && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Wifi size={11} /> Connected
            </p>
          )}
        </div>

        {/* Model preference */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Model preference
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Cheap / Fast */}
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, modelPreference: 'cheap' }))}
              className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                settings.modelPreference === 'cheap'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-primary-600" />
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Fast &amp; Free</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Groq · llama-3.3-70b</p>
              <p className="text-xs text-green-600 font-medium">Recommended · Low cost</p>
            </button>

            {/* Premium */}
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, modelPreference: 'premium' }))}
              className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                settings.modelPreference === 'premium'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Crown size={14} className="text-amber-500" />
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Premium</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">OpenAI · gpt-4o-mini</p>
              <p className="text-xs text-amber-600 font-medium">Higher quality · Pay-per-use</p>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Both support image analysis (prescriptions, lab reports). Fast &amp; Free uses Groq with automatic
            fallback to OpenAI if unavailable.
          </p>
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
        Health profile is stored locally on your device. AI responses are processed via secure cloud APIs.
      </p>
    </div>
  )
}

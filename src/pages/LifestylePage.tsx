import { useState } from 'react'
import { Droplets, Footprints, Moon, Smile, TrendingUp, Salad, Dumbbell, Brain } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { dailyLogsStore } from '../lib/storage'
import type { DailyLog } from '../types'
import { format, parseISO } from 'date-fns'

// ─── Habit Tracker ─────────────────────────────────────────────────────────

interface HabitRowProps {
  icon: typeof Droplets
  label: string
  value: number
  max: number
  unit: string
  color: string
  onDecrement: () => void
  onIncrement: () => void
}

function HabitRow({ icon: Icon, label, value, max, unit, color, onDecrement, onIncrement }: HabitRowProps) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrement}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-lg flex items-center justify-center transition-colors"
          >
            −
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-white w-10 text-center">
            {value}
          </span>
          <button
            onClick={onIncrement}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-lg flex items-center justify-center transition-colors"
          >
            +
          </button>
          <span className="text-xs text-gray-400 w-10">{unit}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color.replace('bg-', 'bg-').replace('-500', '-500')}`}
          style={{ width: `${pct}%`, backgroundColor: undefined }}
        >
          <div className={`h-full rounded-full ${color}`} />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">Goal: {max} {unit}</p>
    </div>
  )
}

// ─── Weekly Chart ──────────────────────────────────────────────────────────

function WeeklyChart({ logs, field, color, label }: {
  logs: DailyLog[]
  field: keyof Pick<DailyLog, 'waterGlasses' | 'steps' | 'sleepHours'>
  color: string
  label: string
}) {
  const values = logs.map((l) => l[field] as number)
  const max = Math.max(...values, 1)

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label} — last 7 days</p>
      <div className="flex items-end gap-1 h-16">
        {logs.map((l, i) => {
          const v = l[field] as number
          const h = Math.max((v / max) * 100, 4)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${color} opacity-80 transition-all`}
                style={{ height: `${h}%` }}
                title={`${v}`}
              />
              <span className="text-[9px] text-gray-400">
                {format(parseISO(l.date), 'EEE')[0]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Coaching Cards ────────────────────────────────────────────────────────

const COACHING_TIPS = [
  {
    icon: Salad,
    color: 'bg-green-500',
    title: 'Nutrition Tips',
    tips: [
      'Eat 5 portions of fruits and vegetables daily',
      'Choose whole grains over refined carbs',
      'Limit salt to less than 5g per day',
      'Stay hydrated with 8+ glasses of water',
      'Avoid processed and ultra-processed foods',
    ],
  },
  {
    icon: Dumbbell,
    color: 'bg-blue-500',
    title: 'Exercise Guidelines',
    tips: [
      '150 min/week moderate aerobic activity (WHO)',
      'Strength training 2+ days per week',
      'Break sitting time every 30 minutes',
      'Even a 10-min walk helps your heart',
      'Consult your doctor before starting if you have heart/BP conditions',
    ],
  },
  {
    icon: Moon,
    color: 'bg-purple-500',
    title: 'Sleep Hygiene',
    tips: [
      'Aim for 7–9 hours of sleep per night',
      'Keep a consistent sleep and wake schedule',
      'Avoid screens 1 hour before bed',
      'Keep your bedroom cool, dark, and quiet',
      'Limit caffeine after 2 PM',
    ],
  },
  {
    icon: Brain,
    color: 'bg-orange-500',
    title: 'Stress Management',
    tips: [
      'Practice 5–10 min of mindful breathing daily',
      'Take short breaks during work every hour',
      'Connect with friends and family regularly',
      'Limit news/social media if it causes anxiety',
      'Consider yoga or meditation apps',
    ],
  },
]

// ─── Main Page ─────────────────────────────────────────────────────────────

export function LifestylePage() {
  const [log, setLog] = useState<DailyLog>(() => dailyLogsStore.getToday())
  const weekData = dailyLogsStore.getLast7Days()

  const update = (patch: Partial<DailyLog>) => {
    const updated = { ...log, ...patch }
    setLog(updated)
    dailyLogsStore.save(updated)
  }

  const moodEmojis: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lifestyle Coaching</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Today · {format(new Date(), 'EEEE, MMM d')}
        </p>
      </div>

      {/* Daily Habit Tracker */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Today's Log</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <HabitRow
            icon={Droplets}
            label="Water"
            value={log.waterGlasses}
            max={8}
            unit="glasses"
            color="bg-blue-500"
            onDecrement={() => update({ waterGlasses: Math.max(0, log.waterGlasses - 1) })}
            onIncrement={() => update({ waterGlasses: Math.min(20, log.waterGlasses + 1) })}
          />
          <HabitRow
            icon={Footprints}
            label="Steps"
            value={log.steps}
            max={10000}
            unit="steps"
            color="bg-green-500"
            onDecrement={() => update({ steps: Math.max(0, log.steps - 500) })}
            onIncrement={() => update({ steps: Math.min(50000, log.steps + 500) })}
          />
          <HabitRow
            icon={Moon}
            label="Sleep"
            value={log.sleepHours}
            max={9}
            unit="hrs"
            color="bg-purple-500"
            onDecrement={() => update({ sleepHours: Math.max(0, log.sleepHours - 0.5) })}
            onIncrement={() => update({ sleepHours: Math.min(12, log.sleepHours + 0.5) })}
          />
          {/* Mood */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Smile size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mood</span>
            </div>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => update({ mood: m as DailyLog['mood'] })}
                  className={`text-2xl transition-all ${log.mood === m ? 'scale-125' : 'opacity-40 hover:opacity-70'}`}
                >
                  {moodEmojis[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Weekly Progress</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <WeeklyChart logs={weekData} field="waterGlasses" color="bg-blue-400" label="Water (glasses)" />
          <WeeklyChart logs={weekData} field="steps" color="bg-green-400" label="Steps (÷100)" />
          <WeeklyChart logs={weekData} field="sleepHours" color="bg-purple-400" label="Sleep (hrs)" />
        </div>
      </div>

      {/* Coaching Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Health Tips</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {COACHING_TIPS.map((card) => (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon size={16} className="text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{card.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {card.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center italic">
        Lifestyle tips are general recommendations. Consult your doctor for personalized medical advice.
      </p>
    </div>
  )
}

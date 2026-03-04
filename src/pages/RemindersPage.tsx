import { useState, useEffect, useCallback } from 'react'
import { Plus, Bell, BellOff, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ReminderCard } from '../components/reminders/ReminderCard'
import { ReminderForm } from '../components/reminders/ReminderForm'
import { remindersStore, reminderLogsStore } from '../lib/storage'
import type { MedicineReminder, ReminderLog } from '../types'

interface DueReminder {
  reminder: MedicineReminder
  scheduledTime: string
  displayTime: string
}

export function RemindersPage() {
  const [reminders, setReminders] = useState<MedicineReminder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<MedicineReminder | undefined>()
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([])
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  const load = useCallback(() => {
    setReminders(remindersStore.getAll())
  }, [])

  useEffect(() => {
    load()
    setNotifPermission(Notification.permission)
  }, [load])

  // Check for due reminders every 30 seconds
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const todayStr = now.toISOString().slice(0, 10)

      const due: DueReminder[] = []
      for (const r of remindersStore.getAll()) {
        if (todayStr < r.startDate || todayStr > r.endDate) continue
        for (const t of r.times) {
          if (t === nowHHMM) {
            const scheduledTime = `${todayStr}T${t}:00`
            const logs = reminderLogsStore.getAll()
            const alreadyLogged = logs.some(
              (l) => l.reminderId === r.id && l.scheduledTime === scheduledTime
            )
            if (!alreadyLogged) {
              due.push({ reminder: r, scheduledTime, displayTime: t })
              // Browser notification
              if (Notification.permission === 'granted') {
                new Notification(`💊 Time to take ${r.medicineName}`, {
                  body: `${r.dose}${r.withFood ? ' — with food' : ''}`,
                  icon: '/favicon.svg',
                })
              }
            }
          }
        }
      }
      if (due.length > 0) setDueReminders((prev) => [...prev, ...due])
    }

    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])

  const requestNotifications = async () => {
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
  }

  const handleAction = (due: DueReminder, action: ReminderLog['action']) => {
    reminderLogsStore.add({
      reminderId: due.reminder.id,
      scheduledTime: due.scheduledTime,
      action,
      loggedAt: new Date().toISOString(),
    })
    setDueReminders((prev) => prev.filter((d) => d.scheduledTime !== due.scheduledTime || d.reminder.id !== due.reminder.id))
  }

  const handleSave = (r: MedicineReminder) => {
    remindersStore.save(r)
    load()
    setEditTarget(undefined)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this reminder?')) {
      remindersStore.delete(id)
      load()
    }
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Medicine Reminders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} set
          </p>
        </div>
        <Button onClick={() => { setEditTarget(undefined); setShowForm(true) }} size="sm">
          <Plus size={16} /> Add
        </Button>
      </div>

      {/* Notification permission */}
      {notifPermission !== 'granted' && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <BellOff size={16} />
            Enable notifications to get medicine alerts
          </div>
          <Button size="sm" variant="secondary" onClick={requestNotifications}>
            Enable
          </Button>
        </div>
      )}

      {/* Due reminders (alerts) */}
      {dueReminders.map((due) => (
        <div
          key={`${due.reminder.id}-${due.scheduledTime}`}
          className="mb-4 bg-primary-50 dark:bg-primary-950 border-2 border-primary-300 dark:border-primary-700 rounded-2xl p-4 animate-pulse-once"
        >
          <div className="flex items-start gap-3">
            <Bell className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-primary-800 dark:text-primary-200 text-sm">
                Time to take {due.reminder.medicineName}!
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                {due.reminder.dose} at {due.displayTime}
                {due.reminder.withFood ? ' · with food' : ''}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAction(due, 'taken')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                >
                  <CheckCircle size={12} /> Taken
                </button>
                <button
                  onClick={() => handleAction(due, 'snoozed')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600"
                >
                  <Clock size={12} /> Snooze 10m
                </button>
                <button
                  onClick={() => handleAction(due, 'skipped')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-400 text-white rounded-lg text-xs font-medium hover:bg-gray-500"
                >
                  <XCircle size={12} /> Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Reminder cards */}
      {reminders.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No reminders yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Add your first medicine reminder to get started
          </p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Reminder
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              adherence={reminderLogsStore.getWeeklyAdherence(r.id)}
              onEdit={() => { setEditTarget(r); setShowForm(true) }}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <ReminderForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTarget(undefined) }}
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  )
}

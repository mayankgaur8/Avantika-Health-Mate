import { useState } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { MedicineReminder } from '../../types'

interface ReminderFormProps {
  open: boolean
  onClose: () => void
  onSave: (reminder: MedicineReminder) => void
  initial?: MedicineReminder
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const today = () => new Date().toISOString().slice(0, 10)
const nextMonth = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export function ReminderForm({ open, onClose, onSave, initial }: ReminderFormProps) {
  const [name, setName] = useState(initial?.medicineName ?? '')
  const [dose, setDose] = useState(initial?.dose ?? '')
  const [times, setTimes] = useState<string[]>(initial?.times ?? ['08:00'])
  const [withFood, setWithFood] = useState(initial?.withFood ?? false)
  const [startDate, setStartDate] = useState(initial?.startDate ?? today())
  const [endDate, setEndDate] = useState(initial?.endDate ?? nextMonth())
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const addTime = () => setTimes((t) => [...t, '12:00'])
  const removeTime = (i: number) => setTimes((t) => t.filter((_, idx) => idx !== i))
  const updateTime = (i: number, val: string) =>
    setTimes((t) => t.map((v, idx) => (idx === i ? val : v)))

  const handleSave = () => {
    if (!name.trim() || !dose.trim() || times.length === 0) return
    onSave({
      id: initial?.id ?? genId(),
      medicineName: name.trim(),
      dose: dose.trim(),
      times: times.sort(),
      withFood,
      startDate,
      endDate,
      notes: notes.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Reminder' : 'Add Medicine Reminder'}>
      <div className="space-y-4">
        {/* Medicine name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Medicine Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Metformin"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
          />
        </div>

        {/* Dose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dose *
          </label>
          <input
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="e.g. 500mg, 1 tablet"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
          />
        </div>

        {/* Times */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Times *
            </label>
            <button
              onClick={addTime}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus size={12} /> Add time
            </button>
          </div>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
                />
                {times.length > 1 && (
                  <button onClick={() => removeTime(i)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* With food */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={withFood}
            onChange={(e) => setWithFood(e.target.checked)}
            className="w-4 h-4 accent-primary-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Take with food</span>
        </label>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Take after dinner"
            rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:text-white resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim() || !dose.trim()}
          >
            Save Reminder
          </Button>
        </div>
      </div>
    </Modal>
  )
}

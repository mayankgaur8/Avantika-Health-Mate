import { Clock, Calendar, Edit2, Trash2, Utensils } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Badge } from '../ui/Badge'
import type { MedicineReminder } from '../../types'

interface ReminderCardProps {
  reminder: MedicineReminder
  adherence: { taken: number; total: number }
  onEdit: () => void
  onDelete: () => void
}

export function ReminderCard({ reminder, adherence, onEdit, onDelete }: ReminderCardProps) {
  const adherencePct =
    adherence.total > 0
      ? Math.round((adherence.taken / adherence.total) * 100)
      : null

  const isActive =
    new Date() >= parseISO(reminder.startDate) &&
    new Date() <= parseISO(reminder.endDate)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {reminder.medicineName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reminder.dose}</p>
        </div>
        <div className="flex items-center gap-1">
          {isActive ? (
            <Badge variant="green">Active</Badge>
          ) : (
            <Badge variant="gray">Ended</Badge>
          )}
        </div>
      </div>

      {/* Times */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {reminder.times.map((t) => (
          <div
            key={t}
            className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-lg text-xs font-medium"
          >
            <Clock size={10} />
            {t}
          </div>
        ))}
        {reminder.withFood && (
          <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-lg text-xs font-medium">
            <Utensils size={10} />
            With food
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
        <Calendar size={11} />
        <span>
          {format(parseISO(reminder.startDate), 'MMM d')} –{' '}
          {format(parseISO(reminder.endDate), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Adherence */}
      {adherencePct !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">7-day adherence</span>
            <span
              className={
                adherencePct >= 80
                  ? 'text-green-600 font-medium'
                  : adherencePct >= 50
                  ? 'text-yellow-600 font-medium'
                  : 'text-red-500 font-medium'
              }
            >
              {adherencePct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                adherencePct >= 80
                  ? 'bg-green-500'
                  : adherencePct >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${adherencePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {reminder.notes && (
        <p className="text-xs text-gray-400 italic mb-3">{reminder.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

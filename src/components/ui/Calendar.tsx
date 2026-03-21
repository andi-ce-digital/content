import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-day-picker/style.css'
import { cn } from '../../lib/utils'

type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rounded-2xl border border-slate-200 bg-white p-3 shadow-sm', className)}
      classNames={{
        months: 'flex flex-col gap-3 sm:flex-row',
        month: 'space-y-3',
        caption: 'flex items-center justify-between pt-1',
        caption_label: 'text-sm font-semibold text-slate-900',
        nav: 'flex items-center gap-1',
        button_previous:
          'inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        button_next:
          'inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        month_grid: 'w-full border-collapse',
        weekdays: 'grid grid-cols-7 gap-1',
        weekday: 'text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400',
        week: 'mt-1 grid grid-cols-7 gap-1',
        day: 'h-9 w-9 p-0 text-xs',
        day_button:
          'h-9 w-9 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition',
        selected:
          '!bg-indigo-600 !text-white hover:!bg-indigo-600 focus:!bg-indigo-600',
        today: 'bg-indigo-50 text-indigo-700',
        outside: 'text-slate-300',
        disabled: 'text-slate-300 opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}


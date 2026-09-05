'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppRedux';
import { openModal } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Task } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, PRIORITY_CONFIG } from '@/lib/utils';

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const dispatch = useAppDispatch();
  const { canCreateTask } = usePermissions();

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Build 35 or 42 calendar grid cells
  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Prev month filler
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: prevDate.toISOString().split('T')[0],
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const curDate = new Date(year, month, i);
    days.push({
      day: i,
      isCurrentMonth: true,
      dateStr: curDate.toISOString().split('T')[0],
    });
  }

  // Next month filler to complete 35 or 42 grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      day: i,
      isCurrentMonth: false,
      dateStr: nextDate.toISOString().split('T')[0],
    });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden select-none">
      {/* Calendar Header Nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {monthNames[month]} {year}
          </h2>
          <Button size="xs" variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-t-xl overflow-hidden text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 py-2 bg-zinc-50 dark:bg-zinc-900">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 border border-t-0 border-zinc-200 rounded-b-xl overflow-hidden">
        {days.map((cell, idx) => {
          const isTodayCell = isCurrentMonth && cell.isCurrentMonth && cell.day === today.getDate();
          const dayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(cell.dateStr));

          return (
            <div
              key={idx}
              onClick={() => {
                if (canCreateTask) {
                  dispatch(openModal({ name: 'create_task', data: { defaultDate: cell.dateStr } }));
                }
              }}
              className={cn(
                'bg-white dark:bg-zinc-900 p-1.5 flex flex-col justify-between min-h-[90px] transition-colors cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                !cell.isCurrentMonth && 'bg-zinc-50/60 dark:bg-zinc-950/40 text-zinc-400'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                    isTodayCell
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-zinc-800 dark:text-zinc-200'
                      : 'text-zinc-400'
                  )}
                >
                  {cell.day}
                </span>

                {canCreateTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(openModal({ name: 'create_task', data: { defaultDate: cell.dateStr } }));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-indigo-600 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Task Chips on this day */}
              <div className="space-y-1 overflow-y-auto flex-1 max-h-20 scrollbar-none">
                {dayTasks.map((t) => {
                  const pConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(openModal({ name: 'task_detail', data: { taskId: t.id } }));
                      }}
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-md border truncate shadow-2xs hover:scale-[1.02] transition-transform',
                        pConfig.bgColor,
                        pConfig.color,
                        pConfig.borderColor
                      )}
                    >
                      {t.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

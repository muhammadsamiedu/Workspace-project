'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppRedux';
import {
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  convertSubtaskToTask,
} from '@/redux/slices/taskSlice';
import { showToast } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Subtask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { generateId, cn } from '@/lib/utils';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const dispatch = useAppDispatch();
  const { canEditTask, isViewer } = usePermissions();

  const [newTitle, setNewTitle] = useState('');

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !canEditTask) return;

    dispatch(
      addSubtask({
        taskId,
        subtask: {
          id: generateId('sub'),
          taskId,
          title: newTitle.trim(),
          completed: false,
        },
      })
    );
    setNewTitle('');
  };

  const handleConvert = (subtaskId: string) => {
    const newTaskId = generateId('task');
    dispatch(convertSubtaskToTask({ taskId, subtaskId, newTaskId }));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'Converted subtask to full independent task!',
        type: 'success',
      })
    );
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Subtasks ({completedCount}/{totalCount})
          </h4>
        </div>
        <span className="text-xs font-medium text-zinc-500">{percent}% Complete</span>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              completedCount === totalCount ? 'bg-emerald-500' : 'bg-indigo-500'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Subtasks items */}
      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60 transition-colors"
          >
            <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                checked={sub.completed}
                disabled={isViewer}
                onChange={() => dispatch(toggleSubtask({ taskId, subtaskId: sub.id }))}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
              />
              <span
                className={cn(
                  'text-xs text-zinc-800 dark:text-zinc-200 transition-all truncate',
                  sub.completed && 'line-through text-zinc-400 dark:text-zinc-500'
                )}
              >
                {sub.title}
              </span>
            </label>

            {canEditTask && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={() => handleConvert(sub.id)}
                  className="p-1 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  title="Convert to full independent task"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => dispatch(deleteSubtask({ taskId, subtaskId: sub.id }))}
                  className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete subtask"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Subtask Input */}
      {canEditTask && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="+ Add subtask..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
          {newTitle.trim() && (
            <Button size="xs" type="submit">
              Add
            </Button>
          )}
        </form>
      )}
    </div>
  );
}

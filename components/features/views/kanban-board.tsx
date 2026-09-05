'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { optimisticMoveTask, moveTaskStatus } from '@/redux/slices/taskSlice';
import { addColumn, reorderColumns } from '@/redux/slices/projectSlice';
import { openModal } from '@/redux/slices/uiSlice';
import { pushHistory } from '@/redux/slices/historySlice';
import { usePermissions } from '@/hooks/usePermissions';
import { TaskCard } from '../tasks/task-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, MoreHorizontal, AlertCircle, GripVertical } from 'lucide-react';
import { Task, ProjectColumn, TaskStatus } from '@/lib/types';
import { generateId, cn } from '@/lib/utils';

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const dispatch = useAppDispatch();
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const projects = useAppSelector((state) => state.projects.projects);

  const { canEditTask, canCreateTask, canMoveTask, canManageColumns, isViewer } = usePermissions();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const project = projects.find((p) => p.id === activeProjectId);
  const columns = project?.columns || [
    { id: 'todo', title: 'To Do', color: '#94a3b8' },
    { id: 'in_progress', title: 'In Progress', color: '#6366f1' },
    { id: 'review', title: 'In Review', color: '#a855f7' },
    { id: 'done', title: 'Completed', color: '#10b981' },
  ];

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (isViewer) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    if (isViewer || !canMoveTask) return;
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== columnId) {
      const oldStatus = task.status;
      const oldOrder = task.order;

      // History recording for Undo
      dispatch(
        pushHistory({
          id: generateId('hist'),
          timestamp: new Date().toISOString(),
          description: `Moved task to ${columnId}`,
          actionType: 'task_move',
          undoData: { taskId, previousStatus: oldStatus, previousOrder: oldOrder },
          redoData: { taskId, newStatus: columnId, newOrder: 0 },
        })
      );

      // Optimistic move thunk with simulated latency and rollback support
      dispatch(optimisticMoveTask({ taskId, newStatus: columnId as TaskStatus }));
    }

    setDraggedTaskId(null);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !project || !canManageColumns) return;

    const newCol: ProjectColumn = {
      id: newColumnTitle.toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`,
      title: newColumnTitle.trim(),
      color: '#6366f1',
    };

    dispatch(addColumn({ projectId: project.id, column: newCol }));
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  return (
    <div className="flex-1 overflow-x-auto p-6 scrollbar-thin">
      <div className="flex items-start gap-4 min-w-max pb-6">
        {columns.map((column) => {
          const columnTasks = tasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.order - b.order);

          const isOverLimit = column.wipLimit && columnTasks.length > column.wipLimit;
          const isDragOver = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={cn(
                'w-76 shrink-0 rounded-2xl flex flex-col max-h-[calc(100vh-14rem)] transition-colors duration-150',
                'bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 p-3',
                isDragOver && 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 mb-3 px-1 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: column.color || '#94a3b8' }}
                  />
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider truncate">
                    {column.title}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80',
                      isOverLimit
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
                        : 'text-zinc-500 dark:text-zinc-400'
                    )}
                  >
                    {columnTasks.length}
                    {column.wipLimit ? ` / ${column.wipLimit}` : ''}
                  </span>
                </div>

                {canCreateTask && !isViewer && (
                  <button
                    onClick={() => dispatch(openModal({ name: 'create_task' }))}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Add task to column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-none">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverColumnId(null);
                    }}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-xl">
                    Drop tasks here
                  </div>
                )}
              </div>

              {/* Quick Add Task button at column footer */}
              {canCreateTask && !isViewer && (
                <button
                  onClick={() => dispatch(openModal({ name: 'create_task' }))}
                  className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800/80 transition-all border border-dashed border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Add Column Section */}
        {canManageColumns && (
          <div className="w-72 shrink-0">
            {isAddingColumn ? (
              <form
                onSubmit={handleAddColumn}
                className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-2.5"
              >
                <input
                  type="text"
                  placeholder="Column Name..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  autoFocus
                  className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                  <Button size="xs" type="submit">
                    Add Column
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

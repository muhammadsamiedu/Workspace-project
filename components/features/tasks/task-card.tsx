'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  setActiveTask,
  toggleSelectTask,
  duplicateTask,
  deleteTask,
  moveTaskStatus,
} from '@/redux/slices/taskSlice';
import { openModal, showToast } from '@/redux/slices/uiSlice';
import { pushHistory } from '@/redux/slices/historySlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Task } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import {
  Calendar,
  CheckSquare,
  Paperclip,
  MessageSquare,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  cn,
  formatDate,
  isDateOverdue,
  isDateToday,
  PRIORITY_CONFIG,
  generateId,
} from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function TaskCard({ task, onDragStart, onDragEnd }: TaskCardProps) {
  const dispatch = useAppDispatch();
  const selectedTaskIds = useAppSelector((state) => state.tasks.selectedTaskIds);
  const users = useAppSelector((state) => state.auth.users);
  const comments = useAppSelector((state) => state.comments.comments);

  const { canEditTask, canDeleteTask, canMoveTask, isViewer } = usePermissions();

  const isSelected = selectedTaskIds.includes(task.id);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const taskComments = comments.filter((c) => c.taskId === task.id);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isOverdue = isDateOverdue(task.dueDate);
  const isToday = isDateToday(task.dueDate);

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleDelete = () => {
    // Record history for Undo
    dispatch(
      pushHistory({
        id: generateId('hist'),
        timestamp: new Date().toISOString(),
        description: `Delete task "${task.title}"`,
        actionType: 'task_delete',
        undoData: task,
        redoData: { taskId: task.id },
      })
    );

    dispatch(deleteTask(task.id));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Task deleted: "${task.title}"`,
        type: 'info',
        action: { label: 'Undo', actionType: 'undo' },
      })
    );
  };

  const menuItems = [
    {
      id: 'open',
      label: 'Open Task Detail',
      icon: <ExternalLink className="w-3.5 h-3.5" />,
      onClick: () => dispatch(openModal({ name: 'task_detail', data: { taskId: task.id } })),
    },
    {
      id: 'dup',
      label: 'Duplicate Task',
      icon: <Copy className="w-3.5 h-3.5" />,
      disabled: !canEditTask,
      onClick: () => {
        dispatch(duplicateTask(task.id));
        dispatch(
          showToast({
            id: generateId('toast'),
            message: `Duplicated task`,
            type: 'success',
          })
        );
      },
    },
    {
      id: 'div',
      divider: true,
      label: '',
    },
    {
      id: 'del',
      label: 'Delete Task',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
      disabled: !canDeleteTask,
      onClick: handleDelete,
    },
  ];

  return (
    <div
      draggable={!isViewer && canMoveTask}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        // Prevent opening detail if clicking checkbox or dropdown
        if ((e.target as HTMLElement).closest('input[type="checkbox"], button, [role="menu"]')) {
          return;
        }
        dispatch(openModal({ name: 'task_detail', data: { taskId: task.id } }));
      }}
      className={cn(
        'group relative bg-white dark:bg-zinc-900 border rounded-xl p-3.5 shadow-xs transition-all duration-150 select-none cursor-pointer',
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
          : 'border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'
      )}
    >
      {/* Top row: Checkbox, Priority badge, and Dropdown menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => dispatch(toggleSelectTask(task.id))}
            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
          />

          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
              priorityConfig.bgColor,
              priorityConfig.color,
              priorityConfig.borderColor
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: priorityConfig.iconColor }}
            />
            {priorityConfig.label}
          </span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown
            align="right"
            trigger={
              <button
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Task options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>

      {/* Task Title & Quick Complete Button */}
      <div className="flex items-start gap-2 mb-1.5">
        <button
          type="button"
          disabled={isViewer}
          onClick={(e) => {
            e.stopPropagation();
            if (isViewer) {
              dispatch(
                showToast({
                  id: generateId('toast'),
                  message: 'View-only access: Viewers cannot change task status.',
                  type: 'warning',
                })
              );
              return;
            }
            const nextStatus = task.status === 'done' ? 'todo' : 'done';
            dispatch(moveTaskStatus({ taskId: task.id, newStatus: nextStatus }));
            dispatch(
              showToast({
                id: generateId('toast'),
                message: nextStatus === 'done' ? `Completed "${task.title}"!` : `Reopened "${task.title}"`,
                type: 'success',
              })
            );
          }}
          className={cn(
            'w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0.5',
            isViewer ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
            task.status === 'done'
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-transparent hover:text-emerald-500'
          )}
          title={isViewer ? 'View-only mode' : task.status === 'done' ? 'Mark as incomplete' : 'Mark task completed'}
        >
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </button>

        <h3
          className={cn(
            'text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 flex-1',
            task.status === 'done' && 'line-through text-zinc-400 dark:text-zinc-500'
          )}
        >
          {task.title}
        </h3>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="neutral" size="sm">
              #{tag}
            </Badge>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-zinc-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Subtasks Progress Bar if subtasks exist */}
      {totalSubtasks > 0 && (
        <div className="mb-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-zinc-400" />
              <span>Subtasks</span>
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                completedSubtasks === totalSubtasks ? 'bg-emerald-500' : 'bg-indigo-500'
              )}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer: Due Date, Attachments, Comments, and Assignee */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1 font-medium',
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : isToday
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
              title={isOverdue ? 'Overdue!' : isToday ? 'Due today!' : undefined}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </span>
          )}

          {task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5" title="Attachments">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </span>
          )}

          {taskComments.length > 0 && (
            <span className="flex items-center gap-0.5" title="Comments">
              <MessageSquare className="w-3 h-3" />
              <span>{taskComments.length}</span>
            </span>
          )}
        </div>

        {assignee ? (
          <Avatar name={assignee.name} src={assignee.avatar} size="xs" showOnlineStatus />
        ) : (
          <span className="w-5 h-5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
            ?
          </span>
        )}
      </div>
    </div>
  );
}

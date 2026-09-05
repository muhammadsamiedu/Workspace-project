'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  toggleSelectTask,
  selectAllTasks,
  clearSelectedTasks,
  updateTask,
} from '@/redux/slices/taskSlice';
import { openModal } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Task, GroupBy, TaskStatus, TaskPriority } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import {
  cn,
  formatDate,
  isDateOverdue,
  isDateToday,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '@/lib/utils';

export function ListView({ tasks }: { tasks: Task[] }) {
  const dispatch = useAppDispatch();
  const groupBy = useAppSelector((state) => state.views.groupBy);
  const selectedTaskIds = useAppSelector((state) => state.tasks.selectedTaskIds);
  const users = useAppSelector((state) => state.auth.users);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const projects = useAppSelector((state) => state.projects.projects);

  const { canEditTask, isViewer } = usePermissions();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const columns = currentProject?.columns || [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ];

  const allSelected = tasks.length > 0 && tasks.every((t) => selectedTaskIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      dispatch(clearSelectedTasks());
    } else {
      dispatch(selectAllTasks(tasks.map((t) => t.id)));
    }
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Group tasks based on groupBy setting
  const groupedTasks: { key: string; title: string; tasks: Task[] }[] = React.useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: 'All Tasks', tasks }];
    }

    if (groupBy === 'status') {
      return columns.map((col) => ({
        key: col.id,
        title: col.title,
        tasks: tasks.filter((t) => t.status === col.id),
      }));
    }

    if (groupBy === 'priority') {
      const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
      return priorities.map((p) => ({
        key: p,
        title: `${p.toUpperCase()} Priority`,
        tasks: tasks.filter((t) => t.priority === p),
      }));
    }

    if (groupBy === 'assignee') {
      const userGroups = users.map((u) => ({
        key: u.id,
        title: u.name,
        tasks: tasks.filter((t) => t.assigneeId === u.id),
      }));
      const unassigned = tasks.filter((t) => !t.assigneeId);
      if (unassigned.length > 0) {
        userGroups.push({ key: 'unassigned', title: 'Unassigned', tasks: unassigned });
      }
      return userGroups;
    }

    if (groupBy === 'label') {
      const labelMap: Record<string, Task[]> = {};
      tasks.forEach((t) => {
        if (t.tags.length === 0) {
          labelMap['No Label'] = labelMap['No Label'] || [];
          labelMap['No Label'].push(t);
        } else {
          t.tags.forEach((tag) => {
            labelMap[tag] = labelMap[tag] || [];
            labelMap[tag].push(t);
          });
        }
      });
      return Object.entries(labelMap).map(([k, v]) => ({
        key: k,
        title: `#${k}`,
        tasks: v,
      }));
    }

    return [{ key: 'all', title: 'Tasks', tasks }];
  }, [groupBy, tasks, columns, users]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
            />
            <span>Task Title</span>
          </div>
          <div className="col-span-2 hidden sm:block">Status</div>
          <div className="col-span-2 hidden md:block">Priority</div>
          <div className="col-span-2 hidden lg:block">Due Date</div>
          <div className="col-span-6 sm:col-span-5 md:col-span-3 lg:col-span-1 text-right">
            Assignee
          </div>
        </div>

        {/* Grouped Rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {groupedTasks.map((group) => {
            const isCollapsed = collapsedGroups[group.key];
            if (group.tasks.length === 0 && groupBy !== 'status') return null;

            return (
              <div key={group.key}>
                {/* Group Heading */}
                {groupBy !== 'none' && (
                  <div
                    onClick={() => toggleGroupCollapse(group.key)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                    <span>{group.title}</span>
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {group.tasks.length}
                    </span>
                  </div>
                )}

                {/* Rows in this group */}
                {!isCollapsed && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {group.tasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      const assignee = users.find((u) => u.id === task.assigneeId);
                      const priorityConfig =
                        PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                      const isOverdue = isDateOverdue(task.dueDate);

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer text-xs',
                            isSelected && 'bg-indigo-50/30 dark:bg-indigo-950/20'
                          )}
                          onClick={(e) => {
                            if (
                              (e.target as HTMLElement).closest('input[type="checkbox"], select')
                            ) {
                              return;
                            }
                            dispatch(openModal({ name: 'task_detail', data: { taskId: task.id } }));
                          }}
                        >
                          {/* Title + Checkbox + Tags */}
                          <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => dispatch(toggleSelectTask(task.id))}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {task.title}
                              </p>
                              {task.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {task.tags.slice(0, 2).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] text-zinc-400 dark:text-zinc-500"
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Dropdown */}
                          <div className="col-span-2 hidden sm:block">
                            <select
                              value={task.status}
                              disabled={isViewer}
                              onChange={(e) =>
                                dispatch(
                                  updateTask({ id: task.id, status: e.target.value as TaskStatus })
                                )
                              }
                              className="text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-0.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                            >
                              {columns.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Priority */}
                          <div className="col-span-2 hidden md:block">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                                priorityConfig.bgColor,
                                priorityConfig.color,
                                priorityConfig.borderColor
                              )}
                            >
                              {priorityConfig.label}
                            </span>
                          </div>

                          {/* Due Date */}
                          <div className="col-span-2 hidden lg:flex items-center gap-1 text-[11px] text-zinc-500">
                            {task.dueDate ? (
                              <span
                                className={cn(
                                  'flex items-center gap-1',
                                  isOverdue && 'text-rose-500 font-semibold'
                                )}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.dueDate)}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </div>

                          {/* Assignee */}
                          <div className="col-span-6 sm:col-span-5 md:col-span-3 lg:col-span-1 flex items-center justify-end">
                            {assignee ? (
                              <Avatar
                                name={assignee.name}
                                src={assignee.avatar}
                                size="xs"
                                showOnlineStatus
                              />
                            ) : (
                              <span className="text-xs text-zinc-400 italic">Unassigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

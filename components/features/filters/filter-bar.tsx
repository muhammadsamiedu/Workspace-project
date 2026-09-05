'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  setSearch,
  setAssigneeFilter,
  toggleStatusFilter,
  togglePriorityFilter,
  setDueDateRange,
  setSorting,
  resetFilters,
  applyPreset,
  saveCustomPreset,
  deleteCustomPreset,
} from '@/redux/slices/filterSlice';
import { showToast } from '@/redux/slices/uiSlice';
import { TaskPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  Calendar,
  Check,
  BookmarkPlus,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';

export function FilterBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters.filters);
  const presets = useAppSelector((state) => state.filters.presets);
  const activePresetId = useAppSelector((state) => state.filters.activePresetId);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [expanded, setExpanded] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
  const statuses = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'In Review' },
    { id: 'done', label: 'Completed' },
  ];

  const hasActiveFilters =
    filters.search ||
    filters.assigneeId ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.dueDateRange !== 'all';

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    dispatch(
      saveCustomPreset({
        id: generateId('preset'),
        name: presetName.trim(),
        isCustom: true,
        filters: {
          search: filters.search,
          assigneeId: filters.assigneeId,
          status: [...filters.status],
          priority: [...filters.priority],
          tags: [...filters.tags],
          dueDateRange: filters.dueDateRange,
        },
      })
    );

    setPresetName('');
    setSavePresetOpen(false);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'Saved custom filter preset!',
        type: 'success',
      })
    );
  };

  return (
    <div className="px-6 py-2 select-none space-y-2.5">
      {/* Presets and Filter Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Preset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <div key={preset.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (preset.id === 'preset-my-tasks') {
                      dispatch(applyPreset(preset.id));
                      dispatch(setAssigneeFilter(currentUser.id));
                    } else {
                      dispatch(applyPreset(preset.id));
                    }
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap border',
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                  )}
                >
                  {preset.name}
                </button>

                {preset.isCustom && (
                  <button
                    onClick={() => dispatch(deleteCustomPreset(preset.id))}
                    className="p-1 text-zinc-400 hover:text-rose-500 transition-colors -ml-1 cursor-pointer"
                    title="Delete preset"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {hasActiveFilters && !savePresetOpen && (
            <button
              onClick={() => setSavePresetOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800 cursor-pointer whitespace-nowrap"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
          )}

          {savePresetOpen && (
            <form onSubmit={handleSavePreset} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Preset Name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                autoFocus
                className="px-2 py-0.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-indigo-500 focus:outline-none"
              />
              <Button size="xs" type="submit">
                Save
              </Button>
              <button
                type="button"
                onClick={() => setSavePresetOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Search & Filter Expand Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={filters.search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-44 focus:w-60 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => dispatch(setSearch(''))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Popover Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer',
              expanded || hasActiveFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => dispatch(resetFilters())}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multi-Filter Controls */}
      {expanded && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn text-xs">
          {/* Assignee Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Assignee
            </label>
            <select
              value={filters.assigneeId || ''}
              onChange={(e) => dispatch(setAssigneeFilter(e.target.value || null))}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Status
            </label>
            <div className="flex flex-wrap gap-1">
              {statuses.map((s) => {
                const isSelected = filters.status.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => dispatch(toggleStatusFilter(s.id))}
                    className={cn(
                      'px-2 py-0.5 text-[11px] rounded-md border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-indigo-500 text-white border-indigo-500 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Priority
            </label>
            <div className="flex flex-wrap gap-1">
              {priorities.map((p) => {
                const isSelected = filters.priority.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => dispatch(togglePriorityFilter(p))}
                    className={cn(
                      'px-2 py-0.5 text-[11px] rounded-md border capitalize transition-all cursor-pointer',
                      isSelected
                        ? 'bg-indigo-500 text-white border-indigo-500 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Sorting */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Due Date & Sort
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filters.dueDateRange}
                onChange={(e) =>
                  dispatch(
                    setDueDateRange(
                      e.target.value as 'all' | 'overdue' | 'today' | 'this_week' | 'no_date'
                    )
                  )
                }
                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="this_week">Due This Week</option>
                <option value="no_date">No Due Date</option>
              </select>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                  dispatch(setSorting({ sortBy, sortOrder }));
                }}
                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="dueDate-asc">Due Date (Earliest)</option>
                <option value="priority-desc">Priority (High-Low)</option>
                <option value="title-asc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

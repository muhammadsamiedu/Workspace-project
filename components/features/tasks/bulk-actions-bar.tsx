'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  clearSelectedTasks,
  bulkUpdateStatus,
  bulkUpdateAssignee,
  bulkDeleteTasks,
} from '@/redux/slices/taskSlice';
import { showToast } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CheckSquare, Trash2, User, ArrowRight, X } from 'lucide-react';
import { TaskStatus } from '@/lib/types';
import { generateId } from '@/lib/utils';

export function BulkActionsBar() {
  const dispatch = useAppDispatch();
  const selectedTaskIds = useAppSelector((state) => state.tasks.selectedTaskIds);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const projects = useAppSelector((state) => state.projects.projects);
  const users = useAppSelector((state) => state.auth.users);

  const { canEditTask, canDeleteTask, isViewer } = usePermissions();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (selectedTaskIds.length === 0 || isViewer) return null;

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const columns = currentProject?.columns || [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ];

  const handleBulkStatus = (status: TaskStatus) => {
    dispatch(bulkUpdateStatus({ taskIds: selectedTaskIds, status }));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Updated status for ${selectedTaskIds.length} tasks`,
        type: 'success',
      })
    );
  };

  const handleBulkAssignee = (assigneeId: string | null) => {
    dispatch(bulkUpdateAssignee({ taskIds: selectedTaskIds, assigneeId }));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Updated assignee for ${selectedTaskIds.length} tasks`,
        type: 'success',
      })
    );
  };

  const handleBulkDelete = () => {
    const count = selectedTaskIds.length;
    dispatch(bulkDeleteTasks(selectedTaskIds));
    setConfirmDeleteOpen(false);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Permanently deleted ${count} tasks`,
        type: 'info',
      })
    );
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl border border-zinc-700/80 animate-slideUp select-none">
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-700">
          <CheckSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold whitespace-nowrap">
            {selectedTaskIds.length} Selected
          </span>
        </div>

        {/* Change Status Dropdown */}
        {canEditTask && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] hidden sm:inline">Status:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatus(e.target.value);
              }}
              defaultValue=""
              className="bg-zinc-800 dark:bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                Move to...
              </option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Change Assignee Dropdown */}
        {canEditTask && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] hidden sm:inline">Assign:</span>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val !== '') handleBulkAssignee(val === 'unassigned' ? null : val);
              }}
              defaultValue=""
              className="bg-zinc-800 dark:bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                Assignee...
              </option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bulk Delete */}
        {canDeleteTask && (
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
            title="Delete selected tasks"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}

        {/* Dismiss selection */}
        <button
          onClick={() => dispatch(clearSelectedTasks())}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Tasks?"
        message={`Are you sure you want to delete ${selectedTaskIds.length} tasks? This action cannot be undone.`}
        confirmLabel="Delete Tasks"
      />
    </>
  );
}

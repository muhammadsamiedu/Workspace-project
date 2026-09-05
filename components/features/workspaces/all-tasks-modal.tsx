'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, openModal } from '@/redux/slices/uiSlice';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, PRIORITY_CONFIG } from '@/lib/utils';
import { CheckSquare, Calendar } from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';

export function AllTasksModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const projects = useAppSelector((state) => state.projects.projects);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { canViewAllTasks } = usePermissions();

  const isOpen = activeModal === 'all_tasks';
  if (!isOpen) return null;

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceTasks = tasks.filter((t) => {
    if (t.workspaceId !== activeWorkspaceId) return false;
    if (!canViewAllTasks && currentUser) {
      return t.assigneeId === currentUser.id || t.createdBy === currentUser.id;
    }
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="All Workspace Tasks"
      description={`Overview of all tasks across "${currentWorkspace?.name}"`}
      size="xl"
    >
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 select-none">
        {workspaceTasks.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">
            No tasks found in this workspace.
          </p>
        ) : (
          workspaceTasks.map((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            const assignee = users.find((u) => u.id === t.assigneeId);
            const pConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;

            return (
              <div
                key={t.id}
                onClick={() => {
                  dispatch(closeModal());
                  dispatch(openModal({ name: 'task_detail', data: { taskId: t.id } }));
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{project?.icon}</span>
                    <span className="text-[11px] font-medium text-zinc-400 truncate">
                      {project?.name}
                    </span>
                    <Badge variant="outline" size="sm">
                      {t.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {t.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {t.dueDate && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 hidden sm:flex">
                      <Calendar className="w-3 h-3" />
                      {formatDate(t.dueDate)}
                    </span>
                  )}
                  {assignee ? (
                    <Avatar name={assignee.name} src={assignee.avatar} size="xs" />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { openModal, showToast } from '@/redux/slices/uiSlice';
import { archiveProject, deleteProject } from '@/redux/slices/projectSlice';
import { setGroupBy } from '@/redux/slices/viewSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  MoreHorizontal,
  Edit2,
  Archive,
  Trash2,
  Layers,
  Filter,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { GroupBy } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

export function ProjectHeader() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.projects);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const users = useAppSelector((state) => state.auth.users);
  const groupBy = useAppSelector((state) => state.views.groupBy);

  const { canEditProject, canDeleteProject } = usePermissions();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const project = projects.find((p) => p.id === activeProjectId);
  if (!project) return null;

  const assignedUsers = users.filter((u) => project.memberIds.includes(u.id));

  const projectActions = [
    {
      id: 'edit-proj',
      label: 'Edit Project',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      disabled: !canEditProject,
      onClick: () => dispatch(openModal({ name: 'edit_project', data: project })),
    },
    {
      id: 'archive-proj',
      label: project.status === 'active' ? 'Archive Project' : 'Unarchive Project',
      icon: <Archive className="w-3.5 h-3.5" />,
      disabled: !canEditProject,
      onClick: () => {
        dispatch(archiveProject(project.id));
        dispatch(
          showToast({
            id: generateId('toast'),
            message: `Project ${project.status === 'active' ? 'archived' : 'restored'}`,
            type: 'info',
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
      id: 'delete-proj',
      label: 'Delete Project',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      danger: true,
      disabled: !canDeleteProject,
      onClick: () => setConfirmDeleteOpen(true),
    },
  ];

  const groupByOptions: { id: GroupBy; label: string }[] = [
    { id: 'none', label: 'No Grouping' },
    { id: 'status', label: 'Group by Status' },
    { id: 'assignee', label: 'Group by Assignee' },
    { id: 'priority', label: 'Group by Priority' },
    { id: 'label', label: 'Group by Label' },
  ];

  const handleDelete = () => {
    dispatch(deleteProject(project.id));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Project "${project.name}" deleted.`,
        type: 'info',
      })
    );
  };

  return (
    <>
      <div className="px-6 pt-5 pb-3 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Project title, emoji, description */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs border border-white/20"
              style={{ backgroundColor: project.color || '#6366f1' }}
            >
              <IconRenderer icon={project.icon} className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  {project.name}
                </h1>

                {project.template && (
                  <Badge variant="indigo" size="sm">
                    {project.template}
                  </Badge>
                )}

                {project.status === 'archived' && (
                  <Badge variant="amber" size="sm">
                    Archived
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Members, Group-by, Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Project Assigned Members */}
            <div className="flex items-center gap-1.5">
              <AvatarGroup limit={4}>
                {assignedUsers.map((u) => (
                  <Avatar key={u.id} name={u.name} src={u.avatar} size="xs" />
                ))}
              </AvatarGroup>
            </div>

            {/* Group By selector */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={groupBy}
                onChange={(e) => dispatch(setGroupBy(e.target.value as GroupBy))}
                className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                {groupByOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="dark:bg-zinc-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* More Actions Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              }
              items={projectActions}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}"? All tasks within this project will be removed.`}
        confirmLabel="Delete Project"
      />
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { createProject, updateProject } from '@/redux/slices/projectSlice';
import { setActiveWorkspace } from '@/redux/slices/workspaceSlice';
import { addTask } from '@/redux/slices/taskSlice';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PROJECT_TEMPLATES } from '@/lib/seedData';
import { Project, ViewType, Task } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Sparkles, Layers } from 'lucide-react';

import { AVAILABLE_SVG_ICONS, IconRenderer } from '@/components/ui/icon-renderer';

export function ProjectModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const modalData = useAppSelector((state) => state.ui.modalData);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const users = useAppSelector((state) => state.auth.users);

  const isEdit = activeModal === 'edit_project';
  const isOpen = activeModal === 'create_project' || isEdit;

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>(activeWorkspaceId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('rocket');
  const [color, setColor] = useState('#6366f1');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sprint-board');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [defaultView, setDefaultView] = useState<ViewType>('kanban');

  const colorOptions = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  useEffect(() => {
    if (isEdit && modalData) {
      setName(modalData.name || '');
      setDescription(modalData.description || '');
      setIcon(modalData.icon || 'rocket');
      setColor(modalData.color || '#6366f1');
      setSelectedTemplate(modalData.template || '');
      setAssignedMemberIds(modalData.memberIds || []);
      setDefaultView(modalData.defaultView || 'kanban');
      setTargetWorkspaceId(modalData.workspaceId || activeWorkspaceId);
    } else {
      setName('');
      setDescription('');
      setIcon('rocket');
      setColor('#6366f1');
      setSelectedTemplate('sprint-board');
      setAssignedMemberIds(currentWorkspace?.members.map((m) => m.userId) || []);
      setDefaultView('kanban');
      setTargetWorkspaceId(modalData?.workspaceId || activeWorkspaceId);
    }
  }, [isEdit, modalData, isOpen, currentWorkspace, activeWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const templateObj = PROJECT_TEMPLATES.find((t) => t.id === selectedTemplate);

    if (isEdit && modalData) {
      dispatch(
        updateProject({
          id: modalData.id,
          name: name.trim(),
          description: description.trim(),
          icon,
          color,
          memberIds: assignedMemberIds,
          defaultView,
        })
      );
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Project updated successfully',
          type: 'success',
        })
      );
    } else {
      const newProjectId = generateId('proj');
      const newColumns = templateObj
        ? templateObj.columns
        : [
            { id: 'todo', title: 'To Do', color: '#94a3b8' },
            { id: 'in_progress', title: 'In Progress', color: '#6366f1' },
            { id: 'review', title: 'In Review', color: '#a855f7' },
            { id: 'done', title: 'Done', color: '#10b981' },
          ];

      const finalWsId = targetWorkspaceId || activeWorkspaceId;

      const newProject: Project = {
        id: newProjectId,
        workspaceId: finalWsId,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        status: 'active',
        memberIds: assignedMemberIds.length > 0 ? assignedMemberIds : ['user-1'],
        columns: newColumns,
        defaultView: templateObj?.defaultView || defaultView,
        template: templateObj?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(createProject(newProject));

      if (finalWsId !== activeWorkspaceId) {
        dispatch(setActiveWorkspace(finalWsId));
      }

      // If template was selected, seed initial starter tasks
      if (templateObj) {
        const starterTask: Task = {
          id: generateId('task'),
          workspaceId: finalWsId,
          projectId: newProjectId,
          title: `Welcome to ${newProject.name}!`,
          description: `This project was initialized with the **${templateObj.name}** template. Click on any task to view subtasks, attachments, and team comments.`,
          status: newColumns[0].id,
          priority: 'medium',
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          assigneeId: assignedMemberIds[0] || null,
          tags: ['Starter', 'Onboarding'],
          subtasks: [
            { id: generateId('sub'), taskId: '', title: 'Explore Kanban drag-and-drop', completed: false },
            { id: generateId('sub'), taskId: '', title: 'Switch to List and Calendar views', completed: false },
          ],
          attachments: [],
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        starterTask.subtasks.forEach((s) => (s.taskId = starterTask.id));
        dispatch(addTask(starterTask));
      }

      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Created project "${name}" in workspace`,
          type: 'success',
        })
      );
    }

    dispatch(closeModal());
  };

  const toggleMember = (userId: string) => {
    if (assignedMemberIds.includes(userId)) {
      setAssignedMemberIds(assignedMemberIds.filter((id) => id !== userId));
    } else {
      setAssignedMemberIds([...assignedMemberIds, userId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title={isEdit ? 'Edit Project' : 'Create New Project'}
      description={
        isEdit
          ? 'Update project properties and team membership'
          : 'Setup a new project or kickstart from a template'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Target Workspace *</span>
              <span className="text-[10px] text-zinc-400">Select which workspace to create this project in</span>
            </label>
            <select
              value={targetWorkspaceId}
              onChange={(e) => setTargetWorkspaceId(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.category || 'General'})
                </option>
              ))}
            </select>
          </div>
        )}

        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Choose Template (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PROJECT_TEMPLATES.map((t) => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setName(t.name);
                      setIcon(t.icon);
                      setColor(t.color);
                      setDefaultView(t.defaultView);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2" style={{ backgroundColor: t.color }}>
                      <IconRenderer icon={t.icon} className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.name}</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                      {t.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Project Name
            </label>
            <Input
              placeholder="e.g. Mobile App Rollout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Brand Color
            </label>
            <div className="flex items-center gap-1.5 pt-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Project Icon (SVG)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVAILABLE_SVG_ICONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => setIcon(key)}
                className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  icon === key
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 scale-105 shadow-xs ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Description
          </label>
          <Textarea
            placeholder="Briefly describe the purpose, goals, or scope of this project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Assigned Team Members */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Assign Workspace Members
          </label>
          <div className="flex flex-wrap gap-2">
            {currentWorkspace?.members.map((m) => {
              const u = users.find((user) => user.id === m.userId);
              if (!u) return null;
              const isAssigned = assignedMemberIds.includes(u.id);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleMember(u.id)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isAssigned
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{u.name}</span>
                  {isAssigned && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={() => dispatch(closeModal())}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

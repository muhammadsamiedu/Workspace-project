'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import {
  updateTask,
  deleteTask,
  duplicateTask,
} from '@/redux/slices/taskSlice';
import { logActivity } from '@/redux/slices/activitySlice';
import { pushHistory } from '@/redux/slices/historySlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { SubtaskList } from './subtask-list';
import { FileAttachment } from './file-attachment';
import { CommentThread } from '../collaboration/comment-thread';
import { ActivityFeed } from '../collaboration/activity-feed';
import { TaskStatus, TaskPriority } from '@/lib/types';
import { generateId, PRIORITY_CONFIG } from '@/lib/utils';
import {
  Trash2,
  Copy,
  Calendar,
  Tag,
  User as UserIcon,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  Activity,
  CheckSquare,
  X,
} from 'lucide-react';

import { IconRenderer } from '@/components/ui/icon-renderer';

export function TaskModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const modalData = useAppSelector((state) => state.ui.modalData);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const projects = useAppSelector((state) => state.projects.projects);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { canEditTask, canDeleteTask, isViewer } = usePermissions();

  const isOpen = activeModal === 'task_detail';
  const task = tasks.find((t) => t.id === modalData?.taskId);
  const project = projects.find((p) => p.id === task?.projectId);

  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'attachments' | 'comments' | 'activity'>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleUpdateTitle = () => {
    if (title.trim() && title !== task.title && canEditTask) {
      dispatch(updateTask({ id: task.id, title: title.trim() }));
      dispatch(
        logActivity({
          id: generateId('act'),
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          taskTitle: title.trim(),
          userId: currentUser.id,
          action: 'updated_task',
          details: `Renamed task to "${title.trim()}"`,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const handleUpdateDescription = () => {
    if (description !== task.description && canEditTask) {
      dispatch(updateTask({ id: task.id, description }));
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!canEditTask) return;
    const oldStatus = task.status;
    dispatch(updateTask({ id: task.id, status: newStatus }));

    dispatch(
      pushHistory({
        id: generateId('hist'),
        timestamp: new Date().toISOString(),
        description: `Status changed to ${newStatus}`,
        actionType: 'task_move',
        undoData: { taskId: task.id, previousStatus: oldStatus, previousOrder: task.order },
        redoData: { taskId: task.id, newStatus, newOrder: task.order },
      })
    );

    dispatch(
      logActivity({
        id: generateId('act'),
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        taskTitle: task.title,
        userId: currentUser.id,
        action: 'updated_status',
        details: `Moved task from ${oldStatus} to ${newStatus}`,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (!canEditTask) return;
    dispatch(updateTask({ id: task.id, priority: newPriority }));
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    if (!canEditTask) return;
    dispatch(updateTask({ id: task.id, assigneeId }));
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditTask) return;
    const val = e.target.value ? new Date(e.target.value).toISOString() : null;
    dispatch(updateTask({ id: task.id, dueDate: val }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim() && canEditTask) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!task.tags.includes(cleanTag)) {
        dispatch(updateTask({ id: task.id, tags: [...task.tags, cleanTag] }));
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!canEditTask) return;
    dispatch(
      updateTask({
        id: task.id,
        tags: task.tags.filter((t) => t !== tagToRemove),
      })
    );
  };

  const handleDelete = () => {
    dispatch(
      pushHistory({
        id: generateId('hist'),
        timestamp: new Date().toISOString(),
        description: `Deleted task "${task.title}"`,
        actionType: 'task_delete',
        undoData: task,
        redoData: { taskId: task.id },
      })
    );

    dispatch(deleteTask(task.id));
    dispatch(closeModal());
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Task deleted: "${task.title}"`,
        type: 'info',
        action: { label: 'Undo', actionType: 'undo' },
      })
    );
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const columns = project?.columns || [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ];

  const tabsConfig = [
    { id: 'details', label: 'Overview' },
    { id: 'subtasks', label: `Subtasks (${task.subtasks.length})` },
    { id: 'attachments', label: `Files (${task.attachments.length})` },
    { id: 'comments', label: 'Discussion' },
    { id: 'activity', label: 'History' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      size="2xl"
      className="p-0 max-h-[92vh]"
      showCloseButton={false}
    >
      {/* Custom Modal Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <IconRenderer icon={project?.icon} className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {project?.name || 'Project'}
          </span>
          <span>/</span>
          <span className="font-mono text-[11px] text-zinc-400">{task.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {canEditTask && (
            <button
              onClick={() => {
                dispatch(duplicateTask(task.id));
                dispatch(
                  showToast({
                    id: generateId('toast'),
                    message: 'Duplicated task',
                    type: 'success',
                  })
                );
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {canDeleteTask && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => dispatch(closeModal())}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Modal Layout: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800 min-h-[500px]">
        {/* Left 2 Cols: Title, Tabs, and Content */}
        <div className="md:col-span-2 p-6 flex flex-col space-y-4">
          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={title}
              disabled={isViewer}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              className="w-full text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 transition-all"
              placeholder="Task Title..."
            />
          </div>

          {/* Navigation Tabs */}
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            variant="underline"
          />

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto pt-2">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={8}
                    disabled={isViewer}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleUpdateDescription}
                    placeholder="Add markdown description, acceptance criteria, or technical notes..."
                    className="w-full text-xs p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-2">
                  <SubtaskList taskId={task.id} subtasks={task.subtasks} />
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <SubtaskList taskId={task.id} subtasks={task.subtasks} />
            )}

            {activeTab === 'attachments' && (
              <FileAttachment taskId={task.id} attachments={task.attachments} />
            )}

            {activeTab === 'comments' && (
              <CommentThread taskId={task.id} taskTitle={task.title} />
            )}

            {activeTab === 'activity' && (
              <ActivityFeed taskId={task.id} />
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata Sidebar */}
        <div className="p-6 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-5 select-none">
          {/* Status Field */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Status
            </label>
            <select
              value={task.status}
              disabled={isViewer}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Field */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Priority
            </label>
            <select
              value={task.priority}
              disabled={isViewer}
              onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              className="w-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 capitalize focus:outline-none"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Assignee Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Assignee
              </label>
              {canEditTask && (
                <button
                  type="button"
                  onClick={() => handleAssigneeChange(currentUser.id)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Assign to Me
                </button>
              )}
            </div>
            <select
              value={task.assigneeId || ''}
              disabled={isViewer}
              onChange={(e) => handleAssigneeChange(e.target.value || null)}
              className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Field */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              disabled={isViewer}
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              onChange={handleDueDateChange}
              className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Tags & Labels
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  #{tag}
                  {canEditTask && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {canEditTask && (
              <input
                type="text"
                placeholder="Type tag and press Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

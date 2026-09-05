'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { addTask } from '@/redux/slices/taskSlice';
import { logActivity } from '@/redux/slices/activitySlice';
import { pushHistory } from '@/redux/slices/historySlice';
import { addNotification } from '@/redux/slices/notificationSlice';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, CheckSquare } from 'lucide-react';

export function TaskFormModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const projects = useAppSelector((state) => state.projects.projects);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const isOpen = activeModal === 'create_task';
  const project = projects.find((p) => p.id === activeProjectId) || projects[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(currentUser.id);
  const [dueDate, setDueDate] = useState('');
  const [tagString, setTagString] = useState('Frontend');
  const [initialSubtasks, setInitialSubtasks] = useState<string[]>([
    'Research & requirements',
    'Implementation & integration',
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  if (!isOpen || !project) return null;

  const handleAddInitialSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setInitialSubtasks([...initialSubtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput('');
  };

  const handleRemoveInitialSubtask = (index: number) => {
    setInitialSubtasks(initialSubtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagString
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const taskId = generateId('task');

    const newTask: Task = {
      id: taskId,
      workspaceId: activeWorkspaceId,
      projectId: project.id,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId,
      tags,
      subtasks: initialSubtasks.map((st) => ({
        id: generateId('sub'),
        taskId,
        title: st,
        completed: false,
      })),
      attachments: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addTask(newTask));

    // Record Undo entry
    dispatch(
      pushHistory({
        id: generateId('hist'),
        timestamp: new Date().toISOString(),
        description: `Created task "${newTask.title}"`,
        actionType: 'task_create',
        undoData: { taskId: newTask.id },
        redoData: newTask,
      })
    );

    // Audit log
    dispatch(
      logActivity({
        id: generateId('act'),
        workspaceId: activeWorkspaceId,
        projectId: project.id,
        taskId: newTask.id,
        taskTitle: newTask.title,
        userId: currentUser.id,
        action: 'created_task',
        details: `Created new task "${newTask.title}"`,
        timestamp: new Date().toISOString(),
      })
    );

    // If assigned to someone else, trigger notification
    if (assigneeId && assigneeId !== currentUser.id) {
      dispatch(
        addNotification({
          id: generateId('notif'),
          userId: assigneeId,
          type: 'assigned',
          title: 'New task assigned',
          message: `${currentUser.name} assigned you to "${newTask.title}"`,
          taskId: newTask.id,
          projectId: project.id,
          workspaceId: activeWorkspaceId,
          read: false,
          createdAt: new Date().toISOString(),
        })
      );
    }

    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Task created: "${newTask.title}"`,
        type: 'success',
        action: { label: 'Undo', actionType: 'undo' },
      })
    );

    dispatch(closeModal());
  };

  const columns = project.columns || [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'In Review' },
    { id: 'done', title: 'Done' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Create New Task"
      description={`Add a task to project "${project.name}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Task Title
          </label>
          <Input
            placeholder="e.g. Build authentication state sync"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Description
          </label>
          <Textarea
            placeholder="Provide context, acceptance criteria, or links..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Column / Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none capitalize"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Assignee
            </label>
            <select
              value={assigneeId || ''}
              onChange={(e) => setAssigneeId(e.target.value || null)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tags (comma separated)
          </label>
          <Input
            placeholder="Frontend, Redux, Performance"
            value={tagString}
            onChange={(e) => setTagString(e.target.value)}
          />
        </div>

        {/* Divide into Subtasks */}
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
              Divide into Subtasks ({initialSubtasks.length})
            </label>
            <span className="text-[10px] text-zinc-400">Actionable steps</span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {initialSubtasks.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs"
              >
                <span className="text-zinc-800 dark:text-zinc-200 truncate flex-1">
                  ↳ {st}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveInitialSubtask(idx)}
                  className="p-0.5 text-zinc-400 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add subtask step (press Enter)..."
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInitialSubtask();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddInitialSubtask}
              disabled={!newSubtaskInput.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={() => dispatch(closeModal())}>
            Cancel
          </Button>
          <Button type="submit">Create Task</Button>
        </div>
      </form>
    </Modal>
  );
}

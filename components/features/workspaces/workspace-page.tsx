'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  createWorkspace,
  setActiveWorkspace,
  deleteWorkspace,
} from '@/redux/slices/workspaceSlice';
import {
  createProject,
  setActiveProject,
  deleteProject,
} from '@/redux/slices/projectSlice';
import {
  addTask,
  deleteTask,
  moveTaskStatus,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from '@/redux/slices/taskSlice';
import { setView } from '@/redux/slices/viewSlice';
import { openModal, showToast } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Workspace,
  Project,
  Task,
  Subtask,
  TaskStatus,
  TaskPriority,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IconRenderer } from '@/components/ui/icon-renderer';
import {
  Building2,
  FolderKanban,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  Settings,
  ListTree,
  Calendar,
  Kanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Palette,
  FolderPlus,
} from 'lucide-react';
import {
  cn,
  generateId,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDate,
} from '@/lib/utils';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const COLOR_OPTIONS = [
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#64748b',
];

const ICON_OPTIONS = [
  'zap',
  'palette',
  'rocket',
  'gem',
  'trending-up',
  'shield',
  'briefcase',
  'box',
  'target',
  'cpu',
  'globe',
  'terminal',
];

export function WorkspacePage() {
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const projects = useAppSelector((state) => state.projects.projects);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    canCreateWorkspace,
    canDeleteWorkspace,
    canCreateProject,
    canDeleteProject,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canViewAllWorkspaces,
    canViewAllTasks,
    isViewer,
    isOwner,
    isAdmin,
  } = usePermissions();

  const { navigateTo } = useAppNavigation();

  // Role visibility limits:
  // Owner and Admin see all workspaces; Members only see their assigned workspaces
  const visibleWorkspaces = useMemo(() => {
    if (canViewAllWorkspaces) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.members.some((m) => m.userId === currentUser?.id) ||
        (ws as any).ownerId === currentUser?.id
    );
  }, [canViewAllWorkspaces, workspaces, currentUser?.id]);

  // Selected workspace
  const activeWorkspace =
    visibleWorkspaces.find((w) => w.id === activeWorkspaceId) ||
    visibleWorkspaces[0] ||
    workspaces[0];

  // Role visibility limits for tasks:
  // Owner and Admin see all tasks; Members only see tasks assigned to them or created by them
  const visibleTasks = useMemo(() => {
    if (canViewAllTasks) return tasks;
    return tasks.filter(
      (t) => t.assigneeId === currentUser?.id || t.createdBy === currentUser?.id
    );
  }, [canViewAllTasks, tasks, currentUser?.id]);

  // Projects in the active workspace
  const workspaceProjects = useMemo(() => {
    if (!activeWorkspace) return [];
    return projects.filter((p) => p.workspaceId === activeWorkspace.id);
  }, [projects, activeWorkspace]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expansion state
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

  // Inline Quick Workspace Creator
  const [showAddWorkspaceForm, setShowAddWorkspaceForm] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsColor, setNewWsColor] = useState('#6366f1');
  const [newWsIcon, setNewWsIcon] = useState('zap');

  // Inline Quick Project Creator
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjColor, setNewProjColor] = useState('#6366f1');
  const [newProjIcon, setNewProjIcon] = useState('FolderKanban');

  // Inline Task Inputs per project
  const [inlineTaskInputs, setInlineTaskInputs] = useState<Record<string, string>>({});
  const [inlineTaskPriorities, setInlineTaskPriorities] = useState<Record<string, TaskPriority>>({});
  const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Inline Subtask Inputs per task
  const [inlineSubtaskInputs, setInlineSubtaskInputs] = useState<Record<string, string>>({});
  const subtaskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Global metrics for this active workspace
  const activeWorkspaceTasks = useMemo(() => {
    if (!activeWorkspace) return [];
    return visibleTasks.filter((t) => t.workspaceId === activeWorkspace.id);
  }, [visibleTasks, activeWorkspace]);

  const totalTasksCount = activeWorkspaceTasks.length;
  const completedTasksCount = activeWorkspaceTasks.filter((t) => t.status === 'done').length;
  const inProgressTasksCount = activeWorkspaceTasks.filter((t) => t.status === 'in_progress').length;
  const activeWorkspaceSubtasks = activeWorkspaceTasks.flatMap((t) => t.subtasks || []);
  const completedSubtasksCount = activeWorkspaceSubtasks.filter((s) => s.completed).length;
  const totalSubtasksCount = activeWorkspaceSubtasks.length;
  const workspaceProgress =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Toggle Collapse Helpers
  const toggleProjectCollapse = (pId: string) => {
    setCollapsedProjects((prev) => ({ ...prev, [pId]: !prev[pId] }));
  };

  const toggleTaskCollapse = (tId: string) => {
    setCollapsedTasks((prev) => ({ ...prev, [tId]: !prev[tId] }));
  };

  const expandAll = () => {
    const projState: Record<string, boolean> = {};
    workspaceProjects.forEach((p) => (projState[p.id] = false));
    setCollapsedProjects(projState);

    const taskState: Record<string, boolean> = {};
    activeWorkspaceTasks.forEach((t) => (taskState[t.id] = false));
    setCollapsedTasks(taskState);
  };

  const collapseAll = () => {
    const projState: Record<string, boolean> = {};
    workspaceProjects.forEach((p) => (projState[p.id] = true));
    setCollapsedProjects(projState);

    const taskState: Record<string, boolean> = {};
    activeWorkspaceTasks.forEach((t) => (taskState[t.id] = true));
    setCollapsedTasks(taskState);
  };

  // 1. CREATE WORKSPACE HANDLER (Unlimited Workspaces)
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !canCreateWorkspace) return;

    const newWs: Workspace = {
      id: generateId('ws'),
      name: newWsName.trim(),
      slug: newWsName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: newWsIcon,
      color: newWsColor,
      description: newWsDesc.trim() || 'Custom workspace for team collaboration.',
      defaultView: 'kanban',
      members: [
        {
          userId: currentUser.id,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    dispatch(createWorkspace(newWs));
    setNewWsName('');
    setNewWsDesc('');
    setShowAddWorkspaceForm(false);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Workspace "${newWs.name}" created successfully!`,
        type: 'success',
      })
    );
  };

  // 2. CREATE PROJECT HANDLER (Unlimited Projects in Workspace)
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !canCreateProject || !activeWorkspace) return;

    const newProj: Project = {
      id: generateId('proj'),
      workspaceId: activeWorkspace.id,
      name: newProjName.trim(),
      description: newProjDesc.trim() || 'Project division for executing structured milestones.',
      icon: newProjIcon,
      color: newProjColor,
      status: 'active',
      memberIds: [currentUser.id],
      columns: [
        { id: 'todo', title: 'To Do', color: '#94a3b8' },
        { id: 'in_progress', title: 'In Progress', color: '#6366f1', wipLimit: 4 },
        { id: 'review', title: 'In Review', color: '#a855f7', wipLimit: 3 },
        { id: 'done', title: 'Completed', color: '#10b981' },
      ],
      defaultView: 'kanban',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(createProject(newProj));
    setNewProjName('');
    setNewProjDesc('');
    setShowAddProjectForm(false);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Project "${newProj.name}" added to ${activeWorkspace.name}!`,
        type: 'success',
      })
    );
  };

  // 3. CREATE TASK HANDLER (Unlimited Tasks in Project)
  const handleCreateTask = (projectId: string) => {
    const title = inlineTaskInputs[projectId]?.trim();
    if (!title || !canCreateTask || !activeWorkspace) return;

    const priority = inlineTaskPriorities[projectId] || 'medium';

    const newTask: Task = {
      id: generateId('task'),
      workspaceId: activeWorkspace.id,
      projectId,
      title,
      description: 'Quick task added via Workspace Architecture Studio.',
      status: 'todo',
      priority,
      dueDate: null,
      assigneeId: currentUser.id,
      tags: ['Workspace'],
      subtasks: [
        { id: generateId('sub'), taskId: '', title: 'Step 1: Planning', completed: false },
        { id: generateId('sub'), taskId: '', title: 'Step 2: Implementation', completed: false },
      ],
      attachments: [],
      order: 0,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    newTask.subtasks.forEach((s) => (s.taskId = newTask.id));

    dispatch(addTask(newTask));
    setInlineTaskInputs((prev) => ({ ...prev, [projectId]: '' }));

    // Keep input focused so user can immediately type the next task
    setTimeout(() => {
      taskInputRefs.current[projectId]?.focus();
    }, 50);

    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Task "${newTask.title}" added with 2 initial subtasks!`,
        type: 'success',
      })
    );
  };

  // 4. CREATE SUBTASK HANDLER (Unlimited Subtasks in Task)
  const handleCreateSubtask = (taskId: string) => {
    const title = inlineSubtaskInputs[taskId]?.trim();
    if (!title || !canEditTask) return;

    const newSub: Subtask = {
      id: generateId('sub'),
      taskId,
      title,
      completed: false,
    };

    dispatch(addSubtask({ taskId, subtask: newSub }));
    setInlineSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));

    // Keep input focused so user can continuously add subtasks rapidly
    setTimeout(() => {
      subtaskInputRefs.current[taskId]?.focus();
    }, 50);

    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Subtask step added!`,
        type: 'success',
      })
    );
  };

  // Quick Toggle Task Complete
  const handleToggleTaskStatus = (task: Task) => {
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
  };

  // Quick Open in Board
  const handleOpenInBoard = (projectId: string) => {
    navigateTo({ projectId, view: 'kanban' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--bg-app)] select-none">
      {/* 1. TOP HERO HEADER & METRICS BAR */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-5 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                <ListTree className="w-3.5 h-3.5" />
                Workspace Architecture Hub
              </span>
              <Badge variant={isOwner ? 'indigo' : isAdmin ? 'purple' : 'default'} size="sm">
                Role: {currentUser.role.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Unlimited Workspace Hierarchy Manager
            </h1>
            <p className="text-xs text-zinc-500 max-w-2xl mt-0.5">
              Build and organize your complete ecosystem: Add unlimited workspaces, create unlimited projects per workspace, add unlimited tasks per project, and divide any task into unlimited subtask steps.
            </p>
          </div>

          {/* Master Action & View Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo({ view: 'overview' })}
              className="text-xs"
            >
              General Dashboard
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs"
            >
              Expand All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              Collapse All
            </Button>

            {canCreateWorkspace && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddWorkspaceForm(!showAddWorkspaceForm)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Workspace
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. INLINE ADD WORKSPACE DRAWER (Unlimited Workspaces) */}
      {showAddWorkspaceForm && canCreateWorkspace && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-900/60 p-6 animate-fadeIn">
          <form onSubmit={handleCreateWorkspace} className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Create a Brand New Workspace (Unlimited)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWorkspaceForm(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Workspace Name *
                </label>
                <Input
                  placeholder="e.g., Marketing Studio, AI Platform Eng..."
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <Input
                  placeholder="e.g., Team workspace for Q3 objectives..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                />
              </div>
            </div>

            {/* Color & Icon Picker */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Color:</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewWsColor(c)}
                      className={cn(
                        'w-5 h-5 rounded-full transition-transform cursor-pointer',
                        newWsColor === c && 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newWsName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Create Workspace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddWorkspaceForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. WORKSPACE SELECTOR STRIP (Switch between unlimited workspaces) */}
      <div className="bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2.5 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
        <span className="text-[10px] uppercase font-bold text-zinc-400 shrink-0 mr-1">
          Workspaces ({visibleWorkspaces.length}):
        </span>

        {visibleWorkspaces.map((ws) => {
          const isActive = ws.id === activeWorkspace?.id;
          const wsProjCount = projects.filter((p) => p.workspaceId === ws.id).length;
          const wsTaskCount = visibleTasks.filter((t) => t.workspaceId === ws.id).length;

          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => navigateTo({ workspaceId: ws.id, view: 'hierarchy' })}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border',
                isActive
                  ? 'bg-white dark:bg-zinc-800 border-indigo-500 shadow-xs text-zinc-900 dark:text-zinc-100 font-bold'
                  : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800'
              )}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ws.color || '#6366f1' }}
              />
              <span className="truncate max-w-[160px]">{ws.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                {wsProjCount}p · {wsTaskCount}t
              </span>
            </button>
          );
        })}

        {canCreateWorkspace && (
          <button
            type="button"
            onClick={() => setShowAddWorkspaceForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-dashed border-indigo-300 dark:border-indigo-800 shrink-0 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Workspace</span>
          </button>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA: Selected Workspace Details & Hierarchy */}
      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Selected Workspace Overview Banner */}
        {activeWorkspace && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ backgroundColor: activeWorkspace.color || '#6366f1' }}
                >
                  <IconRenderer icon={activeWorkspace.icon || 'zap'} className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {activeWorkspace.name}
                    </h2>
                    <span className="text-xs text-zinc-400 font-mono">
                      /{activeWorkspace.slug}
                    </span>
                    <Badge variant="indigo" size="sm">
                      Active Workspace
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 max-w-2xl mt-0.5 line-clamp-1">
                    {activeWorkspace.description ||
                      'Divide this workspace into multiple projects, tasks, and subtasks.'}
                  </p>
                </div>
              </div>

              {/* Workspace Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                {canCreateProject && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddProjectForm(!showAddProjectForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Project
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(openModal({ name: 'workspace_settings' }))}
                  className="text-xs"
                  leftIcon={<Settings className="w-3.5 h-3.5" />}
                >
                  Settings
                </Button>
              </div>
            </div>

            {/* Overall Workspace Progress Bar */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <div className="flex items-center gap-4">
                  <span>
                    <strong>{workspaceProjects.length}</strong> Projects
                  </span>
                  <span>
                    <strong>{totalTasksCount}</strong> Tasks ({completedTasksCount} done)
                  </span>
                  <span>
                    <strong>{totalSubtasksCount}</strong> Subtasks ({completedSubtasksCount} done)
                  </span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {workspaceProgress}% Completed
                </span>
              </div>

              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${workspaceProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. INLINE ADD PROJECT DRAWER (Unlimited Projects in Workspace) */}
        {showAddProjectForm && canCreateProject && activeWorkspace && (
          <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 animate-fadeIn">
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-indigo-600" />
                  Add Project inside &quot;{activeWorkspace.name}&quot; (Unlimited)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProjectForm(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Project Name *
                  </label>
                  <Input
                    placeholder="e.g., Mobile App Launch v2, Onboarding Flow..."
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <Input
                    placeholder="e.g., Milestones, delivery goals..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Color:</span>
                  <div className="flex items-center gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewProjColor(c)}
                        className={cn(
                          'w-5 h-5 rounded-full transition-transform cursor-pointer',
                          newProjColor === c && 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newProjName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Add Project
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddProjectForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 6. SEARCH FILTER BAR */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search tasks across projects and subtasks in this workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* 7. PROJECTS LIST & HIERARCHY ACCORDION (Level 2 -> Level 3 -> Level 4) */}
        {workspaceProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <FolderKanban className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No projects in &quot;{activeWorkspace?.name}&quot; yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Start structuring your workspace by creating your first project, then add unlimited tasks and subtasks inside it.
            </p>
            {canCreateProject && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddProjectForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {workspaceProjects.map((project) => {
              const isProjCollapsed = !!collapsedProjects[project.id];

              // Tasks in this project
              let projectTasks = visibleTasks.filter((t) => t.projectId === project.id);
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                projectTasks = projectTasks.filter(
                  (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.subtasks.some((s) => s.title.toLowerCase().includes(q))
                );
              }

              const pCompletedTasks = projectTasks.filter((t) => t.status === 'done').length;
              const pProgress =
                projectTasks.length > 0
                  ? Math.round((pCompletedTasks / projectTasks.length) * 100)
                  : 0;

              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs transition-all"
                >
                  {/* PROJECT HEADER ROW */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleProjectCollapse(project.id)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        title={isProjCollapsed ? 'Expand Project' : 'Collapse Project'}
                      >
                        {isProjCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      >
                        <IconRenderer icon={project.icon || 'FolderKanban'} className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {project.name}
                          </h3>
                          <Badge variant="outline" size="sm">
                            {projectTasks.length} Tasks
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-xs text-zinc-400 truncate max-w-xl">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Project Header Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono pr-2">
                        <span>{pProgress}%</span>
                        <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${pProgress}%` }}
                          />
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenInBoard(project.id)}
                        className="text-xs"
                        leftIcon={<Kanban className="w-3 h-3" />}
                      >
                        Board
                      </Button>

                      {canDeleteProject && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete project "${project.name}"?`)) {
                              dispatch(deleteProject(project.id));
                              dispatch(
                                showToast({
                                  id: generateId('toast'),
                                  message: `Project "${project.name}" deleted.`,
                                  type: 'info',
                                })
                              );
                            }
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PROJECT BODY: TASKS LIST (Level 3) & SUBTASKS (Level 4) */}
                  {!isProjCollapsed && (
                    <div className="p-4 space-y-3">
                      {projectTasks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2">
                          No tasks in this project yet. Add your first task below!
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {projectTasks.map((task) => {
                            const isTaskCollapsed = !!collapsedTasks[task.id];
                            const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                            const assignee = users.find((u) => u.id === task.assigneeId);
                            const doneSubtasksCount = task.subtasks.filter((s) => s.completed).length;

                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  'rounded-xl border transition-all',
                                  task.status === 'done'
                                    ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-800/20'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700'
                                )}
                              >
                                {/* TASK ROW */}
                                <div className="p-3 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleTaskCollapse(task.id)}
                                      className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                                      title={isTaskCollapsed ? 'Expand Subtasks' : 'Collapse Subtasks'}
                                    >
                                      {isTaskCollapsed ? (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    {/* Task Checkmark Tick Button */}
                                    <button
                                      type="button"
                                      disabled={isViewer}
                                      onClick={() => handleToggleTaskStatus(task)}
                                      className={cn(
                                        'w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0',
                                        isViewer ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                                        task.status === 'done'
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                                          : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                                      )}
                                      title={isViewer ? 'View-only' : task.status === 'done' ? 'Mark incomplete' : 'Mark task completed'}
                                    >
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </button>

                                    <span
                                      className={cn(
                                        'text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate',
                                        task.status === 'done' && 'line-through text-zinc-400 dark:text-zinc-500'
                                      )}
                                    >
                                      {task.title}
                                    </span>

                                    {/* Priority badge */}
                                    <Badge
                                      variant={
                                        task.priority === 'urgent'
                                          ? 'rose'
                                          : task.priority === 'high'
                                          ? 'amber'
                                          : task.priority === 'low'
                                          ? 'neutral'
                                          : 'indigo'
                                      }
                                      size="sm"
                                    >
                                      {prio.label}
                                    </Badge>

                                    {/* Status badge */}
                                    <span
                                      className={cn(
                                        'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0',
                                        statusCfg.badgeClass
                                      )}
                                    >
                                      {statusCfg.label}
                                    </span>
                                  </div>

                                  {/* Right side: Subtask count, Assignee, Actions */}
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>
                                        {doneSubtasksCount}/{task.subtasks.length}
                                      </span>
                                    </div>

                                    {assignee && (
                                      <Avatar name={assignee.name} src={assignee.avatar} size="xs" />
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        dispatch(
                                          openModal({
                                            name: 'task_detail',
                                            data: { taskId: task.id },
                                          })
                                        )
                                      }
                                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                                      title="Task Details"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>

                                    {canDeleteTask && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          dispatch(deleteTask(task.id));
                                          dispatch(
                                            showToast({
                                              id: generateId('toast'),
                                              message: `Task deleted.`,
                                              type: 'info',
                                            })
                                          );
                                        }}
                                        className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* SUBTASKS ACCORDION (Level 4: Unlimited Subtasks) */}
                                {!isTaskCollapsed && (
                                  <div className="px-4 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-800/20 space-y-2">
                                    <div className="space-y-1.5 pt-1">
                                      {task.subtasks.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 group"
                                        >
                                          <label className="flex items-center gap-2 text-xs min-w-0 flex-1 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={sub.completed}
                                              disabled={isViewer || !canEditTask}
                                              onChange={() =>
                                                dispatch(
                                                  toggleSubtask({
                                                    taskId: task.id,
                                                    subtaskId: sub.id,
                                                  })
                                                )
                                              }
                                              className={cn(
                                                'w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800',
                                                isViewer ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                              )}
                                            />
                                            <span
                                              className={cn(
                                                'text-xs text-zinc-800 dark:text-zinc-200 truncate',
                                                sub.completed && 'line-through text-zinc-400 dark:text-zinc-500'
                                              )}
                                            >
                                              {sub.title}
                                            </span>
                                          </label>

                                          {canEditTask && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                dispatch(
                                                  deleteSubtask({
                                                    taskId: task.id,
                                                    subtaskId: sub.id,
                                                  })
                                                )
                                              }
                                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-rose-500 cursor-pointer transition-opacity"
                                              title="Delete Subtask"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* RAPID INLINE SUBTASK INPUT (Press Enter to add unlimited subtasks continuously) */}
                                    {canEditTask && !isViewer && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <Input
                                          ref={(el) => {
                                            subtaskInputRefs.current[task.id] = el;
                                          }}
                                          placeholder="Add subtask step (press Enter to continuously add)..."
                                          value={inlineSubtaskInputs[task.id] || ''}
                                          onChange={(e) =>
                                            setInlineSubtaskInputs((prev) => ({
                                              ...prev,
                                              [task.id]: e.target.value,
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleCreateSubtask(task.id);
                                            }
                                          }}
                                          className="text-xs h-8"
                                        />
                                        <Button
                                          variant="secondary"
                                          size="xs"
                                          onClick={() => handleCreateSubtask(task.id)}
                                          disabled={!inlineSubtaskInputs[task.id]?.trim()}
                                          className="shrink-0"
                                        >
                                          <Plus className="w-3 h-3 mr-1" /> Add Step
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* RAPID INLINE TASK INPUT (Press Enter to add unlimited tasks continuously) */}
                      {canCreateTask && !isViewer && (
                        <div className="mt-3 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center gap-2">
                          <Input
                            ref={(el) => {
                              taskInputRefs.current[project.id] = el;
                            }}
                            placeholder="Add a new task (e.g., Implement OAuth login)... press Enter"
                            value={inlineTaskInputs[project.id] || ''}
                            onChange={(e) =>
                              setInlineTaskInputs((prev) => ({
                                ...prev,
                                [project.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateTask(project.id);
                              }
                            }}
                            className="text-xs h-9 flex-1"
                          />

                          {/* Quick Priority Selector */}
                          <select
                            value={inlineTaskPriorities[project.id] || 'medium'}
                            onChange={(e) =>
                              setInlineTaskPriorities((prev) => ({
                                ...prev,
                                [project.id]: e.target.value as TaskPriority,
                              }))
                            }
                            className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-700 dark:text-zinc-300 shrink-0"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCreateTask(project.id)}
                            disabled={!inlineTaskInputs[project.id]?.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

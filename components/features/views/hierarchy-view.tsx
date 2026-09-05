'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  toggleSubtask,
  addSubtask,
  deleteSubtask,
  moveTaskStatus,
  addTask,
} from '@/redux/slices/taskSlice';
import { openModal, showToast } from '@/redux/slices/uiSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Task, Subtask, TaskStatus, TaskPriority } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconRenderer } from '@/components/ui/icon-renderer';
import {
  cn,
  generateId,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDate,
} from '@/lib/utils';
import {
  Building2,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wand2,
  Check,
} from 'lucide-react';

interface HierarchyViewProps {
  tasks: Task[];
}

export function HierarchyView({ tasks }: HierarchyViewProps) {
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const projects = useAppSelector((state) => state.projects.projects);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { canEditTask, canCreateTask, isViewer } = usePermissions();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  // Expanded state for projects & tasks
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

  // Inline subtask adder state
  const [addingSubtaskForTask, setAddingSubtaskForTask] = useState<string | null>(null);
  const [inlineSubtaskText, setInlineSubtaskText] = useState('');

  // Inline task adder state
  const [addingTaskForProject, setAddingTaskForProject] = useState<string | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  const toggleProjectCollapse = (pId: string) => {
    setCollapsedProjects((prev) => ({ ...prev, [pId]: !prev[pId] }));
  };

  const toggleTaskCollapse = (tId: string) => {
    setCollapsedTasks((prev) => ({ ...prev, [tId]: !prev[tId] }));
  };

  const handleInlineAddSubtask = (taskId: string) => {
    if (!inlineSubtaskText.trim() || !canEditTask) return;
    dispatch(
      addSubtask({
        taskId,
        subtask: {
          id: generateId('sub'),
          taskId,
          title: inlineSubtaskText.trim(),
          completed: false,
        },
      })
    );
    setInlineSubtaskText('');
    setAddingSubtaskForTask(null);
  };

  const handleInlineAddTask = (projectId: string) => {
    if (!inlineTaskTitle.trim() || !canCreateTask) return;
    const newTask: Task = {
      id: generateId('task'),
      workspaceId: activeWorkspace.id,
      projectId,
      title: inlineTaskTitle.trim(),
      description: 'Quick task added via Workspace Hierarchy Breakdown.',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      assigneeId: currentUser.id,
      tags: ['Workspace'],
      subtasks: [
        { id: generateId('sub'), taskId: '', title: 'Step 1: Planning', completed: false },
        { id: generateId('sub'), taskId: '', title: 'Step 2: Execution', completed: false },
      ],
      attachments: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    newTask.subtasks.forEach((s) => (s.taskId = newTask.id));

    dispatch(addTask(newTask));
    setInlineTaskTitle('');
    setAddingTaskForProject(null);
    dispatch(showToast({ id: generateId('toast'), message: `Created task "${newTask.title}" with 2 initial subtasks`, type: 'success' }));
  };

  // Compute metrics
  const totalWorkspaceTasks = tasks.length;
  const totalCompletedTasks = tasks.filter((t) => t.status === 'done').length;
  const allSubtasks = tasks.flatMap((t) => t.subtasks);
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter((s) => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 select-none bg-[var(--bg-app)]">
      {/* Workspace Master Overview Banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: activeWorkspace?.color || '#6366f1' }}
            >
              <IconRenderer icon={activeWorkspace?.icon || 'zap'} className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {activeWorkspace?.name || 'Workspace'}
                </h2>
                <Badge variant="indigo" size="sm">
                  HIERARCHY BREAKDOWN
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 max-w-xl line-clamp-1 mt-0.5">
                {activeWorkspace?.description ||
                  'Structured workspace division: Workspace → Projects → Tasks → Subtasks'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Projects</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {workspaceProjects.length}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tasks</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {totalCompletedTasks}/{totalWorkspaceTasks}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 min-w-[120px]">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
                <span>Subtasks</span>
                <span className="text-indigo-600 dark:text-indigo-400">{subtaskPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${subtaskPercent}%` }}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Workspace Designer
            </Button>
          </div>
        </div>
      </div>

      {/* Projects and Tasks Breakdown Tree */}
      <div className="space-y-6">
        {workspaceProjects.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
            <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No project divisions yet</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Design your workspace to create project streams and break them down into tasks and subtasks.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch Workspace Designer
            </Button>
          </div>
        ) : (
          workspaceProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const isProjectCollapsed = !!collapsedProjects[project.id];
            const projectSubtasks = projectTasks.flatMap((t) => t.subtasks);
            const projectDoneSubtasks = projectSubtasks.filter((s) => s.completed).length;
            const projectProgress =
              projectSubtasks.length > 0
                ? Math.round((projectDoneSubtasks / projectSubtasks.length) * 100)
                : 0;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs overflow-hidden shadow-xs"
              >
                {/* Project Header Bar */}
                <div className="p-4 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleProjectCollapse(project.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 cursor-pointer"
                    >
                      {isProjectCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    >
                      <IconRenderer icon={project.icon || 'folder'} className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          PROJECT: {project.name}
                        </h3>
                        <Badge variant="neutral" size="sm">
                          {projectTasks.length} Tasks
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{project.description}</p>
                    </div>
                  </div>

                  {/* Project Progress & Action */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                      <span>
                        Subtasks: {projectDoneSubtasks}/{projectSubtasks.length}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${projectProgress}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAddingTaskForProject(
                          addingTaskForProject === project.id ? null : project.id
                        )
                      }
                      disabled={!canCreateTask}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                    </Button>
                  </div>
                </div>

                {/* Project Tasks Body */}
                {!isProjectCollapsed && (
                  <div className="p-4 space-y-3">
                    {/* Inline Task Form for this Project */}
                    {addingTaskForProject === project.id && (
                      <div className="p-3 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex gap-2">
                        <Input
                          placeholder={`Enter new task name for ${project.name}...`}
                          value={inlineTaskTitle}
                          onChange={(e) => setInlineTaskTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            (e.preventDefault(), handleInlineAddTask(project.id))
                          }
                          autoFocus
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleInlineAddTask(project.id)}
                          disabled={!inlineTaskTitle.trim()}
                        >
                          Create Task
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddingTaskForProject(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {projectTasks.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400 italic">
                        No tasks in this project yet. Click "+ Add Task" above to divide this project into tasks!
                      </div>
                    ) : (
                      projectTasks.map((task) => {
                        const isTaskCollapsed = !!collapsedTasks[task.id];
                        const assignee = users.find((u) => u.id === task.assigneeId);
                        const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        const statusCfg = STATUS_CONFIG[task.status] || { label: task.status, color: '#64748b' };
                        const completedCount = task.subtasks.filter((s) => s.completed).length;
                        const totalCount = task.subtasks.length;
                        const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                          >
                            {/* Task Top Row */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskCollapse(task.id)}
                                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                >
                                  {isTaskCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: prio.iconColor }}
                                />

                                <button
                                  type="button"
                                  disabled={isViewer}
                                  onClick={() => {
                                    if (isViewer) {
                                      dispatch(showToast({ id: generateId('toast'), message: 'View-only: Viewers cannot change task status.', type: 'warning' }));
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
                                    'w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0',
                                    isViewer ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                                    task.status === 'done'
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                                      : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                                  )}
                                  title={isViewer ? 'View-only mode' : task.status === 'done' ? 'Mark as incomplete' : 'Mark task completed'}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </button>

                                <span
                                  className={cn(
                                    'text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate',
                                    task.status === 'done' && 'line-through text-zinc-400 dark:text-zinc-500'
                                  )}
                                >
                                  {task.title}
                                </span>

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

                                <span
                                  className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                                    statusCfg.badgeClass
                                  )}
                                >
                                  {statusCfg.label}
                                </span>
                              </div>

                              {/* Task Right Actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Subtask Progress Count */}
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                    {completedCount}/{totalCount}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 font-mono">
                                    ({percent}%)
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
                                  className="p-1 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                  title="Open task detail"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Subtask Progress Bar */}
                            {totalCount > 0 && (
                              <div className="w-full h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden ml-6 max-w-[calc(100%-1.5rem)]">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-300',
                                    completedCount === totalCount
                                      ? 'bg-emerald-500'
                                      : 'bg-indigo-500'
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            )}

                            {/* Subtasks Checklist Container */}
                            {!isTaskCollapsed && (
                              <div className="pl-6 space-y-1.5 border-l-2 border-zinc-100 dark:border-zinc-800 ml-3 pt-1">
                                {task.subtasks.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
                                  >
                                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
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
                                          sub.completed &&
                                            'line-through text-zinc-400 dark:text-zinc-500'
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
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {/* Inline Add Subtask input */}
                                {addingSubtaskForTask === task.id ? (
                                  <div className="flex items-center gap-2 pt-1">
                                    <Input
                                      placeholder="Add subtask step (press Enter)..."
                                      value={inlineSubtaskText}
                                      onChange={(e) => setInlineSubtaskText(e.target.value)}
                                      onKeyDown={(e) =>
                                        e.key === 'Enter' &&
                                        (e.preventDefault(), handleInlineAddSubtask(task.id))
                                      }
                                      autoFocus
                                    />
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleInlineAddSubtask(task.id)}
                                      disabled={!inlineSubtaskText.trim()}
                                    >
                                      Add
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setAddingSubtaskForTask(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  canEditTask && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingSubtaskForTask(task.id);
                                        setInlineSubtaskText('');
                                      }}
                                      className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" /> Add Subtask Step
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

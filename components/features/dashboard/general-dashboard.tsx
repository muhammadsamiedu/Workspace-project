'use client';

import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { setActiveWorkspace } from '@/redux/slices/workspaceSlice';
import { setActiveProject } from '@/redux/slices/projectSlice';
import { setView } from '@/redux/slices/viewSlice';
import { openModal, showToast } from '@/redux/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { generateId, cn, PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/utils';
import {
  Building2,
  FolderKanban,
  CheckSquare,
  BarChart3,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  PieChart,
  ListTree,
  Activity,
  ChevronRight,
  Target,
  FolderPlus,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export function GeneralDashboard() {
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const projects = useAppSelector((state) => state.projects.projects);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const {
    canCreateProject,
    canCreateWorkspace,
    canViewAllWorkspaces,
    canViewAllTasks,
    currentRole,
    isOwner,
    isAdmin,
    isViewer,
  } = usePermissions();

  // Filter state for workspaces
  const [searchQuery, setSearchQuery] = useState('');

  // Role visibility limits:
  // Owner and Admin see all workspaces; Members and Viewers only see their assigned workspaces
  const visibleWorkspaces = useMemo(() => {
    if (canViewAllWorkspaces) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.members.some((m) => m.userId === currentUser?.id) ||
        (ws as any).ownerId === currentUser?.id
    );
  }, [canViewAllWorkspaces, workspaces, currentUser?.id]);

  // Role visibility limits:
  // Owner and Admin see all tasks; Members only see their own assigned/created tasks
  const visibleTasks = useMemo(() => {
    if (canViewAllTasks) return tasks;
    return tasks.filter(
      (t) => t.assigneeId === currentUser?.id || t.createdBy === currentUser?.id
    );
  }, [canViewAllTasks, tasks, currentUser?.id]);

  // Overall calculations across visible workspaces and tasks
  const metrics = useMemo(() => {
    const totalWorkspaces = visibleWorkspaces.length;
    const totalProjects = projects.filter((p) =>
      visibleWorkspaces.some((ws) => ws.id === p.workspaceId)
    ).length;
    const totalTasks = visibleTasks.length;
    const completedTasks = visibleTasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = visibleTasks.filter((t) => t.status === 'in_progress').length;
    const reviewTasks = visibleTasks.filter((t) => t.status === 'review').length;
    const todoTasks = visibleTasks.filter((t) => t.status === 'todo').length;

    const allSubtasks = visibleTasks.flatMap((t) => t.subtasks || []);
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter((s) => s.completed).length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const subtaskCompletionRate =
      totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Priority counts
    const urgentCount = visibleTasks.filter((t) => t.priority === 'urgent').length;
    const highCount = visibleTasks.filter((t) => t.priority === 'high').length;
    const mediumCount = visibleTasks.filter((t) => t.priority === 'medium').length;
    const lowCount = visibleTasks.filter((t) => t.priority === 'low').length;

    return {
      totalWorkspaces,
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      taskCompletionRate,
      totalSubtasks,
      completedSubtasks,
      subtaskCompletionRate,
      urgentCount,
      highCount,
      mediumCount,
      lowCount,
    };
  }, [visibleWorkspaces, projects, visibleTasks]);

  // Per workspace breakdown
  const workspaceBreakdowns = useMemo(() => {
    return visibleWorkspaces.map((ws) => {
      const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
      const wsTasks = visibleTasks.filter((t) => t.workspaceId === ws.id);
      const wsDone = wsTasks.filter((t) => t.status === 'done').length;
      const wsSubtasks = wsTasks.flatMap((t) => t.subtasks || []);
      const wsDoneSubtasks = wsSubtasks.filter((s) => s.completed).length;
      const progress = wsTasks.length > 0 ? Math.round((wsDone / wsTasks.length) * 100) : 0;

      return {
        ...ws,
        projects: wsProjects,
        projectsCount: wsProjects.length,
        tasksCount: wsTasks.length,
        doneCount: wsDone,
        subtasksCount: wsSubtasks.length,
        doneSubtasksCount: wsDoneSubtasks,
        progress,
      };
    });
  }, [visibleWorkspaces, projects, visibleTasks]);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaceBreakdowns;
    const q = searchQuery.toLowerCase().trim();
    return workspaceBreakdowns.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.category && w.category.toLowerCase().includes(q)) ||
        w.projects.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [workspaceBreakdowns, searchQuery]);

  // Max tasks count in any workspace for scaling bar charts
  const maxWorkspaceTasks = Math.max(...workspaceBreakdowns.map((w) => w.tasksCount), 1);

  const { navigateTo } = useAppNavigation();

  // Switch to workspace & project smoothly
  const handleOpenWorkspace = (wsId: string) => {
    const wsName = workspaces.find((w) => w.id === wsId)?.name;
    const firstProj = projects.find((p) => p.workspaceId === wsId);
    navigateTo({
      workspaceId: wsId,
      projectId: firstProj?.id,
      view: 'hierarchy',
    });
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Switched to workspace: "${wsName}"`,
        type: 'info',
      })
    );
  };

  const handleOpenProject = (wsId: string, projId: string) => {
    navigateTo({
      workspaceId: wsId,
      projectId: projId,
      view: 'kanban',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 select-none bg-[var(--bg-app)]">
      {/* Top Banner: Master Title & Quick Action Bar */}
      <div className="relative rounded-3xl border border-indigo-100/80 dark:border-zinc-800 bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/40 dark:from-indigo-950 dark:via-slate-900 dark:to-zinc-950 p-6 md:p-8 text-zinc-900 dark:text-white overflow-hidden shadow-lg shadow-indigo-100/50 dark:shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-violet-500/10 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200/80 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Unified Multi-Workspace Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Welcome back, {currentUser?.name || 'Workspace Creator'}!
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Manage your complete enterprise ecosystem across all workspaces, project divisions, tasks, and subtasks with real-time performance analytics.
            </p>
          </div>

          {/* Master Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            {canCreateWorkspace && (
              <Button
                variant="primary"
                size="md"
                onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/25 dark:shadow-indigo-900/40 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2 text-indigo-200" />
                Build New Workspace
              </Button>
            )}

            {canCreateProject && (
              <Button
                variant="outline"
                size="md"
                onClick={() => dispatch(openModal({ name: 'create_project' }))}
                className="border-indigo-200/80 dark:border-zinc-700 text-indigo-700 dark:text-zinc-200 hover:bg-indigo-50/50 dark:hover:bg-zinc-800 bg-white/80 dark:bg-transparent font-semibold cursor-pointer shadow-2xs"
              >
                <FolderPlus className="w-4 h-4 mr-2 text-indigo-500" />
                Add Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Workspaces */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Workspaces</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {metrics.totalWorkspaces}
          </div>
          <p className="text-[11px] text-zinc-400">Active enterprise hubs</p>
        </div>

        {/* Total Projects */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Projects & Streams</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {metrics.totalProjects}
          </div>
          <p className="text-[11px] text-zinc-400">Total active divisions</p>
        </div>

        {/* Total Tasks */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {metrics.completedTasks}/{metrics.totalTasks}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>{metrics.taskCompletionRate}% completed</span>
          </div>
        </div>

        {/* Subtasks Progress */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Subtask Decomposition</span>
            <ListTree className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {metrics.completedSubtasks}/{metrics.totalSubtasks}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
            <span>{metrics.subtaskCompletionRate}% steps finished</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION: Beautiful Graphs & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRAPH 1: Workspaces Load Distribution Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Workload Distribution Across Workspaces
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Tasks per workspace</span>
          </div>

          {/* Bar Chart Bars */}
          <div className="space-y-4 pt-1">
            {workspaceBreakdowns.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No workspaces created yet.</p>
            ) : (
              workspaceBreakdowns.map((ws) => {
                const barWidth = Math.max((ws.tasksCount / maxWorkspaceTasks) * 100, 4);
                return (
                  <div key={ws.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ws.color || '#6366f1' }}
                        />
                        <span className="truncate max-w-[200px]">{ws.name}</span>
                        {ws.id === activeWorkspaceId && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                        <span>{ws.projects.length} projects</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {ws.doneCount}/{ws.tasksCount} tasks ({ws.progress}%)
                        </span>
                      </div>
                    </div>

                    {/* Styled Multi-Bar */}
                    <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: ws.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GRAPH 2 & 3: Global Status & Priority Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Breakdown */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Global Task Status
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">{metrics.totalTasks} total</span>
            </div>

            {/* Segmented Status Progress Line */}
            {metrics.totalTasks > 0 ? (
              <div className="space-y-3 pt-1">
                <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(metrics.completedTasks / metrics.totalTasks) * 100}%` }}
                    title={`Done: ${metrics.completedTasks}`}
                  />
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(metrics.inProgressTasks / metrics.totalTasks) * 100}%` }}
                    title={`In Progress: ${metrics.inProgressTasks}`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(metrics.reviewTasks / metrics.totalTasks) * 100}%` }}
                    title={`In Review: ${metrics.reviewTasks}`}
                  />
                  <div
                    className="h-full bg-zinc-400 transition-all duration-300"
                    style={{ width: `${(metrics.todoTasks / metrics.totalTasks) * 100}%` }}
                    title={`To Do: ${metrics.todoTasks}`}
                  />
                </div>

                {/* Status Legend Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Done</span>
                    <span className="font-bold">{metrics.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">In Progress</span>
                    <span className="font-bold">{metrics.inProgressTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">In Review</span>
                    <span className="font-bold">{metrics.reviewTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">To Do</span>
                    <span className="font-bold">{metrics.todoTasks}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-3 text-center">No tasks to analyze.</p>
            )}
          </div>

          {/* Priority Matrix Pills */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Priority Distribution
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">Severity</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Urgent</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-300">{metrics.urgentCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">High</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-300">{metrics.highCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">Medium</span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-300">{metrics.mediumCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">Low</span>
                <span className="text-lg font-black text-zinc-700 dark:text-zinc-300">{metrics.lowCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALL WORKSPACES DIRECTORY & PROJECT EXPLORER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              All Workspaces Directory ({workspaces.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Switch between workspaces, create new projects, and jump directly into task boards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search workspaces or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between gap-4',
                  isActive
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
              >
                {/* Workspace Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: ws.color || '#6366f1' }}
                      >
                        <IconRenderer icon={ws.icon || 'zap'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {ws.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 capitalize truncate">
                          {ws.category || 'General Hub'}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <Badge variant="indigo" size="sm">
                        Active
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {ws.description || 'Enterprise workspace for projects and subtasks.'}
                  </p>

                  {/* Metrics Badges */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                    <span>{ws.projects.length} Projects</span>
                    <span>{ws.tasksCount} Tasks</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{ws.progress}% Done</span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${ws.progress}%` }}
                    />
                  </div>

                  {/* Projects List inside Workspace */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Projects in this workspace:
                    </span>
                    {ws.projects.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">No projects created yet.</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {ws.projects.map((p) => {
                          const pTasks = tasks.filter((t) => t.projectId === p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleOpenProject(ws.id, p.id)}
                              className="w-full text-left p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: p.color || ws.color }}
                                />
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                  {p.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                {pTasks.length} tasks
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Workspace Card Footer Actions */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  {canCreateProject ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        dispatch(
                          openModal({
                            name: 'create_project',
                            data: { workspaceId: ws.id },
                          })
                        )
                      }
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Project
                    </Button>
                  ) : <div />}

                  <Button
                    variant={isActive ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleOpenWorkspace(ws.id)}
                    className="text-xs"
                  >
                    {isActive ? (
                      <>
                        <span>Current Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Switch & Open</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

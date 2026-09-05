'use client';

import React, { useMemo, useEffect, Suspense } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppRedux';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { openModal } from '@/redux/slices/uiSlice';
import { resetFilters } from '@/redux/slices/filterSlice';
import { setView } from '@/redux/slices/viewSlice';
import { Sidebar } from '@/components/features/layout/sidebar';
import { Topbar } from '@/components/features/layout/topbar';
import { ProjectHeader } from '@/components/features/projects/project-header';
import { FilterBar } from '@/components/features/filters/filter-bar';
import { KanbanBoard } from '@/components/features/views/kanban-board';
import { ListView } from '@/components/features/views/list-view';
import { CalendarView } from '@/components/features/views/calendar-view';
import { GeneralDashboard } from '@/components/features/dashboard/general-dashboard';
import { WorkspacePage } from '@/components/features/workspaces/workspace-page';
import { ModalContainer } from '@/components/features/layout/modal-container';
import { LoginPage } from '@/components/features/auth/login-page';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Layers, SearchX, Sparkles } from 'lucide-react';
import { ViewType } from '@/lib/types';

interface WorkspaceAppShellProps {
  defaultView?: ViewType;
}

function WorkspaceAppShellContent({ defaultView }: WorkspaceAppShellProps) {
  const dispatch = useAppDispatch();
  useKeyboardShortcuts();
  useAppNavigation(); // Keeps URL & Redux state synchronized

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authHydrated = useAppSelector((state) => state.auth.authHydrated);
  const currentView = useAppSelector((state) => state.views.currentView);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const projects = useAppSelector((state) => state.projects.projects);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const filters = useAppSelector((state) => state.filters.filters);
  const isOnline = useAppSelector((state) => state.ui.isOnline);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { canCreateTask, isViewer, canViewAllTasks } = usePermissions();

  useEffect(() => {
    if (defaultView && currentView !== defaultView) {
      dispatch(setView(defaultView));
    }
  }, [defaultView, currentView, dispatch]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Compute filtered & sorted tasks for the active project
  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];

    return tasks
      .filter((task) => {
        if (task.projectId !== activeProject.id) return false;

        // Role limit: If not authorized to view all tasks (e.g. member), member only sees their own tasks
        if (!canViewAllTasks && currentUser) {
          const isMyTask = task.assigneeId === currentUser.id || task.createdBy === currentUser.id;
          if (!isMyTask) return false;
        }

        // Search query
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchTag = task.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        // Assignee filter
        if (filters.assigneeId && task.assigneeId !== filters.assigneeId) {
          return false;
        }

        // Status filter
        if (filters.status.length > 0 && !filters.status.includes(task.status)) {
          return false;
        }

        // Priority filter
        if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
          return false;
        }

        // Due date range filter
        if (filters.dueDateRange !== 'all') {
          if (!task.dueDate) {
            if (filters.dueDateRange !== 'no_date') return false;
          } else {
            if (filters.dueDateRange === 'no_date') return false;
            const taskDate = new Date(task.dueDate);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (filters.dueDateRange === 'overdue') {
              if (taskDate >= today) return false;
            } else if (filters.dueDateRange === 'today') {
              const isToday =
                taskDate.getDate() === today.getDate() &&
                taskDate.getMonth() === today.getMonth() &&
                taskDate.getFullYear() === today.getFullYear();
              if (!isToday) return false;
            } else if (filters.dueDateRange === 'this_week') {
              const weekEnd = new Date(today.getTime() + 7 * 86400000);
              if (taskDate < today || taskDate > weekEnd) return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        const factor = filters.sortOrder === 'asc' ? 1 : -1;
        if (filters.sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * factor;
        }
        if (filters.sortBy === 'priority') {
          const pWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (pWeight[a.priority] - pWeight[b.priority]) * factor;
        }
        if (filters.sortBy === 'title') {
          return a.title.localeCompare(b.title) * factor;
        }
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
      });
  }, [tasks, activeProject, filters, canViewAllTasks, currentUser]);

  const totalProjectTasks = tasks.filter((t) => {
    if (t.projectId !== activeProject?.id) return false;
    if (!canViewAllTasks && currentUser) {
      return t.assigneeId === currentUser.id || t.createdBy === currentUser.id;
    }
    return true;
  });

  // Wait for client-side auth rehydration
  if (!authHydrated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Loading workspace…</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)]">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Offline notification banner if offline */}
        {!isOnline && (
          <div className="bg-amber-500 text-zinc-900 text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2 select-none shadow-xs">
            <span>You are currently offline. Changes are saved locally to IndexedDB and will sync when reconnected.</span>
          </div>
        )}

        {/* Top Header Bar */}
        <Topbar />

        {/* Viewer Read-Only Notice Banner */}
        {isViewer && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium px-4 py-1.5 flex items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-mono">
                VIEWER (READ-ONLY)
              </span>
              <span>
                You have view-only access. Creating, editing, moving, and completing tasks or projects is disabled.
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area with smooth animated page/view transition */}
        <div key={currentView} className="flex-1 flex flex-col min-h-0 overflow-hidden animate-viewFadeIn">
          {currentView === 'overview' ? (
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <GeneralDashboard />
            </main>
          ) : currentView === 'hierarchy' ? (
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <WorkspacePage />
            </main>
          ) : activeProject ? (
            <>
              <ProjectHeader />
              <FilterBar />

              {/* Views Area */}
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {totalProjectTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
                    <EmptyState
                      icon={<Layers className="w-6 h-6" />}
                      title="No tasks in this project yet"
                      description="Get started by designing your complete workspace hierarchy or add an individual task."
                      actionLabel={canCreateTask ? "Add Single Task" : undefined}
                      onAction={() => dispatch(openModal({ name: 'create_task' }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      Launch Workspace Architecture Studio
                    </Button>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <EmptyState
                      icon={<SearchX className="w-6 h-6 text-zinc-400" />}
                      title="No tasks match your active filters"
                      description="Try clearing your search query or reset status and priority filters."
                      actionLabel="Reset All Filters"
                      onAction={() => dispatch(resetFilters())}
                    />
                  </div>
                ) : currentView === 'kanban' ? (
                  <KanbanBoard tasks={filteredTasks} />
                ) : currentView === 'list' ? (
                  <ListView tasks={filteredTasks} />
                ) : (
                  <CalendarView tasks={filteredTasks} />
                )}
              </main>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
              <EmptyState
                icon={<Layers className="w-6 h-6" />}
                title="No project selected"
                description="Design a complete workspace divided into projects, tasks, and subtasks."
                actionLabel="Launch Workspace Designer"
                onAction={() => dispatch(openModal({ name: 'workspace_wizard' }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Modals & Toasts Container */}
      <ModalContainer />
    </div>
  );
}

export function WorkspaceAppShell(props: WorkspaceAppShellProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[var(--text-muted)]">Loading workspace manager…</p>
          </div>
        </div>
      }
    >
      <WorkspaceAppShellContent {...props} />
    </Suspense>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  toggleSidebar,
  setMobileSidebarOpen,
  openModal,
  closeModal,
  showToast,
} from '@/redux/slices/uiSlice';
import { setActiveWorkspace } from '@/redux/slices/workspaceSlice';
import { setActiveProject } from '@/redux/slices/projectSlice';
import { setView } from '@/redux/slices/viewSlice';
import { loginAs, logout } from '@/redux/slices/authSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  CheckSquare,
  Activity,
  Settings,
  FolderPlus,
  Briefcase,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
  UserCheck,
  LogOut,
  ListTree,
  Wand2,
  BarChart3,
  Building2,
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

import { useAppNavigation } from '@/hooks/useAppNavigation';

export function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const mobileSidebarOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);
  const currentView = useAppSelector((state) => state.views.currentView);
  const { navigateTo } = useAppNavigation();

  const handleLogout = () => {
    dispatch(setMobileSidebarOpen(false));
    dispatch(closeModal());
    dispatch(logout());
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'You have been logged out.',
        type: 'info',
      })
    );
  };
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const projects = useAppSelector((state) => state.projects.projects);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const users = useAppSelector((state) => state.auth.users);
  const tasks = useAppSelector((state) => state.tasks.tasks);

  const {
    canCreateProject,
    canCreateWorkspace,
    canViewAllWorkspaces,
    canViewAllProfiles,
    currentRole,
    isViewer,
    isOwner,
    isAdmin,
  } = usePermissions();

  // Role visibility limit: Members and Viewers only see their assigned workspaces
  const visibleWorkspaces = React.useMemo(() => {
    if (canViewAllWorkspaces) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.members.some((m) => m.userId === currentUser.id) ||
        (ws as any).ownerId === currentUser.id
    );
  }, [canViewAllWorkspaces, workspaces, currentUser.id]);

  // Auto-switch to authorized workspace if active workspace is unauthorized
  React.useEffect(() => {
    if (
      visibleWorkspaces.length > 0 &&
      !visibleWorkspaces.some((ws) => ws.id === activeWorkspaceId)
    ) {
      dispatch(setActiveWorkspace(visibleWorkspaces[0].id));
    }
  }, [visibleWorkspaces, activeWorkspaceId, dispatch]);

  const activeWorkspace =
    visibleWorkspaces.find((w) => w.id === activeWorkspaceId) ||
    visibleWorkspaces[0] ||
    workspaces[0];
  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);
  const workspaceTasks = tasks.filter((t) => t.workspaceId === activeWorkspace?.id);

  // Workspace Switcher Dropdown items
  const workspaceDropdownItems = [
    ...visibleWorkspaces.map((ws) => ({
      id: ws.id,
      label: (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: ws.color }}>
            <IconRenderer icon={ws.icon} className="w-3 h-3 text-white" />
          </div>
          <span className={cn(ws.id === activeWorkspaceId && 'font-bold text-indigo-600 dark:text-indigo-400')}>
            {ws.name}
          </span>
        </div>
      ),
      onClick: () => navigateTo({ workspaceId: ws.id }),
    })),
    {
      id: 'divider-1',
      divider: true,
      label: '',
    },
    ...(canCreateWorkspace
      ? [
          {
            id: 'new-workspace',
            label: 'Build New Workspace...',
            icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
            onClick: () => dispatch(openModal({ name: 'workspace_wizard' })),
          },
        ]
      : []),
    {
      id: 'ws-settings',
      label: 'Workspace Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => dispatch(openModal({ name: 'workspace_settings' })),
    },
  ];

  // User Switcher items for fast multi-user role testing
  const userSwitcherItems = [
    ...users.map((u) => ({
      id: u.id,
      label: (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 truncate">
            <Avatar name={u.name} src={u.avatar} size="xs" />
            <span className={cn(u.id === currentUser.id && 'font-bold text-indigo-600 dark:text-indigo-400')}>
              {u.name}
            </span>
          </div>
          <Badge
            variant={u.role === 'owner' ? 'indigo' : u.role === 'admin' ? 'purple' : u.role === 'member' ? 'default' : 'rose'}
            size="sm"
          >
            {u.role}
          </Badge>
        </div>
      ),
      onClick: () => dispatch(loginAs(u.id)),
    })),
    {
      id: 'divider-user',
      divider: true,
      label: '',
    },
    {
      id: 'all-profiles',
      label: (
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Team Profiles Directory</span>
          </span>
          {isOwner ? (
            <Badge variant="indigo" size="sm">
              Owner
            </Badge>
          ) : isAdmin ? (
            <Badge variant="purple" size="sm">
              Admin
            </Badge>
          ) : null}
        </div>
      ),
      onClick: () => dispatch(openModal({ name: 'all_profiles' })),
    },
    {
      id: 'edit-profile',
      label: 'Edit My Profile...',
      icon: <UserCheck className="w-4 h-4" />,
      onClick: () => dispatch(openModal({ name: 'profile_modal' })),
    },
    {
      id: 'logout-btn',
      label: 'Log Out',
      icon: <LogOut className="w-4 h-4 text-rose-500" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900/95 border-r border-zinc-200 dark:border-zinc-800 select-none">
      {/* Workspace Header */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <Dropdown
          align="left"
          width="w-64"
          trigger={
            <div
              className={cn(
                'flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer',
                sidebarCollapsed && 'justify-center p-1.5'
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: activeWorkspace?.color || '#6366f1' }}
              >
                <IconRenderer icon={activeWorkspace?.icon} className="w-4 h-4 text-white" />
              </div>

              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {activeWorkspace?.name || 'Workspace'}
                  </h2>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                    {activeWorkspace?.slug || 'workspace'}
                  </p>
                </div>
              )}

              {!sidebarCollapsed && (
                <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
              )}
            </div>
          }
          items={workspaceDropdownItems}
        />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {/* Workspace Architecture Action */}
        <div className="px-0.5">
          <button
            type="button"
            onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-indigo-500/5 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs transition-all cursor-pointer',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="Design & Divide Workspace into Tasks/Subtasks"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {!sidebarCollapsed && <span>Workspace Designer</span>}
          </button>
        </div>

        {/* Main Quick Links */}
        <div className="space-y-0.5">
          <button
            onClick={() => navigateTo({ view: 'overview' })}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              currentView === 'overview'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="General Dashboard (All Workspaces & Analytics)"
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-indigo-500" />
            {!sidebarCollapsed && <span>General Dashboard</span>}
          </button>

          <button
            onClick={() => navigateTo({ view: 'hierarchy' })}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              currentView === 'hierarchy'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="Workspace Explorer (Unlimited Workspaces, Projects, Tasks & Subtasks)"
          >
            <Building2 className="w-4 h-4 shrink-0 text-emerald-500" />
            {!sidebarCollapsed && <span>Workspace Explorer</span>}
          </button>

          <button
            onClick={() => dispatch(openModal({ name: 'all_tasks' }))}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="All Workspace Tasks"
          >
            <CheckSquare className="w-4 h-4 shrink-0 text-indigo-500" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>All Tasks</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {workspaceTasks.length}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => dispatch(openModal({ name: 'activity_feed' }))}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="Activity Feed"
          >
            <Activity className="w-4 h-4 shrink-0 text-amber-500" />
            {!sidebarCollapsed && <span>Activity Log</span>}
          </button>

          <button
            onClick={() => dispatch(openModal({ name: 'workspace_settings' }))}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="Workspace Settings"
          >
            <Settings className="w-4 h-4 shrink-0 text-zinc-400" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>

          <Link
            href="/demo"
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center px-1.5'
            )}
            title="Interactive Neural Vortex Demo"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            {!sidebarCollapsed && <span>Neural Vortex Demo</span>}
          </Link>
        </div>

        {/* Projects Section */}
        <div className="space-y-1">
          <div
            className={cn(
              'flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {!sidebarCollapsed ? (
              <>
                <span>Projects ({workspaceProjects.length})</span>
                {canCreateProject && (
                  <button
                    onClick={() => dispatch(openModal({ name: 'create_project' }))}
                    className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                    title="Create New Project"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="space-y-0.5 mt-1">
            {workspaceProjects.map((project) => {
              const isActive = project.id === activeProjectId;
              const projectTaskCount = tasks.filter((t) => t.projectId === project.id).length;

              return (
                <button
                  key={project.id}
                  onClick={() =>
                    navigateTo({
                      projectId: project.id,
                      view:
                        currentView === 'overview' || currentView === 'hierarchy'
                          ? 'kanban'
                          : currentView,
                    })
                  }
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100',
                    sidebarCollapsed && 'justify-center px-1.5'
                  )}
                  title={project.name}
                >
                  <IconRenderer icon={project.icon} className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{project.name}</span>
                      <span className="text-[10px] text-zinc-400 ml-1.5 shrink-0">
                        {projectTaskCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {workspaceProjects.length === 0 && !sidebarCollapsed && (
              <p className="px-2 py-2 text-[11px] text-zinc-400 italic">
                No active projects
              </p>
            )}
          </div>
        </div>

        {/* Templates Launcher */}
        {!sidebarCollapsed && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Project Templates</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2">
              Start fast with Sprint, Bug Tracker, or Roadmap.
            </p>
            <button
              onClick={() => dispatch(openModal({ name: 'create_project' }))}
              disabled={!canCreateProject}
              className="w-full py-1 text-[11px] font-medium text-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Browse Templates
            </button>
          </div>
        )}
      </div>

      {/* User Switcher / Profile Bar at Bottom */}
      <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1">
        <Dropdown
          align="left"
          width="w-64"
          dropUp
          trigger={
            <div
              className={cn(
                'flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer',
                sidebarCollapsed && 'justify-center p-1'
              )}
            >
              <Avatar
                name={currentUser.name}
                src={currentUser.avatar}
                size={sidebarCollapsed ? 'sm' : 'md'}
                showOnlineStatus
              />
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentUser.name}
                    </span>
                    <Badge
                      variant={
                        currentRole === 'owner'
                          ? 'indigo'
                          : currentRole === 'admin'
                          ? 'purple'
                          : currentRole === 'member'
                          ? 'default'
                          : 'rose'
                      }
                      size="sm"
                    >
                      {currentRole}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">{currentUser.email}</p>
                </div>
              )}
            </div>
          }
          items={userSwitcherItems}
        />

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer',
            sidebarCollapsed && 'justify-center px-1.5'
          )}
          title="Log out of account"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          {!sidebarCollapsed && <span>Log out</span>}
        </button>
      </div>

      {/* Collapse Sidebar Toggle on Desktop */}
      <div className="hidden md:flex items-center justify-end px-3 py-2 border-t border-zinc-100 dark:border-zinc-800/60">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 h-screen sticky top-0 z-30',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => dispatch(setMobileSidebarOpen(false))}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

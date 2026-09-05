'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  toggleTheme,
  setCommandPaletteOpen,
  setMobileSidebarOpen,
  openModal,
  closeModal,
  showToast,
  toggleLiveSimulation,
} from '@/redux/slices/uiSlice';
import { setView } from '@/redux/slices/viewSlice';
import { logout } from '@/redux/slices/authSlice';
import { markAsRead, markAllAsRead } from '@/redux/slices/notificationSlice';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { ViewType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { Dropdown } from '@/components/ui/dropdown';
import { IconRenderer } from '@/components/ui/icon-renderer';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  Undo2,
  Redo2,
  Plus,
  Kanban,
  List,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  Radio,
  CheckCheck,
  ExternalLink,
  Keyboard,
  LogOut,
  ChevronDown,
  UserCheck,
  Settings,
  ListTree,
  Sparkles,
  Wand2,
  BarChart3,
  Users,
  Building2,
} from 'lucide-react';
import { cn, formatRelativeTime, generateId } from '@/lib/utils';

import { useAppNavigation } from '@/hooks/useAppNavigation';

export function Topbar() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const currentView = useAppSelector((state) => state.views.currentView);
  const liveSimulationActive = useAppSelector((state) => state.ui.liveSimulationActive);
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const projects = useAppSelector((state) => state.projects.projects);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { navigateTo } = useAppNavigation();

  const handleLogout = () => {
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

  const { canUndo, canRedo, undo, redo } = useUndoRedo();
  const { isOnline, isSyncing, triggerSync } = useOnlineStatus();
  const { canCreateTask, isViewer, isOwner, isAdmin } = usePermissions();

  const [notificationOpen, setNotificationOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const viewOptions: { id: ViewType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'overview', label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" />, shortcut: 'D' },
    { id: 'hierarchy', label: 'Workspaces Hub', icon: <Building2 className="w-3.5 h-3.5" />, shortcut: 'W' },
    { id: 'kanban', label: 'Board', icon: <Kanban className="w-3.5 h-3.5" />, shortcut: 'B' },
    { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" />, shortcut: 'L' },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" />, shortcut: 'M' },
  ];

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20 px-4 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => dispatch(setMobileSidebarOpen(true))}
          className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {activeWorkspace?.name || 'Workspace'}
          </span>
          <span>/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
            <IconRenderer icon={activeProject?.icon} className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{activeProject?.name || 'Overview'}</span>
          </span>
        </div>
      </div>

      {/* Center: View Switcher Tabs (Board, List, Calendar) */}
      <div className="hidden lg:flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
        {viewOptions.map((v) => (
          <Tooltip key={v.id} position="bottom" content={`${v.label} (Shortcut: ${v.shortcut})`}>
            <button
              onClick={() => navigateTo({ view: v.id })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer select-none',
                currentView === v.id
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              {v.icon}
              <span>{v.label}</span>
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Right: Actions, Search, Notifications, Theme, New Task */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cmd+K Quick Search Trigger */}
        <button
          onClick={() => dispatch(setCommandPaletteOpen(true))}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700/60 transition-colors cursor-pointer"
          title="Open Command Palette"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Undo / Redo Buttons */}
        <div className="hidden sm:flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-2">
          <Tooltip position="bottom" content="Undo (Ctrl+Z)">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip position="bottom" content="Redo (Ctrl+Y)">
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Live Simulation Pulse */}
        <Tooltip
          position="bottom"
          content={
            liveSimulationActive
              ? 'Realtime simulation active (click to pause)'
              : 'Realtime simulation paused (click to resume)'
          }
        >
          <button
            onClick={() => dispatch(toggleLiveSimulation())}
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border',
              liveSimulationActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                liveSimulationActive ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'
              )}
            />
            <span>{liveSimulationActive ? 'Live' : 'Paused'}</span>
          </button>
        </Tooltip>

        {/* Offline & Manual Sync Button */}
        <Tooltip position="bottom" content={isOnline ? 'Online (Click to sync changes)' : 'Offline mode'}>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              isOnline
                ? 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                : 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
            )}
          >
            {isOnline ? (
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin text-indigo-500')} />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
          </button>
        </Tooltip>

        {/* Keyboard Shortcuts Dialog Trigger */}
        <Tooltip position="bottom" content="Keyboard Shortcuts (?)">
          <button
            onClick={() => dispatch(openModal({ name: 'shortcuts_modal' }))}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Notification Bell with Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-900" />
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 glass-panel overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <Badge variant="indigo" size="sm">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-zinc-400">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        dispatch(markAsRead(n.id));
                        if (n.taskId) {
                          dispatch(openModal({ name: 'task_detail', data: { taskId: n.taskId } }));
                        }
                      }}
                      className={cn(
                        'p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer',
                        !n.read && 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-center">
                <button
                  onClick={() => {
                    setNotificationOpen(false);
                    dispatch(openModal({ name: 'notification_settings' }));
                  }}
                  className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Notification Preferences
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Log Out Action */}
        <Tooltip position="bottom" content="Log out of account">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer shadow-2xs"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </Tooltip>

        {/* Theme Toggle Button */}
        <Tooltip position="bottom" content={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </Tooltip>

        {/* Workspace Designer Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(openModal({ name: 'workspace_wizard' }))}
          className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Workspace Designer</span>
        </Button>

        {/* New Task Button */}
        <Tooltip position="bottom" content={isViewer ? 'Viewers cannot create tasks' : 'Create Task (Shortcut: C)'}>
          <span>
            <Button
              size="sm"
              disabled={!canCreateTask}
              onClick={() => dispatch(openModal({ name: 'create_task' }))}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </span>
        </Tooltip>

        {/* User Account Menu with Dropdown */}
        <Dropdown
          align="right"
          width="w-60"
          trigger={
            <div
              className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 hover:opacity-85 transition-opacity cursor-pointer select-none"
              title="Account Menu"
            >
              <Avatar
                name={currentUser?.name || 'User'}
                src={currentUser?.avatar}
                size="sm"
                showOnlineStatus
              />
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-[90px] truncate leading-none">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize mt-0.5">
                  {currentUser?.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </div>
          }
          items={[
            {
              id: 'user-profile-header',
              label: (
                <div className="flex items-center gap-2.5 py-1">
                  <Avatar name={currentUser?.name || 'User'} src={currentUser?.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {currentUser?.email}
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          currentUser?.role === 'owner'
                            ? 'indigo'
                            : currentUser?.role === 'admin'
                            ? 'purple'
                            : currentUser?.role === 'member'
                            ? 'default'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {currentUser?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              ),
              disabled: true,
            },
            { id: 'div-user-1', divider: true, label: '' },
            {
              id: 'all-profiles-link',
              label: (
                <div className="flex items-center justify-between w-full">
                  <span>Team Profiles Directory</span>
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
              icon: <Users className="w-4 h-4 text-indigo-500" />,
              onClick: () => dispatch(openModal({ name: 'all_profiles' })),
            },
            {
              id: 'profile-link',
              label: 'View / Edit Profile',
              icon: <UserCheck className="w-4 h-4 text-indigo-500" />,
              onClick: () => dispatch(openModal({ name: 'profile_modal' })),
            },
            {
              id: 'ws-settings-link',
              label: 'Workspace Settings',
              icon: <Settings className="w-4 h-4 text-zinc-500" />,
              onClick: () => dispatch(openModal({ name: 'workspace_settings' })),
            },
            { id: 'div-user-2', divider: true, label: '' },
            {
              id: 'logout-menu-item',
              label: 'Log Out',
              icon: <LogOut className="w-4 h-4 text-rose-500" />,
              danger: true,
              onClick: handleLogout,
            },
          ]}
        />
      </div>
    </header>
  );
}

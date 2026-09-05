'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import {
  setCommandPaletteOpen,
  openModal,
  closeModal,
  showToast,
  toggleTheme,
} from '@/redux/slices/uiSlice';
import { setActiveWorkspace } from '@/redux/slices/workspaceSlice';
import { setActiveProject } from '@/redux/slices/projectSlice';
import { setView } from '@/redux/slices/viewSlice';
import { logout } from '@/redux/slices/authSlice';
import {
  Search,
  CheckSquare,
  Folder,
  Layers,
  Plus,
  Kanban,
  List,
  Calendar,
  Sun,
  Moon,
  ArrowRight,
  Database,
  Download,
  LogOut,
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export function CommandPalette() {
  const dispatch = useAppDispatch();
  const { navigateTo } = useAppNavigation();
  const isOpen = useAppSelector((state) => state.ui.isCommandPaletteOpen);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const projects = useAppSelector((state) => state.projects.projects);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();

    const taskMatches = tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        title: t.title,
        subtitle: `Task · ${t.status.toUpperCase()}`,
        icon: <CheckSquare className="w-4 h-4 text-indigo-500" />,
        action: () => dispatch(openModal({ name: 'task_detail', data: { taskId: t.id } })),
      }));

    const projectMatches = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: `proj-${p.id}`,
        type: 'project' as const,
        title: p.name,
        subtitle: 'Jump to Project',
        icon: <Folder className="w-4 h-4 text-emerald-500" />,
        action: () => {
          dispatch(setActiveWorkspace(p.workspaceId));
          dispatch(setActiveProject(p.id));
        },
      }));

    const workspaceMatches = workspaces
      .filter((w) => w.name.toLowerCase().includes(q))
      .map((w) => ({
        id: `ws-${w.id}`,
        type: 'workspace' as const,
        title: w.name,
        subtitle: 'Switch Workspace',
        icon: <Layers className="w-4 h-4 text-purple-500" />,
        action: () => dispatch(setActiveWorkspace(w.id)),
      }));

    const systemActions = [
      {
        id: 'act-new-task',
        type: 'action' as const,
        title: 'Create New Task',
        subtitle: 'Shortcut: C',
        icon: <Plus className="w-4 h-4 text-indigo-500" />,
        action: () => dispatch(openModal({ name: 'create_task' })),
      },
      {
        id: 'act-kanban',
        type: 'action' as const,
        title: 'Switch to Kanban Board',
        subtitle: 'Shortcut: B',
        icon: <Kanban className="w-4 h-4 text-blue-500" />,
        action: () => navigateTo({ view: 'kanban' }),
      },
      {
        id: 'act-list',
        type: 'action' as const,
        title: 'Switch to List View',
        subtitle: 'Shortcut: L',
        icon: <List className="w-4 h-4 text-cyan-500" />,
        action: () => navigateTo({ view: 'list' }),
      },
      {
        id: 'act-calendar',
        type: 'action' as const,
        title: 'Switch to Calendar View',
        subtitle: 'Shortcut: M',
        icon: <Calendar className="w-4 h-4 text-amber-500" />,
        action: () => navigateTo({ view: 'calendar' }),
      },
      {
        id: 'act-theme',
        type: 'action' as const,
        title: 'Toggle Dark / Light Theme',
        subtitle: 'Appearance setting',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
        action: () => dispatch(toggleTheme()),
      },
      {
        id: 'act-export',
        type: 'action' as const,
        title: 'Export / Import Workspace JSON',
        subtitle: 'Data backup manager',
        icon: <Download className="w-4 h-4 text-emerald-400" />,
        action: () => dispatch(openModal({ name: 'export_import' })),
      },
      {
        id: 'act-logout',
        type: 'action' as const,
        title: 'Log Out / Sign Out',
        subtitle: 'Sign out of current account',
        icon: <LogOut className="w-4 h-4 text-rose-500" />,
        action: () => {
          dispatch(closeModal());
          dispatch(logout());
          dispatch(
            showToast({
              id: generateId('toast'),
              message: 'You have been logged out.',
              type: 'info',
            })
          );
        },
      },
    ].filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        (a.id === 'act-logout' && 'logout signout log out sign out'.includes(q))
    );

    return [...taskMatches, ...projectMatches, ...workspaceMatches, ...systemActions];
  }, [query, tasks, projects, workspaces, dispatch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item) {
        item.action();
        dispatch(setCommandPaletteOpen(false));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) dispatch(setCommandPaletteOpen(false));
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden modal-enter flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, jump to a project, or search tasks..."
            className="w-full bg-transparent border-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No matching tasks, projects, or commands found for &quot;{query}&quot;
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    dispatch(setCommandPaletteOpen(false));
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">
              ↓
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">
              ↵
            </kbd>
          </div>
          <span>Workspace Manager Spotlight</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './useAppRedux';
import { setView } from '@/redux/slices/viewSlice';
import { setActiveWorkspace } from '@/redux/slices/workspaceSlice';
import { setActiveProject } from '@/redux/slices/projectSlice';
import { ViewType } from '@/lib/types';

export const VIEW_TO_PATH: Record<ViewType, string> = {
  overview: '/dashboard',
  hierarchy: '/workspaces',
  kanban: '/kanban',
  list: '/list',
  calendar: '/calendar',
};

export const PATH_TO_VIEW: Record<string, ViewType> = {
  '/dashboard': 'overview',
  '/workspaces': 'hierarchy',
  '/kanban': 'kanban',
  '/list': 'list',
  '/calendar': 'calendar',
};

export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const currentView = useAppSelector((state) => state.views.currentView);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const activeProjectId = useAppSelector((state) => state.projects.activeProjectId);

  // Sync URL (pathname + search params) -> Redux store
  useEffect(() => {
    // 1. Sync Pathname -> View
    const pathView = PATH_TO_VIEW[pathname];
    if (pathView && pathView !== currentView) {
      dispatch(setView(pathView));
    }

    if (!searchParams) return;

    // 2. Fallback query param for view if on root or custom path
    const urlView = searchParams.get('view') as ViewType | null;
    const urlWorkspace = searchParams.get('ws') || searchParams.get('workspace');
    const urlProject = searchParams.get('p') || searchParams.get('project');

    if (
      !pathView &&
      urlView &&
      ['overview', 'hierarchy', 'kanban', 'list', 'calendar'].includes(urlView) &&
      urlView !== currentView
    ) {
      dispatch(setView(urlView));
    }

    if (urlWorkspace && urlWorkspace !== activeWorkspaceId) {
      dispatch(setActiveWorkspace(urlWorkspace));
    }

    if (urlProject && urlProject !== activeProjectId) {
      dispatch(setActiveProject(urlProject));
    }
  }, [pathname, searchParams, currentView, activeWorkspaceId, activeProjectId, dispatch]);

  // Ultra-Smooth Router Navigation Helper
  const navigateTo = useCallback(
    (opts: {
      view?: ViewType;
      workspaceId?: string;
      projectId?: string;
      replace?: boolean;
    }) => {
      const targetView = opts.view ?? currentView;
      const targetWorkspace = opts.workspaceId ?? activeWorkspaceId;
      const targetProject = opts.projectId ?? activeProjectId;

      // Determine clean URL path (e.g. /dashboard, /kanban, /workspaces)
      const targetPath = VIEW_TO_PATH[targetView] || '/dashboard';

      const params = new URLSearchParams();
      if (targetWorkspace) params.set('ws', targetWorkspace);
      if (targetProject && targetView !== 'overview' && targetView !== 'hierarchy') {
        params.set('p', targetProject);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${targetPath}?${queryString}` : targetPath;

      const updateStateAndUrl = () => {
        if (opts.view) dispatch(setView(opts.view));
        if (opts.workspaceId) dispatch(setActiveWorkspace(opts.workspaceId));
        if (opts.projectId) dispatch(setActiveProject(opts.projectId));

        if (opts.replace) {
          router.replace(newUrl, { scroll: false });
        } else {
          router.push(newUrl, { scroll: false });
        }
      };

      // Native browser View Transition API for ultra-smooth fluid animations
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          updateStateAndUrl();
        });
      } else {
        updateStateAndUrl();
      }
    },
    [router, currentView, activeWorkspaceId, activeProjectId, dispatch]
  );

  return {
    navigateTo,
    currentView,
    activeWorkspaceId,
    activeProjectId,
    pathname,
  };
}

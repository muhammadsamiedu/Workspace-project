'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { setOnlineStatus, showToast } from './slices/uiSlice';
import { rehydrateAuth } from './slices/authSlice';
import { mockSocket, SocketEvent } from '@/lib/mockSocket';
import { addComment } from './slices/commentSlice';
import { moveTaskStatus, toggleSubtask } from './slices/taskSlice';
import { addNotification } from './slices/notificationSlice';
import { generateId } from '@/lib/utils';
import { idbManager } from '@/lib/indexedDb';

function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 0. Rehydrate auth state from localStorage (client-only, runs after SSR)
    //    Also clear stale auth from old sessions that didn't have a version stamp.
    const SESSION_VERSION = 'v2';
    const storedVersion = localStorage.getItem('workspace_mgr_session_version');
    if (storedVersion !== SESSION_VERSION) {
      // Old session without proper auth flow — force re-login
      localStorage.removeItem('workspace_mgr_auth_authenticated');
      localStorage.setItem('workspace_mgr_session_version', SESSION_VERSION);
    }
    store.dispatch(rehydrateAuth());

    // 1. Initialize Theme from localStorage (Defaults to aesthetic light theme)
    const THEME_VERSION = 'v-light-aesthetic-v1';
    if (localStorage.getItem('workspace_mgr_theme_migrated') !== THEME_VERSION) {
      localStorage.setItem('workspace_mgr_app_theme', JSON.stringify('light'));
      localStorage.setItem('app_theme', JSON.stringify('light'));
      localStorage.setItem('workspace_mgr_theme_migrated', THEME_VERSION);
      document.documentElement.classList.remove('dark');
    } else {
      const savedTheme = localStorage.getItem('workspace_mgr_app_theme') || localStorage.getItem('app_theme');
      const isDark = savedTheme ? JSON.parse(savedTheme) === 'dark' : false;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // 2. Setup online/offline listeners
    const handleOnline = () => store.dispatch(setOnlineStatus(true));
    const handleOffline = () => store.dispatch(setOnlineStatus(false));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Backup active state to IndexedDB periodically
    const idbSyncInterval = setInterval(async () => {
      const state = store.getState();
      try {
        await idbManager.saveItems('workspaces', state.workspaces.workspaces);
        await idbManager.saveItems('projects', state.projects.projects);
        await idbManager.saveItems('tasks', state.tasks.tasks);
        await idbManager.saveItems('comments', state.comments.comments);
        await idbManager.saveItems('activity', state.activity.activities);
        await idbManager.saveItems('notifications', state.notifications.notifications);
      } catch (e) {
        console.warn('Background IndexedDB sync error:', e);
      }
    }, 15000);

    // 4. Connect simulated mock socket for live collaborator events
    const unsubscribeSocket = mockSocket.subscribe((event: SocketEvent) => {
      const state = store.getState();
      if (!state.ui.liveSimulationActive) return;

      if (event.type === 'COMMENT_ADDED') {
        store.dispatch(
          addComment({
            id: event.payload.commentId,
            taskId: event.payload.taskId,
            userId: 'user-2', // Sarah Chen
            content: event.payload.content,
            createdAt: new Date().toISOString(),
          })
        );
        store.dispatch(
          showToast({
            id: generateId('toast'),
            message: `${event.payload.authorName} commented on "${event.payload.taskTitle}"`,
            type: 'info',
          })
        );
      } else if (event.type === 'TASK_MOVED') {
        store.dispatch(
          moveTaskStatus({
            taskId: event.payload.taskId,
            newStatus: event.payload.toStatus,
          })
        );
        store.dispatch(
          showToast({
            id: generateId('toast'),
            message: `${event.payload.actorName} moved "${event.payload.taskTitle}" to ${event.payload.toStatus}`,
            type: 'info',
          })
        );
      } else if (event.type === 'SUBTASK_COMPLETED') {
        store.dispatch(
          toggleSubtask({
            taskId: event.payload.taskId,
            subtaskId: event.payload.subtaskId,
          })
        );
      } else if (event.type === 'TEAM_NOTIFICATION') {
        store.dispatch(
          addNotification({
            id: generateId('notif'),
            userId: state.auth.currentUser.id,
            type: event.payload.type,
            title: event.payload.title,
            message: event.payload.message,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );
      }
    });

    mockSocket.start(45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(idbSyncInterval);
      unsubscribeSocket();
      mockSocket.stop();
    };
  }, []);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}

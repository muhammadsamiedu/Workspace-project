import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppRedux';
import { setSyncing, showToast } from '@/redux/slices/uiSlice';
import { generateId } from '@/lib/utils';
import { idbManager } from '@/lib/indexedDb';

export function useOnlineStatus() {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector((state) => state.ui.isOnline);
  const isSyncing = useAppSelector((state) => state.ui.isSyncing);

  const triggerSync = useCallback(async () => {
    dispatch(setSyncing(true));
    try {
      // Simulate reconciling local offline changes with remote server
      await new Promise((resolve) => setTimeout(resolve, 800));
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Workspace data synchronized successfully with cloud',
          type: 'success',
        })
      );
    } catch (err) {
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Failed to sync offline changes',
          type: 'error',
        })
      );
    } finally {
      dispatch(setSyncing(false));
    }
  }, [dispatch]);

  return {
    isOnline,
    isSyncing,
    triggerSync,
  };
}

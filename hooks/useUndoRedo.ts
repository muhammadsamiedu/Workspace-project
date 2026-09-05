import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppRedux';
import { popPast, popFuture } from '@/redux/slices/historySlice';
import { updateTask, addTask, deleteTask, moveTaskStatus } from '@/redux/slices/taskSlice';
import { showToast } from '@/redux/slices/uiSlice';
import { generateId } from '@/lib/utils';

export function useUndoRedo() {
  const dispatch = useAppDispatch();
  const past = useAppSelector((state) => state.history.past);
  const future = useAppSelector((state) => state.history.future);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const entry = past[past.length - 1];
    dispatch(popPast());

    if (entry.actionType === 'task_delete') {
      // Undo delete = restore task
      dispatch(addTask(entry.undoData));
      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Restored task: "${entry.undoData.title}"`,
          type: 'success',
        })
      );
    } else if (entry.actionType === 'task_move') {
      // Undo move = revert status
      dispatch(
        moveTaskStatus({
          taskId: entry.undoData.taskId,
          newStatus: entry.undoData.previousStatus,
          newOrder: entry.undoData.previousOrder,
        })
      );
      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Reverted task movement`,
          type: 'info',
        })
      );
    } else if (entry.actionType === 'task_update') {
      dispatch(updateTask(entry.undoData));
      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Reverted task edits`,
          type: 'info',
        })
      );
    } else if (entry.actionType === 'task_create') {
      dispatch(deleteTask(entry.undoData.taskId));
      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Reverted task creation`,
          type: 'info',
        })
      );
    }
  }, [dispatch, past]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const entry = future[future.length - 1];
    dispatch(popFuture());

    if (entry.actionType === 'task_delete') {
      dispatch(deleteTask(entry.redoData.taskId));
    } else if (entry.actionType === 'task_move') {
      dispatch(
        moveTaskStatus({
          taskId: entry.redoData.taskId,
          newStatus: entry.redoData.newStatus,
          newOrder: entry.redoData.newOrder,
        })
      );
    } else if (entry.actionType === 'task_update') {
      dispatch(updateTask(entry.redoData));
    } else if (entry.actionType === 'task_create') {
      dispatch(addTask(entry.redoData));
    }

    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Redone: ${entry.description}`,
        type: 'info',
      })
    );
  }, [dispatch, future]);

  return {
    canUndo,
    canRedo,
    undo: handleUndo,
    redo: handleRedo,
  };
}

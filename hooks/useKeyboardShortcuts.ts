import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppRedux';
import { setCommandPaletteOpen, setShortcutsOpen, openModal, closeModal } from '@/redux/slices/uiSlice';
import { setView } from '@/redux/slices/viewSlice';
import { useUndoRedo } from './useUndoRedo';

export function useKeyboardShortcuts() {
  const dispatch = useAppDispatch();
  const { undo, redo } = useUndoRedo();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const isCommandPaletteOpen = useAppSelector((state) => state.ui.isCommandPaletteOpen);
  const isShortcutsOpen = useAppSelector((state) => state.ui.isShortcutsOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut triggers when actively typing inside an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K (Command Palette) - Works anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!isCommandPaletteOpen));
        return;
      }

      // Ctrl+Z (Undo) and Ctrl+Shift+Z / Ctrl+Y (Redo)
      if ((e.metaKey || e.ctrlKey) && !isInput) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Escape key to dismiss modals/palette
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          dispatch(setCommandPaletteOpen(false));
          return;
        }
        if (isShortcutsOpen) {
          dispatch(setShortcutsOpen(false));
          return;
        }
        if (activeModal) {
          dispatch(closeModal());
          return;
        }
      }

      // Single-key shortcuts (only if NOT typing in an input)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            dispatch(openModal({ name: 'create_task' }));
            break;
          case 'b':
            e.preventDefault();
            dispatch(setView('kanban'));
            break;
          case 'l':
            e.preventDefault();
            dispatch(setView('list'));
            break;
          case 'm':
            e.preventDefault();
            dispatch(setView('calendar'));
            break;
          case '?':
            e.preventDefault();
            dispatch(setShortcutsOpen(!isShortcutsOpen));
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isCommandPaletteOpen, isShortcutsOpen, activeModal, undo, redo]);
}

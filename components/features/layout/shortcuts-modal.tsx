'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { setShortcutsOpen } from '@/redux/slices/uiSlice';
import { Modal } from '@/components/ui/modal';

export function ShortcutsModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isShortcutsOpen);

  const shortcutGroups = [
    {
      title: 'General & Navigation',
      shortcuts: [
        { key: '⌘K / Ctrl+K', desc: 'Open Command Palette' },
        { key: '?', desc: 'Toggle keyboard shortcuts help' },
        { key: 'Esc', desc: 'Dismiss active dialog, popover, or palette' },
      ],
    },
    {
      title: 'Views & Switching',
      shortcuts: [
        { key: 'B', desc: 'Switch to Kanban Board view' },
        { key: 'L', desc: 'Switch to List / Table view' },
        { key: 'M', desc: 'Switch to Calendar month view' },
      ],
    },
    {
      title: 'Task Actions',
      shortcuts: [
        { key: 'C', desc: 'Create new task' },
        { key: 'Ctrl+Z', desc: 'Undo last task update or deletion' },
        { key: 'Ctrl+Y / Ctrl+Shift+Z', desc: 'Redo undone action' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(setShortcutsOpen(false))}
      title="Keyboard Shortcuts"
      description="Navigate Workspace Manager with speed"
      size="md"
    >
      <div className="space-y-4">
        {shortcutGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.title}
            </h4>
            <div className="space-y-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-2.5 border border-zinc-200/60 dark:border-zinc-700/60">
              {group.shortcuts.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-center justify-between text-xs py-1 px-1.5"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">{s.desc}</span>
                  <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

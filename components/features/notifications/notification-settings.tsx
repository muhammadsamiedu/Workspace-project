'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { updatePreferences } from '@/redux/slices/notificationSlice';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { generateId } from '@/lib/utils';
import { Bell, User, MessageSquare, Clock, Shield } from 'lucide-react';

export function NotificationSettings() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const preferences = useAppSelector((state) => state.notifications.preferences);

  const isOpen = activeModal === 'notification_settings';
  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof preferences) => {
    dispatch(updatePreferences({ [key]: !preferences[key] }));
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'Notification preference saved',
        type: 'info',
      })
    );
  };

  const prefItems: { key: keyof typeof preferences; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'assigned',
      title: 'Task Assignments',
      desc: 'Notify when a teammate assigns a task to you',
      icon: <User className="w-4 h-4 text-indigo-500" />,
    },
    {
      key: 'mentioned',
      title: '@Mentions',
      desc: 'Notify when someone mentions you in a comment',
      icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
    },
    {
      key: 'dueSoon',
      title: 'Due Date Alerts',
      desc: 'Remind when tasks are due soon or overdue',
      icon: <Clock className="w-4 h-4 text-amber-500" />,
    },
    {
      key: 'system',
      title: 'System & Collaborator Activity',
      desc: 'Real-time updates when team members make changes',
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Notification Preferences"
      description="Choose which notifications you receive in-app"
      size="sm"
    >
      <div className="space-y-3 select-none">
        {prefItems.map((item) => {
          const isChecked = preferences[item.key];
          return (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <span className="shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-snug">{item.desc}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(item.key)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer shrink-0"
              />
            </div>
          );
        })}

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <Button size="sm" onClick={() => dispatch(closeModal())}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

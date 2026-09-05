'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { createWorkspace, updateWorkspace } from '@/redux/slices/workspaceSlice';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateId } from '@/lib/utils';
import { Workspace, ViewType } from '@/lib/types';

import { AVAILABLE_SVG_ICONS } from '@/components/ui/icon-renderer';

export function WorkspaceModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const modalData = useAppSelector((state) => state.ui.modalData);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const isEdit = activeModal === 'edit_workspace';
  const isOpen = activeModal === 'create_workspace' || isEdit;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('zap');
  const [color, setColor] = useState('#6366f1');
  const [defaultView, setDefaultView] = useState<ViewType>('kanban');

  const colorOptions = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    if (isEdit && modalData) {
      setName(modalData.name || '');
      setSlug(modalData.slug || '');
      setIcon(modalData.icon || 'zap');
      setColor(modalData.color || '#6366f1');
      setDefaultView(modalData.defaultView || 'kanban');
    } else {
      setName('');
      setSlug('');
      setIcon('zap');
      setColor('#6366f1');
      setDefaultView('kanban');
    }
  }, [isEdit, modalData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && modalData) {
      dispatch(
        updateWorkspace({
          id: modalData.id,
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
          icon,
          color,
          defaultView,
        })
      );
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Workspace updated successfully',
          type: 'success',
        })
      );
    } else {
      const newWs: Workspace = {
        id: generateId('ws'),
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        icon,
        color,
        defaultView,
        members: [
          {
            userId: currentUser.id,
            role: 'owner',
            joinedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };
      dispatch(createWorkspace(newWs));
      dispatch(
        showToast({
          id: generateId('toast'),
          message: `Created workspace "${name}"`,
          type: 'success',
        })
      );
    }
    dispatch(closeModal());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title={isEdit ? 'Edit Workspace' : 'Create New Workspace'}
      description={
        isEdit
          ? 'Update your team workspace details'
          : 'Create a dedicated space for your team, projects, and tasks'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Workspace Name
          </label>
          <Input
            placeholder="e.g. Acme Corp Platform"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Workspace Slug
          </label>
          <Input
            placeholder="e.g. acme-platform"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Workspace Icon (SVG)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVAILABLE_SVG_ICONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => setIcon(key)}
                className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  icon === key
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 scale-105 shadow-xs ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Brand Color
          </label>
          <div className="flex items-center gap-2.5">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'ring-3 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Default View
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['kanban', 'list', 'calendar'] as ViewType[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDefaultView(v)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border capitalize transition-colors cursor-pointer ${
                  defaultView === v
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={() => dispatch(closeModal())}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Save Changes' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal } from '@/redux/slices/uiSlice';
import { Modal } from '@/components/ui/modal';
import { ActivityFeed } from './activity-feed';

export function ActivityDrawer() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);

  const isOpen = activeModal === 'activity_feed';
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Workspace Activity Feed"
      description="Live audit trail of task creations, movements, comments, and project edits"
      size="md"
    >
      <ActivityFeed workspaceId={activeWorkspaceId} />
    </Modal>
  );
}

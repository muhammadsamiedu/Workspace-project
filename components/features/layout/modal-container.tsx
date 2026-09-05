'use client';

import React from 'react';
import { WorkspaceModal } from '../workspaces/workspace-modal';
import { WorkspaceWizardModal } from '../workspaces/workspace-wizard-modal';
import { WorkspaceSettings } from '../workspaces/workspace-settings';
import { InviteMemberModal } from '../workspaces/invite-member-modal';
import { AllTasksModal } from '../workspaces/all-tasks-modal';
import { ProjectModal } from '../projects/project-modal';
import { TaskModal } from '../tasks/task-modal';
import { TaskFormModal } from '../tasks/task-form-modal';
import { ShortcutsModal } from './shortcuts-modal';
import { CommandPalette } from './command-palette';
import { ToastContainer } from '@/components/ui/toast';
import { BulkActionsBar } from '../tasks/bulk-actions-bar';
import { ProfileModal } from '../auth/profile-modal';
import { AllProfilesModal } from '../auth/all-profiles-modal';
import { NotificationSettings } from '../notifications/notification-settings';
import { ExportImportModal } from '../settings/export-import-modal';
import { ActivityDrawer } from '../collaboration/activity-drawer';

export function ModalContainer() {
  return (
    <>
      <WorkspaceWizardModal />
      <WorkspaceModal />
      <WorkspaceSettings />
      <InviteMemberModal />
      <AllTasksModal />
      <ProjectModal />
      <TaskModal />
      <TaskFormModal />
      <ShortcutsModal />
      <CommandPalette />
      <ToastContainer />
      <BulkActionsBar />
      <ProfileModal />
      <AllProfilesModal />
      <NotificationSettings />
      <ExportImportModal />
      <ActivityDrawer />
    </>
  );
}

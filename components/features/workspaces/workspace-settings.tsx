'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, openModal, showToast } from '@/redux/slices/uiSlice';
import {
  deleteWorkspace,
  updateMemberRole,
  removeMember,
} from '@/redux/slices/workspaceSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserPlus, Trash2, ShieldAlert, Edit } from 'lucide-react';
import { Role } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

export function WorkspaceSettings() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const { isOwner, isAdmin, canManageMembers, canDeleteWorkspace } = usePermissions();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isOpen = activeModal === 'workspace_settings';

  if (!isOpen || !currentWorkspace) return null;

  const handleDeleteWorkspace = () => {
    if (!isOwner) {
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Access Denied: Only the workspace Owner can delete this workspace.',
          type: 'error',
        })
      );
      return;
    }
    dispatch(deleteWorkspace(currentWorkspace.id));
    dispatch(closeModal());
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Workspace "${currentWorkspace.name}" was permanently deleted.`,
        type: 'info',
      })
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => dispatch(closeModal())}
        title="Workspace Settings"
        description="Manage workspace preferences, team members, and permissions"
        size="lg"
      >
        <div className="space-y-6">
          {/* General Info Card */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: currentWorkspace.color }}
              >
                <IconRenderer icon={currentWorkspace.icon} className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {currentWorkspace.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  /{currentWorkspace.slug} · Default View: {currentWorkspace.defaultView}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => dispatch(openModal({ name: 'edit_workspace', data: currentWorkspace }))}
            >
              Edit Details
            </Button>
          </div>

          {/* Members Management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Workspace Members ({currentWorkspace.members.length})
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage team access and role permissions
                </p>
              </div>

              <Button
                size="xs"
                disabled={!canManageMembers}
                onClick={() => dispatch(openModal({ name: 'invite_member' }))}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Invite Member
              </Button>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              {currentWorkspace.members.map((member) => {
                const user = users.find((u) => u.id === member.userId);
                if (!user) return null;

                const isMe = user.id === currentUser.id;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} src={user.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {user.name}
                          </span>
                          {isMe && (
                            <Badge variant="indigo" size="sm">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role Selector */}
                      {canManageMembers && !isMe ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            dispatch(
                              updateMemberRole({
                                workspaceId: currentWorkspace.id,
                                userId: member.userId,
                                role: e.target.value as Role,
                              })
                            )
                          }
                          className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <Badge
                          variant={
                            member.role === 'owner'
                              ? 'indigo'
                              : member.role === 'admin'
                              ? 'purple'
                              : member.role === 'member'
                              ? 'default'
                              : 'rose'
                          }
                          size="sm"
                        >
                          {member.role}
                        </Badge>
                      )}

                      {canManageMembers && !isMe && (
                        <button
                          onClick={() =>
                            dispatch(
                              removeMember({
                                workspaceId: currentWorkspace.id,
                                userId: member.userId,
                              })
                            )
                          }
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-rose-200 dark:border-rose-950/60">
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Danger Zone
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Permanently delete this workspace along with all its projects, tasks, comments, and member associations.
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  disabled={!canDeleteWorkspace}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete Workspace
                </Button>
              </div>
              {!isOwner && (
                <p className="text-[11px] text-zinc-400 mt-2 italic">
                  * Only the workspace Owner can delete this workspace.
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace?"
        message={`Are you sure you want to delete "${currentWorkspace.name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
      />
    </>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { addMember } from '@/redux/slices/workspaceSlice';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Role } from '@/lib/types';
import { generateId } from '@/lib/utils';

export function InviteMemberModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);
  const users = useAppSelector((state) => state.auth.users);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isOpen = activeModal === 'invite_member';

  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<Role>('member');

  if (!isOpen || !currentWorkspace) return null;

  const currentMemberIds = currentWorkspace.members.map((m) => m.userId);
  const nonMembers = users.filter((u) => !currentMemberIds.includes(u.id));

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    dispatch(
      addMember({
        workspaceId: currentWorkspace.id,
        userId: selectedUserId,
        role,
      })
    );

    const invitedUser = users.find((u) => u.id === selectedUserId);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Added ${invitedUser?.name || 'User'} to workspace as ${role}`,
        type: 'success',
      })
    );
    dispatch(closeModal());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Invite Team Member"
      description={`Add a team member to "${currentWorkspace.name}"`}
      size="sm"
    >
      <form onSubmit={handleInvite} className="space-y-4">
        {nonMembers.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            All registered mock users are already members of this workspace!
          </p>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Select Team Member
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nonMembers.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Role Permission
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="member">Member (Can edit tasks, comments, attachments)</option>
                <option value="admin">Admin (Can manage projects, columns, and members)</option>
                <option value="viewer">Viewer (Read-only access)</option>
              </select>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={() => dispatch(closeModal())}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedUserId}>
            Add to Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}

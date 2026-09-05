import { useAppSelector } from './useAppRedux';
import { ROLE_PERMISSIONS_MATRIX, RolePermissions } from '@/redux/slices/roleSlice';
import { Role } from '@/lib/types';

export function usePermissions(): RolePermissions & {
  currentRole: Role;
  isViewer: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  canInviteMembers: boolean;
  canManageRoles: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  canViewAllProfiles: boolean;
  canViewAllTasks: boolean;
  canViewAllWorkspaces: boolean;
} {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceMember = activeWorkspace?.members.find((m) => m.userId === currentUser?.id);

  // Effective role:
  // If global currentUser is 'owner', always 'owner'.
  // Otherwise, use member's role in active workspace if specified, falling back to currentUser.role or 'member'.
  const currentRole: Role =
    currentUser?.role === 'owner'
      ? 'owner'
      : (workspaceMember?.role || currentUser?.role || 'member');

  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'admin';
  const isMember = currentRole === 'member';
  const isViewer = currentRole === 'viewer';

  const basePermissions = ROLE_PERMISSIONS_MATRIX[currentRole] || ROLE_PERMISSIONS_MATRIX.member;

  return {
    ...basePermissions,
    currentRole,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    // Owner and Admin can view all profiles and inspector directory
    canViewAllProfiles: isOwner || isAdmin,
    // Owner and Admin can view all tasks; Member only sees own tasks
    canViewAllTasks: isOwner || isAdmin,
    // Owner and Admin can view all workspaces; Member only sees own workspace(s)
    canViewAllWorkspaces: isOwner || isAdmin,
    canInviteMembers: isOwner || isAdmin,
    canManageRoles: isOwner,
    canExportData: isOwner || isAdmin,
    canViewAnalytics: true,
  };
}

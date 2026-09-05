import { createSlice } from '@reduxjs/toolkit';
import { Role } from '@/lib/types';

export interface RolePermissions {
  canCreateWorkspace: boolean;
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canManageMembers: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canManageColumns: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canMoveTask: boolean;
  canComment: boolean;
  canAttachFiles: boolean;
}

export const ROLE_PERMISSIONS_MATRIX: Record<Role, RolePermissions> = {
  owner: {
    canCreateWorkspace: true,
    canEditWorkspace: true,
    canDeleteWorkspace: true,
    canManageMembers: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canManageColumns: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canMoveTask: true,
    canComment: true,
    canAttachFiles: true,
  },
  admin: {
    canCreateWorkspace: true,
    canEditWorkspace: true,
    canDeleteWorkspace: false,
    canManageMembers: true,
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    canManageColumns: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canMoveTask: true,
    canComment: true,
    canAttachFiles: true,
  },
  member: {
    canCreateWorkspace: false,
    canEditWorkspace: false,
    canDeleteWorkspace: false,
    canManageMembers: false,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canManageColumns: false,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canMoveTask: true,
    canComment: true,
    canAttachFiles: true,
  },
  viewer: {
    canCreateWorkspace: false,
    canEditWorkspace: false,
    canDeleteWorkspace: false,
    canManageMembers: false,
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canManageColumns: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canMoveTask: false,
    canComment: false,
    canAttachFiles: false,
  },
};

interface RoleState {
  matrix: typeof ROLE_PERMISSIONS_MATRIX;
}

const initialState: RoleState = {
  matrix: ROLE_PERMISSIONS_MATRIX,
};

export const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
});

export default roleSlice.reducer;

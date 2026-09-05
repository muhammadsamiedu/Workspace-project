import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workspace, Role } from '@/lib/types';
import { INITIAL_WORKSPACES } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

const savedWorkspaces = getFromLocalStorage<Workspace[]>('workspaces', INITIAL_WORKSPACES);
const savedActiveId = getFromLocalStorage<string>('active_workspace_id', savedWorkspaces[0]?.id || 'ws-1');

const initialState: WorkspaceState = {
  workspaces: savedWorkspaces,
  activeWorkspaceId: savedActiveId,
};

export const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.activeWorkspaceId = action.payload;
      saveToLocalStorage('active_workspace_id', action.payload);
    },
    createWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload);
      state.activeWorkspaceId = action.payload.id;
      saveToLocalStorage('workspaces', state.workspaces);
      saveToLocalStorage('active_workspace_id', action.payload.id);
    },
    updateWorkspace: (state, action: PayloadAction<Partial<Workspace> & { id: string }>) => {
      const idx = state.workspaces.findIndex((w) => w.id === action.payload.id);
      if (idx !== -1) {
        state.workspaces[idx] = { ...state.workspaces[idx], ...action.payload };
        saveToLocalStorage('workspaces', state.workspaces);
      }
    },
    deleteWorkspace: (state, action: PayloadAction<string>) => {
      state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
      if (state.activeWorkspaceId === action.payload) {
        state.activeWorkspaceId = state.workspaces[0]?.id || '';
        saveToLocalStorage('active_workspace_id', state.activeWorkspaceId);
      }
      saveToLocalStorage('workspaces', state.workspaces);
    },
    addMember: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string; role: Role }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws) {
        const existing = ws.members.find((m) => m.userId === action.payload.userId);
        if (!existing) {
          ws.members.push({
            userId: action.payload.userId,
            role: action.payload.role,
            joinedAt: new Date().toISOString(),
          });
          saveToLocalStorage('workspaces', state.workspaces);
        }
      }
    },
    updateMemberRole: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string; role: Role }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws) {
        const member = ws.members.find((m) => m.userId === action.payload.userId);
        if (member) {
          member.role = action.payload.role;
          saveToLocalStorage('workspaces', state.workspaces);
        }
      }
    },
    removeMember: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string }>
    ) => {
      const ws = state.workspaces.find((w) => w.id === action.payload.workspaceId);
      if (ws) {
        ws.members = ws.members.filter((m) => m.userId !== action.payload.userId);
        saveToLocalStorage('workspaces', state.workspaces);
      }
    },
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload;
      if (!state.workspaces.some((w) => w.id === state.activeWorkspaceId)) {
        state.activeWorkspaceId = state.workspaces[0]?.id || '';
      }
      saveToLocalStorage('workspaces', state.workspaces);
      saveToLocalStorage('active_workspace_id', state.activeWorkspaceId);
    },
  },
});

export const {
  setActiveWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
  setWorkspaces,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;

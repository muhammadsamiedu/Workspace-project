import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectColumn } from '@/lib/types';
import { INITIAL_PROJECTS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface ProjectState {
  projects: Project[];
  activeProjectId: string;
}

const savedProjects = getFromLocalStorage<Project[]>('projects', INITIAL_PROJECTS);
const savedActiveId = getFromLocalStorage<string>('active_project_id', savedProjects[0]?.id || 'proj-1');

const initialState: ProjectState = {
  projects: savedProjects,
  activeProjectId: savedActiveId,
};

export const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setActiveProject: (state, action: PayloadAction<string>) => {
      state.activeProjectId = action.payload;
      saveToLocalStorage('active_project_id', action.payload);
    },
    createProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload);
      state.activeProjectId = action.payload.id;
      saveToLocalStorage('projects', state.projects);
      saveToLocalStorage('active_project_id', action.payload.id);
    },
    addMultipleProjects: (state, action: PayloadAction<{ projects: Project[]; activeId?: string }>) => {
      state.projects.push(...action.payload.projects);
      if (action.payload.activeId) {
        state.activeProjectId = action.payload.activeId;
        saveToLocalStorage('active_project_id', action.payload.activeId);
      }
      saveToLocalStorage('projects', state.projects);
    },
    updateProject: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
      const idx = state.projects.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.projects[idx] = {
          ...state.projects[idx],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        saveToLocalStorage('projects', state.projects);
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = state.projects[0]?.id || '';
        saveToLocalStorage('active_project_id', state.activeProjectId);
      }
      saveToLocalStorage('projects', state.projects);
    },
    archiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find((p) => p.id === action.payload);
      if (project) {
        project.status = project.status === 'active' ? 'archived' : 'active';
        saveToLocalStorage('projects', state.projects);
      }
    },
    addColumn: (
      state,
      action: PayloadAction<{ projectId: string; column: ProjectColumn }>
    ) => {
      const project = state.projects.find((p) => p.id === action.payload.projectId);
      if (project) {
        project.columns.push(action.payload.column);
        saveToLocalStorage('projects', state.projects);
      }
    },
    reorderColumns: (
      state,
      action: PayloadAction<{ projectId: string; columns: ProjectColumn[] }>
    ) => {
      const project = state.projects.find((p) => p.id === action.payload.projectId);
      if (project) {
        project.columns = action.payload.columns;
        saveToLocalStorage('projects', state.projects);
      }
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
      if (!state.projects.some((p) => p.id === state.activeProjectId)) {
        state.activeProjectId = state.projects[0]?.id || '';
      }
      saveToLocalStorage('projects', state.projects);
      saveToLocalStorage('active_project_id', state.activeProjectId);
    },
  },
});

export const {
  setActiveProject,
  createProject,
  addMultipleProjects,
  updateProject,
  deleteProject,
  archiveProject,
  addColumn,
  reorderColumns,
  setProjects,
} = projectSlice.actions;

export default projectSlice.reducer;

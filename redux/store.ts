import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import projectReducer from './slices/projectSlice';
import taskReducer from './slices/taskSlice';
import viewReducer from './slices/viewSlice';
import filterReducer from './slices/filterSlice';
import roleReducer from './slices/roleSlice';
import activityReducer from './slices/activitySlice';
import commentReducer from './slices/commentSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspaces: workspaceReducer,
    projects: projectReducer,
    tasks: taskReducer,
    views: viewReducer,
    filters: filterReducer,
    roles: roleReducer,
    activity: activityReducer,
    comments: commentReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    history: historyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

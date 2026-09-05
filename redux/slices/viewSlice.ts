import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewType, GroupBy } from '@/lib/types';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface ViewState {
  currentView: ViewType;
  groupBy: GroupBy;
  projectPreferences: Record<string, { view: ViewType; groupBy: GroupBy }>;
}

const savedPreferences = getFromLocalStorage<Record<string, { view: ViewType; groupBy: GroupBy }>>(
  'view_preferences',
  {}
);
const savedCurrentView = getFromLocalStorage<ViewType>('current_view', 'kanban');
const savedGroupBy = getFromLocalStorage<GroupBy>('group_by', 'none');

const initialState: ViewState = {
  currentView: savedCurrentView,
  groupBy: savedGroupBy,
  projectPreferences: savedPreferences,
};

export const viewSlice = createSlice({
  name: 'views',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<ViewType>) => {
      state.currentView = action.payload;
      saveToLocalStorage('current_view', action.payload);
    },
    setGroupBy: (state, action: PayloadAction<GroupBy>) => {
      state.groupBy = action.payload;
      saveToLocalStorage('group_by', action.payload);
    },
    saveProjectPreference: (
      state,
      action: PayloadAction<{ projectId: string; view: ViewType; groupBy: GroupBy }>
    ) => {
      state.projectPreferences[action.payload.projectId] = {
        view: action.payload.view,
        groupBy: action.payload.groupBy,
      };
      saveToLocalStorage('view_preferences', state.projectPreferences);
    },
    loadProjectPreference: (state, action: PayloadAction<string>) => {
      const pref = state.projectPreferences[action.payload];
      if (pref) {
        state.currentView = pref.view;
        state.groupBy = pref.groupBy;
      }
    },
  },
});

export const { setView, setGroupBy, saveProjectPreference, loadProjectPreference } = viewSlice.actions;
export default viewSlice.reducer;

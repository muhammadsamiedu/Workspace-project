import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLogItem } from '@/lib/types';
import { INITIAL_ACTIVITY } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface ActivityState {
  activities: ActivityLogItem[];
}

const savedActivity = getFromLocalStorage<ActivityLogItem[]>('activities', INITIAL_ACTIVITY);

const initialState: ActivityState = {
  activities: savedActivity,
};

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    logActivity: (state, action: PayloadAction<ActivityLogItem>) => {
      state.activities.unshift(action.payload);
      // Keep max 200 items in memory
      if (state.activities.length > 200) {
        state.activities = state.activities.slice(0, 200);
      }
      saveToLocalStorage('activities', state.activities);
    },
    clearActivity: (state) => {
      state.activities = [];
      saveToLocalStorage('activities', state.activities);
    },
    setActivities: (state, action: PayloadAction<ActivityLogItem[]>) => {
      state.activities = action.payload;
      saveToLocalStorage('activities', state.activities);
    },
  },
});

export const { logActivity, clearActivity, setActivities } = activitySlice.actions;
export default activitySlice.reducer;

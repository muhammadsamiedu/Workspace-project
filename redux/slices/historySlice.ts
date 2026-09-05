import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HistoryEntry } from '@/lib/types';

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const initialState: HistoryState = {
  past: [],
  future: [],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushHistory: (state, action: PayloadAction<HistoryEntry>) => {
      state.past.push(action.payload);
      // Keep last 30 history states
      if (state.past.length > 30) {
        state.past.shift();
      }
      state.future = [];
    },
    popPast: (state) => {
      const entry = state.past.pop();
      if (entry) {
        state.future.push(entry);
      }
    },
    popFuture: (state) => {
      const entry = state.future.pop();
      if (entry) {
        state.past.push(entry);
      }
    },
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
    },
  },
});

export const { pushHistory, popPast, popFuture, clearHistory } = historySlice.actions;
export default historySlice.reducer;

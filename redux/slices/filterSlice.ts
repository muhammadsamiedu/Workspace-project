import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState, FilterPreset, TaskPriority } from '@/lib/types';
import { DEFAULT_FILTER_PRESETS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface FilterSliceState {
  filters: FilterState;
  presets: FilterPreset[];
  activePresetId: string;
}

const defaultFilters: FilterState = {
  search: '',
  assigneeId: null,
  status: [],
  priority: [],
  tags: [],
  dueDateRange: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const savedPresets = getFromLocalStorage<FilterPreset[]>('filter_presets', DEFAULT_FILTER_PRESETS);

const initialState: FilterSliceState = {
  filters: defaultFilters,
  presets: savedPresets,
  activePresetId: 'preset-all',
};

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setAssigneeFilter: (state, action: PayloadAction<string | null>) => {
      state.filters.assigneeId = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.status = action.payload;
    },
    toggleStatusFilter: (state, action: PayloadAction<string>) => {
      if (state.filters.status.includes(action.payload)) {
        state.filters.status = state.filters.status.filter((s) => s !== action.payload);
      } else {
        state.filters.status.push(action.payload);
      }
    },
    setPriorityFilter: (state, action: PayloadAction<TaskPriority[]>) => {
      state.filters.priority = action.payload;
    },
    togglePriorityFilter: (state, action: PayloadAction<TaskPriority>) => {
      if (state.filters.priority.includes(action.payload)) {
        state.filters.priority = state.filters.priority.filter((p) => p !== action.payload);
      } else {
        state.filters.priority.push(action.payload);
      }
    },
    setTagFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.tags = action.payload;
    },
    toggleTagFilter: (state, action: PayloadAction<string>) => {
      if (state.filters.tags.includes(action.payload)) {
        state.filters.tags = state.filters.tags.filter((t) => t !== action.payload);
      } else {
        state.filters.tags.push(action.payload);
      }
    },
    setDueDateRange: (
      state,
      action: PayloadAction<'all' | 'overdue' | 'today' | 'this_week' | 'no_date'>
    ) => {
      state.filters.dueDateRange = action.payload;
    },
    setSorting: (
      state,
      action: PayloadAction<{ sortBy: FilterState['sortBy']; sortOrder: 'asc' | 'desc' }>
    ) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },
    resetFilters: (state) => {
      state.filters = { ...defaultFilters };
      state.activePresetId = 'preset-all';
    },
    applyPreset: (state, action: PayloadAction<string>) => {
      const preset = state.presets.find((p) => p.id === action.payload);
      if (preset) {
        state.activePresetId = preset.id;
        state.filters = {
          ...defaultFilters,
          ...preset.filters,
        };
      }
    },
    saveCustomPreset: (state, action: PayloadAction<FilterPreset>) => {
      state.presets.push(action.payload);
      state.activePresetId = action.payload.id;
      saveToLocalStorage('filter_presets', state.presets);
    },
    deleteCustomPreset: (state, action: PayloadAction<string>) => {
      state.presets = state.presets.filter((p) => p.id !== action.payload);
      if (state.activePresetId === action.payload) {
        state.activePresetId = 'preset-all';
        state.filters = { ...defaultFilters };
      }
      saveToLocalStorage('filter_presets', state.presets);
    },
  },
});

export const {
  setSearch,
  setAssigneeFilter,
  setStatusFilter,
  toggleStatusFilter,
  setPriorityFilter,
  togglePriorityFilter,
  setTagFilter,
  toggleTagFilter,
  setDueDateRange,
  setSorting,
  resetFilters,
  applyPreset,
  saveCustomPreset,
  deleteCustomPreset,
} = filterSlice.actions;

export default filterSlice.reducer;

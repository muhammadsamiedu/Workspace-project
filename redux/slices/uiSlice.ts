import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

export interface ToastAction {
  label: string;
  actionType: 'undo' | 'custom';
  payload?: any;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: ToastAction;
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark';
  isOnline: boolean;
  isSyncing: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsOpen: boolean;
  activeModal: string | null;
  modalData: any;
  toast: ToastMessage | null;
  liveSimulationActive: boolean;
}

const savedTheme = getFromLocalStorage<'light' | 'dark'>('app_theme', 'light');
const savedSidebarCollapsed = getFromLocalStorage<boolean>('sidebar_collapsed', false);

const initialState: UIState = {
  sidebarCollapsed: savedSidebarCollapsed,
  mobileSidebarOpen: false,
  theme: savedTheme,
  isOnline: true,
  isSyncing: false,
  isCommandPaletteOpen: false,
  isShortcutsOpen: false,
  activeModal: null,
  modalData: null,
  toast: null,
  liveSimulationActive: true,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      saveToLocalStorage('sidebar_collapsed', state.sidebarCollapsed);
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      saveToLocalStorage('sidebar_collapsed', action.payload);
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveToLocalStorage('app_theme', state.theme);
      if (typeof document !== 'undefined') {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      saveToLocalStorage('app_theme', action.payload);
      if (typeof document !== 'undefined') {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.isCommandPaletteOpen = action.payload;
    },
    setShortcutsOpen: (state, action: PayloadAction<boolean>) => {
      state.isShortcutsOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<{ name: string; data?: any }>) => {
      state.activeModal = action.payload.name;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    showToast: (state, action: PayloadAction<ToastMessage>) => {
      state.toast = action.payload;
    },
    hideToast: (state) => {
      state.toast = null;
    },
    toggleLiveSimulation: (state) => {
      state.liveSimulationActive = !state.liveSimulationActive;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setMobileSidebarOpen,
  toggleTheme,
  setTheme,
  setOnlineStatus,
  setSyncing,
  setCommandPaletteOpen,
  setShortcutsOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
  toggleLiveSimulation,
} = uiSlice.actions;

export default uiSlice.reducer;

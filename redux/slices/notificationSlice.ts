import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem, NotificationPreferences } from '@/lib/types';
import { INITIAL_NOTIFICATIONS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface NotificationState {
  notifications: NotificationItem[];
  preferences: NotificationPreferences;
}

const savedNotifications = getFromLocalStorage<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
const savedPreferences = getFromLocalStorage<NotificationPreferences>('notification_preferences', {
  assigned: true,
  mentioned: true,
  dueSoon: true,
  system: true,
});

const initialState: NotificationState = {
  notifications: savedNotifications,
  preferences: savedPreferences,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      // Respect notification preferences
      const type = action.payload.type;
      const shouldNotify =
        (type === 'assigned' && state.preferences.assigned) ||
        (type === 'mentioned' && state.preferences.mentioned) ||
        (type === 'due_soon' && state.preferences.dueSoon) ||
        (type === 'system' && state.preferences.system);

      if (shouldNotify) {
        state.notifications.unshift(action.payload);
        saveToLocalStorage('notifications', state.notifications);
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) {
        notif.read = true;
        saveToLocalStorage('notifications', state.notifications);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      saveToLocalStorage('notifications', state.notifications);
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      saveToLocalStorage('notifications', state.notifications);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      saveToLocalStorage('notifications', state.notifications);
    },
    updatePreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
      saveToLocalStorage('notification_preferences', state.preferences);
    },
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      saveToLocalStorage('notifications', state.notifications);
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  updatePreferences,
  setNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

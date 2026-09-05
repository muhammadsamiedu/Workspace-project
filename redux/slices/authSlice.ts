import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/lib/types';
import { INITIAL_USERS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '@/lib/storage';

interface AuthState {
  currentUser: User;
  users: User[];
  isAuthenticated: boolean;
  /** True once the client has rehydrated auth from localStorage (prevents flash) */
  authHydrated: boolean;
}

// Always start NOT authenticated on SSR / initial JS parse.
// The client-side provider will call rehydrateAuth() after mount.
const initialState: AuthState = {
  currentUser: INITIAL_USERS[0],
  users: INITIAL_USERS,
  isAuthenticated: false,
  authHydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called once on the client after mount to restore a saved session.
     * Sets authHydrated = true regardless so the app stops showing a loading state.
     */
    rehydrateAuth: (state) => {
      const savedUsers = getFromLocalStorage<User[]>('auth_users', []);
      if (savedUsers.length > 0) {
        state.users = savedUsers;
      }

      const savedUserId = getFromLocalStorage<string | null>('auth_user_id', null);
      const savedAuthenticated = getFromLocalStorage<boolean>('auth_authenticated', false);

      if (savedAuthenticated && savedUserId) {
        const user = state.users.find((u) => u.id === savedUserId);
        if (user) {
          state.currentUser = user;
          state.isAuthenticated = true;
        } else {
          // Saved user no longer exists — force re-login
          state.isAuthenticated = false;
          saveToLocalStorage('auth_authenticated', false);
        }
      } else {
        state.isAuthenticated = false;
      }

      state.authHydrated = true;
    },

    /** Full login — sets isAuthenticated = true and saves session */
    login: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        state.currentUser = user;
        state.isAuthenticated = true;
        state.authHydrated = true;
        saveToLocalStorage('auth_user_id', user.id);
        saveToLocalStorage('auth_authenticated', true);
      }
    },

    /** New user registration / signup */
    signup: (state, action: PayloadAction<User>) => {
      const existingIdx = state.users.findIndex(
        (u) => u.email.toLowerCase() === action.payload.email.toLowerCase()
      );
      if (existingIdx !== -1) {
        state.users[existingIdx] = action.payload;
      } else {
        state.users.push(action.payload);
      }
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.authHydrated = true;
      saveToLocalStorage('auth_users', state.users);
      saveToLocalStorage('auth_user_id', action.payload.id);
      saveToLocalStorage('auth_authenticated', true);
    },

    /** Switch between users without going through login screen (in-app switcher) */
    loginAs: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        state.currentUser = user;
        state.isAuthenticated = true;
        state.authHydrated = true;
        saveToLocalStorage('auth_user_id', user.id);
        saveToLocalStorage('auth_authenticated', true);
      }
    },

    logout: (state) => {
      state.isAuthenticated = false;
      saveToLocalStorage('auth_authenticated', false);
      removeFromLocalStorage('auth_user_id');
    },

    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
      const idx = state.users.findIndex((u) => u.id === state.currentUser.id);
      if (idx !== -1) {
        state.users[idx] = state.currentUser;
      }
      saveToLocalStorage('auth_users', state.users);
      saveToLocalStorage('auth_user_id', state.currentUser.id);
    },

    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
      saveToLocalStorage('auth_users', state.users);
    },
  },
});

export const {
  rehydrateAuth,
  login,
  signup,
  loginAs,
  logout,
  updateProfile,
  addUser,
} = authSlice.actions;

export default authSlice.reducer;

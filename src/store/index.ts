import { configureStore, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import adminJobsReducer from "./slices/adminJobsSlice";

const AUTH_STORAGE_KEY = "job-portal-admin-auth";

interface AuthState {
  accessToken: string | null;
  admin: { uuid: string; name: string; email: string; role: string } | null;
}

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { accessToken: null, admin: null };
    }
    const parsed = JSON.parse(raw) as AuthState;
    return {
      accessToken: parsed.accessToken ?? null,
      admin: parsed.admin ?? null,
    };
  } catch {
    return { accessToken: null, admin: null };
  }
}

function persistAuthState(state: AuthState) {
  if (!state.accessToken || !state.admin) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadAuthState(),
  reducers: {
    setAuth: (state, action: PayloadAction<AuthState>) => {
      state.accessToken = action.payload.accessToken;
      state.admin = action.payload.admin;
      persistAuthState({
        accessToken: action.payload.accessToken,
        admin: action.payload.admin,
      });
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.admin = null;
      persistAuthState({ accessToken: null, admin: null });
    },
  },
});

interface MetaState {
  categories: string[];
  experienceLevels: string[];
  employmentTypes: string[];
}

const metaSlice = createSlice({
  name: "meta",
  initialState: {
    categories: [],
    experienceLevels: [],
    employmentTypes: [],
  } as MetaState,
  reducers: {
    setMeta: (state, action: PayloadAction<MetaState>) => {
      state.categories = action.payload.categories;
      state.experienceLevels = action.payload.experienceLevels;
      state.employmentTypes = action.payload.employmentTypes;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export const { setMeta } = metaSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    meta: metaSlice.reducer,
    adminJobs: adminJobsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

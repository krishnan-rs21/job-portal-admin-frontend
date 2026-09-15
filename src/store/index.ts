import { configureStore, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import adminJobsReducer from "./slices/adminJobsSlice";
import adminApplicationsReducer from "./slices/adminApplicationsSlice";

const AUTH_STORAGE_KEY = "job-portal-admin-auth";

interface AuthState {
  accessToken: string | null;
  refreshToken?: string | null;
  admin: { uuid: string; name: string; email: string; role: string } | null;
}

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { accessToken: null, refreshToken: null, admin: null };
    }
    const parsed = JSON.parse(raw) as AuthState;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      admin: parsed.admin ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, admin: null };
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
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken ?? null;
      state.admin = action.payload.admin;
      persistAuthState({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        admin: state.admin,
      });
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.admin = null;
      persistAuthState({ accessToken: null, refreshToken: null, admin: null });
    },
  },
});

export interface CategoryOption {
  uuid: string;
  name: string;
}

interface MetaState {
  categories: string[];
  experienceLevels: string[];
  employmentTypes: string[];
  categoryOptions: CategoryOption[];
  experienceLevelOptions: CategoryOption[];
  employmentTypeOptions: CategoryOption[];
}

const asOptions = (value: unknown): CategoryOption[] => (Array.isArray(value) ? value : []);
const asNames = (value: unknown): string[] => (Array.isArray(value) ? value : []);

const metaSlice = createSlice({
  name: "meta",
  initialState: {
    categories: [],
    experienceLevels: [],
    employmentTypes: [],
    categoryOptions: [],
    experienceLevelOptions: [],
    employmentTypeOptions: [],
  } as MetaState,
  reducers: {
    setMeta: (state, action: PayloadAction<Partial<MetaState>>) => {
      state.categories = asNames(action.payload?.categories);
      state.experienceLevels = asNames(action.payload?.experienceLevels);
      state.employmentTypes = asNames(action.payload?.employmentTypes);
      state.categoryOptions = asOptions(action.payload?.categoryOptions);
      state.experienceLevelOptions = asOptions(action.payload?.experienceLevelOptions);
      state.employmentTypeOptions = asOptions(action.payload?.employmentTypeOptions);
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
    adminApplications: adminApplicationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

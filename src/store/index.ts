import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  admin: { uuid: string; name: string; email: string; role: string } | null;
}

const authSlice = createSlice({
  name: "auth",
  initialState: { accessToken: null, admin: null } as AuthState,
  reducers: {
    setAuth: (state, action: PayloadAction<AuthState>) => {
      state.accessToken = action.payload.accessToken;
      state.admin = action.payload.admin;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.admin = null;
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
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient, { getErrorMessage } from "../../services/apiClient";

export const APPLICATION_STATUSES = ["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface AdminApplication {
  uuid: string;
  status: ApplicationStatus;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    uuid: string;
    title: string;
    location: string;
    type: string;
    experience: string;
    category: string;
    categoryUuid: string;
    isActive: boolean;
  } | null;
  applicant: {
    uuid: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ApplicationsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

interface AdminApplicationsState {
  applications: AdminApplication[];
  meta: ApplicationsMeta;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  updatingUuid: string | null;
}

const emptyCounts = () =>
  APPLICATION_STATUSES.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: 0 }), {});

const initialState: AdminApplicationsState = {
  applications: [],
  meta: { page: 1, limit: 10, total: 0, totalPages: 0, statusCounts: emptyCounts() },
  status: "idle",
  error: null,
  updatingUuid: null,
};

export const fetchApplications = createAsyncThunk(
  "adminApplications/fetch",
  async (
    { jobUuid, params = {} }: { jobUuid?: string; params?: Record<string, string | number> },
    { rejectWithValue },
  ) => {
    try {
      const url = jobUuid ? `/jobs/${jobUuid}/applications` : "/jobs/applications";
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch applications"));
    }
  },
);

export const updateApplicationStatus = createAsyncThunk(
  "adminApplications/updateStatus",
  async ({ uuid, status }: { uuid: string; status: ApplicationStatus }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/jobs/applications/${uuid}/status`, { status });
      return response.data.data as AdminApplication;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update application status"));
    }
  },
);

const adminApplicationsSlice = createSlice({
  name: "adminApplications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        const payload = action.payload;
        state.applications = Array.isArray(payload?.data) ? payload.data : [];
        state.meta = {
          ...initialState.meta,
          ...(payload?.meta ?? {}),
          statusCounts: { ...emptyCounts(), ...(payload?.meta?.statusCounts ?? {}) },
        };
        state.status = "succeeded";
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || action.error.message || "Failed";
      })
      .addCase(updateApplicationStatus.pending, (state, action) => {
        state.updatingUuid = action.meta.arg.uuid;
        state.error = null;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.applications.findIndex((app) => app.uuid === updated.uuid);
        if (index >= 0) {
          const previous = state.applications[index].status;
          if (previous !== updated.status) {
            state.meta.statusCounts[previous] = Math.max(0, (state.meta.statusCounts[previous] ?? 0) - 1);
            state.meta.statusCounts[updated.status] = (state.meta.statusCounts[updated.status] ?? 0) + 1;
          }
          state.applications[index] = updated;
        }
        state.updatingUuid = null;
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.updatingUuid = null;
        state.error = (action.payload as string) || action.error.message || "Failed";
      });
  },
});

export default adminApplicationsSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient, { getErrorMessage } from "../../services/apiClient";

export interface Job {
  uuid: string;
  title: string;
  description: string;
  location: string;
  type: string;
  experience: string;
  category: string;
  categoryUuid: string;
  employmentTypeUuid: string;
  experienceLevelUuid: string;
  salaryRange?: string | null;
  isActive: boolean;
  applicationCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface AdminJobsState {
  jobs: Job[];
  meta: { page: number; totalPages: number; total: number; limit?: number };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminJobsState = {
  jobs: [],
  meta: { page: 1, totalPages: 0, total: 0 },
  status: "idle",
  error: null,
};

type JobPayload = Partial<Job>;

export const fetchAdminJobs = createAsyncThunk(
  "adminJobs/fetch",
  async (params: Record<string, string | number> = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/jobs", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch jobs"));
    }
  },
);

export const fetchAdminJobByUuid = createAsyncThunk(
  "adminJobs/fetchOne",
  async (uuid: string, { rejectWithValue }) => {
    try {
      const limit = 100;
      let page = 1;
      let totalPages = 1;
      do {
        const response = await apiClient.get("/jobs", { params: { page, limit } });
        const list: Job[] = response.data?.data ?? [];
        const found = list.find((job) => job.uuid === uuid);
        if (found) return found;
        totalPages = response.data?.meta?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);
      return rejectWithValue("Job not found");
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch job"));
    }
  },
);

export const createJob = createAsyncThunk(
  "adminJobs/create",
  async (data: JobPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/jobs", data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Job creation failed"));
    }
  },
);

export const updateJob = createAsyncThunk(
  "adminJobs/update",
  async ({ uuid, data }: { uuid: string; data: JobPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/jobs/${uuid}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Update failed"));
    }
  },
);

export const toggleJobStatus = createAsyncThunk(
  "adminJobs/toggle",
  async ({ uuid, isActive }: { uuid: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/jobs/${uuid}/status`, {
        isActive,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update status"));
    }
  },
);

export const deleteJob = createAsyncThunk(
  "adminJobs/delete",
  async (uuid: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/jobs/${uuid}`);
      return uuid;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete job"));
    }
  },
);

const replaceJob = (state: AdminJobsState, updated: Job | undefined) => {
  if (!updated?.uuid) return;
  const index = state.jobs.findIndex((job) => job.uuid === updated.uuid);
  if (index >= 0) {
    state.jobs[index] = updated;
  } else {
    state.jobs.unshift(updated);
  }
};

const adminJobsSlice = createSlice({
  name: "adminJobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminJobs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminJobs.fulfilled, (state, action) => {
        const payload = action.payload;
        state.jobs = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        state.meta = payload?.meta ?? state.meta;
        state.status = "succeeded";
      })
      .addCase(fetchAdminJobByUuid.fulfilled, (state, action) => {
        replaceJob(state, action.payload);
      })
      .addCase(createJob.fulfilled, (state, action) => {
        if (action.payload) {
          state.jobs.unshift(action.payload);
          state.meta.total += 1;
        }
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        replaceJob(state, action.payload);
      })
      .addCase(toggleJobStatus.fulfilled, (state, action) => {
        replaceJob(state, action.payload);
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter((job) => job.uuid !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      })
      .addCase(fetchAdminJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || action.error.message || "Failed";
      })
      .addMatcher(
        (action): action is { type: string; payload: unknown; error: { message?: string } } =>
          action.type.startsWith("adminJobs/") &&
          action.type.endsWith("/rejected") &&
          action.type !== fetchAdminJobs.rejected.type,
        (state, action) => {
          state.error = (action.payload as string) || action.error.message || "Failed";
        },
      );
  },
});

export default adminJobsSlice.reducer;

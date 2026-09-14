import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

interface Job {
  uuid: string;
  title: string;
  description: string;
  location: string;
  type: string;
  experience: string;
  categoryId: number;
  salaryRange?: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminJobsState {
  jobs: Job[];
  meta: { page: number; totalPages: number; total: number };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminJobsState = {
  jobs: [],
  meta: { page: 1, totalPages: 0, total: 0 },
  status: "idle",
  error: null,
};

export const fetchAdminJobs = createAsyncThunk(
  "adminJobs/fetch",
  async (params: any) => {
    const response = await apiClient.get("/jobs", { params });
    return response.data;
  },
);

export const createJob = createAsyncThunk(
  "adminJobs/create",
  async (data: any) => {
    const response = await apiClient.post("/jobs", data);
    return response.data.data;
  },
);

export const updateJob = createAsyncThunk(
  "adminJobs/update",
  async ({ uuid, data }: { uuid: string; data: any }) => {
    const response = await apiClient.put(`/jobs/${uuid}`, data);
    return response.data.data;
  },
);

export const toggleJobStatus = createAsyncThunk(
  "adminJobs/toggle",
  async ({ uuid, isActive }: { uuid: string; isActive: boolean }) => {
    const response = await apiClient.patch(`/jobs/${uuid}/status`, {
      isActive,
    });
    return response.data.data;
  },
);

export const deleteJob = createAsyncThunk(
  "adminJobs/delete",
  async (uuid: string) => {
    await apiClient.delete(`/jobs/${uuid}`);
    return uuid;
  },
);

const adminJobsSlice = createSlice({
  name: "adminJobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminJobs.fulfilled, (state, action) => {
        state.jobs = action.payload.data;
        state.meta = action.payload.meta;
        state.status = "succeeded";
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.error.message || "Failed";
        },
      );
  },
});

export default adminJobsSlice.reducer;

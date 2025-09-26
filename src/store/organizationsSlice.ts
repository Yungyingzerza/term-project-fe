import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Organization } from "@/interfaces";
import { getUserOrganizations } from "@/lib/api/organization";

export interface OrganizationsState {
  items: Organization[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: OrganizationsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchUserOrganizations = createAsyncThunk(
  "organizations/fetchUserOrganizations",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUserOrganizations();
      if (!Array.isArray(data.organizations)) {
        return [] as Organization[];
      }
      return data.organizations;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load organizations";
      return rejectWithValue(message);
    }
  }
);

const organizationsSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    resetOrganizations: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrganizations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserOrganizations.fulfilled, (state, action) => {
        state.items = action.payload ?? [];
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchUserOrganizations.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || action.error.message || null;
      });
  },
});

export const { resetOrganizations } = organizationsSlice.actions;
export default organizationsSlice.reducer;

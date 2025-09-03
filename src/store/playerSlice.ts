import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  muted: true as boolean,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    toggleMuted: (state) => {
      state.muted = !state.muted;
    },
    setMuted: (state, action) => {
      state.muted = !!action.payload;
    },
  },
});

export const { toggleMuted, setMuted } = playerSlice.actions;
export default playerSlice.reducer;


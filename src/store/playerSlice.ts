import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  muted: true as boolean,
  // Hex or rgb() string representing the current ambient color
  ambientColor: "#0a0a0a" as string,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    toggleMuted: (state) => {
      state.muted = !state.muted;
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.muted = !!action.payload;
    },
    setAmbientColor: (state, action: PayloadAction<string>) => {
      state.ambientColor = action.payload || state.ambientColor;
    },
  },
});

export const { toggleMuted, setMuted, setAmbientColor } = playerSlice.actions;
export default playerSlice.reducer;

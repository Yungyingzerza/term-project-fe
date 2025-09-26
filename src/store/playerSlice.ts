import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  muted: true as boolean,
  volume: 0.7 as number,
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
    setVolume: (state, action: PayloadAction<number>) => {
      const next = Math.max(0, Math.min(1, Number(action.payload) || 0));
      state.volume = next;
      if (next === 0) {
        state.muted = true;
      } else if (state.muted) {
        state.muted = false;
      }
    },
    setAmbientColor: (state, action: PayloadAction<string>) => {
      state.ambientColor = action.payload || state.ambientColor;
    },
  },
});

export const { toggleMuted, setMuted, setVolume, setAmbientColor } =
  playerSlice.actions;
export default playerSlice.reducer;

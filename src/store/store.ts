import { configureStore } from "@reduxjs/toolkit";
import user from "./userSlice";
import player from "./playerSlice";

export const store = configureStore({
  reducer: {
    user,
    player,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

import { configureStore } from "@reduxjs/toolkit";
import user from "./userSlice";
import player from "./playerSlice";
import organizations from "./organizationsSlice";

export const store = configureStore({
  reducer: {
    user,
    player,
    organizations,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

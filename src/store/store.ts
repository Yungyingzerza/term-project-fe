import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import playerSlice from "./playerSlice";

export default configureStore({
  reducer: {
    user: userSlice,
    player: playerSlice,
  },
});

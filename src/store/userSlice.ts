import { createSlice } from "@reduxjs/toolkit";
// import type { IUser } from "@interfaces/IUser";

const initialState = {
  id: "",
  username: "",
  picture_url: "",
  emails: [] as string[],
  isLoaded: false,
  exp: 0,
  handle: "",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setId: (state, action) => {
      state.id = action.payload;
    },
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setPictureUrl: (state, action) => {
      state.picture_url = action.payload;
    },
    setEmails: (state, action) => {
      state.emails = Array.isArray(action.payload) ? action.payload : [];
    },
    setExp: (state, action) => {
      state.exp = action.payload;
    },
    setHandle: (state, action) => {
      state.handle = action.payload;
    },
  },
});

export const {
  setId,
  setUsername,
  setPictureUrl,
  setEmails,
  setExp,
  setHandle,
} = userSlice.actions;
export default userSlice.reducer;

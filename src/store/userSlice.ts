import { createSlice } from "@reduxjs/toolkit";
// import type { IUser } from "@interfaces/IUser";

const initialState = {
  id: "",
  username: "",
  picture_url: "",
  emails: [] as string[],
  isLoaded: false,
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
  },
});

export const { setId, setUsername, setPictureUrl, setEmails } = userSlice.actions;
export default userSlice.reducer;

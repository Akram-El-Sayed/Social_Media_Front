import { createSlice } from "@reduxjs/toolkit";


const userSlice = createSlice({
  name: "userSlice",
  // States Store Global
  initialState: {
    userInfo: null,
    isLoggedIn: false,
    role:null,
  },

  // Function or Action Change State
  reducers: {
    // state - action
    setUser: (state, action) => {
      // action.payload -> data -> dispatch
      state.userInfo = action.payload;
      state.isLoggedIn = true;
      state.role = action.payload.role;
    },
    clearUser: (state) => {
      state.isLoggedIn = false;
      state.userInfo = null;
      state.role = null;
    },
  
  },
});

// Export Actions
export const { clearUser, setUser } = userSlice.actions;

// Export States
export default userSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    unreadCount: 0,
    activeConversationId: null,
  },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },

    setActiveConversation: (state, action) => {   
    state.activeConversationId = action.payload;
  },
   
    decrementUnread: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, incrementUnread, decrementUnread, clearUnread , setActiveConversation } =
  notificationSlice.actions;

export default notificationSlice.reducer;

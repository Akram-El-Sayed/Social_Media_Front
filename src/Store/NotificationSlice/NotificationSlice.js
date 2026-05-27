import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    unreadCount: 0,
    unreadMessagesCount: 0,
    activeConversationId: null,
  },
  reducers: {
    // General notifications
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    decrementUnread: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },

    //  Message-only counter
    setUnreadMessagesCount: (state, action) => {
      state.unreadMessagesCount = Math.max(0, action.payload);
    },
    incrementUnreadMessages: (state) => {
      state.unreadMessagesCount += 1;
    },
    decrementUnreadMessages: (state, action) => {
      state.unreadMessagesCount = Math.max(
        0,
        state.unreadMessagesCount - (action.payload ?? 1),
      );
    },
    clearUnreadMessages: (state) => {
      state.unreadMessagesCount = 0;
    },

    // Active conversation tracker
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnread,
  decrementUnread,
  clearUnread,
  setUnreadMessagesCount,
  incrementUnreadMessages,
  decrementUnreadMessages,
  clearUnreadMessages,
  setActiveConversation,
} = notificationSlice.actions;

export default notificationSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./UserSlice/UserSlice"
import notificationReducer from './NotificationSlice/NotificationSlice'
import feedReducer from './feedSlice/feedSlice'
import reelsReducer from "./reelsSlice/reelsSlice";


// Store States Global
export const Store = configureStore({
  // Each Slice Export Reducer -> return States
  reducer: {
    // user -> useSelector(state => state.user)
   user: userReducer,
    // useSelector(state => state.notification)
    notification: notificationReducer,

    feed: feedReducer,

    reels: reelsReducer,
  },
});

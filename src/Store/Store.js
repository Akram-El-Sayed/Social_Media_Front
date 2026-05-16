import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./UserSlice/UserSlice"
import notificationReducer from './NotificationSlice/NotificationSlice'
import feedReducer from './feedSlice/feedSlice'


// Store States Global
export const Store = configureStore({
  // Each Slice Export Reducer -> return States
  reducer: {
    // user -> useSelector(state => state.user)
   user: userReducer,
    // cart -> useSelector(state => state.cart)
    // useSelector(state => state.notification)
    notification: notificationReducer,

    feed: feedReducer,
  },
});

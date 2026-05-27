import React, { useEffect, useState, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Register from "./Pages/Register/Register";
import Login from "./Pages/Login/Login";
import VerifyOtp from "./Pages/VerifyOtp/VerifyOtp";
import ForgotPassword from "./Pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword/ResetPassword";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "./Store/UserSlice/UserSlice";
import { api } from "./utils/api";
import { Loading } from "./Components/Loading/Loading";
import { connectSocket, disconnectSocket } from "./utils/Socket";
import Sidebar from "./Components/Sidebar/Sidebar";
import Reels from "./Pages/Reels/Reels";
import Notifications from "./Pages/Notifications/Notifications";
import MyProfile from "./Pages/MyProfile/MyProfile";
import UserSearch from "./Pages/UsersSearch/UserSearch";
import CreatePost from "./Pages/CreatePost/CreatePost";
import Profiles from "./Pages/Profiles/Profiles";
import HashtagPosts from "./Pages/HashtagPosts/HashtagPosts";
import AdminReport from "./Pages/AdminReport/AdminReport";
import BottomNav from "./Components/Bottonbar/BottomNav";
import Navbar from "./Components/Navbar/Navbar";
import Following from "./Pages/Following/Following";
import Followers from "./Pages/Followers/Followers";
import GetPost from "./Pages/GetPost/GetPost";
import ReportPost from "./Pages/ReportPost/ReportPost";
import EditPost from "./Pages/EditPost/EditPost";
import Conversations from "./Pages/Conversations/Conversations";
import ScrollToTop from "./Components/ScrollToUp/ScrollToUp";
import { OnlineProvider } from "./context/OnlineContext";
import { Store } from "./Store/Store";
import {
  setUnreadMessagesCount,   
  incrementUnreadMessages,  
} from "./Store/NotificationSlice/NotificationSlice";

function App() {
  const { isLoggedIn, role, userInfo } = useSelector((state) => state.user);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const dispatch = useDispatch();

  const processedMsgIds = useRef(new Set());

  // ── Auth check on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      dispatch(setUser(JSON.parse(storedUser)));
    }

    const checkAuth = async () => {
      try {
        const res = await api.get("/api/users/profile");
        dispatch(setUser(res.data.user));
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch {
        dispatch(clearUser());
        localStorage.removeItem("user");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [dispatch]);

 
useEffect(() => {
  if (isCheckingAuth) return;

  if (isLoggedIn) {
    const sock = connectSocket();

    // Seed unread message count from conversations 
    const initConversations = async () => {
      try {
        const { data } = await api.get("/api/messages/conversations");
        const ids = (data.conversations || []).map((c) => c._id);

        // bulk-mark delivered (unchanged)
        if (ids.length) {
          await api.patch("/api/messages/conversations/delivered-bulk", {
            conversationIds: ids,
          });
        }

        
        const totalUnread = (data.conversations || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0,
        );
        dispatch(setUnreadMessagesCount(totalUnread));   
      } catch (err) {
        console.error("initConversations error:", err);
      }
    };
    initConversations();

    // message:new 
    const handleNewMessage = (msg) => {
      if (!sock) return;

      const msgId = msg._id?.toString();
        if (msgId) {
          if (processedMsgIds.current.has(msgId)) return;
          processedMsgIds.current.add(msgId);
        }

        const senderId = msg.sender?._id?.toString() ?? msg.sender?.toString();
        if (senderId && userInfo?._id && senderId === userInfo._id.toString()) {
          return; // ignore own messages
        }

        const convId = (msg.conversation?._id ?? msg.conversation)?.toString();
        const activeConvId = Store.getState().notification.activeConversationId;

        // If we are currently in this conversation, do nothing
        if (activeConvId && activeConvId === convId) return;

        if (msgId && convId) {
          sock.emit("message_received", { messageId: msgId, conversationId: convId });
        }

        dispatch(incrementUnreadMessages());
      };

      sock.on("message:new", handleNewMessage);
      return () => {
        sock.off("message:new", handleNewMessage);
      };
    } else {
      disconnectSocket();
    }
  }, [isLoggedIn, isCheckingAuth, userInfo?._id, dispatch]);

  // Theme persistence
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
  }, [theme]);

  if (isCheckingAuth) return <Loading />;

  return (
    // OnlineProvider wraps everything so any page can read online status
    <OnlineProvider>
      <div className="d-flex flex-column min-vh-100">
        <ScrollToTop />
        <Navbar
          theme={theme}
          isLoggedIn={isLoggedIn}
          setTheme={setTheme}
          role={role}
        />
        <div
          className={`flex-grow-1 ${
            theme === "light" ? "bg-light text-dark" : "bg-dark text-light"
          }`}
        >
          <Sidebar
            theme={theme}
            isLoggedIn={isLoggedIn}
            setTheme={setTheme}
            role={role}
          />

          <main className="main">
            <Routes>
              <Route path="/" element={!isLoggedIn ? <Navigate to="/login" /> : <Home theme={theme} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/Verify-Otp" element={<VerifyOtp theme={theme} />} />
              <Route path="/Forgot-Password" element={<ForgotPassword />} />
              <Route path="/Reset-Password" element={<ResetPassword />} />
              <Route
                path="/Reels"
                element={!isLoggedIn ? <Navigate to="/login" /> : <Reels />}
              />
              <Route
                path="/Conversations"
                element={
                  !isLoggedIn ? <Navigate to="/login" /> : <Conversations />
                }
              />
              <Route
                path="/Creat-Post"
                element={
                  !isLoggedIn ? <Navigate to="/login" /> : <CreatePost />
                }
              />
              <Route
                path="/Users-Search"
                element={
                  !isLoggedIn ? <Navigate to="/login" /> : <UserSearch />
                }
              />
              <Route path="/Notifications" element={<Notifications />} />
              <Route
                path="/My-Profile"
                element={
                  !isLoggedIn ? (
                    <Navigate to="/login" />
                  ) : (
                    <MyProfile theme={theme} />
                  )
                }
              />
              <Route path="/profile/:id" element={<Profiles theme={theme} />} />
              <Route
                path="/hashtag/:tag"
                element={<HashtagPosts theme={theme} />}
              />
              <Route
                path="/admin-Report"
                element={
                  !isLoggedIn || role !== "admin" ? (
                    <Navigate to="/" />
                  ) : (
                    <AdminReport />
                  )
                }
              />
              <Route path="/following/:id" element={<Following />} />
              <Route path="/followers/:id" element={<Followers />} />
              <Route path="/posts/edit/:id" element={<EditPost />} />
              <Route path="/report/post/:postId" element={<ReportPost />} />
              <Route path="/post/:id" element={<GetPost theme={theme} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </div>
    </OnlineProvider>
  );
}

export default App;

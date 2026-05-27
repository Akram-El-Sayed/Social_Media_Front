import React, { useEffect, memo } from "react";
import { IoShareSocialOutline } from "react-icons/io5";
import { TbHome2, TbUserSearch } from "react-icons/tb";
import { GoVideo } from "react-icons/go";
import { LuMessageCircleMore } from "react-icons/lu";
import { BsPatchPlus } from "react-icons/bs";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { RiLoginCircleLine } from "react-icons/ri";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogoutButton } from "../LogoutButton/LogoutButton";
import { Button } from "react-bootstrap";
import {
  MdOutlineLightMode,
  MdDarkMode,
  MdReportGmailerrorred,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../Hooks/useSocket";
import {
  setUnreadCount,
} from "../../Store/NotificationSlice/NotificationSlice";

const Sidebar = memo(({ theme, isLoggedIn, setTheme, role }) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = useSelector((state) => state.notification.unreadCount);
  const unreadMessagesCount = useSelector(
    (state) => state.notification.unreadMessagesCount,
  );
  const serverUnreadCount = useSelector(
    (state) => state.user.userInfo?.unreadNotificationsCount,
  );

  // Sync initial count from server user object
  useEffect(() => {
    if (serverUnreadCount != null) {
      dispatch(setUnreadCount(serverUnreadCount));
    }
  }, [serverUnreadCount, dispatch]);

  // Keep badge in sync with real-time socket updates from any controller
  useEffect(() => {
    if (!socket) return;
    const handler = ({ unreadCount: count }) => {
      dispatch(setUnreadCount(count));
    };
    socket.on("notification_badge_updated", handler);
    return () => socket.off("notification_badge_updated", handler);
  }, [socket, dispatch]);

  const handleHomeClick = (e) => {
    e.preventDefault();

    if (location.pathname === "/") {
      // Already on Home => trigger refresh
      navigate("/", { state: { refresh: Date.now() } });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="sidebar">
      <NavLink
        to="/"
        className="d-flex justify-content-center fs-2 link-body-emphasis text-decoration-none brand"
      >
        <IoShareSocialOutline />
        <span className="visually-hidden">Icon-only</span>
      </NavLink>
      <div className="sidebar-footer">
        <ul className="nav nav-pills nav-flush flex-column gap-1 mb-auto text-center">
          <li className="nav-item">
            <NavLink
              to="/"
              onClick={handleHomeClick}
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <TbHome2 />
            </NavLink>
          </li>
          {role === "admin" && (
            <li className="nav-item">
              <NavLink
                to="/admin-Report"
                className={({ isActive }) =>
                  `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
                }
              >
                <MdReportGmailerrorred />
              </NavLink>
            </li>
          )}
          <li>
            <NavLink
              to="/Reels"
              onClick={() =>
                navigate("/Reels", {
                  state: { refresh: location.pathname === "/Reels" },
                })
              }
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <GoVideo />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Conversations"
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              {/* ← NEW: badge wrapper identical to the notification bell */}
              <span className="sidebar-notif-wrapper">
                <LuMessageCircleMore />
                {unreadMessagesCount > 0 && (
                  <span className="sidebar-notif-badge">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Creat-Post"
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <BsPatchPlus />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Users-Search"
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <TbUserSearch />
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/Notifications"
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-notif-wrapper">
                <IoMdNotificationsOutline />
                {unreadCount > 0 && (
                  <span className="sidebar-notif-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/My-Profile"
              className={({ isActive }) =>
                `nav-link p-1 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
            >
              <FaRegUser />
            </NavLink>
          </li>
          <li className="nav-item">
            <div className="border-bottom rounded-4">
              {isLoggedIn ? (
                <LogoutButton />
              ) : (
                <Button
                  variant="outline-warning"
                  className="py-1 fs-2 border-0 rounded-4 button-nav"
                  as={Link}
                  to="/login"
                >
                  <RiLoginCircleLine />
                </Button>
              )}
            </div>
          </li>
          <li className="nav-item">
            <div className="border-bottom rounded-4">
              <Button
                variant="outline-primary"
                className="py-1 fs-2 border-0 rounded-4 button-nav"
                onClick={() =>
                  setTheme((prev) => (prev === "light" ? "dark" : "light"))
                }
              >
                {theme === "light" ? <MdDarkMode /> : <MdOutlineLightMode />}
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
});

export default Sidebar;

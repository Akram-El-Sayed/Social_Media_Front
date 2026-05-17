import React, { useEffect, memo, useState } from "react";
import {
  Navbar as BootstrapNavbar,
  Button,
  Container,
  Nav,
} from "react-bootstrap";
import { MdOutlineLightMode, MdDarkMode , MdReportGmailerrorred, } from "react-icons/md";
import { Link, NavLink } from "react-router-dom";
import { LogoutButton } from "../LogoutButton/LogoutButton";
import { IoMdNotificationsOutline } from "react-icons/io";
import { TbUserSearch } from "react-icons/tb";
import { RiLoginCircleLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { setUnreadCount } from "../../Store/NotificationSlice/NotificationSlice";
import { useSocket } from "../../Hooks/useSocket";

const Navbar = memo(({ theme, isLoggedIn, setTheme, role }) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const [expanded, setExpanded] = useState(false);
  const unreadCount = useSelector((state) => state.notification.unreadCount);
  const serverUnreadCount = useSelector(
    (state) => state.user.userInfo?.unreadNotificationsCount,
  );

  const closeNav = () => setExpanded(false);

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

  return (
    <div className="upper-nav">
      <BootstrapNavbar
        expand="md"
        bg={theme}
        data-bs-theme={theme}
        expanded={expanded}
        onToggle={(val) => setExpanded(val)}
        className="nav-border rounded-bottom-4 rounded-top-3"
      >
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/" className="font5">
            OSAK-Gram
          </BootstrapNavbar.Brand>

          <NavLink
            to="/Notifications"
            onClick={closeNav}
            className={({ isActive }) =>
              `nav-link p-3 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
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

          <BootstrapNavbar.Toggle className="border-2 rounded-4 border-primary" />

          <BootstrapNavbar.Collapse className="ms-3">
            <Nav className="ms-auto d-flex flex-row justify-content-around align-items-center gap-2">
              {role === "admin" && (
                <NavLink
                  to="/admin-Report"
                  onClick={closeNav}
                  className='font4 p-3 border-bottom rounded-4'
                >
                  <MdReportGmailerrorred className="fs-2" />
                </NavLink>
              )}
              <Nav.Link
                as={NavLink}
                to="/Users-Search"
                onClick={closeNav}
                className="font4 p-3 border-bottom rounded-4"
              >
                <TbUserSearch className="fs-2" />
              </Nav.Link>

              <div className="border-bottom rounded-4">
                {isLoggedIn ? (
                  <LogoutButton onClick={closeNav} />
                ) : (
                  <Button
                    variant="outline-primary"
                    className="py-2 fs-2 border-0 rounded-4 button-nav top-nav"
                    as={Link}
                    to="/login"
                    onClick={closeNav}
                  >
                    <RiLoginCircleLine />
                  </Button>
                )}
              </div>

              <div className="border-bottom rounded-4 top-nav">
                <Button
                  variant="outline-primary"
                  className="py-2 fs-2 border-0 rounded-4 button-nav toggle-nav"
                  onClick={() => {
                    setTheme((prev) => (prev === "light" ? "dark" : "light"));
                    closeNav();
                  }}
                >
                  {theme === "light" ? <MdDarkMode /> : <MdOutlineLightMode />}
                </Button>
              </div>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </div>
  );
});

export default Navbar;

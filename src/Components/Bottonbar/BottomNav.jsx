import React from "react";
import { IoShareSocialOutline } from "react-icons/io5";
import { TbHome2 } from "react-icons/tb";
import { GoVideo } from "react-icons/go";
import { LuMessageCircleMore } from "react-icons/lu";
import { BsPatchPlus } from "react-icons/bs";
import { TbUserSearch } from "react-icons/tb";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { RiLoginCircleLine } from "react-icons/ri";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogoutButton } from "../LogoutButton/LogoutButton";
import { Button } from "react-bootstrap";
import { MdOutlineLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = (e) => {
    e.preventDefault();

    if (location.pathname === "/") {
      navigate("/", { state: { refresh: Date.now() } });
    } else {
      navigate("/");
    }
  };
  return (
    <div className="bottom-all  ">
      <div className="bottom bg-body-secondary  rounded-top-5  rounded-bottom-3 ">
        <ul className="nav nav-pills  nav-flush    text-center gap-2">
          <li className="nav-item">
            <NavLink
              to="/"
              onClick={handleHomeClick}
              className={({ isActive }) =>
                `nav-link py-2 fs-2 link-warning border-bottom rounded-4 ${
                  isActive ? "active" : ""
                }`
              }
              aria-label="Home"
            >
              <TbHome2 />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Reels"
              className={({ isActive }) =>
                `nav-link py-2 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              aria-label="Reels"
              data-bs-original-title="Reels"
            >
              <GoVideo />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Creat-Post"
              className={({ isActive }) =>
                `nav-link py-2 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              aria-label="Creat-Post"
              data-bs-original-title="Creat_Post"
            >
              <BsPatchPlus />
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/Conversations"
              className={({ isActive }) =>
                `nav-link py-2 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              aria-label="Conversations"
              data-bs-original-title="Conversations"
            >
              <LuMessageCircleMore />
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/My-Profile"
              className={({ isActive }) =>
                `nav-link py-2 fs-2 link-warning border-bottom rounded-4 ${isActive ? "active" : ""}`
              }
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              aria-label="Profile"
              data-bs-original-title="Profile"
            >
              <FaRegUser />
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

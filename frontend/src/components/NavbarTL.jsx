import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.js";
import "./NavbarTL.css";

const NavbarTL = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  return (
    <nav className="tlNav">
      <div className="tlNavInner">
        <div className="brand">
          <div className="brandLogoWrap" aria-hidden="true">
            <img className="brandLogo" src="/cap.png" alt="Capgemini logo" />
          </div>
          <div className="brandText">
            <h2 className="brandTitle">LMS Platform</h2>
            <div className="brandSubtitle">Team Lead workspace</div>
          </div>
        </div>

        <div className="navLinks" aria-label="TL navigation">
          <NavLink
            to="/tl/dashboard"
            className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink to="/tl/courses" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Courses
          </NavLink>
          <NavLink to="/tl/groups" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Groupes
          </NavLink>
          <NavLink to="/tl/stats" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Statistiques
          </NavLink>
        </div>

        <div className="actions">
          <NavLink to="/tl/profile" className="profileBtn">
            Profile
          </NavLink>
          <button onClick={handleLogout} className="logoutBtn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarTL;

import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.js";
import "./NavbarAdmin.css";

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  return (
    <nav className="adminNav">
      <div className="adminNavInner">
        <div className="brand">
          <div className="brandLogoWrap">
            <img className="brandLogo" src="/cap.png" alt="Logo" />
          </div>
          <div className="brandText">
            <h2 className="brandTitle">Manufacturing Academie</h2>
            <div className="brandSubtitle">Administration</div>
          </div>
        </div>

        <div className="navLinks">
          <NavLink 
            to="/admin/home" 
            className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}
          >
            Accueil
          </NavLink>
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}
          >
            TL & Consultant
          </NavLink>
          <NavLink 
            to="/admin/groups" 
            className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}
          >
            Groupe
          </NavLink>
          <NavLink 
            to="/admin/stats" 
            className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}
          >
            Statistique
          </NavLink>
        </div>

        <div className="actions">
          <NavLink to="/admin/profile" className="profileBtn">
            Profile
          </NavLink>
          <button type="button" onClick={handleLogout} className="logoutBtn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

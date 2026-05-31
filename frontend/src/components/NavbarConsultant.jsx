import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.js";
import "./NavbarTL.css";

export default function NavbarConsultant() {
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
            <img className="brandLogo" src="/cap.png" alt="" />
          </div>
          <div className="brandText">
            <h2 className="brandTitle">Manufacturing Academie</h2>
            <div className="brandSubtitle">Espace Consultant</div>
          </div>
        </div>

        <div className="navLinks" aria-label="Navigation consultant">
          <NavLink to="/consultant/dashboard" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Accueil
          </NavLink>
          <NavLink to="/consultant/courses" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Courses
          </NavLink>
          <NavLink to="/consultant/groupe" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Groupe
          </NavLink>
          <NavLink to="/consultant/statistique" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            Statistique
          </NavLink>
          <NavLink to="/consultant/help" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
            ❓ Aide
          </NavLink>
        </div>

        <div className="actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="notification-wrapper" style={{ position: "relative", display: "flex", alignItems: "center", cursor: "pointer", padding: "4px" }} title="Notifications (Certificats)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px", color: "var(--ink)" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style={{ position: "absolute", top: "0px", right: "2px", backgroundColor: "#ef4444", width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #fff" }}></span>
          </div>
          
          <NavLink to="/consultant/profile" className="profileBtn">
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

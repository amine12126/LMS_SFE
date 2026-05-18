import { Outlet } from "react-router-dom";
import NavbarConsultant from "./NavbarConsultant.jsx";
import "./DashboardLayout.css";
import "./consultant-surface.css";

export default function ConsultantLayout() {
  return (
    <div className="layout layout--consultant">
      <NavbarConsultant />
      <main className="layout__main layout__main--consultant">
        <Outlet />
      </main>
    </div>
  );
}

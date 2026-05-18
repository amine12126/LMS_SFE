import { Outlet } from "react-router-dom";
import NavbarAdmin from "./NavbarAdmin.jsx";
import "./DashboardLayout.css";

export default function AdminLayout() {
  return (
    <div className="layout layout--admin">
      <NavbarAdmin />
      <main className="layout__main layout__main--admin">
        <div className="container" style={{ padding: '20px', maxWidth: '1300px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

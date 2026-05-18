import NavbarTL from "./NavbarTL";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, hero }) => (
  <div className="layout">
    <NavbarTL />
    {hero && <div className="layout__hero">{hero}</div>}
    <main className="layout__main">{children}</main>
  </div>
);

export default DashboardLayout;


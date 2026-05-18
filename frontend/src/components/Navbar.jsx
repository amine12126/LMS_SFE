import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext.js";

function Navbar() {
  const { logout } = useContext(AuthContext);

  return (
    <nav style={{ background: "#222", color: "#fff", padding: "10px" }}>
      <span>LMS</span>

      <button onClick={logout} style={{ float: "right" }}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
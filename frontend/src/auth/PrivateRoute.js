import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext.js";

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has the required role
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "admin") return <Navigate to="/admin" />;
    if (user.role === "tl") return <Navigate to="/tl" />;
    return <Navigate to="/consultant" />;
  }

  return children;
};

export default PrivateRoute;

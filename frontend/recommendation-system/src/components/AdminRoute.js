import { useAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return <Navigate to="/login-selection" replace />;
  return children;
}

export default AdminRoute;

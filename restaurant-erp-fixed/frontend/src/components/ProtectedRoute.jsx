import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/staff-login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/staff-portal" replace />;
  }
  return children;
}

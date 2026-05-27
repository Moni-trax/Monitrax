import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // If there is no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  return children;
}

import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";

const PublicOnlyRoutes: React.FC = () => {
  const { currentUser, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
    </div>;
  }

  if (currentUser) {
    // redirect to home page if user is already authenticated
    // The home page will handle redirecting to their dashboard
    return <Navigate to="/" replace />;
  }

  // Render child routes if not authenticated
  return <Outlet />;
};

export default PublicOnlyRoutes;

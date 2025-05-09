import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";

const ProtectedRoutes: React.FC <{ children:React.ReactNode }> = () => {
  const { currentUser, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[40vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
  </div>;
  }

  if (!currentUser) {
    // redirect to login if user not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoutes;
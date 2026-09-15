import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import type { RootState } from "../store";

const ProtectedRoute: React.FC = () => {
  const { accessToken, admin } = useSelector((state: RootState) => state.auth);

  if (!accessToken || admin?.role?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

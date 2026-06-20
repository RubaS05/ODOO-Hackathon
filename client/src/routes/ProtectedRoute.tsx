import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = usePOSStore((state) => state.isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
export const PublicRoute = () => {
    const isAuthenticated = usePOSStore((state) => state.isAuthenticated);
    return isAuthenticated ? <Navigate to="/" replace/> : <Outlet />;
};

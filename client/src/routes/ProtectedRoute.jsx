import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
export const ProtectedRoute = ({ allowedRoles }) => {
    const isAuthenticated = usePOSStore((state) => state.isAuthenticated);
    const currentUser = usePOSStore((state) => state.currentUser);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/" replace/>;
    }
    return <Outlet />;
};

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
export const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, currentUser } = usePOSStore((state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
    }));
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/" replace/>;
    }
    return <Outlet />;
};

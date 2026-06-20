import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
// Pages
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { POSSession } from '../pages/POSSession';
import { POSOrder } from '../pages/POSOrder';
import { TableManagement } from '../pages/TableManagement';
import { Orders } from '../pages/Orders';
import { CustomerManagement } from '../pages/CustomerManagement';
import { ProductManagement } from '../pages/ProductManagement';
import { CategoryManagement } from '../pages/CategoryManagement';
import { PaymentMethods } from '../pages/PaymentMethods';
import { CouponsPromotions } from '../pages/CouponsPromotions';
import { UserManagement } from '../pages/UserManagement';
import { KDS } from '../pages/KDS';
import { Reports } from '../pages/Reports';
import { CustomerDisplay } from '../pages/CustomerDisplay';
import { AdminDashboard } from '../pages/AdminDashboard';
import TableEntry from '../pages/TableEntry';
import CustomerDashboard from '../pages/CustomerDashboard';
import { usePOSStore } from '../store/posStore';

// Dynamic Root Redirect Component
const RootRedirect = () => {
    const { currentUser } = usePOSStore();
    if (currentUser?.role === 'CHEF') {
        return <Navigate to="/kitchen" replace />;
    }
    return <Navigate to="/pos-session" replace />;
};

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Separate Public Customer Display Screen Route */}
            <Route path="/customer-display" element={<CustomerDisplay />} />

            {/* Public QR Table Routes – no auth required */}
            <Route path="/table/:tableId" element={<TableEntry />} />
            <Route path="/table/:tableId/order" element={<CustomerDashboard />} />

            {/* Protected POS Dashboard Routes (Admin & Employee only) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']} />}>
                <Route path="/pos" element={<DashboardLayout><POSOrder /></DashboardLayout>} />
                <Route path="/pos-session" element={<DashboardLayout><POSSession /></DashboardLayout>} />
                <Route path="/tables" element={<DashboardLayout><TableManagement /></DashboardLayout>} />
                <Route path="/orders" element={<DashboardLayout><Orders /></DashboardLayout>} />
                <Route path="/customers" element={<DashboardLayout><CustomerManagement /></DashboardLayout>} />
            </Route>

            {/* Chef & Admin Route */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CHEF']} />}>
                <Route path="/kitchen" element={<DashboardLayout><KDS /></DashboardLayout>} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
                <Route path="/products" element={<DashboardLayout><ProductManagement /></DashboardLayout>} />
                <Route path="/categories" element={<DashboardLayout><CategoryManagement /></DashboardLayout>} />
                <Route path="/payment-methods" element={<DashboardLayout><PaymentMethods /></DashboardLayout>} />
                <Route path="/coupons" element={<DashboardLayout><CouponsPromotions /></DashboardLayout>} />
                <Route path="/users" element={<DashboardLayout><UserManagement /></DashboardLayout>} />
                <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
            </Route>

            {/* Root route with role-based redirect */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<RootRedirect />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;

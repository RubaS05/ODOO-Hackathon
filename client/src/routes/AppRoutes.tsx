import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Pages
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Separate Public Customer Display Screen Route */}
      <Route path="/customer-display" element={<CustomerDisplay />} />

      {/* Protected POS Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route 
          path="/" 
          element={
            <DashboardLayout>
              <POSOrder />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/tables" 
          element={
            <DashboardLayout>
              <TableManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <DashboardLayout>
              <Orders />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <DashboardLayout>
              <CustomerManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/products" 
          element={
            <DashboardLayout>
              <ProductManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/categories" 
          element={
            <DashboardLayout>
              <CategoryManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/payment-methods" 
          element={
            <DashboardLayout>
              <PaymentMethods />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/coupons" 
          element={
            <DashboardLayout>
              <CouponsPromotions />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/users" 
          element={
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/kds" 
          element={
            <DashboardLayout>
              <KDS />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          } 
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRoutes;

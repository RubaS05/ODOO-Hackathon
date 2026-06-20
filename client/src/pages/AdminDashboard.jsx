import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Package, Users, Settings, Tag, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/Card';

export const AdminDashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage the restaurant's configuration, menu, and users from here.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/categories">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-primary/20 hover:border-primary/50">
                        <CardHeader>
                            <LayoutGrid className="w-8 h-8 text-primary mb-2" />
                            <CardTitle>Menu Categories</CardTitle>
                            <CardDescription>Manage your food categories</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                
                <Link to="/products">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-primary/20 hover:border-primary/50">
                        <CardHeader>
                            <Package className="w-8 h-8 text-primary mb-2" />
                            <CardTitle>Food Items</CardTitle>
                            <CardDescription>Add or edit items on the menu</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/users">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-primary/20 hover:border-primary/50">
                        <CardHeader>
                            <Users className="w-8 h-8 text-primary mb-2" />
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage Admin, Employee, and Chef accounts</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                
                <Link to="/payment-methods">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-primary/20 hover:border-primary/50">
                        <CardHeader>
                            <CreditCard className="w-8 h-8 text-primary mb-2" />
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>Configure payment options</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

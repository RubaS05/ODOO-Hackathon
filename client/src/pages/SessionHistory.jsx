import React, { useState, useEffect, useMemo } from 'react';
import { History, Calendar, Clock, IndianRupee, ShoppingBag, Utensils, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { apiService } from '../services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/Table';

export const SessionHistory = () => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState([]);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.sessions.getAll();
            setSessions(data || []);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAnalytics = async (session) => {
        setSelectedSession(session);
        setAnalyticsModalOpen(true);
        setIsAnalyticsLoading(true);
        try {
            const orders = await apiService.orders.getBySession(session.id);
            setSessionOrders(orders || []);
        } catch (error) {
            console.error("Failed to load session orders", error);
            setSessionOrders([]);
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    // Calculate Analytics
    const analytics = useMemo(() => {
        if (!sessionOrders.length) return { totalRevenue: 0, orderCount: 0, topItems: [] };

        let totalRevenue = 0;
        let orderCount = sessionOrders.length;
        const itemCounts = {};

        sessionOrders.forEach(order => {
            // Only count PAID orders for revenue
            if (order.status === 'PAID') {
                totalRevenue += order.totalAmount || 0;
            }

            // Tally items
            (order.items || []).forEach(item => {
                const name = item.productName || 'Unknown Item';
                if (!itemCounts[name]) {
                    itemCounts[name] = { name, quantity: 0, revenue: 0 };
                }
                itemCounts[name].quantity += item.quantity;
                itemCounts[name].revenue += item.lineTotal;
            });
        });

        // Sort items by quantity descending
        const topItems = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);

        return { totalRevenue, orderCount, topItems };
    }, [sessionOrders]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <History className="h-8 w-8 text-primary" />
                        Session History
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View past POS sessions, total revenue, and popular food items.
                    </p>
                </div>
                <Button onClick={loadSessions} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            <Card className="border-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Opened At</TableHead>
                                <TableHead>Closed At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length > 0 ? (
                                sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-mono text-xs">#{session.id}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                {formatDate(session.openingTime)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {session.closingTime ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {formatDate(session.closingTime)}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">In Progress</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={session.status === 'OPEN' ? 'success' : 'secondary'}>
                                                {session.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleViewAnalytics(session)}
                                                className="h-8 gap-1.5 text-xs font-semibold"
                                            >
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                View Analytics
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No sessions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Analytics Modal */}
            <Modal 
                isOpen={analyticsModalOpen} 
                onClose={() => setAnalyticsModalOpen(false)} 
                title={`Analytics: Session #${selectedSession?.id}`}
                size="3xl"
            >
                {isAnalyticsLoading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-primary/5 border-none">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        <IndianRupee className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                                        <h3 className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-blue-500/5 border-none">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
                                        <ShoppingBag className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                                        <h3 className="text-2xl font-bold">{analytics.orderCount}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-500/5 border-none">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-orange-500/10 rounded-full text-orange-600">
                                        <Utensils className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Unique Items Sold</p>
                                        <h3 className="text-2xl font-bold">{analytics.topItems.length}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Selling Items */}
                        <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Most Ordered Food
                            </h3>
                            <Card className="border-border">
                                <CardContent className="p-0 max-h-64 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead className="text-right">Quantity Sold</TableHead>
                                                <TableHead className="text-right">Revenue Generated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.topItems.length > 0 ? (
                                                analytics.topItems.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                                                        <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-sm">₹{item.revenue.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs">
                                                        No items sold in this session.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

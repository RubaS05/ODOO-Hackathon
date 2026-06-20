import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, Banknote } from 'lucide-react';
import { apiService } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.orders.getAll();
            setOrders(data || []);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            let statusMatches = false;
            if (statusFilter === 'all') statusMatches = true;
            else if (statusFilter === 'draft') statusMatches = o.status === 'DRAFT';
            else if (statusFilter === 'pending') statusMatches = o.status === 'PENDING' || o.status === 'READY';
            else if (statusFilter === 'paid') statusMatches = o.status === 'PAID';
            else if (statusFilter === 'cancelled') statusMatches = o.status === 'CANCELLED';

            return matchesSearch && statusMatches;
        });
    }, [orders, searchTerm, statusFilter]);

    const handlePayBill = async (orderId) => {
        if (confirm('Are you sure you want to mark this bill as PAID?')) {
            try {
                await apiService.orders.updateStatus(orderId, 'PAID');
                loadOrders(); // Refresh orders
                setSelectedOrder(null);
            } catch (error) {
                console.error("Failed to pay bill", error);
                alert("Failed to pay bill. Please try again.");
            }
        }
    };

    const getPaymentStatusBadge = (status) => {
        if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
        if (status === 'DRAFT') return <Badge variant="secondary">Draft</Badge>;
        if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
        return <Badge variant="warning">Unpaid</Badge>;
    };

    const getFoodStatusBadge = (kitchenStatus, status) => {
        if (status === 'DRAFT' || status === 'CANCELLED') return <Badge variant="secondary">N/A</Badge>;
        if (kitchenStatus === 'COMPLETED') return <Badge variant="info">Delivered</Badge>;
        if (kitchenStatus === 'PREPARING') return <Badge variant="warning">Cooking</Badge>;
        return <Badge variant="secondary">To Cook</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Order Directory</h1>
                <p className="text-muted-foreground">Search and review drafts, active kitchen orders, and finalized bills.</p>
            </div>

            <Card className="glass border border-border/40">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <Input placeholder="Search by order number or customer name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9"/>
                    </div>

                    <div className="flex bg-card p-1 rounded-lg border border-border/60 w-full md:w-auto">
                        {['all', 'draft', 'pending', 'paid'].map((status) => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${statusFilter === status
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'}`}>
                                {status === 'all' ? 'All Orders' : status}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Date / Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Food Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">Loading orders...</TableCell>
                        </TableRow>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono font-bold text-xs">{order.orderNumber}</TableCell>
                                <TableCell className="text-xs">{new Date(order.orderDate).toLocaleString()}</TableCell>
                                <TableCell className="text-xs font-semibold">{order.customer?.name || 'Walk-in Guest'}</TableCell>
                                <TableCell className="text-xs capitalize">{order.orderType}</TableCell>
                                <TableCell className="font-mono font-bold text-xs">₹{order.totalAmount?.toFixed(2)}</TableCell>
                                <TableCell>{getPaymentStatusBadge(order.status)}</TableCell>
                                <TableCell>{getFoodStatusBadge(order.kitchenStatus, order.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                            <Eye size={14}/>
                                        </Button>
                                        {(order.status === 'PENDING' || order.status === 'READY') && (
                                            <Button variant="secondary" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600 hover:bg-emerald-100" onClick={() => handlePayBill(order.id)} title="Pay Bill">
                                                <Banknote size={14}/>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">No orders found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order Details: ${selectedOrder?.orderNumber}`} size="md">
                {selectedOrder && (
                    <div className="space-y-5 text-xs font-mono">
                        <div className="space-y-1 bg-accent/20 p-3 rounded-lg border border-border/20">
                            <div className="flex justify-between text-xxs">
                                <span className="text-muted-foreground">DATE:</span>
                                <span>{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xxs">
                                <span className="text-muted-foreground">SERVICE TYPE:</span>
                                <span className="capitalize">{selectedOrder.orderType}</span>
                            </div>
                            {selectedOrder.tableId && (
                                <div className="flex justify-between text-xxs">
                                    <span className="text-muted-foreground">TABLE:</span>
                                    <span>Table ID: {selectedOrder.tableId}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xxs">
                                <span className="text-muted-foreground">CUSTOMER:</span>
                                <span>{selectedOrder.customer?.name || 'Walk-in Guest'}</span>
                            </div>
                            <div className="flex justify-between text-xxs items-center">
                                <span className="text-muted-foreground">PAYMENT:</span>
                                <span>{getPaymentStatusBadge(selectedOrder.status)}</span>
                            </div>
                            <div className="flex justify-between text-xxs items-center">
                                <span className="text-muted-foreground">FOOD:</span>
                                <span>{getFoodStatusBadge(selectedOrder.kitchenStatus, selectedOrder.status)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-xxs text-muted-foreground uppercase border-b border-border/40 pb-1">Items</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedOrder.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between font-mono text-xxs">
                                        <div>
                                            <p className="font-bold">{item.productName || 'Item'}</p>
                                            <p className="text-muted-foreground mt-0.5">₹{item.unitPrice?.toFixed(2)} x {item.quantity}</p>
                                        </div>
                                        <span>₹{item.lineTotal?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-border pt-3 space-y-1">
                            <div className="flex justify-between text-xxs">
                                <span>Subtotal</span>
                                <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xxs">
                                <span>Tax</span>
                                <span>₹{selectedOrder.taxAmount?.toFixed(2)}</span>
                            </div>
                            {selectedOrder.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-500 font-bold">
                                    <span>Discount</span>
                                    <span>-₹{selectedOrder.discountAmount?.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-black text-sm pt-1 border-t border-border/30">
                                <span>TOTAL AMOUNT</span>
                                <span>₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                            </div>
                        </div>

                        {selectedOrder.notes && (
                            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xxs text-amber-500 italic">
                                Notes: {selectedOrder.notes}
                            </div>
                        )}

                        <div className="flex gap-2 border-t border-border/40 pt-4 font-sans">
                            <Button variant="outline" className="flex-1 font-bold text-xs h-9 cursor-pointer" onClick={() => window.print()}>
                                Print Receipt
                            </Button>
                            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'READY') && (
                                <Button className="flex-1 font-bold text-xs h-9 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handlePayBill(selectedOrder.id)}>
                                    Pay Bill (₹{selectedOrder.totalAmount?.toFixed(2)})
                                </Button>
                            )}
                            <Button variant="ghost" className="flex-1 text-xs h-9 cursor-pointer" onClick={() => setSelectedOrder(null)}>
                                Close View
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default Orders;

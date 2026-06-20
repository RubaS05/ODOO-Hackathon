import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, Banknote, DollarSign, CreditCard, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { apiService } from '../services/api';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';

export const Orders = () => {
    const { storeSettings } = usePOSStore();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Payment State (embedded in View Modal)
    const [selectedPaymentType, setSelectedPaymentType] = useState('cash');
    const [cashAmountReceived, setCashAmountReceived] = useState('');
    const [cardReference, setCardReference] = useState('');
    const [upiQrCode, setUpiQrCode] = useState('');

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
        return orders.filter(order => {
            const matchesSearch = 
                (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));
            
            let statusMatches = false;
            if (statusFilter === 'all') statusMatches = true;
            else if (statusFilter === 'draft') statusMatches = order.status === 'DRAFT';
            else if (statusFilter === 'pending') statusMatches = order.status === 'PENDING' || order.status === 'READY';
            else if (statusFilter === 'paid') statusMatches = order.status === 'PAID';
            else if (statusFilter === 'cancelled') statusMatches = order.status === 'CANCELLED';

            return matchesSearch && statusMatches;
        });
    }, [orders, searchTerm, statusFilter]);

    // Reset pagination when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Cash change calculation
    const changeDue = useMemo(() => {
        if (!selectedOrder) return 0;
        const received = parseFloat(cashAmountReceived);
        if (isNaN(received) || received < selectedOrder.totalAmount) return 0;
        return parseFloat((received - selectedOrder.totalAmount).toFixed(2));
    }, [cashAmountReceived, selectedOrder]);

    const handleQuickCash = (amount) => {
        setCashAmountReceived(amount.toString());
    };

    // Generate UPI QR Code when needed
    useEffect(() => {
        if (selectedOrder && (selectedOrder.status === 'PENDING' || selectedOrder.status === 'READY') && selectedPaymentType === 'upi') {
            const upiId = storeSettings?.upiId || 'prathaban009-1@okhdfcbank';
            const name = storeSettings?.businessName || 'GastroPOS';
            const url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${selectedOrder.totalAmount.toFixed(2)}&cu=INR`;
            QRCode.toDataURL(url, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setUpiQrCode(url))
                .catch(err => console.error(err));
        }
    }, [selectedOrder, selectedPaymentType, storeSettings]);

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setSelectedPaymentType('cash');
        setCashAmountReceived('');
        setCardReference('');
    };

    const confirmPayment = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;
        
        if (selectedPaymentType === 'cash') {
            const received = parseFloat(cashAmountReceived) || selectedOrder.totalAmount;
            if (received < selectedOrder.totalAmount) {
                alert('Received cash is less than order total.');
                return;
            }
        } else if (selectedPaymentType === 'card') {
            if (!cardReference.trim()) {
                alert('Please enter a card transaction reference.');
                return;
            }
        }

        try {
            await apiService.orders.updateStatus(selectedOrder.id, 'PAID');
            loadOrders(); // Refresh orders
            
            // Just update selected order locally so UI updates to paid instantly without closing
            setSelectedOrder(prev => ({ ...prev, status: 'PAID' }));
        } catch (error) {
            console.error("Failed to pay bill", error);
            alert("Failed to pay bill. Please try again.");
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
                        <TableHead>Customer Email</TableHead>
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
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">Loading orders...</TableCell>
                        </TableRow>
                    ) : paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono font-bold text-xs">{order.orderNumber}</TableCell>
                                <TableCell className="text-xs">{new Date(order.orderDate).toLocaleString()}</TableCell>
                                <TableCell className="text-xs font-semibold">{order.customerEmail || order.customerName || 'Walk-in Guest'}</TableCell>
                                <TableCell className="text-xs capitalize">{order.orderType}</TableCell>
                                <TableCell className="font-mono font-bold text-xs">₹{order.totalAmount?.toFixed(2)}</TableCell>
                                <TableCell>{getPaymentStatusBadge(order.status)}</TableCell>
                                <TableCell>{getFoodStatusBadge(order.kitchenStatus, order.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => handleViewOrder(order)}>
                                            <Eye size={14}/>
                                        </Button>
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
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

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
                                <div className="text-right">
                                    <span>{selectedOrder.customerName || 'Walk-in Guest'}</span>
                                    {selectedOrder.customerEmail && (
                                        <div className="text-muted-foreground">{selectedOrder.customerEmail}</div>
                                    )}
                                </div>
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

                        {/* Payment Section embedded for Unpaid Orders */}
                        {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'READY') && (
                            <form onSubmit={confirmPayment} className="mt-4 pt-4 border-t border-border/40 space-y-4">
                                <h4 className="font-bold text-xxs text-muted-foreground uppercase">Payment Details</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setSelectedPaymentType('cash')} className={`py-2 px-3 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${selectedPaymentType === 'cash' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-card border-border text-muted-foreground hover:bg-accent'}`}>
                                        <DollarSign size={16} />
                                        <span className="text-xxs font-bold">Cash</span>
                                    </button>
                                    <button type="button" onClick={() => setSelectedPaymentType('card')} className={`py-2 px-3 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${selectedPaymentType === 'card' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-accent'}`}>
                                        <CreditCard size={16} />
                                        <span className="text-xxs font-bold">Card</span>
                                    </button>
                                    <button type="button" onClick={() => setSelectedPaymentType('upi')} className={`py-2 px-3 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${selectedPaymentType === 'upi' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-accent'}`}>
                                        <QrCode size={16} />
                                        <span className="text-xxs font-bold">UPI</span>
                                    </button>
                                </div>

                                <div className="pt-2">
                                    {selectedPaymentType === 'cash' && (
                                        <div className="space-y-3 animate-in fade-in duration-200">
                                            <Input
                                                label="Amount Received (₹)"
                                                type="number"
                                                min={selectedOrder.totalAmount}
                                                step="0.01"
                                                value={cashAmountReceived}
                                                onChange={(e) => setCashAmountReceived(e.target.value)}
                                                placeholder={selectedOrder.totalAmount.toFixed(2)}
                                            />
                                            <div className="flex gap-2">
                                                {[selectedOrder.totalAmount, 500, 1000, 2000].filter(a => a >= selectedOrder.totalAmount).slice(0, 4).map(amt => (
                                                    <button key={amt} type="button" onClick={() => handleQuickCash(amt)} className="px-2 py-1 bg-accent hover:bg-accent/80 rounded border border-border text-xxs font-mono cursor-pointer">
                                                        ₹{amt === selectedOrder.totalAmount ? 'Exact' : amt}
                                                    </button>
                                                ))}
                                            </div>
                                            {changeDue > 0 && (
                                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs flex justify-between text-emerald-600 font-bold">
                                                    <span>Change Due:</span>
                                                    <span className="font-mono">₹{changeDue.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedPaymentType === 'card' && (
                                        <div className="space-y-3 animate-in fade-in duration-200">
                                            <Input
                                                label="Card Reference / Last 4 Digits *"
                                                value={cardReference}
                                                onChange={(e) => setCardReference(e.target.value)}
                                                placeholder="e.g. 4242 or AUTH-12345"
                                                required={selectedPaymentType === 'card'}
                                            />
                                            <p className="text-xxs text-muted-foreground">Swipe or insert card on the external terminal, then enter the reference.</p>
                                        </div>
                                    )}

                                    {selectedPaymentType === 'upi' && (
                                        <div className="animate-in fade-in duration-200 flex flex-col items-center">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-border/50">
                                                {upiQrCode ? (
                                                    <img src={upiQrCode} alt="UPI QR Code" className="w-24 h-24" />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 animate-pulse rounded flex items-center justify-center">
                                                        <QrCode className="text-gray-300" size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xxs font-mono mt-2 text-muted-foreground bg-accent px-2 py-1 rounded">
                                                {storeSettings?.upiId || 'prathaban009-1@okhdfcbank'}
                                            </p>
                                            <p className="text-xxs text-muted-foreground mt-1 text-center max-w-[200px]">
                                                Scan to pay <strong className="text-foreground">₹{selectedOrder.totalAmount?.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" className="w-full text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600">
                                    Mark Payment Completed
                                </Button>
                            </form>
                        )}

                        <div className="flex gap-2 border-t border-border/40 pt-4 mt-4 font-sans">
                            <Button variant="outline" className="flex-1 font-bold text-xs h-9 cursor-pointer" onClick={() => window.print()}>
                                Print Receipt
                            </Button>
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

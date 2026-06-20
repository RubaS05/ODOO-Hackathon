import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit2, Trash2, Calendar, ClipboardCheck, DollarSign } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, deleteOrder, loadDraftToCart } = usePOSStore();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleEditDraft = (order: any) => {
    loadDraftToCart(order);
    setSelectedOrder(null);
    navigate('/');
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderId);
      setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Paid</Badge>;
      case 'preparing':
        return <Badge variant="warning">Preparing</Badge>;
      case 'pending':
        return <Badge variant="info">Pending</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order Directory</h1>
        <p className="text-muted-foreground">Search and review drafts, active kitchen orders, and finalized bills.</p>
      </div>

      {/* Filters & Actions bar */}
      <Card className="glass border border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex bg-card p-1 rounded-lg border border-border/60 w-full md:w-auto">
            {['all', 'draft', 'pending', 'preparing', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'all' ? 'All Orders' : status}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Date / Time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono font-bold text-xs">{order.orderNumber}</TableCell>
                <TableCell className="text-xs">
                  {new Date(order.date).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-semibold">{order.customerName || 'Walk-in Guest'}</TableCell>
                <TableCell className="text-xs capitalize">{order.orderType}</TableCell>
                <TableCell className="font-mono font-bold text-xs">${order.total.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={14} />
                    </Button>
                    {order.status === 'draft' && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 cursor-pointer text-primary"
                          onClick={() => handleEditDraft(order)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                No orders matching the filters were found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs font-mono">
            {/* Details header */}
            <div className="space-y-1 bg-accent/20 p-3 rounded-lg border border-border/20">
              <div className="flex justify-between text-xxs">
                <span className="text-muted-foreground">DATE:</span>
                <span>{new Date(selectedOrder.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xxs">
                <span className="text-muted-foreground">SERVICE TYPE:</span>
                <span className="capitalize">{selectedOrder.orderType}</span>
              </div>
              {selectedOrder.tableNumber && (
                <div className="flex justify-between text-xxs">
                  <span className="text-muted-foreground">TABLE:</span>
                  <span>Table {selectedOrder.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-xxs">
                <span className="text-muted-foreground">CUSTOMER:</span>
                <span>{selectedOrder.customerName || 'Walk-in Guest'}</span>
              </div>
              <div className="flex justify-between text-xxs">
                <span className="text-muted-foreground">STATUS:</span>
                <span className="font-bold text-primary uppercase">{selectedOrder.status}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xxs text-muted-foreground uppercase border-b border-border/40 pb-1">Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between font-mono text-xxs">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-muted-foreground mt-0.5">${item.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <span>${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-xxs">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xxs">
                <span>Tax</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span>Discount</span>
                  <span>-${selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-border/30">
                <span>TOTAL AMOUNT</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            {selectedOrder.paymentMethod && (
              <div className="border-t border-border/40 pt-2 space-y-0.5 text-xxs">
                <p className="font-bold uppercase">Payment details</p>
                <p>Method: {selectedOrder.paymentMethod.toUpperCase()}</p>
                {selectedOrder.paymentDetails?.amountReceived && (
                  <>
                    <p>Cash Received: ${selectedOrder.paymentDetails.amountReceived.toFixed(2)}</p>
                    <p>Change Due: ${selectedOrder.paymentDetails.change.toFixed(2)}</p>
                  </>
                )}
                {selectedOrder.paymentDetails?.reference && (
                  <p className="truncate">Ref: {selectedOrder.paymentDetails.reference}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xxs text-amber-500 italic">
                Notes: {selectedOrder.notes}
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex gap-2 border-t border-border/40 pt-4 font-sans">
              <Button
                variant="outline"
                className="flex-1 font-bold text-xs h-9 cursor-pointer"
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              {selectedOrder.status === 'draft' ? (
                <Button
                  className="flex-1 font-bold text-xs h-9 cursor-pointer"
                  onClick={() => handleEditDraft(selectedOrder)}
                >
                  Edit Order
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="flex-1 text-xs h-9 cursor-pointer"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close View
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Orders;

import React, { useState, useMemo } from 'react';
import { ChefHat, Search, Clock, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const KDS: React.FC = () => {
  const { orders, updateOrderStatus } = usePOSStore();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Filter orders for KDS (excludes drafts and cancelled)
  const kdsOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'draft' || o.status === 'cancelled') return false;
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.tableNumber?.includes(searchTerm) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = orderTypeFilter === 'all' ? true : o.orderType === orderTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [orders, searchTerm, orderTypeFilter]);

  // Split orders into KDS columns
  const toCookOrders = useMemo(() => kdsOrders.filter((o) => o.status === 'pending'), [kdsOrders]);
  const preparingOrders = useMemo(() => kdsOrders.filter((o) => o.status === 'preparing'), [kdsOrders]);
  const completedOrders = useMemo(() => kdsOrders.filter((o) => o.status === 'completed'), [kdsOrders]);

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const handleCompletePreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'completed');
  };

  const getTicketHeaderColor = (orderType: string) => {
    switch (orderType) {
      case 'dine-in':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'takeaway':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivery':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-accent/40 text-muted-foreground';
    }
  };

  const renderOrderCard = (order: any, nextAction: () => void, actionText: string, actionIcon: React.ReactNode) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.date).getTime()) / 60000);
    return (
      <Card key={order.id} className="border-border/60 shadow-sm relative overflow-hidden animate-in fade-in duration-200">
        {/* Ticket Header */}
        <div className={`px-4 py-2 border-b flex justify-between items-center text-xs font-semibold ${getTicketHeaderColor(order.orderType)}`}>
          <div>
            <span className="font-bold font-mono">{order.orderNumber.slice(-7)}</span>
            {order.tableNumber && (
              <span className="ml-2 font-black text-foreground bg-background px-1.5 py-0.5 rounded text-xxs border border-border/20">
                T: {order.tableNumber}
              </span>
            )}
          </div>
          <span className="capitalize text-xxs font-bold">{order.orderType}</span>
        </div>

        <CardContent className="p-4 space-y-3.5 text-xs">
          {/* Elapsed Timer */}
          <div className="flex items-center gap-1 text-xxs text-muted-foreground">
            <Clock size={12} className={elapsedMinutes > 15 ? 'text-destructive animate-pulse' : 'text-primary'} />
            <span>Placed {elapsedMinutes} mins ago</span>
          </div>

          {/* Dish checklist */}
          <div className="space-y-2 border-y border-border/20 py-2.5 max-h-48 overflow-y-auto">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="font-black text-sm text-primary font-mono select-none">
                    {item.quantity}x
                  </span>
                  <p className="font-bold truncate leading-snug">{item.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Instructions Notes */}
          {order.notes && (
            <div className="p-2 rounded bg-amber-500/10 text-xxs text-amber-600 font-semibold italic border border-amber-500/20">
              Note: {order.notes}
            </div>
          )}

          {/* Action Trigger */}
          <Button
            onClick={nextAction}
            className="w-full text-xs font-bold py-2 cursor-pointer h-9"
            size="sm"
            variant={order.status === 'completed' ? 'outline' : 'primary'}
          >
            {actionIcon}
            <span className="ml-1.5">{actionText}</span>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kitchen Display (KDS)</h1>
          <p className="text-muted-foreground">Monitor cooking timers, review dish tickets, and coordinate order prep.</p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="glass border border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #, table #, or guest..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex bg-card p-1 rounded-lg border border-border/60 w-full md:w-auto">
            {['all', 'dine-in', 'takeaway', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderTypeFilter(type)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
                  orderTypeFilter === type
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type === 'all' ? 'All Channels' : type}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: To Cook */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-b-blue-500 pb-2">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              To Cook
            </h3>
            <Badge variant="info">{toCookOrders.length} Tickets</Badge>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {toCookOrders.length > 0 ? (
              toCookOrders.map((order) => 
                renderOrderCard(
                  order, 
                  () => handleStartPreparing(order.id), 
                  'Start Preparing', 
                  <ArrowRight size={14} />
                )
              )
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                No orders pending.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-b-amber-500 pb-2">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Preparing
            </h3>
            <Badge variant="warning">{preparingOrders.length} Tickets</Badge>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {preparingOrders.length > 0 ? (
              preparingOrders.map((order) => 
                renderOrderCard(
                  order, 
                  () => handleCompletePreparing(order.id), 
                  'Mark Completed', 
                  <CheckCircle size={14} />
                )
              )
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                No active preps.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-b-emerald-500 pb-2">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Served / Done
            </h3>
            <Badge variant="success">{completedOrders.length} Tickets</Badge>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {completedOrders.length > 0 ? (
              completedOrders.map((order) => 
                renderOrderCard(
                  order, 
                  () => {}, 
                  'Completed Check', 
                  <CheckCircle size={14} className="text-emerald-500" />
                )
              )
            ) : (
              <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                No tickets completed in this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default KDS;

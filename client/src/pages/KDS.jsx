import React, { useState, useMemo, useEffect } from 'react';
import { Search, Clock, ArrowRight, CheckCircle, Flame, Utensils, LayoutDashboard, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

const ColumnPagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center pt-3 border-t border-border/40 mt-3">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 cursor-pointer" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Prev</Button>
            <span className="text-xs text-muted-foreground font-bold">{currentPage} / {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 cursor-pointer" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</Button>
        </div>
    );
};

export const KDS = () => {
    const navigate = useNavigate();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    
    // Pagination states
    const [pageToCook, setPageToCook] = useState(1);
    const [pagePreparing, setPagePreparing] = useState(1);
    const [pageCompleted, setPageCompleted] = useState(1);
    const itemsPerPage = 10;

    // Fetch Kitchen Orders from API
    const { data: activeOrders = [], refetch } = useQuery({
        queryKey: ['kitchenOrders'],
        queryFn: apiService.kitchen.getOrders,
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
        const ws = new WebSocket(`${protocol}//${host}/ws/kds`);

        ws.onopen = () => console.log('KDS WebSocket Connected');
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'NEW_ORDER' && data.payload) {
                    queryClient.setQueryData(['kitchenOrders'], (old) => {
                        if (!old) return [data.payload];
                        // Avoid duplicates
                        if (old.find(o => o.id === data.payload.id)) return old;
                        return [...old, data.payload];
                    });
                } else if (data.type === 'UPDATE_ORDER' && data.payload) {
                    queryClient.setQueryData(['kitchenOrders'], (old) => {
                        if (!old) return [data.payload];
                        return old.map(o => o.id === data.payload.id ? data.payload : o);
                    });
                } else {
                    // Fallback to refetch
                    setTimeout(() => refetch(), 300);
                }
            } catch (err) {
                console.error("Error parsing websocket message", err);
            }
        };
        ws.onclose = () => console.log('KDS WebSocket Disconnected');

        return () => ws.close();
    }, [refetch, queryClient]);

    // Analytics Metrics
    const pendingOrders = useMemo(() => activeOrders.filter(o => o.kitchenStatus === 'TO_COOK' || o.kitchenStatus === 'PREPARING'), [activeOrders]);
    
    const { highestDish, oldestWait } = useMemo(() => {
        if (pendingOrders.length === 0) return { highestDish: null, oldestWait: 0 };
        
        const counts = {};
        let oldestTime = Date.now();
        
        pendingOrders.forEach(o => {
            const orderTime = new Date(o.orderDate).getTime();
            if (orderTime < oldestTime) oldestTime = orderTime;
            
            o.items.forEach(i => {
                counts[i.productName] = (counts[i.productName] || 0) + i.quantity;
            });
        });
        
        const sortedDishes = Object.entries(counts).sort((a,b) => b[1] - a[1]);
        const highestDishStr = sortedDishes.length > 0 ? `${sortedDishes[0][0]} (${sortedDishes[0][1]}x)` : null;
        
        const waitMins = Math.floor((Date.now() - oldestTime) / 60000);
        return { highestDish: highestDishStr, oldestWait: waitMins };
    }, [pendingOrders]);

    // Filter orders for Kanban
    const kdsOrders = useMemo(() => {
        return activeOrders.filter((o) => {
            const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.tableNumber?.includes(searchTerm) ||
                o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = orderTypeFilter === 'all' ? true : o.orderType === orderTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [activeOrders, searchTerm, orderTypeFilter]);

    // Split orders into KDS columns
    const toCookOrders = useMemo(() => kdsOrders.filter((o) => o.kitchenStatus === 'TO_COOK'), [kdsOrders]);
    const preparingOrders = useMemo(() => kdsOrders.filter((o) => o.kitchenStatus === 'PREPARING'), [kdsOrders]);
    const completedOrders = useMemo(() => kdsOrders.filter((o) => o.kitchenStatus === 'COMPLETED'), [kdsOrders]);

    // Apply pagination
    const paginatedToCook = toCookOrders.slice((pageToCook - 1) * itemsPerPage, pageToCook * itemsPerPage);
    const paginatedPreparing = preparingOrders.slice((pagePreparing - 1) * itemsPerPage, pagePreparing * itemsPerPage);
    const paginatedCompleted = completedOrders.slice((pageCompleted - 1) * itemsPerPage, pageCompleted * itemsPerPage);

    // Actions
    const handleUpdateStatus = async (orderId, newStatus) => {
        await apiService.kitchen.updateOrderStatus(orderId, newStatus);
        refetch();
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, orderId, sourceStatus) => {
        e.dataTransfer.setData("orderId", orderId);
        e.dataTransfer.setData("sourceStatus", sourceStatus);
        // Optional styling for drag
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");
        const sourceStatus = e.dataTransfer.getData("sourceStatus");
        if (orderId && sourceStatus && sourceStatus !== targetStatus) {
            handleUpdateStatus(orderId, targetStatus);
        }
    };

    const getTicketHeaderColor = (orderType) => {
        switch (orderType) {
            case 'dine-in': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'takeaway': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'delivery': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-accent/40 text-muted-foreground';
        }
    };
    
    const renderOrderCard = (order, nextAction, actionText, actionIcon) => {
        const elapsedMinutes = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / 60000);
        return (
        <Card 
            id={`order-card-${order.id}`}
            key={order.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, order.id, order.kitchenStatus)}
            onDragEnd={handleDragEnd}
            className="border-border/60 shadow-sm relative overflow-hidden animate-in fade-in duration-200 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
        >
            <div className={`px-4 py-2 border-b flex justify-between items-center text-xs font-semibold ${getTicketHeaderColor(order.orderType)}`}>
              <div>
                <span className="font-bold font-mono">{order.orderNumber}</span>
                {order.tableNumber && (<span className="ml-2 font-black text-foreground bg-background px-1.5 py-0.5 rounded text-xxs border border-border/20">
                    T: {order.tableNumber}
                  </span>)}
              </div>
              <span className="capitalize text-xxs font-bold">{order.orderType}</span>
            </div>

            <CardContent className="p-4 space-y-3.5 text-xs bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xxs text-muted-foreground">
                    <Clock size={12} className={elapsedMinutes > 15 ? 'text-destructive animate-pulse' : 'text-primary'}/>
                    <span className={elapsedMinutes > 15 ? 'text-destructive font-bold' : ''}>Placed {elapsedMinutes} mins ago</span>
                </div>
                {order.chefName && (
                    <div className="text-xxs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        By: {order.chefName}
                    </div>
                )}
              </div>

              <div className="space-y-2 border-y border-border/20 py-2.5 max-h-48 overflow-y-auto">
                {order.items.map((item) => (<div key={item.id} className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-black text-sm text-primary font-mono select-none">
                        {item.quantity}x
                      </span>
                      <p className="font-bold truncate leading-snug text-sm">{item.productName}</p>
                    </div>
                  </div>))}
              </div>

              {order.notes && (<div className="p-2 rounded bg-amber-500/10 text-xxs text-amber-600 font-semibold italic border border-amber-500/20">
                  Note: {order.notes}
                </div>)}

              {nextAction && (
                <Button onClick={nextAction} className="w-full text-xs font-bold py-2 cursor-pointer h-9" size="sm" variant={order.kitchenStatus === 'COMPLETED' ? 'outline' : 'primary'}>
                    {actionIcon}
                    <span className="ml-1.5">{actionText}</span>
                </Button>
              )}
            </CardContent>
        </Card>
        );
    };

    return (
    <div className="min-h-screen bg-background flex flex-col">
        {/* Fullscreen KDS Top Navbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold shadow-md shadow-primary/30">
                    P
                </div>
                <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Kitchen Display
                </h1>
            </div>
            
            <div className="flex items-center gap-6">
                {/* Metrics */}
                <div className="hidden md:flex gap-4 items-center mr-4">
                    <div className="flex flex-col items-center">
                        <span className="text-xxs text-muted-foreground uppercase font-bold tracking-widest">Pending</span>
                        <span className="font-mono font-black text-lg text-primary">{pendingOrders.length}</span>
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xxs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1"><Timer size={10}/> Oldest Wait</span>
                        <span className={`font-mono font-black text-lg ${oldestWait > 15 ? 'text-destructive' : 'text-amber-500'}`}>{oldestWait}m</span>
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-xxs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1"><Flame size={10} className="text-orange-500"/> Most Needed</span>
                        <span className="font-bold text-sm text-foreground max-w-[120px] truncate">{highestDish || 'None'}</span>
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => navigate('/pos')} className="font-bold text-xs h-9 cursor-pointer">
                    <LayoutDashboard size={14} className="mr-2" />
                    Back to POS
                </Button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Order Queue */}
            <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0 h-[calc(100vh-64px)] overflow-hidden hidden lg:flex">
                <div className="p-4 border-b border-border bg-muted/20">
                    <h2 className="font-black tracking-tight text-lg flex items-center gap-2">
                        <Utensils size={18} className="text-primary"/>
                        Order Queue
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold">{pendingOrders.length} active tickets</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {pendingOrders.map(order => {
                        const elapsedMinutes = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / 60000);
                        return (
                            <div 
                                key={`queue-${order.id}`} 
                                onClick={() => {
                                    document.getElementById(`order-card-${order.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="p-3 border border-border/50 rounded-lg hover:border-primary/40 cursor-pointer transition-colors bg-background"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold font-mono text-sm">{order.orderNumber}</span>
                                    <span className={`text-xs font-bold ${order.kitchenStatus === 'PREPARING' ? 'text-amber-500' : 'text-blue-500'}`}>
                                        {order.kitchenStatus === 'PREPARING' ? 'Cooking' : 'Waiting'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{order.orderType} {order.tableNumber && `• T: ${order.tableNumber}`}</span>
                                    <span className={elapsedMinutes > 15 ? 'text-destructive font-bold' : ''}>{elapsedMinutes}m</span>
                                </div>
                            </div>
                        );
                    })}
                    {pendingOrders.length === 0 && (
                        <div className="text-center p-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                            Queue is empty
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
              {/* Filters Card */}
              <Card className="glass border border-border/40">
                <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input placeholder="Search by ticket #, table #, or guest..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9"/>
              </div>

              <div className="flex bg-card p-1 rounded-lg border border-border/60 w-full md:w-auto">
                {['all', 'dine-in', 'takeaway', 'delivery'].map((type) => (
                  <button key={type} onClick={() => setOrderTypeFilter(type)} className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${orderTypeFilter === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {type === 'all' ? 'All Channels' : type}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Kanban Board columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
            {/* Column 1: To Cook */}
            <div 
                className="flex flex-col bg-muted/20 border border-border rounded-xl p-4 transition-colors hover:bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'TO_COOK')}
            >
              <div className="flex items-center justify-between border-b-2 border-b-blue-500 pb-3 mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"/>
                  To Cook
                </h3>
                <Badge variant="info" className="px-2">{toCookOrders.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2 custom-scrollbar">
                {paginatedToCook.length > 0 ? (
                    paginatedToCook.map((order) => renderOrderCard(order, () => handleUpdateStatus(order.id, 'PREPARING'), 'Start Preparing', <ArrowRight size={14}/>))
                ) : (
                    <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg bg-background/50">
                        Drop orders here or wait for new ones.
                    </div>
                )}
              </div>
              <ColumnPagination currentPage={pageToCook} totalPages={Math.ceil(toCookOrders.length / itemsPerPage)} onPageChange={setPageToCook} />
            </div>

            {/* Column 2: Preparing */}
            <div 
                className="flex flex-col bg-muted/20 border border-border rounded-xl p-4 transition-colors hover:bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'PREPARING')}
            >
              <div className="flex items-center justify-between border-b-2 border-b-amber-500 pb-3 mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"/>
                  Preparing
                </h3>
                <Badge variant="warning" className="px-2">{preparingOrders.length}</Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2 custom-scrollbar">
                {paginatedPreparing.length > 0 ? (
                    paginatedPreparing.map((order) => renderOrderCard(order, () => handleUpdateStatus(order.id, 'COMPLETED'), 'Mark Completed', <CheckCircle size={14}/>))
                ) : (
                    <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg bg-background/50">
                        Drop orders here when you start cooking.
                    </div>
                )}
              </div>
              <ColumnPagination currentPage={pagePreparing} totalPages={Math.ceil(preparingOrders.length / itemsPerPage)} onPageChange={setPagePreparing} />
            </div>

            {/* Column 3: Completed */}
            <div 
                className="flex flex-col bg-muted/20 border border-border rounded-xl p-4 transition-colors hover:bg-muted/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'COMPLETED')}
            >
              <div className="flex items-center justify-between border-b-2 border-b-emerald-500 pb-3 mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>
                  Served / Done
                </h3>
                <Badge variant="success" className="px-2">{completedOrders.length}</Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-2 custom-scrollbar">
                {paginatedCompleted.length > 0 ? (
                    paginatedCompleted.map((order) => renderOrderCard(order, null, '', null)) // No action button needed
                ) : (
                    <div className="py-12 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg bg-background/50">
                        Drop orders here when finished.
                    </div>
                )}
              </div>
              <ColumnPagination currentPage={pageCompleted} totalPages={Math.ceil(completedOrders.length / itemsPerPage)} onPageChange={setPageCompleted} />
            </div>
          </div>
        </div>
      </div>
    </div>
    );
};
export default KDS;

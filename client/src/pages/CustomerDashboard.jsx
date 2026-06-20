import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
import { apiService } from '../services/api';
import { Pagination } from '../components/ui/Pagination';

const STORAGE_KEY = 'cafe_customer';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const STATUS_LABELS = {
    pending: { label: 'Order Received', color: '#f59e0b', icon: '🕐' },
    paid: { label: 'Paid & Received', color: '#3b82f6', icon: '💳' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', icon: '✅' },
    preparing: { label: 'Being Prepared', color: '#8b5cf6', icon: '👨‍🍳' },
    ready: { label: 'Ready to Serve', color: '#10b981', icon: '🍽️' },
    completed: { label: 'Completed', color: '#6b7280', icon: '✔️' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✖️' },
};

// ─────────────────────────────────────────────────────────────────────────────
const CustomerDashboard = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();

    const { tables, orders, createCustomerOrder } = usePOSStore();
    const table = tables.find((t) => String(t.id) === String(tableId));

    // Customer identity from localStorage
    const [customer, setCustomer] = useState(null);
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) { navigate(`/table/${tableId}`, { replace: true }); return; }
        try { setCustomer(JSON.parse(stored)); }
        catch { navigate(`/table/${tableId}`, { replace: true }); }
    }, [tableId, navigate]);

    // Fetch Table if missing
    const [tableNotFound, setTableNotFound] = useState(!table);
    useEffect(() => {
        const fetchTable = async () => {
            if (!table && tableId) {
                try {
                    const fetchedTable = await apiService.public.getTableById(tableId);
                    if (fetchedTable) {
                        const mapped = {
                            ...fetchedTable,
                            number: fetchedTable.tableNumber,
                            floor: fetchedTable.floorName || fetchedTable.floor?.name || '1st Floor',
                            status: fetchedTable.status ? fetchedTable.status.toLowerCase() : (fetchedTable.active ? 'available' : 'unavailable'),
                            occupiedMembers: fetchedTable.occupiedMembers || 0,
                        };
                        usePOSStore.getState().addTable(mapped);
                        setTableNotFound(false);
                    } else {
                        setTableNotFound(true);
                    }
                } catch (err) {
                    console.error("Failed to fetch table", err);
                    setTableNotFound(true);
                }
            } else if (table) {
                setTableNotFound(false);
            }
        };
        fetchTable();
    }, [table, tableId]);

    // Active tab
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'cart' | 'orders'
    const [ordersPage, setOrdersPage] = useState(1);
    const ordersPerPage = 10;

    // Order type (Dine-in vs Takeaway)
    const [orderType, setOrderType] = useState('dine-in');

    // Category filter
    const [selectedCatId, setSelectedCatId] = useState('all');

    // Cart state
    const [cart, setCart] = useState([]);

    // Payment modal
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [paying, setPaying] = useState(false);
    const [lastOrderId, setLastOrderId] = useState(null);

    // API Data
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [prods, cats] = await Promise.all([
                    apiService.public.getProducts(),
                    apiService.public.getCategories()
                ]);
                setProducts(prods || []);
                setCategories(cats || []);
            } catch (err) {
                console.error("Failed to load menu data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // ── Orders for this table / customer ──
    const myOrders = useMemo(() => {
        return orders.filter(
            (o) => String(o.tableId) === String(tableId) && (o.customerEmail === customer?.email || o.source === 'customer')
        ).sort((a, b) => new Date(b.date || b.orderDate) - new Date(a.date || a.orderDate));
    }, [orders, tableId, customer]);

    // Current (latest non-completed) order
    const currentOrder = myOrders.find((o) => !['completed', 'cancelled'].includes(o.status?.toLowerCase()));

    // ── Load Table Orders ──
    useEffect(() => {
        const fetchOrders = async () => {
            if (tableId && customer?.email) {
                try {
                    const fetched = await apiService.public.getTableOrders(tableId, customer.email);
                    const mapped = (fetched || []).map(o => ({
                        ...o,
                        status: o.status ? o.status.toLowerCase() : 'pending',
                        kitchenStatus: o.kitchenStatus ? o.kitchenStatus.toLowerCase() : 'received',
                        source: 'customer'
                    }));
                    usePOSStore.setState({ orders: mapped });
                } catch (err) {
                    console.error("Failed to load table orders", err);
                }
            }
        };
        fetchOrders();
    }, [tableId, customer]);

    // ── Order Tracking Real-time WebSocket & Polling Fallback ──
    useEffect(() => {
        if (!tableId || !customer?.email) return;

        // WebSocket setup for real-time status updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:8082' : window.location.host;
        let ws;
        let reconnectTimer;

        const connect = () => {
            ws = new WebSocket(`${protocol}//${host}/ws/kds`);

            ws.onopen = () => console.log('Customer KDS WebSocket Connected');
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if ((data.type === 'NEW_ORDER' || data.type === 'UPDATE_ORDER') && data.payload) {
                        const payload = data.payload;
                        // Check if it belongs to this table and customer
                        if (String(payload.tableId) === String(tableId) && payload.customerEmail === customer.email) {
                            const mapped = {
                                ...payload,
                                status: payload.status ? payload.status.toLowerCase() : 'pending',
                                kitchenStatus: payload.kitchenStatus ? payload.kitchenStatus.toLowerCase() : 'received',
                                source: 'customer'
                            };
                            usePOSStore.getState().updateOrder(payload.id, mapped);
                        }
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message", err);
                }
            };

            ws.onclose = () => {
                console.log('Customer KDS WebSocket Disconnected, reconnecting...');
                reconnectTimer = setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                console.error("Customer KDS WebSocket Error", err);
                ws.close();
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimer);
        };
    }, [tableId, customer, currentOrder, activeTab]);

    // ── Filtered products ──
    const visibleProducts = useMemo(() => {
        const active = products.filter((p) => p.available !== false);
        if (selectedCatId === 'all') return active;
        return active.filter((p) => p.categoryId === selectedCatId);
    }, [products, selectedCatId]);

    // ── Cart helpers ──
    const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === productId);
            if (!existing) return prev;
            if (existing.quantity === 1) return prev.filter((i) => i.id !== productId);
            return prev.map((i) => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
        });
    };

    const getQty = (productId) => cart.find((i) => i.id === productId)?.quantity || 0;

    // ── Payment & Actions ──
    const isDineIn = orderType === 'dine-in';

    const handleAction = async () => {
        if (cart.length === 0) return;
        setPaymentOpen(true);
    };

    const confirmPayment = () => {
        setPaying(true);
        setTimeout(async () => {
            try {
                if (cart.length > 0) {
                    const newOrderDto = await apiService.public.createOrder({
                        tableId: table?.id,
                        customerId: customer?.id,
                        customerEmail: customer?.email,
                        customerName: customer?.name,
                        notes: `Customer Name: ${customer?.name}, Email: ${customer?.email}`,
                        orderType: 'dine-in',
                        paymentMethod,
                        sendToKitchen: true,
                        items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
                    });
                    
                    createCustomerOrder({
                        ...newOrderDto,
                        status: 'paid',
                        paymentMethod,
                    });
                }

                setCart([]);
                setPaymentOpen(false);
                setPaying(false);
                setActiveTab('orders');
            } catch (err) {
                console.error("Payment failed", err);
                alert("Failed to process payment.");
                setPaying(false);
            }
        }, 1200);
    };

    // ── Logout ──
    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/table/${tableId}`, { replace: true });
    };

    if (!table) {
        return (
            <div style={pageStyle}>
                {tableNotFound && (
                    <p style={{ color: '#f87171', textAlign: 'center' }}>❌ Table not found.</p>
                )}
                {!tableNotFound && !table && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>Loading table...</p>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading menu...</p>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
          <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* ── Header ── */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>🍽️ Table {table.number}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Hi, {customer?.name}!</div>
                </div>
                <button onClick={handleLogout} style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Change User
                </button>
            </div>

            {/* ── Order Type Toggle Removed (Only Dine-In) ── */}

            {/* ── Tabs ── */}
            <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
            }}>
                {[
                    { id: 'menu', label: '🍴 Menu' },
                    { id: 'cart', label: `🛒 Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
                    { id: 'orders', label: '📋 My Orders' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '14px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                            color: activeTab === tab.id ? '#f59e0b' : '#64748b',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >{tab.label}</button>
                ))}
            </div>

            {/* ──────────── MENU TAB ──────────── */}
            {activeTab === 'menu' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {/* Category scroll */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
                        <button
                            onClick={() => setSelectedCatId('all')}
                            style={catChipStyle(selectedCatId === 'all')}
                        >All</button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCatId(cat.id)}
                                style={catChipStyle(selectedCatId === cat.id)}
                            >{cat.name}</button>
                        ))}
                    </div>

                    {/* Products grid */}
                    {visibleProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '14px' }}>
                            No items available right now.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                            {visibleProducts.map((product) => {
                                const qty = getQty(product.id);
                                return (
                                    <div key={product.id} style={productCardStyle}>
                                        {/* Product image placeholder */}
                                        <div style={{
                                            height: '90px',
                                            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '32px',
                                            marginBottom: '10px',
                                        }}>
                                            {product.emoji || '🍽️'}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', lineHeight: 1.3 }}>{product.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{fmt(product.price)}</div>
                                        {qty === 0 ? (
                                            <button onClick={() => addToCart(product)} style={addBtnStyle}>+ Add</button>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                <button onClick={() => removeFromCart(product.id)} style={qtyBtnStyle}>−</button>
                                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{qty}</span>
                                                <button onClick={() => addToCart(product)} style={qtyBtnStyle}>+</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ──────────── CART TAB ──────────── */}
            {activeTab === 'cart' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '14px' }}>
                            Your cart is empty.<br />
                            <button onClick={() => setActiveTab('menu')} style={{ marginTop: '16px', ...addBtnStyle }}>Browse Menu</button>
                        </div>
                    ) : (
                        <>
                            {cart.map((item) => (
                                    <div key={item.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: '#ffffff',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                {fmt(item.price)} each
                                            </div>
                                        </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={() => removeFromCart(item.id)} style={qtyBtnStyle}>−</button>
                                        <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button onClick={() => addToCart(item)} style={qtyBtnStyle}>+</button>
                                        <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '60px', textAlign: 'right' }}>
                                            {fmt(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Total */}
                            <div style={{
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: '20px', color: '#f59e0b' }}>{fmt(cartTotal)}</span>
                            </div>

                            <button onClick={handleAction} style={{
                                ...addBtnStyle,
                                padding: '16px',
                                fontSize: '15px',
                                width: '100%',
                                borderRadius: '12px',
                            }}>
                                💳 Pay & Place Order
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ──────────── ORDERS TAB ──────────── */}
            {activeTab === 'orders' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Current Order Status */}
                    {currentOrder && (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '16px',
                            border: `1px solid ${STATUS_LABELS[currentOrder.status?.toLowerCase()]?.color || '#f59e0b'}44`,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Current Order
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '28px' }}>{STATUS_LABELS[currentOrder.status?.toLowerCase()]?.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '16px' }}>
                                        {STATUS_LABELS[currentOrder.status?.toLowerCase()]?.label || currentOrder.status}
                                        {currentOrder.kitchenStatus && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)' }}>{currentOrder.kitchenStatus}</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {currentOrder.orderNumber}
                                    </div>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                                <div style={{
                                    height: '100%',
                                    borderRadius: '99px',
                                    background: STATUS_LABELS[currentOrder.status?.toLowerCase()]?.color || '#f59e0b',
                                    width: {
                                        pending: '20%', paid: '20%', confirmed: '40%', preparing: '65%', ready: '90%', completed: '100%', cancelled: '100%'
                                    }[currentOrder.status?.toLowerCase()] || '20%',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                            {/* Items */}
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                {currentOrder.items.map((oi) => (
                                    <div key={oi.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span>{oi.name} ×{oi.quantity}</span>
                                        <span>{fmt(oi.lineTotal)}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                    <span>{currentOrder.items.reduce((s, i) => s + i.quantity, 0)} Items</span>
                                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{fmt(currentOrder.totalAmount || currentOrder.total)}</span>
                                </div>
                                {isDineIn && currentOrder.status?.toLowerCase() !== 'paid' && (
                                    <button
                        onClick={() => setPaymentOpen(true)}
                                        style={{
                                            marginTop: '12px', width: '100%', padding: '12px', borderRadius: '10px',
                                            border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                                            background: currentOrder.kitchenStatus?.toLowerCase() === 'completed' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                                            color: currentOrder.kitchenStatus?.toLowerCase() === 'completed' ? '#fff' : 'rgba(255,255,255,0.5)',
                                            transition: 'all 0.2s'
                                        }}>
                                        💳 Pay Bill
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Past Orders */}
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: currentOrder ? '8px' : '0' }}>
                        Order History
                    </div>
                    {(() => {
                        const pastOrders = myOrders.filter((o) => o.id !== currentOrder?.id);
                        if (pastOrders.length === 0 && !currentOrder) {
                            return (
                                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0', fontSize: '14px' }}>
                                    No orders yet. Start ordering from the menu!
                                </div>
                            );
                        }
                        const totalPages = Math.ceil(pastOrders.length / ordersPerPage);
                        const paginatedOrders = pastOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

                        return (
                            <>
                                {paginatedOrders.map((order) => (
                                    <div key={order.id} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '13px' }}>{order.orderNumber}</span>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
                                                background: `${STATUS_LABELS[order.status?.toLowerCase()]?.color || '#6b7280'}22`,
                                                color: STATUS_LABELS[order.status?.toLowerCase()]?.color || '#6b7280',
                                                border: `1px solid ${STATUS_LABELS[order.status?.toLowerCase()]?.color || '#6b7280'}44`,
                                            }}>
                                                {STATUS_LABELS[order.status?.toLowerCase()]?.label || order.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            {order.items.map((oi) => `${oi.name} ×${oi.quantity}`).join(' · ')}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#f59e0b', marginTop: '8px' }}>
                                            {fmt(order.totalAmount || order.total)}
                                        </div>
                                    </div>
                                ))}
                                <Pagination currentPage={ordersPage} totalPages={totalPages} onPageChange={setOrdersPage} />
                            </>
                        );
                    })()}
                </div>
            )}

            {/* ──────────── PAYMENT MODAL ──────────── */}
            {paymentOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '20px 20px 0 0',
                        padding: '28px 24px 36px',
                        width: '100%',
                        maxWidth: '480px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 -10px 25px rgba(0,0,0,0.05)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>💳 Payment</h2>
                            <button onClick={() => setPaymentOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Order summary */}
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                            {isDineIn && currentOrder && (
                                <div style={{ fontSize: '12px', color: '#64748b', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                                    Payment for Order: <b style={{ color: '#0f172a' }}>{currentOrder.orderNumber}</b>
                                </div>
                            )}
                            {!isDineIn && cart.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#475569' }}>
                                    <span>{item.name} ×{item.quantity}</span>
                                    <span style={{ color: '#0f172a' }}>{fmt(item.price * item.quantity)}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: isDineIn ? 'none' : '1px solid #e2e8f0', marginTop: isDineIn ? '0' : '10px', paddingTop: isDineIn ? '0' : '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>
                                <span>Total</span>
                                <span style={{ color: '#f59e0b' }}>{fmt(isDineIn && currentOrder ? currentOrder.totalAmount || currentOrder.total : cartTotal)}</span>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Payment Method
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                            {[
                                { id: 'card', label: '💳 Card' },
                                { id: 'upi', label: '📱 UPI' },
                            ].map((pm) => (
                                <button
                                    key={pm.id}
                                    onClick={() => setPaymentMethod(pm.id)}
                                    style={{
                                        padding: '12px 8px',
                                        borderRadius: '10px',
                                        border: paymentMethod === pm.id ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                                        background: paymentMethod === pm.id ? 'rgba(245,158,11,0.1)' : '#ffffff',
                                        color: paymentMethod === pm.id ? '#f59e0b' : '#64748b',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }}
                                >{pm.label}</button>
                            ))}
                        </div>

                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: 'rgba(16,185,129,0.9)' }}>
                            ℹ️ This is a demo payment. No real charge will be made.
                        </div>

                        <button
                            onClick={confirmPayment}
                            disabled={paying}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: paying ? '#374151' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 800,
                                cursor: paying ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {paying ? '⏳ Processing…' : `Confirm & Pay ${fmt(cartTotal)}`}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const pageStyle = {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
    margin: 0,
    padding: 0,
};

const catChipStyle = (active) => ({
    padding: '7px 16px',
    borderRadius: '99px',
    border: active ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
    background: active ? 'rgba(245,158,11,0.1)' : '#ffffff',
    color: active ? '#f59e0b' : '#64748b',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
});

const productCardStyle = {
    background: '#ffffff',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
};

const addBtnStyle = {
    background: '#f59e0b',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
    padding: '8px 12px',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 6px rgba(245,158,11,0.2)',
};

const qtyBtnStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    margin: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
};

export default CustomerDashboard;

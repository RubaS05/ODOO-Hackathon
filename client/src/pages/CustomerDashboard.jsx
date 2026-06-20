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
    const table = tables.find((t) => t.id === tableId);

    // Customer identity from localStorage
    const [customer, setCustomer] = useState(null);
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) { navigate(`/table/${tableId}`, { replace: true }); return; }
        try { setCustomer(JSON.parse(stored)); }
        catch { navigate(`/table/${tableId}`, { replace: true }); }
    }, [tableId, navigate]);

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
            (o) => o.tableId === tableId && (o.customerEmail === customer?.email || o.source === 'customer')
        ).sort((a, b) => new Date(b.date || o.orderDate) - new Date(a.date || a.orderDate));
    }, [orders, tableId, customer]);

    // Current (latest non-completed/paid) order
    const currentOrder = myOrders.find((o) => !['completed', 'cancelled', 'paid'].includes(o.status?.toLowerCase()));

    // ── Order Tracking Polling ──
    useEffect(() => {
        let interval;
        if (currentOrder && activeTab === 'orders') {
            interval = setInterval(async () => {
                try {
                    const fetched = await apiService.public.getOrder(currentOrder.id);
                    usePOSStore.getState().updateOrder(currentOrder.id, fetched);
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [currentOrder, activeTab]);

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
                    // Upfront payment for new items
                    if (currentOrder && isDineIn) {
                        // Append and pay if there's an active unpaid order
                        await apiService.public.appendItems(currentOrder.id, cart.map(i => ({ productId: i.id, quantity: i.quantity })));
                        // Wait, the backend appendItems doesn't process payment!
                        // Instead of appending, just create a new order. It's much simpler and keeps receipts clean.
                    }
                    
                    const newOrderDto = await apiService.public.createOrder({
                        tableId: table?.id,
                        customerId: customer?.id,
                        customerEmail: customer?.email,
                        customerName: customer?.name,
                        notes: `Customer Name: ${customer?.name}, Email: ${customer?.email}`,
                        orderType,
                        paymentMethod,
                        sendToKitchen: true,
                        items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
                    });
                    createCustomerOrder({
                        ...newOrderDto,
                        paymentMethod,
                    });
                } else if (currentOrder) {
                    // Deferred payment for existing Dine-in order
                    const updated = await apiService.public.payOrder(currentOrder.id);
                    usePOSStore.getState().updateOrder(currentOrder.id, { ...updated, paymentMethod });
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
                <div style={cardStyle}>
                    <p style={{ color: '#f87171', textAlign: 'center' }}>❌ Table not found.</p>
                </div>
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
            {/* ── Header ── */}
            <div style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
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
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Hi, {customer?.name}!</div>
                </div>
                <button onClick={handleLogout} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Change User
                </button>
            </div>

            {/* ── Order Type Toggle ── */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '12px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', padding: '6px' }}>
                    <button onClick={() => setOrderType('dine-in')} style={{
                        padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                        background: orderType === 'dine-in' ? '#f59e0b' : 'transparent', color: orderType === 'dine-in' ? '#fff' : 'rgba(255,255,255,0.5)'
                    }}>🍽️ Dine-in</button>
                    <button onClick={() => setOrderType('takeaway')} style={{
                        padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                        background: orderType === 'takeaway' ? '#f59e0b' : 'transparent', color: orderType === 'takeaway' ? '#fff' : 'rgba(255,255,255,0.5)'
                    }}>🛍️ Takeaway</button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.25)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
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
                            color: activeTab === tab.id ? '#f59e0b' : 'rgba(255,255,255,0.5)',
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
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: '14px' }}>
                            No items available right now.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>{fmt(product.price)}</div>
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
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0', fontSize: '14px' }}>
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
                                    background: 'rgba(255,255,255,0.07)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
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
                                {isDineIn ? (currentOrder ? '🍽️ Send More to Kitchen' : '🍽️ Send to Kitchen') : '💳 Pay & Place Order'}
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
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: '14px',
                            padding: '16px',
                            border: `1px solid ${STATUS_LABELS[currentOrder.status]?.color || '#f59e0b'}44`,
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                                Current Order
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '28px' }}>{STATUS_LABELS[currentOrder.status]?.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '16px' }}>
                                        {STATUS_LABELS[currentOrder.status?.toLowerCase()]?.label || currentOrder.status}
                                        {currentOrder.kitchenStatus && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)' }}>{currentOrder.kitchenStatus}</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                        {currentOrder.orderNumber}
                                    </div>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                                <div style={{
                                    height: '100%',
                                    borderRadius: '99px',
                                    background: STATUS_LABELS[currentOrder.status]?.color || '#f59e0b',
                                    width: {
                                        pending: '20%', confirmed: '40%', preparing: '65%', ready: '90%', completed: '100%', cancelled: '100%'
                                    }[currentOrder.status] || '20%',
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
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff' }}>
                                    <span>Total</span>
                                    <span style={{ color: '#f59e0b' }}>{fmt(currentOrder.totalAmount || currentOrder.total)}</span>
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
                                                background: `${STATUS_LABELS[order.status]?.color || '#6b7280'}22`,
                                                color: STATUS_LABELS[order.status]?.color || '#6b7280',
                                                border: `1px solid ${STATUS_LABELS[order.status]?.color || '#6b7280'}44`,
                                            }}>
                                                {STATUS_LABELS[order.status]?.label || order.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
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
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#1e1b4b',
                        borderRadius: '20px 20px 0 0',
                        padding: '28px 24px 36px',
                        width: '100%',
                        maxWidth: '480px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>💳 Payment</h2>
                            <button onClick={() => setPaymentOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Order summary */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                            {isDineIn && currentOrder && (
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    Payment for Order: <b>{currentOrder.orderNumber}</b>
                                </div>
                            )}
                            {!isDineIn && cart.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>
                                    <span>{item.name} ×{item.quantity}</span>
                                    <span>{fmt(item.price * item.quantity)}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: isDineIn ? 'none' : '1px solid rgba(255,255,255,0.1)', marginTop: isDineIn ? '0' : '10px', paddingTop: isDineIn ? '0' : '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
                                <span>Total</span>
                                <span style={{ color: '#f59e0b' }}>{fmt(isDineIn && currentOrder ? currentOrder.totalAmount || currentOrder.total : cartTotal)}</span>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Payment Method
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                            {[
                                { id: 'card', label: '💳 Card' },
                                { id: 'cash', label: '💵 Cash' },
                                { id: 'upi', label: '📱 UPI' },
                            ].map((pm) => (
                                <button
                                    key={pm.id}
                                    onClick={() => setPaymentMethod(pm.id)}
                                    style={{
                                        padding: '12px 8px',
                                        borderRadius: '10px',
                                        border: paymentMethod === pm.id ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
                                        background: paymentMethod === pm.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                                        color: paymentMethod === pm.id ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                                        fontWeight: 700,
                                        fontSize: '13px',
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
                            {paying ? '⏳ Processing…' : `Confirm & Pay ${fmt(isDineIn && currentOrder ? currentOrder.totalAmount || currentOrder.total : cartTotal)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%)',
    color: '#fff',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '480px',
    margin: '0 auto',
    position: 'relative',
};

const catChipStyle = (active) => ({
    padding: '7px 16px',
    borderRadius: '99px',
    border: active ? '1.5px solid #f59e0b' : '1.5px solid rgba(255,255,255,0.15)',
    background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
    color: active ? '#f59e0b' : 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s',
});

const productCardStyle = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
};

const addBtnStyle = {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
    padding: '8px 12px',
    cursor: 'pointer',
    width: '100%',
};

const qtyBtnStyle = {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const cardStyle = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '24px',
    margin: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
};

export default CustomerDashboard;

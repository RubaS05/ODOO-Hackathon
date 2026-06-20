import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, UserPlus, Receipt, ChefHat, Ticket, Check, QrCode, CreditCard, DollarSign, AlertTriangle } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { apiService } from '../services/api';

export const POSOrder = () => {
    // Store selectors for cart and UI state
    const {
        cart, activeCustomer, activeTable, activeCoupon, orderType, cartNotes,
        customers, coupons, paymentMethods, addToCart, removeFromCart,
        updateCartQuantity, clearCart, assignCustomer, assignTable, applyCoupon,
        setOrderType, setCartNotes, getCartTotals, addCustomer
    } = usePOSStore();

    // Local state for API data
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    // Modals state
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);

    // New customer form state
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');

    // Payment Method Selection & Inputs
    const [selectedPaymentType, setSelectedPaymentType] = useState('cash');
    const [cashAmountReceived, setCashAmountReceived] = useState('');
    const [cardReference, setCardReference] = useState('');
    const [checkoutSuccess, setCheckoutSuccess] = useState(null);

    // Checkout Details Interceptor
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [checkoutAction, setCheckoutAction] = useState(null);
    const [checkoutEmail, setCheckoutEmail] = useState('');
    const [checkoutName, setCheckoutName] = useState('');
    const [checkoutPhone, setCheckoutPhone] = useState('');

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const session = await apiService.sessions.getCurrent();
                
                if (session && session.status === 'OPEN') {
                    setCurrentSession(session);
                    const prods = await apiService.products.getAll();
                    const cats = await apiService.categories.getAll();
                    setProducts(prods || []);
                    setCategories(cats || []);
                } else {
                    setCurrentSession(null);
                }
            } catch (err) {
                console.error("Failed to fetch POS data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Totals calculations
    const { subtotal, tax, discount, total } = getCartTotals();

    // Filter products by category and search query
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const catId = product.category?.id || product.categoryId;
            const matchesCategory = selectedCategoryId ? catId === selectedCategoryId : true;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategoryId, searchQuery]);

    // Cash change calculation
    const changeDue = useMemo(() => {
        const received = parseFloat(cashAmountReceived);
        if (isNaN(received) || received < total)
            return 0;
        return parseFloat((received - total).toFixed(2));
    }, [cashAmountReceived, total]);

    const handleAddProduct = (product) => {
        addToCart(product);
    };

    const submitOrderAPI = async (isSendToKitchen, paymentMethod = null, isDraft = false) => {
        if (!currentSession) {
            alert("No active session found. Please open a session first.");
            return;
        }

        const items = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        }));

        // Sanitize IDs: if they are local mock strings (e.g. 'tab-123'), send null instead
        const tId = activeTable?.id;
        const cId = activeCustomer?.id;
        const sanitizedTableId = typeof tId === 'string' && tId.startsWith('tab-') ? null : tId;
        const sanitizedCustomerId = typeof cId === 'string' && cId.startsWith('cust-') ? null : cId;

        const orderData = {
            sessionId: currentSession.id,
            orderType: orderType,
            notes: cartNotes,
            tableId: sanitizedTableId,
            customerId: sanitizedCustomerId,
            customerEmail: checkoutEmail || undefined,
            customerName: checkoutName || undefined,
            customerPhone: checkoutPhone || undefined,
            items: items,
            sendToKitchen: isSendToKitchen,
            paymentMethod: paymentMethod
        };

        try {
            const createdOrder = await apiService.orders.create(orderData);
            
            // Check if we need to add a new customer to the local store
            if (checkoutEmail) {
                const existingCustomer = customers.find(c => c.email === checkoutEmail);
                if (!existingCustomer) {
                    addCustomer({
                        id: createdOrder.customerId || `cust-${Date.now()}`,
                        name: checkoutName || checkoutEmail.split('@')[0],
                        email: checkoutEmail,
                        phoneNumber: checkoutPhone || '',
                    });
                }
            }

            clearCart();
            setCheckoutSuccess({
                ...createdOrder,
                kitchenSuccess: isSendToKitchen,
                draftSuccess: isDraft
            });
            setReceiptModalOpen(true);
        } catch (error) {
            console.error("Order creation failed", error);
            alert("Failed to create order");
        }
    };

    const triggerCheckout = (action) => {
        if (cart.length === 0) return;
        if (activeCustomer && activeCustomer.email) {
            submitOrderAPI(action.isSendToKitchen, action.paymentMethod, action.isDraft);
        } else {
            setCheckoutAction(action);
            setCheckoutModalOpen(true);
        }
    };

    const handleSendToKitchen = () => {
        triggerCheckout({ isSendToKitchen: true, paymentMethod: null, isDraft: false });
    };

    const handleSendReceipt = () => {
        triggerCheckout({ isSendToKitchen: false, paymentMethod: null, isDraft: true });
    };

    const handleConfirmCheckoutDetails = (e) => {
        e.preventDefault();
        if (!checkoutEmail) return;
        setCheckoutModalOpen(false);
        submitOrderAPI(checkoutAction.isSendToKitchen, checkoutAction.paymentMethod, checkoutAction.isDraft);
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setCheckoutEmail(val);
        if (val.includes('@')) {
            const parsedName = val.split('@')[0];
            // Only auto-fill if the user hasn't explicitly typed a completely different name
            setCheckoutName(parsedName);
        }
    };

    const handleCheckoutPayment = () => {
        if (cart.length === 0) return;

        let paymentMethod = selectedPaymentType;
        if (selectedPaymentType === 'cash') {
            const received = parseFloat(cashAmountReceived) || total;
            if (received < total) {
                alert('Received cash is less than order total.');
                return;
            }
        } else if (selectedPaymentType === 'card') {
            if (!cardReference.trim()) {
                alert('Please enter a card transaction reference.');
                return;
            }
        }

        triggerCheckout({ isSendToKitchen: true, paymentMethod: paymentMethod, isDraft: false });
        setCashAmountReceived('');
        setCardReference('');
    };

    const handleQuickCash = (amount) => {
        setCashAmountReceived(amount.toString());
    };

    const handleAddNewCustomer = async (e) => {
        e.preventDefault();
        if (!newCustomerName || !newCustomerEmail) return;
        
        try {
            const custData = {
                name: newCustomerName,
                email: newCustomerEmail,
                phoneNumber: newCustomerPhone || '',
            };
            const newCust = { id: `cust-${Date.now()}`, ...custData };
            assignCustomer(newCust);
            setNewCustomerName('');
            setNewCustomerEmail('');
            setNewCustomerPhone('');
            setCustomerModalOpen(false);
        } catch (err) {
            console.error("Failed to add customer", err);
        }
    };

    const getCategoryColor = (categoryId) => {
        return categories.find((c) => c.id === categoryId)?.color || '#6b7280';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-bold">Loading POS...</p>
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-200">
                    <AlertTriangle size={48} className="text-orange-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-orange-700">No Active Session</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    You cannot take orders because there is no open POS session. 
                    Please ask your manager or an Admin to open a session first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Point of Sale</h1>
                    <p className="text-muted-foreground">Add products to cart, choose service type, and complete checkout.</p>
                </div>
                <div className="flex bg-card p-1 rounded-lg border border-border/60">
                    {['dine-in', 'takeaway', 'delivery'].map((type) => (
                        <button key={type} onClick={() => setOrderType(type)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${orderType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <section className="lg:col-span-5 space-y-4">
                    <Card className="glass border border-border/40">
                        <div className="p-4 space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                                <button onClick={() => setSelectedCategoryId(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${selectedCategoryId === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent'}`}>
                                    All Items
                                </button>
                                {categories.map((cat) => (
                                    <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} style={{ borderColor: selectedCategoryId === cat.id ? cat.color : 'transparent' }} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${selectedCategoryId === cat.id ? 'bg-card text-foreground' : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                                        <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-1">
                        {filteredProducts.length > 0 ? (filteredProducts.map((prod) => {
                            const catId = prod.category?.id || prod.categoryId;
                            const catColor = getCategoryColor(catId);
                            return (
                                <Card key={prod.id} className="cursor-pointer hover:border-primary/50 transition-all select-none hover:scale-[1.02] flex flex-col justify-between" onClick={() => handleAddProduct(prod)}>
                                    <div className="h-2" style={{ backgroundColor: catColor }} />
                                    <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                                        <div>
                                            <h4 className="font-bold text-sm leading-snug line-clamp-1">{prod.name}</h4>
                                            <p className="text-xxs text-muted-foreground line-clamp-2 mt-1 min-h-[24px]">
                                                {prod.description || 'No description available'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="font-mono font-bold text-xs">₹{prod.price?.toFixed(2)}</span>
                                            <Badge variant="secondary" className="text-xxs font-mono">
                                                {prod.unitOfMeasure || prod.unit || 'Item'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                                No products found matches the filter.
                            </div>
                        )}
                    </div>
                </section>

                <section className="lg:col-span-7 space-y-4">
                    <Card className="glass border border-border/40 flex flex-col h-[650px]">
                        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/40">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={16} className="text-primary" />
                                <span className="font-bold text-sm">Active Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0} className="text-xs text-muted-foreground hover:text-destructive cursor-pointer h-7 px-2">
                                Clear Cart
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length > 0 ? (cart.map((item) => (
                                <div key={item.product.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-accent/20 border border-border/20">
                                    <div className="min-w-0 flex-1">
                                        <h5 className="font-bold text-xs truncate leading-normal">{item.product.name}</h5>
                                        <span className="text-xxs text-muted-foreground font-mono">
                                            ₹{item.product.price?.toFixed(2)} / {item.product.unitOfMeasure || item.product.unit || 'Item'}
                                        </span>
                                    </div>
                                    <div className="flex items-center border border-border rounded-md bg-background">
                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 text-xs hover:bg-accent font-bold cursor-pointer">-</button>
                                        <span className="px-2.5 text-xs font-mono font-bold">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 text-xs hover:bg-accent font-bold cursor-pointer">+</button>
                                    </div>
                                    <div className="text-right pl-2">
                                        <span className="font-mono font-bold text-xs">
                                            ₹{(item.product.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                    <ShoppingCart size={32} className="opacity-30 mb-2" />
                                    <p className="text-xs">Your cart is empty.</p>
                                    <p className="text-xxs opacity-80 mt-0.5">Click items in the grid to add them.</p>
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="px-4 py-2 border-t border-border/30 bg-card/10">
                                <input type="text" placeholder="Add order notes / special instructions..." value={cartNotes} onChange={(e) => setCartNotes(e.target.value)} className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none py-1" />
                            </div>
                        )}

                        <div className="px-4 py-2 border-t border-border/30 bg-card/20 flex flex-wrap gap-2 justify-between items-center text-xxs">
                            <button onClick={() => setCustomerModalOpen(true)} className="flex items-center gap-1 text-primary hover:underline font-bold">
                                <UserPlus size={12} />
                                {activeCustomer ? `Customer: ${activeCustomer.name}` : 'Assign Customer'}
                            </button>
                            <button onClick={() => setCouponModalOpen(true)} className="flex items-center gap-1 text-purple-500 hover:underline font-bold">
                                <Ticket size={12} />
                                {activeCoupon ? `Coupon: ${activeCoupon.code}` : 'Apply Coupon'}
                            </button>
                        </div>

                        <div className="p-4 border-t border-border bg-card/40 space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax</span>
                                <span className="font-mono">₹{tax.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-500 font-semibold">
                                    <span>Discount</span>
                                    <span className="font-mono">-₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-border/50">
                                <span>Total Amount</span>
                                <span className="font-mono text-base text-primary">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border grid grid-cols-2 gap-2 bg-card/60">
                            <Button variant="outline" size="sm" onClick={handleSendReceipt} disabled={cart.length === 0} className="text-xs cursor-pointer">
                                <Receipt size={14} className="mr-1.5" />
                                Draft Order
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleSendToKitchen} disabled={cart.length === 0} className="text-xs cursor-pointer hover:bg-emerald-500 hover:text-white">
                                <ChefHat size={14} className="mr-1.5" />
                                Send To Kitchen
                            </Button>
                        </div>
                    </Card>
                </section>
            </div>

            {/* Receipt Modal */}
            <Modal isOpen={receiptModalOpen} onClose={() => { setReceiptModalOpen(false); setCheckoutSuccess(null); }} title="POS Order Submitted" size="sm">
                {checkoutSuccess && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="text-center py-2">
                            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                                <Check size={28} />
                            </div>
                            <h3 className="font-bold text-base">
                                {checkoutSuccess.kitchenSuccess ? 'Sent to Kitchen KDS!' : checkoutSuccess.draftSuccess ? 'Draft Order Created!' : 'Checkout Complete!'}
                            </h3>
                            <p className="text-xxs text-muted-foreground mt-0.5">Order Number: {checkoutSuccess.orderNumber}</p>
                        </div>
                        <div className="p-4 border-2 border-dashed border-border rounded-lg bg-card text-xs font-mono space-y-3">
                            <div className="text-center border-b border-border/40 pb-2 space-y-1">
                                <p className="font-bold uppercase">GASTRO POS OUTLET</p>
                                <p className="text-xxs text-muted-foreground">{new Date().toLocaleString()}</p>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {checkoutSuccess.items?.map((oi) => (
                                    <div key={oi.id} className="flex justify-between text-xxs">
                                        <span className="truncate max-w-[150px]">{oi.name || `Item ${oi.productId}`} x{oi.quantity}</span>
                                        <span>₹{oi.lineTotal?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-border/60 pt-2 space-y-1 text-xxs">
                                <div className="flex justify-between text-xxs">
                                    <span>Subtotal</span>
                                    <span>₹{checkoutSuccess.subtotal?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>₹{checkoutSuccess.taxAmount?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-black text-sm pt-1 border-t border-border/30">
                                    <span>TOTAL</span>
                                    <span>₹{checkoutSuccess.totalAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 font-bold text-xs h-9" onClick={() => window.print()}>
                                Print Receipt
                            </Button>
                            <Button className="flex-1 font-bold text-xs h-9" onClick={() => { setReceiptModalOpen(false); setCheckoutSuccess(null); }}>
                                New Transaction
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Assign Customer Modal */}
            <Modal isOpen={customerModalOpen} onClose={() => { setCustomerModalOpen(false); setCustomerSearchQuery(''); }} title="Assign Customer" size="md">
                <div className="space-y-6">
                    {/* Existing Customers List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-xs uppercase text-muted-foreground">Select Existing Customer</h4>
                        </div>
                        <div className="mb-3 relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or email..." 
                                value={customerSearchQuery}
                                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                            {(() => {
                                const filteredCustomers = customers.filter(c => 
                                    (c.name && c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())) || 
                                    (c.email && c.email.toLowerCase().includes(customerSearchQuery.toLowerCase()))
                                );
                                return filteredCustomers.length > 0 ? filteredCustomers.map(cust => (
                                    <div key={cust.id} 
                                        onClick={() => { assignCustomer(cust); setCustomerModalOpen(false); setCustomerSearchQuery(''); }}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${activeCustomer?.id === cust.id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'}`}>
                                        <div className="font-bold text-sm">{cust.name}</div>
                                        <div className="text-xxs text-muted-foreground mt-0.5">{cust.email}</div>
                                        <div className="text-xxs text-muted-foreground">{cust.phoneNumber || 'No phone'}</div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground col-span-2">No customers match your search.</p>
                                );
                            })()}
                        </div>
                        {activeCustomer && (
                            <Button variant="outline" size="sm" className="mt-3 text-xs text-destructive hover:bg-destructive hover:text-white" onClick={() => { assignCustomer(null); setCustomerModalOpen(false); }}>
                                Remove Selected Customer
                            </Button>
                        )}
                    </div>

                    <hr className="border-border/60" />

                    {/* Create New Customer Form */}
                    <form onSubmit={handleAddNewCustomer} className="space-y-4">
                        <h4 className="font-bold text-xs uppercase text-muted-foreground">Or Create New</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Full Name *"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                required
                                placeholder="John Doe"
                            />
                            <Input
                                label="Email Address *"
                                type="email"
                                value={newCustomerEmail}
                                onChange={(e) => setNewCustomerEmail(e.target.value)}
                                required
                                placeholder="john@example.com"
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="Mobile Number (Optional)"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    placeholder="+1 555-0199"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-bold text-xs">
                            <UserPlus size={14} className="mr-2" />
                            Create & Assign Customer
                        </Button>
                    </form>
                </div>
            </Modal>

            {/* Checkout Customer Details Modal */}
            <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="Customer Email (Required for E-Receipt)">
                <form onSubmit={handleConfirmCheckoutDetails} className="space-y-4">
                    <div className="bg-accent/20 border border-border p-3 rounded-md mb-4 text-xs text-muted-foreground">
                        Please provide an email to send the PDF receipt once the order is paid. We will automatically link or create a profile.
                    </div>
                    <Input
                        label="Email Address (Required)"
                        type="email"
                        placeholder="customer@example.com"
                        value={checkoutEmail}
                        onChange={handleEmailChange}
                        required
                    />
                    <Input
                        label="Customer Name"
                        placeholder="Auto-filled from email..."
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                    />
                    <Input
                        label="Mobile Number (Optional)"
                        placeholder="+1 555-0199"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                    />
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setCheckoutModalOpen(false)} className="flex-1 text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                            Continue to Checkout
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
export default POSOrder;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Initial Mock Data
const initialCategories = [];
const initialProducts = [];
const initialTables = [];
const initialCustomers = [];
const initialCoupons = [];
const initialPromotions = [];
const initialUsers = [];
const initialPaymentMethods = [];
const initialOrders = [];
export const usePOSStore = create()(persist((set, get) => ({
    // Authentication
    currentUser: null,
    isAuthenticated: false,
    // POS Session
    posSession: null,           // { openedAt, openedBy, openingBalance }
    lastSession: null,          // { closedAt, closingAmount, totalOrders, openedAt }
    // POS Cart state
    cart: [],
    activeCustomer: null,
    activeTable: null,
    activeCoupon: null,
    orderType: 'dine-in',
    cartNotes: '',
    // DB Collections
    categories: initialCategories,
    products: initialProducts,
    tables: initialTables,
    customers: initialCustomers,
    orders: initialOrders,
    paymentMethods: initialPaymentMethods,
    coupons: initialCoupons,
    promotions: initialPromotions,
    users: initialUsers,
    // UI
    darkMode: false, // Default to a gorgeous light theme
    // Auth Functions
    setCurrentUser: (user) => {
        set({ currentUser: user, isAuthenticated: !!user });
    },
    initializeAuth: () => {
        const token = localStorage.getItem('pos_token');
        if (!token) {
            set({ currentUser: null, isAuthenticated: false });
            return;
        }
        // In a complete implementation, you might want to call an endpoint like /api/auth/me to fetch user details using the token
        // For now, if we have a token but no user, we'll try to rely on state persistence or just assume they need to log in again if refreshed.
        // Zustand persistence should technically keep `currentUser` hydrated if we add it to partialize.
    },
    logout: () => {
        localStorage.removeItem('pos_token');
        set({ currentUser: null, isAuthenticated: false, cart: [], activeCustomer: null, activeTable: null, activeCoupon: null, posSession: null });
    },
    // POS Session actions
    openSession: (openingBalance = 0) => {
        const { currentUser } = get();
        set({
            posSession: {
                openedAt: new Date().toISOString(),
                openedBy: currentUser?.name || 'Unknown',
                openingBalance,
            }
        });
    },
    closeSession: () => {
        const { posSession, orders } = get();
        if (!posSession) return;
        // Calculate session sales total from orders created after session open
        const sessionOpenTime = new Date(posSession.openedAt).getTime();
        const sessionOrders = orders.filter(o =>
            o.status === 'completed' && new Date(o.date).getTime() >= sessionOpenTime
        );
        const closingAmount = sessionOrders.reduce((sum, o) => sum + o.total, 0);
        const lastSession = {
            openedAt: posSession.openedAt,
            openedBy: posSession.openedBy,
            closedAt: new Date().toISOString(),
            closingAmount: parseFloat(closingAmount.toFixed(2)),
            totalOrders: sessionOrders.length,
        };
        set({ posSession: null, lastSession });
        return lastSession;
    },
    // Cart management
    addToCart: (product) => {
        set((state) => {
            const existingItemIndex = state.cart.findIndex((item) => item.product.id === product.id);
            if (existingItemIndex > -1) {
                const updatedCart = [...state.cart];
                updatedCart[existingItemIndex].quantity += 1;
                return { cart: updatedCart };
            }
            else {
                return { cart: [...state.cart, { product, quantity: 1 }] };
            }
        });
    },
    removeFromCart: (productId) => {
        set((state) => ({
            cart: state.cart.filter((item) => item.product.id !== productId),
        }));
    },
    updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeFromCart(productId);
            return;
        }
        set((state) => ({
            cart: state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item),
        }));
    },
    clearCart: () => {
        set({ cart: [], activeCustomer: null, activeTable: null, activeCoupon: null, cartNotes: '' });
    },
    assignCustomer: (customer) => set({ activeCustomer: customer }),
    assignTable: (table) => {
        set({ activeTable: table });
        if (table) {
            set({ orderType: 'dine-in' });
        }
    },
    applyCoupon: (coupon) => set({ activeCoupon: coupon }),
    setOrderType: (orderType) => {
        set({ orderType });
        if (orderType !== 'dine-in') {
            set({ activeTable: null });
        }
    },
    setCartNotes: (cartNotes) => set({ cartNotes }),
    getCartTotals: () => {
        const { cart, activeCoupon } = get();
        let subtotal = 0;
        let tax = 0;
        cart.forEach((item) => {
            const itemTotal = item.product.price * item.quantity;
            subtotal += itemTotal;
            tax += itemTotal * item.product.taxRate;
        });
        let discount = 0;
        if (activeCoupon) {
            if (activeCoupon.discountType === 'percentage') {
                discount = subtotal * (activeCoupon.value / 100);
            }
            else {
                discount = activeCoupon.value;
            }
            // Make sure discount doesn't exceed subtotal
            discount = Math.min(discount, subtotal);
        }
        const total = Math.max(0, subtotal + tax - discount);
        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        };
    },
    // Database CRUD Operations
    // Categories
    addCategory: (cat) => set((state) => ({
        categories: [...state.categories, { ...cat, id: `cat-${Date.now()}` }],
    })),
    updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
    deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        // Clean up products in this category
        products: state.products.filter((p) => p.categoryId !== id),
    })),
    // Products
    addProduct: (prod) => set((state) => ({
        products: [...state.products, { ...prod, id: `prod-${Date.now()}` }],
    })),
    updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
    deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
    })),
    setTableQrDataUrl: (id, dataUrl) => set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? { ...t, qrDataUrl: dataUrl } : t)),
    })),
    setTables: (tables) => set({ tables }),
    addTable: (table) => set((state) => {
        return {
            tables: [...state.tables, table]
        };
    }),
    updateTable: (id, updates) => set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
    deleteTable: (id) => set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
    })),
    setTableStatus: (id, status, currentOrderId) => set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? { ...t, status, currentOrderId } : t)),
    })),
    addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
    })),
    updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o))
    })),
    // Customer self-ordering (no POS session required)
    createCustomerOrder: (orderDto) => {
        // Map DTO back to frontend format if needed, but since it's from API, we can just save it.
        const newOrder = {
            ...orderDto,
            status: orderDto.status?.toLowerCase() || 'pending',
            kitchenStatus: orderDto.kitchenStatus?.toLowerCase() || 'received',
            source: 'customer',
        };
        set((state) => ({ orders: [newOrder, ...state.orders] }));
        if (orderDto.table?.id || orderDto.tableId) {
            get().setTableStatus(orderDto.table?.id || orderDto.tableId, 'occupied', newOrder.id);
        }
        return newOrder;
    },
    // Customers
    addCustomer: (cust) => set((state) => ({
        customers: [...state.customers, { ...cust, id: `cust-${Date.now()}` }],
    })),
    updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
    deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
    })),
    // Orders
    createOrder: (paymentDetails, isDraft = false) => {
        const { cart, activeCustomer, activeTable, orderType, cartNotes, getCartTotals } = get();
        const { subtotal, tax, discount, total } = getCartTotals();
        const orderItems = cart.map((item, idx) => ({
            id: `oi-${Date.now()}-${idx}`,
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            taxRate: item.product.taxRate,
            lineTotal: parseFloat((item.product.price * item.quantity).toFixed(2)),
        }));
        const newOrder = {
            id: `ord-${Date.now()}`,
            orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(get().orders.length + 1).padStart(3, '0')}`,
            date: new Date().toISOString(),
            customerId: activeCustomer?.id,
            customerName: activeCustomer?.name || 'Guest Customer',
            tableId: activeTable?.id,
            tableNumber: activeTable?.number,
            items: orderItems,
            subtotal,
            tax,
            discount,
            total,
            status: isDraft ? 'draft' : 'pending',
            orderType,
            notes: cartNotes,
        };
        if (paymentDetails) {
            newOrder.status = 'completed';
            newOrder.paymentDetails = paymentDetails;
            newOrder.paymentMethod = paymentDetails.amountReceived ? 'cash' : paymentDetails.reference ? 'card' : 'upi';
        }
        // Add to orders list
        set((state) => ({
            orders: [newOrder, ...state.orders],
        }));
        // If it's a Dine-In table order, link to table
        if (activeTable) {
            get().setTableStatus(activeTable.id, isDraft || newOrder.status === 'completed' ? 'available' : 'occupied', isDraft || newOrder.status === 'completed' ? undefined : newOrder.id);
        }
        // Clear Cart
        get().clearCart();
        return newOrder;
    },
    updateOrderStatus: (id, status) => set((state) => {
        const updatedOrders = state.orders.map((o) => (o.id === id ? { ...o, status } : o));
        const matchedOrder = updatedOrders.find((o) => o.id === id);
        // If order gets completed/cancelled, free up the associated table
        if (matchedOrder && matchedOrder.tableId && (status === 'completed' || status === 'cancelled')) {
            const table = state.tables.find(t => t.id === matchedOrder.tableId);
            if (table && table.currentOrderId === id) {
                table.status = 'available';
                table.currentOrderId = undefined;
            }
        }
        return { orders: updatedOrders, tables: [...state.tables] };
    }),
    deleteOrder: (id) => set((state) => {
        const orderToDelete = state.orders.find(o => o.id === id);
        if (orderToDelete && orderToDelete.tableId) {
            const table = state.tables.find(t => t.id === orderToDelete.tableId);
            if (table && table.currentOrderId === id) {
                table.status = 'available';
                table.currentOrderId = undefined;
            }
        }
        return {
            orders: state.orders.filter((o) => o.id !== id),
            tables: [...state.tables],
        };
    }),
    loadDraftToCart: (order) => {
        // Load items
        const cartItems = order.items.map((oi) => {
            const product = get().products.find((p) => p.id === oi.productId) || {
                id: oi.productId,
                name: oi.name,
                price: oi.price,
                taxRate: oi.taxRate,
                categoryId: 'cat-1',
                unit: 'Pcs',
            };
            return { product, quantity: oi.quantity };
        });
        // Find customer & table
        const customer = get().customers.find((c) => c.id === order.customerId) || null;
        const table = get().tables.find((t) => t.id === order.tableId) || null;
        set({
            cart: cartItems,
            activeCustomer: customer,
            activeTable: table,
            orderType: order.orderType,
            cartNotes: order.notes || '',
        });
        // Remove from list so it can be re-saved / updated
        get().deleteOrder(order.id);
    },
    // Payment Methods
    addPaymentMethod: (pm) => set((state) => ({
        paymentMethods: [...state.paymentMethods, { ...pm, id: `pm-${Date.now()}` }],
    })),
    updatePaymentMethod: (id, updates) => set((state) => ({
        paymentMethods: state.paymentMethods.map((pm) => (pm.id === id ? { ...pm, ...updates } : pm)),
    })),
    togglePaymentMethodStatus: (id) => set((state) => ({
        paymentMethods: state.paymentMethods.map((pm) => (pm.id === id ? { ...pm, status: !pm.status } : pm)),
    })),
    // Coupons
    addCoupon: (coup) => set((state) => ({
        coupons: [...state.coupons, { ...coup, id: `coup-${Date.now()}` }],
    })),
    updateCoupon: (id, updates) => set((state) => ({
        coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
    deleteCoupon: (id) => set((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
    })),
    // Promotions
    addPromotion: (promo) => set((state) => ({
        promotions: [...state.promotions, { ...promo, id: `promo-${Date.now()}` }],
    })),
    updatePromotion: (id, updates) => set((state) => ({
        promotions: state.promotions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
    deletePromotion: (id) => set((state) => ({
        promotions: state.promotions.filter((p) => p.id !== id),
    })),
    // Users
    addUser: (user) => set((state) => ({
        users: [...state.users, { ...user, id: `user-${Date.now()}`, status: 'active' }],
    })),
    updateUser: (id, updates) => set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),
    deleteUser: (id) => set((state) => ({
        users: state.users.filter((u) => u.id !== id),
    })),
    // UI
    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}), {
    name: 'restaurant-pos-storage',
    partialize: (state) => ({
        categories: state.categories,
        products: state.products,
        tables: state.tables,
        customers: state.customers,
        orders: state.orders,
        paymentMethods: state.paymentMethods,
        coupons: state.coupons,
        promotions: state.promotions,
        users: state.users,
        darkMode: state.darkMode,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        lastSession: state.lastSession,
        posSession: state.posSession,
    }),
    version: 1,
}));

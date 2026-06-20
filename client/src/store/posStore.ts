import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Category, Product, Table, Customer, Order, OrderItem,
  PaymentMethod, Coupon, Promotion, User, CartItem 
} from '../types';

interface POSState {
  // Auth State
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Active Cart / POS State
  cart: CartItem[];
  activeCustomer: Customer | null;
  activeTable: Table | null;
  activeCoupon: Coupon | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  cartNotes: string;

  // Mock Database Arrays
  categories: Category[];
  products: Product[];
  tables: Table[];
  customers: Customer[];
  orders: Order[];
  paymentMethods: PaymentMethod[];
  coupons: Coupon[];
  promotions: Promotion[];
  users: User[];

  // UI State
  darkMode: boolean;

  // Auth Actions
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, username: string) => Promise<void>;
  logout: () => void;

  // Cart Actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  assignCustomer: (customer: Customer | null) => void;
  assignTable: (table: Table | null) => void;
  applyCoupon: (coupon: Coupon | null) => void;
  setOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  setCartNotes: (notes: string) => void;
  getCartTotals: () => { subtotal: number; tax: number; discount: number; total: number };

  // Database CRUD Actions
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Tables
  addTable: (table: Omit<Table, 'id' | 'status'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  setTableStatus: (id: string, status: Table['status'], currentOrderId?: string) => void;

  // Customers
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Orders
  createOrder: (paymentDetails?: Order['paymentDetails'], isDraft?: boolean) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;
  loadDraftToCart: (order: Order) => void;

  // Payment Methods
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void;
  togglePaymentMethodStatus: (id: string) => void;

  // Coupons
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  // Promotions
  addPromotion: (promo: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;

  // Users
  addUser: (user: Omit<User, 'id' | 'status'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // UI Actions
  toggleDarkMode: () => void;
}

// Initial Mock Data
const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Burgers', color: '#ec4899' }, // Pink
  { id: 'cat-2', name: 'Pizza', color: '#f97316' },   // Orange
  { id: 'cat-3', name: 'Pasta', color: '#eab308' },   // Yellow
  { id: 'cat-4', name: 'Desserts', color: '#a855f7' },// Purple
  { id: 'cat-5', name: 'Drinks', color: '#06b6d4' },   // Cyan
  { id: 'cat-6', name: 'Sides', color: '#10b981' },    // Emerald
];

const initialProducts: Product[] = [
  { id: 'prod-1', name: 'Signature Cheeseburger', categoryId: 'cat-1', price: 9.99, taxRate: 0.08, unit: 'Pcs', description: 'Flame-grilled beef patty, cheddar, lettuce, tomato, pickles, and chef sauce.' },
  { id: 'prod-2', name: 'Spicy Chicken Burger', categoryId: 'cat-1', price: 8.99, taxRate: 0.08, unit: 'Pcs', description: 'Crispy fried spicy chicken breast, slaw, jalapenos, and sriracha mayo.' },
  { id: 'prod-3', name: 'Pepperoni Supreme Pizza', categoryId: 'cat-2', price: 14.99, taxRate: 0.10, unit: '12"', description: 'Loaded with double pepperoni, mozzarella, and marinara sauce.' },
  { id: 'prod-4', name: 'Margherita Garden Pizza', categoryId: 'cat-2', price: 12.99, taxRate: 0.10, unit: '12"', description: 'Fresh tomatoes, mozzarella, sweet basil, and extra virgin olive oil.' },
  { id: 'prod-5', name: 'Creamy Carbonara Pasta', categoryId: 'cat-3', price: 11.99, taxRate: 0.08, unit: 'Portion', description: 'Fettuccine with crispy pancetta, parmesan, egg yolk, and cracked black pepper.' },
  { id: 'prod-6', name: 'Spaghetti Bolognese', categoryId: 'cat-3', price: 10.99, taxRate: 0.08, unit: 'Portion', description: 'Slow-cooked beef and herb ragu over spaghetti, topped with parmesan.' },
  { id: 'prod-7', name: 'Chocolate Lava Cake', categoryId: 'cat-4', price: 6.99, taxRate: 0.05, unit: 'Portion', description: 'Warm chocolate cake with a molten fudge core, served with vanilla ice cream.' },
  { id: 'prod-8', name: 'New York Cheesecake', categoryId: 'cat-4', price: 5.99, taxRate: 0.05, unit: 'Slice', description: 'Rich and creamy cheesecake with a graham cracker crust and strawberry compote.' },
  { id: 'prod-9', name: 'Craft IPA Beer', categoryId: 'cat-5', price: 6.50, taxRate: 0.15, unit: 'Can', description: 'Locally brewed citrusy IPA with a crisp, hoppy finish.' },
  { id: 'prod-10', name: 'Fresh Lemonade', categoryId: 'cat-5', price: 3.50, taxRate: 0.05, unit: 'Glass', description: 'Squeezed lemons, fresh mint leaves, cane sugar, and chilled mineral water.' },
  { id: 'prod-11', name: 'Truffle Fries', categoryId: 'cat-6', price: 5.99, taxRate: 0.08, unit: 'Portion', description: 'Golden French fries tossed in white truffle oil, rosemary, and parmesan.' },
  { id: 'prod-12', name: 'Mozzarella Sticks', categoryId: 'cat-6', price: 6.49, taxRate: 0.08, unit: 'Pcs', description: 'Crispy breaded mozzarella logs, served with warm marinara dipping sauce.' },
];

const initialTables: Table[] = [
  // 1st Floor
  { id: 'tab-1', number: '101', seats: 2, status: 'available', floor: '1st Floor' },
  { id: 'tab-2', number: '102', seats: 4, status: 'occupied', floor: '1st Floor', currentOrderId: 'ord-101' },
  { id: 'tab-3', number: '103', seats: 6, status: 'reserved', floor: '1st Floor' },
  { id: 'tab-4', number: '104', seats: 2, status: 'available', floor: '1st Floor' },
  // 2nd Floor
  { id: 'tab-5', number: '201', seats: 8, status: 'available', floor: '2nd Floor' },
  { id: 'tab-6', number: '202', seats: 4, status: 'occupied', floor: '2nd Floor', currentOrderId: 'ord-102' },
  { id: 'tab-7', number: '203', seats: 4, status: 'available', floor: '2nd Floor' },
  // Outdoor
  { id: 'tab-8', number: '301', seats: 4, status: 'available', floor: 'Outdoor' },
  { id: 'tab-9', number: '302', seats: 2, status: 'reserved', floor: 'Outdoor' },
];

const initialCustomers: Customer[] = [
  { id: 'cust-1', name: 'Alex Johnson', email: 'alex.j@example.com', phone: '+1 555-0199' },
  { id: 'cust-2', name: 'Sarah Miller', email: 'sarah.m@example.com', phone: '+1 555-0142' },
  { id: 'cust-3', name: 'Michael Chen', email: 'm.chen@example.com', phone: '+1 555-0178' },
  { id: 'cust-4', name: 'Emily Davis', email: 'emily.d@example.com', phone: '+1 555-0155' },
];

const initialCoupons: Coupon[] = [
  { id: 'coup-1', code: 'WELCOME10', discountType: 'percentage', value: 10 },
  { id: 'coup-2', code: 'FLAT20', discountType: 'fixed', value: 20, minAmount: 80 },
  { id: 'coup-3', code: 'CHEESELOVER', discountType: 'percentage', value: 15 },
];

const initialPromotions: Promotion[] = [
  { id: 'promo-1', name: 'Burger Fiesta', type: 'product', minQuantity: 2, discountType: 'percentage', discountValue: 50, productId: 'prod-1' },
  { id: 'promo-2', name: 'Dine-In Happy Hour', type: 'order', minAmount: 100, discountType: 'fixed', discountValue: 15 },
];

const initialUsers: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'admin@pos.com', username: 'admin', role: 'admin', status: 'active' },
  { id: 'user-2', name: 'Cashier Alice', email: 'alice@pos.com', username: 'alice', role: 'cashier', status: 'active' },
  { id: 'user-3', name: 'Chef Bobby', email: 'chef@pos.com', username: 'chef', role: 'chef', status: 'active' },
];

const initialPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Cash Payment', type: 'cash', status: true },
  { id: 'pm-2', name: 'Credit/Debit Card', type: 'card', status: true },
  { id: 'pm-3', name: 'UPI (QR Code)', type: 'upi', status: true },
];

const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-20260620-001',
    date: '2026-06-20T11:30:00Z',
    customerId: 'cust-1',
    customerName: 'Alex Johnson',
    tableId: 'tab-2',
    tableNumber: '102',
    items: [
      { id: 'oi-1', productId: 'prod-1', name: 'Signature Cheeseburger', price: 9.99, quantity: 2, taxRate: 0.08, lineTotal: 19.98 },
      { id: 'oi-2', productId: 'prod-10', name: 'Fresh Lemonade', price: 3.50, quantity: 2, taxRate: 0.05, lineTotal: 7.00 },
    ],
    subtotal: 26.98,
    tax: 1.95,
    discount: 2.70,
    total: 26.23,
    status: 'preparing',
    orderType: 'dine-in',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-20260620-002',
    date: '2026-06-20T12:00:00Z',
    customerId: 'cust-2',
    customerName: 'Sarah Miller',
    tableId: 'tab-6',
    tableNumber: '202',
    items: [
      { id: 'oi-3', productId: 'prod-3', name: 'Pepperoni Supreme Pizza', price: 14.99, quantity: 1, taxRate: 0.10, lineTotal: 14.99 },
      { id: 'oi-4', productId: 'prod-7', name: 'Chocolate Lava Cake', price: 6.99, quantity: 1, taxRate: 0.05, lineTotal: 6.99 },
    ],
    subtotal: 21.98,
    tax: 1.85,
    discount: 0.00,
    total: 23.83,
    status: 'completed',
    paymentMethod: 'card',
    paymentDetails: { reference: 'TXN-98230912' },
    orderType: 'dine-in',
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-20260620-003',
    date: '2026-06-20T12:15:00Z',
    customerName: 'Guest Customer',
    items: [
      { id: 'oi-5', productId: 'prod-2', name: 'Spicy Chicken Burger', price: 8.99, quantity: 1, taxRate: 0.08, lineTotal: 8.99 },
    ],
    subtotal: 8.99,
    tax: 0.72,
    discount: 0.00,
    total: 9.71,
    status: 'draft',
    orderType: 'takeaway',
  }
];

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      // Authentication
      currentUser: initialUsers[0], // default log in as admin for demo purposes
      isAuthenticated: true,

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
      darkMode: true, // Default to a gorgeous dark theme

      // Auth Functions
      login: async (usernameOrEmail, password) => {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 800));
        const user = get().users.find(
          (u) => (u.username === usernameOrEmail || u.email === usernameOrEmail)
        );
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          return user;
        } else {
          throw new Error('Invalid username or password');
        }
      },
      signup: async (fullName, email, username) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: fullName,
          email,
          username,
          role: 'cashier', // defaults to cashier role
          status: 'active',
        };
        set((state) => ({
          users: [...state.users, newUser],
        }));
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false, cart: [], activeCustomer: null, activeTable: null, activeCoupon: null });
      },

      // Cart management
      addToCart: (product) => {
        set((state) => {
          const existingItemIndex = state.cart.findIndex((item) => item.product.id === product.id);
          if (existingItemIndex > -1) {
            const updatedCart = [...state.cart];
            updatedCart[existingItemIndex].quantity += 1;
            return { cart: updatedCart };
          } else {
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
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
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
          } else {
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

      // Tables
      addTable: (tab) => set((state) => ({
        tables: [...state.tables, { ...tab, id: `tab-${Date.now()}`, status: 'available' }],
      })),
      updateTable: (id, updates) => set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      deleteTable: (id) => set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
      })),
      setTableStatus: (id, status, currentOrderId) => set((state) => ({
        tables: state.tables.map((t) => (t.id === id ? { ...t, status, currentOrderId } : t)),
      })),

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
        
        const orderItems: OrderItem[] = cart.map((item, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          taxRate: item.product.taxRate,
          lineTotal: parseFloat((item.product.price * item.quantity).toFixed(2)),
        }));

        const newOrder: Order = {
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
          get().setTableStatus(
            activeTable.id, 
            isDraft || newOrder.status === 'completed' ? 'available' : 'occupied', 
            isDraft || newOrder.status === 'completed' ? undefined : newOrder.id
          );
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
        const cartItems: CartItem[] = order.items.map((oi) => {
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
    }),
    {
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
      }),
    }
  )
);

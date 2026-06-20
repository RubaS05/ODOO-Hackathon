import axios from 'axios';
import { usePOSStore } from '../store/posStore';
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8082/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('pos_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// On 401, auto-logout
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pos_token');
            usePOSStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export const apiService = {
    /* ─── AUTH ──────────────────────────────────────────────── */
    auth: {
        login: async (email, password) => {
            const res = await apiClient.post('/auth/login', { email, password });
            const userData = res.data;
            if (userData.token) localStorage.setItem('pos_token', userData.token);
            usePOSStore.getState().setCurrentUser(userData);
            return userData;
        },
        signup: async (name, email, password) => {
            await apiClient.post('/auth/signup', { name, email, password });
        },
        logout: async () => {
            localStorage.removeItem('pos_token');
            usePOSStore.getState().logout();
        },
        changePassword: async (oldPassword, newPassword) => {
            await apiClient.post('/auth/change-password', { oldPassword, newPassword });
        },
    },

    /* ─── SESSIONS ───────────────────────────────────────────── */
    sessions: {
        getCurrent: async () => {
            const res = await apiClient.get('/sessions/current');
            return res.data;
        },
        open: async (openingCashAmount = 0) => {
            const res = await apiClient.post('/sessions/open', { openingCashAmount });
            return res.data;
        },
        close: async () => {
            const res = await apiClient.post('/sessions/close');
            return res.data;
        },
        getAll: async () => {
            const res = await apiClient.get('/sessions');
            return res.data;
        },
    },

    /* ─── ORDERS ─────────────────────────────────────────────── */
    orders: {
        create: async (orderData) => {
            const res = await apiClient.post('/orders', orderData);
            return res.data;
        },
        getAll: async () => {
            const res = await apiClient.get('/orders');
            return res.data;
        },
        getByTable: async (tableId) => {
            const res = await apiClient.get(`/orders/table/${tableId}`);
            return res.data;
        },
        getBySession: async (sessionId) => {
            const res = await apiClient.get(`/orders/session/${sessionId}`);
            return res.data;
        },
        getById: async (id) => {
            const res = await apiClient.get(`/orders/${id}`);
            return res.data;
        },
        updateStatus: async (id, status) => {
            const res = await apiClient.put(`/orders/${id}/status`, { status });
            return res.data;
        },
    },

    /* ─── KITCHEN ────────────────────────────────────────────── */
    kitchen: {
        getOrders: async () => {
            const res = await apiClient.get('/kitchen/orders');
            return res.data;
        },
        updateItemStatus: async (itemId, kitchenStatus) => {
            const res = await apiClient.put(`/kitchen/items/${itemId}/status`, { kitchenStatus });
            return res.data;
        },
        updateOrderStatus: async (orderId, kitchenStatus) => {
            const res = await apiClient.put(`/kitchen/orders/${orderId}/status`, { kitchenStatus });
            return res.data;
        },
    },

    /* ─── PRODUCTS ───────────────────────────────────────────── */
    products: {
        getAll: async () => {
            const res = await apiClient.get('/products');
            return res.data;
        },
        create: async (product) => {
            const res = await apiClient.post('/products', product);
            return res.data;
        },
        update: async (id, updates) => {
            const res = await apiClient.put(`/products/${id}`, updates);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/products/${id}`);
        },
        search: async (name) => {
            const res = await apiClient.get(`/products/search?name=${name}`);
            return res.data;
        },
    },

    /* ─── CATEGORIES ─────────────────────────────────────────── */
    categories: {
        getAll: async () => {
            const res = await apiClient.get('/categories');
            return res.data;
        },
        create: async (category) => {
            const res = await apiClient.post('/categories', category);
            return res.data;
        },
        update: async (id, updates) => {
            const res = await apiClient.put(`/categories/${id}`, updates);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/categories/${id}`);
        },
    },

    /* ─── FLOORS ─────────────────────────────────────────────── */
    floors: {
        getAll: async () => {
            const res = await apiClient.get('/floors');
            return res.data;
        },
        create: async (floor) => {
            const res = await apiClient.post('/floors', floor);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/floors/${id}`);
        },
    },

    /* ─── TABLES ─────────────────────────────────────────────── */
    tables: {
        getAll: async () => {
            const res = await apiClient.get('/tables');
            return res.data;
        },
        create: async (table) => {
            const res = await apiClient.post('/tables', table);
            return res.data;
        },
        update: async (id, updates) => {
            const res = await apiClient.put(`/tables/${id}`, updates);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/tables/${id}`);
        },
    },

    /* ─── USERS ──────────────────────────────────────────────── */
    users: {
        getAll: async () => {
            const res = await apiClient.get('/users');
            return res.data;
        },
        create: async (user) => {
            const res = await apiClient.post('/users', user);
            return res.data;
        },
        archive: async (id) => {
            const res = await apiClient.put(`/users/${id}/archive`);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/users/${id}`);
        },
        resetPassword: async (id, newPassword) => {
            await apiClient.put(`/users/${id}/password`, { newPassword });
        },
    },

    /* ─── CUSTOMERS ──────────────────────────────────────────── */
    customers: {
        getAll: async () => {
            const res = await apiClient.get('/customers');
            return res.data;
        },
        create: async (customer) => {
            const res = await apiClient.post('/customers', customer);
            return res.data;
        },
        update: async (id, updates) => {
            const res = await apiClient.put(`/customers/${id}`, updates);
            return res.data;
        },
        delete: async (id) => {
            await apiClient.delete(`/customers/${id}`);
        },
    },

    /* ─── PAYMENT METHODS ────────────────────────────────────── */
    paymentMethods: {
        getAll: async () => {
            const res = await apiClient.get('/payment-methods');
            return res.data;
        },
        toggle: async (id) => {
            const res = await apiClient.put(`/payment-methods/${id}/toggle`);
            return res.data;
        },
    },

    /* ─── COUPONS & PROMOTIONS ───────────────────────────────── */
    coupons: {
        getAll: async () => {
            const res = await apiClient.get('/coupons');
            return res.data;
        },
        create: async (coupon) => {
            const res = await apiClient.post('/coupons', coupon);
            return res.data;
        },
        toggle: async (id) => {
            const res = await apiClient.put(`/coupons/${id}/toggle`);
            return res.data;
        },
    },

    promotions: {
        getAll: async () => {
            const res = await apiClient.get('/promotions');
            return res.data;
        },
        create: async (promotion) => {
            const res = await apiClient.post('/promotions', promotion);
            return res.data;
        },
        toggle: async (id) => {
            const res = await apiClient.put(`/promotions/${id}/toggle`);
            return res.data;
        },
    },

    /* ─── PUBLIC (CUSTOMER) ──────────────────────────────────── */
    public: {
        getProducts: async () => {
            const res = await apiClient.get('/public/products');
            return res.data;
        },
        getCategories: async () => {
            const res = await apiClient.get('/public/categories');
            return res.data;
        },
        getTableById: async (id) => {
            const res = await apiClient.get(`/public/tables/${id}`);
            return res.data;
        },
        createOrder: async (orderData) => {
            const res = await apiClient.post('/public/orders', orderData);
            return res.data;
        },
        getOrder: async (id) => {
            const res = await apiClient.get(`/public/orders/${id}`);
            return res.data;
        },
        appendItems: async (id, items) => {
            const res = await apiClient.put(`/public/orders/${id}/append`, { items });
            return res.data;
        },
        payOrder: async (id) => {
            const res = await apiClient.put(`/public/orders/${id}/pay`);
            return res.data;
        },
        getTableOrders: async (tableId, email) => {
            const res = await apiClient.get(`/public/tables/${tableId}/orders`, { params: { email } });
            return res.data;
        },
    },
};

export default apiClient;

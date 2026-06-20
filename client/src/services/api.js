import axios from 'axios';
import { usePOSStore } from '../store/posStore';
// We'll update the token when a user logs in
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8082/api',
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add a request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// We add mock delays to simulate actual network conditions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const apiService = {
    auth: {
        login: async (usernameOrEmail, password) => {
            const response = await apiClient.post('/auth/login', {
                email: usernameOrEmail,
                password: password,
            });
            const userData = response.data;
            // Save token to localStorage
            if (userData.token) {
                localStorage.setItem('pos_token', userData.token);
            }
            // Also update the store (this updates global state)
            usePOSStore.getState().setCurrentUser(userData);
            return userData;
        },
        signup: async (fullName, email, password) => {
            await apiClient.post('/auth/signup', {
                name: fullName,
                email: email,
                password: password
            });
        },
        logout: async () => {
            localStorage.removeItem('pos_token');
            usePOSStore.getState().logout();
        }
    },
    products: {
        getAll: async () => {
            await delay(500);
            return usePOSStore.getState().products;
        },
        create: async (product) => {
            await delay(400);
            usePOSStore.getState().addProduct(product);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateProduct(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteProduct(id);
        }
    },
    categories: {
        getAll: async () => {
            await delay(300);
            return usePOSStore.getState().categories;
        },
        create: async (category) => {
            await delay(400);
            usePOSStore.getState().addCategory(category);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateCategory(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteCategory(id);
        }
    },
    tables: {
        getAll: async () => {
            await delay(400);
            return usePOSStore.getState().tables;
        },
        create: async (table) => {
            await delay(400);
            usePOSStore.getState().addTable(table);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateTable(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteTable(id);
        },
        setStatus: async (id, status, orderId) => {
            await delay(200);
            usePOSStore.getState().setTableStatus(id, status, orderId);
        }
    },
    customers: {
        getAll: async () => {
            await delay(300);
            return usePOSStore.getState().customers;
        },
        create: async (customer) => {
            await delay(400);
            usePOSStore.getState().addCustomer(customer);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateCustomer(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteCustomer(id);
        }
    },
    orders: {
        getAll: async () => {
            await delay(500);
            return usePOSStore.getState().orders;
        },
        create: async (paymentDetails, isDraft) => {
            await delay(600);
            return usePOSStore.getState().createOrder(paymentDetails, isDraft);
        },
        updateStatus: async (id, status) => {
            await delay(400);
            usePOSStore.getState().updateOrderStatus(id, status);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteOrder(id);
        }
    },
    coupons: {
        getAll: async () => {
            await delay(300);
            return usePOSStore.getState().coupons;
        },
        create: async (coupon) => {
            await delay(400);
            usePOSStore.getState().addCoupon(coupon);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateCoupon(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteCoupon(id);
        }
    },
    promotions: {
        getAll: async () => {
            await delay(300);
            return usePOSStore.getState().promotions;
        },
        create: async (promo) => {
            await delay(400);
            usePOSStore.getState().addPromotion(promo);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updatePromotion(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deletePromotion(id);
        }
    },
    users: {
        getAll: async () => {
            await delay(400);
            return usePOSStore.getState().users;
        },
        create: async (user) => {
            await delay(400);
            usePOSStore.getState().addUser(user);
        },
        update: async (id, updates) => {
            await delay(400);
            usePOSStore.getState().updateUser(id, updates);
        },
        delete: async (id) => {
            await delay(300);
            usePOSStore.getState().deleteUser(id);
        }
    }
};

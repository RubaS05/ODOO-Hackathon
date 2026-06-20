import axios from 'axios';
import { usePOSStore } from '../store/posStore';
import { Product, Category, Table, Customer, Order, Coupon, Promotion, User } from '../types';

// In a real application, you would configure an Axios instance:
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.restaurantpos.local/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// We add mock delays to simulate actual network conditions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  auth: {
    login: async (usernameOrEmail: string, password: string): Promise<User> => {
      // Simulate network request
      await delay(600);
      return usePOSStore.getState().login(usernameOrEmail, password);
    },
    signup: async (fullName: string, email: string, username: string): Promise<void> => {
      await delay(800);
      return usePOSStore.getState().signup(fullName, email, username);
    },
    logout: async (): Promise<void> => {
      await delay(200);
      usePOSStore.getState().logout();
    }
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      await delay(500);
      return usePOSStore.getState().products;
    },
    create: async (product: Omit<Product, 'id'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addProduct(product);
    },
    update: async (id: string, updates: Partial<Product>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateProduct(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteProduct(id);
    }
  },

  categories: {
    getAll: async (): Promise<Category[]> => {
      await delay(300);
      return usePOSStore.getState().categories;
    },
    create: async (category: Omit<Category, 'id'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addCategory(category);
    },
    update: async (id: string, updates: Partial<Category>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateCategory(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteCategory(id);
    }
  },

  tables: {
    getAll: async (): Promise<Table[]> => {
      await delay(400);
      return usePOSStore.getState().tables;
    },
    create: async (table: Omit<Table, 'id' | 'status'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addTable(table);
    },
    update: async (id: string, updates: Partial<Table>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateTable(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteTable(id);
    },
    setStatus: async (id: string, status: Table['status'], orderId?: string): Promise<void> => {
      await delay(200);
      usePOSStore.getState().setTableStatus(id, status, orderId);
    }
  },

  customers: {
    getAll: async (): Promise<Customer[]> => {
      await delay(300);
      return usePOSStore.getState().customers;
    },
    create: async (customer: Omit<Customer, 'id'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addCustomer(customer);
    },
    update: async (id: string, updates: Partial<Customer>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateCustomer(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteCustomer(id);
    }
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      await delay(500);
      return usePOSStore.getState().orders;
    },
    create: async (paymentDetails?: Order['paymentDetails'], isDraft?: boolean): Promise<Order> => {
      await delay(600);
      return usePOSStore.getState().createOrder(paymentDetails, isDraft);
    },
    updateStatus: async (id: string, status: Order['status']): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateOrderStatus(id, status);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteOrder(id);
    }
  },

  coupons: {
    getAll: async (): Promise<Coupon[]> => {
      await delay(300);
      return usePOSStore.getState().coupons;
    },
    create: async (coupon: Omit<Coupon, 'id'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addCoupon(coupon);
    },
    update: async (id: string, updates: Partial<Coupon>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateCoupon(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteCoupon(id);
    }
  },

  promotions: {
    getAll: async (): Promise<Promotion[]> => {
      await delay(300);
      return usePOSStore.getState().promotions;
    },
    create: async (promo: Omit<Promotion, 'id'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addPromotion(promo);
    },
    update: async (id: string, updates: Partial<Promotion>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updatePromotion(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deletePromotion(id);
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      await delay(400);
      return usePOSStore.getState().users;
    },
    create: async (user: Omit<User, 'id' | 'status'>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().addUser(user);
    },
    update: async (id: string, updates: Partial<User>): Promise<void> => {
      await delay(400);
      usePOSStore.getState().updateUser(id, updates);
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      usePOSStore.getState().deleteUser(id);
    }
  }
};

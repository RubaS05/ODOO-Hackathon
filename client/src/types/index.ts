export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class or Hex (e.g. 'bg-emerald-500', 'bg-amber-500')
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  taxRate: number; // e.g. 0.05 for 5%, 0.18 for 18%
  unit: string;    // e.g. 'Pcs', 'Portion', 'Bottle'
  description?: string;
  image?: string;
}

export interface Table {
  id: string;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
  floor: string; // e.g. '1st Floor', '2nd Floor', 'Outdoor'
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerId?: string;
  customerName?: string;
  tableId?: string;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'preparing' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'upi';
  paymentDetails?: {
    amountReceived?: number;
    change?: number;
    reference?: string;
  };
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'upi';
  status: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'product' | 'order';
  minQuantity?: number;
  minAmount?: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'manager' | 'cashier' | 'chef';
  status: 'active' | 'inactive';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

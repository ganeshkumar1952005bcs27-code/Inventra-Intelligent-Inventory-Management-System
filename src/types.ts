export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  min_stock: number;
  current_stock: number;
  expiry_date: string | null;
  is_active: number;
}

export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRY_ALERT';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  type: AlertType;
  severity: Severity;
  message: string;
  status: AlertStatus;
  created_at: string;
}

export interface Transaction {
  id: number;
  product_id: number;
  product_name: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  user_id: number;
  username: string;
  timestamp: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price_at_time: number;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  user_id: number;
  username: string;
  items?: OrderItem[];
}

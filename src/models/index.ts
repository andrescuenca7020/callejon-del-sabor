// Category Model
export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

// Product Model
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number;
  is_extra: boolean;
  applies_to_takeaway: boolean;
  is_active: boolean;
  sort_order: number;
}

// Order Model
export interface Order {
  id?: number;
  order_type: 'Local' | 'Llevar';
  table_number?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  total: number;
  created_at?: string;
  completed_at?: string;
}

// Order Item Model
export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  is_takeaway: boolean;
  extra_charge: number;
  pagado: boolean;
  created_at?: string;
}

// Payment Model
export interface Payment {
  id?: number;
  order_id: number;
  amount: number;
  payment_method: 'Efectivo' | 'Transferencia';
  reference_photo?: string;
  notes?: string;
  created_at?: string;
}

// Payment Item Model (for split by item)
export interface PaymentItem {
  id?: number;
  payment_id: number;
  order_item_id: number;
  amount: number;
}

// Cart Item (for temporary cart)
export interface CartItem {
  product: Product;
  quantity: number;
  is_takeaway: boolean;
  subtotal: number;
  extra_charge: number;
}

// Dashboard Stats
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  cash_total: number;
  transfer_total: number;
  top_products: ProductSale[];
  low_products: ProductSale[];
}

export interface ProductSale {
  product_name: string;
  total_sold: number;
  revenue: number;
}

// Date Range Filter
export interface DateRange {
  start: string;
  end: string;
}

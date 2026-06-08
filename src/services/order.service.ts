import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabase } from '../models/supabase';
import { Order, OrderItem, Payment, PaymentItem, CartItem, Product } from '../models/index';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private currentOrderSubject = new BehaviorSubject<Order | null>(null);
  private orderItemsSubject = new BehaviorSubject<OrderItem[]>([]);

  orders$ = this.ordersSubject.asObservable();
  currentOrder$ = this.currentOrderSubject.asObservable();
  orderItems$ = this.orderItemsSubject.asObservable();

  // Cart for building new orders
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  // Extra charge for takeaway items (except Choclo Asado)
  private readonly EXTRA_CHARGE = 0.25;

  constructor() {}

  // Cart Management
  addToCart(product: Product, quantity: number, isTakeaway: boolean): boolean {
    const cart = this.cartSubject.value;
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.is_takeaway === isTakeaway
    );

    const extraCharge = this.calculateExtraCharge(product, isTakeaway);
    const subtotal = (product.price * quantity) + (extraCharge * quantity);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
      cart[existingIndex].subtotal += subtotal;
    } else {
      cart.push({
        product,
        quantity,
        is_takeaway: isTakeaway,
        subtotal,
        extra_charge: extraCharge
      });
    }

    this.cartSubject.next([...cart]);
    return true;
  }

  calculateExtraCharge(product: Product, isTakeaway: boolean): number {
    // Only charge extra for takeaway main dishes (category 1) except Choclo Asado
    if (isTakeaway && product.category_id === 1 && product.name !== 'Choclo Asado' && product.applies_to_takeaway) {
      return this.EXTRA_CHARGE;
    }
    return 0;
  }

  removeFromCart(index: number): void {
    const cart = this.cartSubject.value;
    cart.splice(index, 1);
    this.cartSubject.next([...cart]);
  }

  updateCartItemQuantity(index: number, quantity: number): void {
    const cart = this.cartSubject.value;
    if (index >= 0 && index < cart.length && quantity > 0) {
      const item = cart[index];
      item.quantity = quantity;
      item.subtotal = (item.product.price * quantity) + (item.extra_charge * quantity);
      this.cartSubject.next([...cart]);
    }
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.subtotal, 0);
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  // Order Creation
  async createOrder(
    orderType: 'Local' | 'Llevar',
    tableNumber?: string
  ): Promise<Order | null> {
    const cart = this.cartSubject.value;
    if (cart.length === 0) return null;

    const total = this.getCartTotal();

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_type: orderType,
        table_number: tableNumber || null,
        status: 'Active',
        total
      })
      .select()
      .single();

    if (error || !order) return null;

    // Insert order items
    for (const cartItem of cart) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: cartItem.product.id,
        product_name: cartItem.product.name,
        unit_price: cartItem.product.price,
        quantity: cartItem.quantity,
        subtotal: cartItem.subtotal,
        is_takeaway: cartItem.is_takeaway,
        extra_charge: cartItem.extra_charge,
        pagado: false
      });
    }

    this.clearCart();
    await this.loadActiveOrders();
    return order;
  }

  // Load Orders
  async loadActiveOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.ordersSubject.next(data);
    }
    return data || [];
  }

  async loadCompletedOrders(startDate?: string, endDate?: string): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', 'Completed')
      .order('completed_at', { ascending: false });

    if (startDate) {
      query = query.gte('completed_at', startDate);
    }
    if (endDate) {
      query = query.lte('completed_at', endDate);
    }

    const { data, error } = await query;
    return data || [];
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    return data || null;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at');

    if (!error && data) {
      this.orderItemsSubject.next(data);
    }
    return data || [];
  }

  async getPayments(orderId: number): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at');

    return data || [];
  }

  // Add items to existing order
  async addItemsToOrder(orderId: number, items: CartItem[]): Promise<boolean> {
    for (const item of items) {
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        is_takeaway: item.is_takeaway,
        extra_charge: item.extra_charge,
        pagado: false
      });

      // Update order total
      const { data: order } = await supabase
        .from('orders')
        .select('total')
        .eq('id', orderId)
        .single();

      if (order) {
        await supabase
          .from('orders')
          .update({ total: order.total + item.subtotal })
          .eq('id', orderId);
      }
    }

    await this.loadActiveOrders();
    return true;
  }

  // Payments
  async processPayment(
    orderId: number,
    amount: number,
    method: 'Efectivo' | 'Transferencia',
    referencePhoto?: string,
    notes?: string
  ): Promise<Payment | null> {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        payment_method: method,
        reference_photo: referencePhoto || null,
        notes
      })
      .select()
      .single();

    if (error) return null;
    return payment;
  }

  async processPaymentByItems(
    orderId: number,
    itemIds: number[],
    method: 'Efectivo' | 'Transferencia',
    referencePhoto?: string
  ): Promise<{ payment: Payment | null; total: number }> {
    const items = await this.getOrderItems(orderId);
    const selectedItems = items.filter(i => itemIds.includes(i.id!));
    const total = selectedItems.reduce((sum, i) => sum + i.subtotal, 0);

    const payment = await this.processPayment(orderId, total, method, referencePhoto);

    if (payment) {
      // Mark items as paid
      for (const item of selectedItems) {
        await supabase
          .from('order_items')
          .update({ pagado: true })
          .eq('id', item.id);

        // Create payment item record
        await supabase.from('payment_items').insert({
          payment_id: payment.id,
          order_item_id: item.id,
          amount: item.subtotal
        });
      }

      // Check if all items are paid
      await this.checkOrderCompletion(orderId);
    }

    return { payment, total };
  }

  async checkOrderCompletion(orderId: number): Promise<boolean> {
    const items = await this.getOrderItems(orderId);
    const allPaid = items.every(i => i.pagado);

    if (allPaid) {
      await supabase
        .from('orders')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await this.loadActiveOrders();
      return true;
    }

    return false;
  }

  async getOrderBalance(orderId: number): Promise<number> {
    const order = await this.getOrderById(orderId);
    const payments = await this.getPayments(orderId);

    if (!order) return 0;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return order.total - totalPaid;
  }

  async finalizeOrder(orderId: number): Promise<boolean> {
    const balance = await this.getOrderBalance(orderId);
    if (balance > 0) return false;

    const result = await supabase
      .from('orders')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (!result.error) {
      await this.loadActiveOrders();
      return true;
    }
    return false;
  }

  // Stats
  async getStats(startDate: string, endDate: string): Promise<{
    total_sales: number;
    total_orders: number;
    cash_total: number;
    transfer_total: number;
  }> {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_method, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const stats = {
      total_sales: 0,
      total_orders: 0,
      cash_total: 0,
      transfer_total: 0
    };

    if (payments) {
      payments.forEach(p => {
        stats.total_sales += p.amount;
        if (p.payment_method === 'Efectivo') {
          stats.cash_total += p.amount;
        } else {
          stats.transfer_total += p.amount;
        }
      });
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'Completed')
      .gte('completed_at', startDate)
      .lte('completed_at', endDate);

    stats.total_orders = orders?.length || 0;

    return stats;
  }

  async getTopProducts(limit: number = 10): Promise<{ product_name: string; total_sold: number; revenue: number }[]> {
    const { data } = await supabase
      .from('order_items')
      .select('product_name, quantity, subtotal');

    if (!data) return [];

    const productMap = new Map<string, { total_sold: number; revenue: number }>();

    data.forEach(item => {
      const existing = productMap.get(item.product_name) || { total_sold: 0, revenue: 0 };
      existing.total_sold += item.quantity;
      existing.revenue += item.subtotal;
      productMap.set(item.product_name, existing);
    });

    return Array.from(productMap.entries())
      .map(([product_name, stats]) => ({ product_name, ...stats }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonModal, IonHeader, IonToolbar,
  IonTitle, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, calculatorOutline, timeOutline, addCircleOutline,
  listOutline, cubeOutline, cashOutline, phonePortraitOutline, walletOutline
} from 'ionicons/icons';
import { OrderService } from '../../services/order.service';
import { Order, Payment, OrderItem } from '../../models/index';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons
  ],
  template: `
    <ion-content class="historial-container">
      <div class="header">
        <ion-button fill="clear" [routerLink]="['/pedidos']">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
        <h1>Historial</h1>
        <ion-button fill="clear" (click)="showCierreCaja = true">
          <ion-icon name="calculator-outline"></ion-icon>
        </ion-button>
      </div>

      <div class="date-filter">
        <div class="date-input">
          <label>Desde</label>
          <input type="date" [(ngModel)]="startDate" (change)="loadOrders()">
        </div>
        <div class="date-input">
          <label>Hasta</label>
          <input type="date" [(ngModel)]="endDate" (change)="loadOrders()">
        </div>
        <button class="today-btn" (click)="setToday()">Hoy</button>
      </div>

      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ orders.length }}</span>
          <span class="stat-label">Pedidos</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">$ {{ totalSales | number:'1.2-2' }}</span>
          <span class="stat-label">Ventas</span>
        </div>
        <div class="stat-item cash">
          <span class="stat-value">$ {{ cashTotal | number:'1.2-2' }}</span>
          <span class="stat-label">Efectivo</span>
        </div>
        <div class="stat-item transfer">
          <span class="stat-value">$ {{ transferTotal | number:'1.2-2' }}</span>
          <span class="stat-label">Transferencias</span>
        </div>
      </div>

      <div class="orders-list">
        <div *ngFor="let order of orders" class="order-card" (click)="toggleOrderDetail(order.id!)">
          <div class="order-main">
            <div class="order-info">
              <div class="order-header">
                <span class="order-type" [class.local]="order.order_type === 'Local'" [class.takeaway]="order.order_type === 'Llevar'">
                  {{ order.order_type === 'Local' ? 'Mesa ' + order.table_number : 'Llevar' }}
                </span>
                <span class="order-total">$ {{ order.total | number:'1.2-2' }}</span>
              </div>
              <div class="order-time">
                <ion-icon name="time-outline"></ion-icon>
                {{ formatDateTime(order.completed_at!) }}
              </div>
            </div>
          </div>

          <div class="order-details" *ngIf="expandedOrder === order.id">
            <div class="detail-section">
              <h4>Productos</h4>
              <div class="items-list">
                <div *ngFor="let item of getOrderItems(order.id!)" class="item-row">
                  <span class="item-name">{{ item.product_name }} x{{ item.quantity }}</span>
                  <span *ngIf="item.is_takeaway" class="takeaway-badge">+envase</span>
                  <span class="item-total">$ {{ item.subtotal | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="getOrderPayments(order.id!).length > 0">
              <h4>Pagos Realizados</h4>
              <div class="payments-list">
                <div *ngFor="let payment of getOrderPayments(order.id!)" class="payment-row">
                  <div class="payment-info">
                    <ion-icon [name]="payment.payment_method === 'Efectivo' ? 'cash-outline' : 'phone-portrait-outline'"></ion-icon>
                    <span>{{ payment.payment_method }}</span>
                    <span class="payment-time">{{ formatTime(payment.created_at!) }}</span>
                  </div>
                  <span class="payment-amount">$ {{ payment.amount | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="orders.length === 0">
          <ion-icon name="document-text-outline"></ion-icon>
          <h2>No hay pedidos en este rango</h2>
        </div>
      </div>

      <ion-modal [isOpen]="showCierreCaja" (didDismiss)="showCierreCaja = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Cierre de Caja</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showCierreCaja = false">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="cierre-content">
            <div class="cierre-stats">
              <div class="cierre-card">
                <ion-icon name="cash-outline"></ion-icon>
                <div class="info">
                  <span class="label">Total en Efectivo</span>
                  <span class="value">$ {{ cashTotal | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="cierre-card">
                <ion-icon name="phone-portrait-outline"></ion-icon>
                <div class="info">
                  <span class="label">Total en Transferencias</span>
                  <span class="value">$ {{ transferTotal | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="cierre-card total">
                <ion-icon name="wallet-outline"></ion-icon>
                <div class="info">
                  <span class="label">TOTAL GENERAL</span>
                  <span class="value">$ {{ totalSales | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <div class="bottom-nav">
        <ion-button fill="clear" [routerLink]="['/pos']">
          <ion-icon name="add-circle-outline"></ion-icon>
          <span>Nuevo</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/pedidos']">
          <ion-icon name="list-outline"></ion-icon>
          <span>Pedidos</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/historial']" class="active">
          <ion-icon name="time-outline"></ion-icon>
          <span>Historial</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/inventario']">
          <ion-icon name="cube-outline"></ion-icon>
          <span>Inventario</span>
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { --primary: #2563eb; --success: #059669; --warning: #f59e0b; --gray: #64748b; }
    .historial-container { --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .header h1 { color: #fff; margin: 0; font-size: 1.25rem; }
    .date-filter { display: flex; gap: 8px; padding: 16px; align-items: flex-end; }
    .date-input { flex: 1; }
    .date-input label { display: block; color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px; }
    .date-input input { width: 100%; padding: 8px 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-size: 0.9rem; }
    .today-btn { padding: 8px 16px; background: #3b82f6; border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; }
    .stats-summary { display: flex; gap: 12px; padding: 16px; overflow-x: auto; }
    .stat-item { flex: 1; min-width: 80px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 12px; text-align: center; }
    .stat-item.cash { background: rgba(5, 150, 105, 0.2); }
    .stat-item.transfer { background: rgba(37, 99, 235, 0.2); }
    .stat-value { display: block; color: #fff; font-size: 1.1rem; font-weight: 700; }
    .stat-label { display: block; color: #94a3b8; font-size: 0.7rem; margin-top: 4px; }
    .orders-list { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 12px; }
    .order-card { background: rgba(0, 0, 0, 0.3); border-radius: 16px; overflow: hidden; cursor: pointer; }
    .order-main { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
    .order-info { flex: 1; }
    .order-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .order-type { padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; }
    .order-type.local { background: #3b82f6; color: #fff; }
    .order-type.takeaway { background: #f59e0b; color: #000; }
    .order-total { color: #fff; font-weight: 700; font-size: 1.25rem; }
    .order-time { display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 0.8rem; }
    .order-details { background: rgba(0, 0, 0, 0.2); padding: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
    .detail-section { margin-bottom: 16px; }
    .detail-section h4 { color: #fff; margin: 0 0 8px 0; font-size: 0.9rem; }
    .items-list, .payments-list { display: flex; flex-direction: column; gap: 6px; }
    .item-row, .payment-row { display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; }
    .item-name { color: #fff; flex: 1; }
    .takeaway-badge { background: #f59e0b; color: #000; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; }
    .item-total { color: #3b82f6; font-weight: 600; }
    .payment-info { display: flex; align-items: center; gap: 8px; color: #fff; flex: 1; }
    .payment-time { color: #94a3b8; font-size: 0.75rem; margin-left: auto; }
    .payment-amount { color: #059669; font-weight: 600; }
    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-state ion-icon { font-size: 64px; color: #94a3b8; }
    .empty-state h2 { color: #fff; margin-top: 16px; }
    .cierre-content { padding: 24px; --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .cierre-stats { display: flex; flex-direction: column; gap: 12px; }
    .cierre-card { display: flex; align-items: center; gap: 16px; background: rgba(0, 0, 0, 0.3); border-radius: 16px; padding: 20px; }
    .cierre-card.total { background: #3b82f6; }
    .cierre-card ion-icon { font-size: 32px; color: #059669; }
    .cierre-card.total ion-icon { color: #fff; }
    .cierre-card .info { flex: 1; }
    .cierre-card .label { display: block; color: #94a3b8; font-size: 0.85rem; }
    .cierre-card.total .label { color: rgba(255, 255, 255, 0.8); }
    .cierre-card .value { display: block; color: #fff; font-size: 1.5rem; font-weight: 700; margin-top: 4px; }
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, #0f172a 100%); border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 8px 20px; }
    .bottom-nav ion-button { --color: #94a3b8; display: flex; flex-direction: column; --padding-start: 0; --padding-end: 0; }
    .bottom-nav ion-button.active { --color: #3b82f6; }
    .bottom-nav ion-button span { font-size: 0.7rem; margin-top: 4px; }
    .bottom-nav ion-button ion-icon { font-size: 24px; }
  `]
})
export class HistorialPage implements OnInit {
  startDate: string = '';
  endDate: string = '';
  orders: Order[] = [];
  expandedOrder: number | null = null;
  orderItems: Map<number, OrderItem[]> = new Map();
  orderPayments: Map<number, Payment[]> = new Map();

  totalSales: number = 0;
  cashTotal: number = 0;
  transferTotal: number = 0;

  showCierreCaja = false;

  constructor(private orderService: OrderService) {
    addIcons({ arrowBackOutline, calculatorOutline, timeOutline, addCircleOutline, listOutline, cubeOutline, cashOutline, phonePortraitOutline, walletOutline });
  }

  async ngOnInit() {
    this.setToday();
    await this.loadOrders();
  }

  setToday() {
    const today = new Date().toISOString().split('T')[0];
    this.startDate = today;
    this.endDate = today;
    this.loadOrders();
  }

  async loadOrders() {
    const start = `${this.startDate}T00:00:00`;
    const end = `${this.endDate}T23:59:59`;

    this.orders = await this.orderService.loadCompletedOrders(start, end);

    for (const order of this.orders) {
      if (order.id) {
        const items = await this.orderService.getOrderItems(order.id);
        this.orderItems.set(order.id, items);
        const payments = await this.orderService.getPayments(order.id);
        this.orderPayments.set(order.id, payments);
      }
    }

    this.totalSales = this.orders.reduce((sum, o) => sum + o.total, 0);
    this.cashTotal = 0;
    this.transferTotal = 0;

    this.orderPayments.forEach((payments) => {
      payments.forEach(p => {
        if (p.payment_method === 'Efectivo') {
          this.cashTotal += p.amount;
        } else {
          this.transferTotal += p.amount;
        }
      });
    });
  }

  toggleOrderDetail(orderId: number) {
    this.expandedOrder = this.expandedOrder === orderId ? null : orderId;
  }

  getOrderItems(orderId: number): OrderItem[] {
    return this.orderItems.get(orderId) || [];
  }

  getOrderPayments(orderId: number): Payment[] {
    return this.orderPayments.get(orderId) || [];
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}

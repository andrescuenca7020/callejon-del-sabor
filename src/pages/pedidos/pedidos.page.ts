import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Order, OrderItem, Product, CartItem } from '../../models/index';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="pedidos-container">
      <!-- Header -->
      <div class="header">
        <ion-button color="dark" routerLink="/pos" fill="clear">
          <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
          Volver
        </ion-button>
        <h1>Pedidos Activos</h1>
        <ion-button routerLink="/historial" fill="clear">
          <ion-icon name="time-outline" slot="start"></ion-icon>
          Historial
        </ion-button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ activeOrders.length }}</span>
          <span class="stat-label">Mesas Activas</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">\${{ totalPending.toFixed(2) }}</span>
          <span class="stat-label">Por Cobrar</span>
        </div>
        <div class="stat-card" routerLink="/estadisticas">
          <ion-icon name="stats-chart-outline"></ion-icon>
          <span class="stat-label">Estadísticas</span>
        </div>
      </div>

      <!-- Orders Grid -->
      <div class="orders-grid" *ngIf="activeOrders.length > 0">
        <div
          *ngFor="let order of activeOrders"
          class="order-card"
          routerLink="/pedidos/{{ order.id }}"
        >
          <div class="order-header">
            <div class="order-type-badge" [class.local]="order.order_type === 'Local'" [class.takeaway]="order.order_type === 'Llevar'">
              {{ order.order_type === 'Local' ? 'Mesa ' + order.table_number : 'Llevar' }}
            </div>
            <span class="order-time">{{ getTimeAgo(order.created_at!) }}</span>
          </div>
          <div class="order-body">
            <div class="order-total">\${{ order.total.toFixed(2) }}</div>
            <ion-button color="primary" size="small">
              <ion-icon name="card-outline" slot="start"></ion-icon>
              Cobrar
            </ion-button>
          </div>
          <div class="order-items-preview">
            <span *ngFor="let item of getOrderPreview(order.id!); let last = last">
              {{ item.product_name }}{{ last ? '' : ', ' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="activeOrders.length === 0">
        <ion-icon name="restaurant-outline"></ion-icon>
        <h2>No hay pedidos activos</h2>
        <p>Los nuevos pedidos aparecerán aquí</p>
        <ion-button color="primary" routerLink="/pos">
          Crear Pedido
        </ion-button>
      </div>

      <!-- Bottom Nav -->
      <div class="bottom-nav">
        <ion-button fill="clear" routerLink="/pos">
          <ion-icon name="add-circle-outline"></ion-icon>
          <span>Nuevo</span>
        </ion-button>
        <ion-button fill="clear" routerLink="/pedidos" class="active">
          <ion-icon name="list-outline"></ion-icon>
          <span>Pedidos</span>
        </ion-button>
        <ion-button fill="clear" routerLink="/historial">
          <ion-icon name="time-outline"></ion-icon>
          <span>Historial</span>
        </ion-button>
        <ion-button fill="clear" routerLink="/inventario">
          <ion-icon name="cube-outline"></ion-icon>
          <span>Inventario</span>
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --primary: #2563eb;
      --success: #059669;
      --warning: #f59e0b;
      --gray: #64748b;
    }

    .pedidos-container {
      --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header h1 {
      color: #fff;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stats-row {
      display: flex;
      gap: 12px;
      padding: 16px;
      overflow-x: auto;
    }

    .stat-card {
      flex: 1;
      min-width: 100px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-value {
      color: var(--primary);
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      color: var(--gray);
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      padding: 16px;
      padding-bottom: 100px;
    }

    .order-card {
      background: linear-gradient(145deg, #334155 0%, #1e293b 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .order-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .order-type-badge {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .order-type-badge.local {
      background: var(--primary);
      color: #fff;
    }

    .order-type-badge.takeaway {
      background: var(--warning);
      color: #000;
    }

    .order-time {
      color: var(--gray);
      font-size: 0.75rem;
    }

    .order-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .order-total {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .order-items-preview {
      color: var(--gray);
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
    }

    .empty-state ion-icon {
      font-size: 64px;
      color: var(--gray);
    }

    .empty-state h2 {
      color: #fff;
      margin-top: 16px;
    }

    .empty-state p {
      color: var(--gray);
      margin-bottom: 24px;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, #0f172a 100%);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 8px 20px;
    }

    .bottom-nav ion-button {
      --color: var(--gray);
      display: flex;
      flex-direction: column;
      --padding-start: 0;
      --padding-end: 0;
    }

    .bottom-nav ion-button.active {
      --color: var(--primary);
    }

    .bottom-nav ion-button span {
      font-size: 0.7rem;
      margin-top: 4px;
    }

    .bottom-nav ion-button ion-icon {
      font-size: 24px;
    }
  `]
})
export class PedidosPage implements OnInit {
  activeOrders: Order[] = [];
  orderItems: Map<number, OrderItem[]> = new Map();
  totalPending: number = 0;

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.activeOrders = await this.orderService.loadActiveOrders();
    this.totalPending = this.activeOrders.reduce((sum, o) => sum + o.total, 0);

    // Load items for each order
    for (const order of this.activeOrders) {
      if (order.id) {
        const items = await this.orderService.getOrderItems(order.id);
        this.orderItems.set(order.id, items);
      }
    }
  }

  getOrderPreview(orderId: number): OrderItem[] {
    return this.orderItems.get(orderId) || [];
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }
}

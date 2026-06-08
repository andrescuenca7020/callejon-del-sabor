import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, refreshOutline, cashOutline, receiptOutline,
  walletOutline, trendingUpOutline, trendingDownOutline,
  addCircleOutline, listOutline, timeOutline, cubeOutline, phonePortraitOutline
} from 'ionicons/icons';
import { OrderService } from '../../services/order.service';

interface ProductStat {
  product_name: string;
  total_sold: number;
  revenue: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, IonButton, IonIcon, IonBadge],
  template: `
    <ion-content class="stats-container">
      <div class="header">
        <ion-button fill="clear" [routerLink]="['/pedidos']">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
        <h1>Estadisticas</h1>
        <ion-button fill="clear" (click)="refresh()">
          <ion-icon name="refresh-outline"></ion-icon>
        </ion-button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <ion-icon name="cash-outline"></ion-icon>
          <span class="stat-value">$ {{ stats.total_sales | number:'1.2-2' }}</span>
          <span class="stat-label">Ventas Totales</span>
        </div>
        <div class="stat-card">
          <ion-icon name="receipt-outline"></ion-icon>
          <span class="stat-value">{{ stats.total_orders }}</span>
          <span class="stat-label">Pedidos</span>
        </div>
        <div class="stat-card green">
          <ion-icon name="wallet-outline"></ion-icon>
          <span class="stat-value">$ {{ stats.cash_total | number:'1.2-2' }}</span>
          <span class="stat-label">Efectivo</span>
        </div>
        <div class="stat-card blue">
          <ion-icon name="phone-portrait-outline"></ion-icon>
          <span class="stat-value">$ {{ stats.transfer_total | number:'1.2-2' }}</span>
          <span class="stat-label">Transferencias</span>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3><ion-icon name="trending-up-outline"></ion-icon> Top Ventas</h3>
          <ion-badge color="success">Mejores</ion-badge>
        </div>
        <div class="ranking-list">
          <div *ngFor="let item of topProducts; let i = index" class="ranking-item">
            <div class="rank" [class.first]="i === 0" [class.second]="i === 1" [class.third]="i === 2">{{ i + 1 }}</div>
            <div class="item-info">
              <span class="item-name">{{ item.product_name }}</span>
              <span class="item-sold">{{ item.total_sold }} vendidos</span>
            </div>
            <div class="item-revenue">$ {{ item.revenue | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3><ion-icon name="trending-down-outline"></ion-icon> Menos Vendidos</h3>
          <ion-badge color="warning">Revisar</ion-badge>
        </div>
        <div class="ranking-list">
          <div *ngFor="let item of lowProducts; let i = index" class="ranking-item low">
            <div class="rank low">{{ i + 1 }}</div>
            <div class="item-info">
              <span class="item-name">{{ item.product_name }}</span>
              <span class="item-sold">{{ item.total_sold }} vendidos</span>
            </div>
            <div class="item-revenue">$ {{ item.revenue | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="bottom-nav">
        <ion-button fill="clear" [routerLink]="['/pos']">
          <ion-icon name="add-circle-outline"></ion-icon>
          <span>Nuevo</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/pedidos']">
          <ion-icon name="list-outline"></ion-icon>
          <span>Pedidos</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/historial']">
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
    .stats-container { --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .header h1 { color: #fff; margin: 0; font-size: 1.25rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; }
    .stat-card { background: linear-gradient(145deg, #334155 0%, #1e293b 100%); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .stat-card ion-icon { font-size: 28px; color: #3b82f6; margin-bottom: 8px; }
    .stat-card.green ion-icon { color: #059669; }
    .stat-card.blue ion-icon { color: #60a5fa; }
    .stat-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .stat-label { color: #94a3b8; font-size: 0.8rem; margin-top: 4px; }
    .section { padding: 16px; padding-bottom: 100px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-header h3 { color: #fff; margin: 0; display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
    .ranking-list { display: flex; flex-direction: column; gap: 8px; }
    .ranking-item { display: flex; align-items: center; background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 12px; }
    .rank { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; background: rgba(255, 255, 255, 0.1); color: #fff; }
    .rank.first { background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%); color: #000; }
    .rank.second { background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%); color: #000; }
    .rank.third { background: linear-gradient(135deg, #cd7f32 0%, #b87332 100%); }
    .rank.low { background: rgba(245, 158, 11, 0.3); color: #f59e0b; }
    .item-info { flex: 1; }
    .item-name { display: block; color: #fff; font-weight: 500; }
    .item-sold { display: block; color: #94a3b8; font-size: 0.8rem; }
    .item-revenue { color: #059669; font-weight: 700; }
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, #0f172a 100%); border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 8px 20px; }
    .bottom-nav ion-button { --color: #94a3b8; display: flex; flex-direction: column; --padding-start: 0; --padding-end: 0; }
    .bottom-nav ion-button span { font-size: 0.7rem; margin-top: 4px; }
    .bottom-nav ion-button ion-icon { font-size: 24px; }
  `]
})
export class EstadisticasPage implements OnInit {
  stats = { total_sales: 0, total_orders: 0, cash_total: 0, transfer_total: 0 };
  topProducts: ProductStat[] = [];
  lowProducts: ProductStat[] = [];

  constructor(private orderService: OrderService) {
    addIcons({ arrowBackOutline, refreshOutline, cashOutline, receiptOutline, walletOutline, trendingUpOutline, trendingDownOutline, addCircleOutline, listOutline, timeOutline, cubeOutline, phonePortraitOutline });
  }

  async ngOnInit() { await this.loadData(); }
  async refresh() { await this.loadData(); }

  async loadData() {
    const start = '2020-01-01T00:00:00';
    const end = new Date().toISOString();
    this.stats = await this.orderService.getStats(start, end);
    const allProducts = await this.orderService.getTopProducts(50);
    this.topProducts = allProducts.slice(0, 10);
    this.lowProducts = allProducts.slice(-10).reverse();
  }
}

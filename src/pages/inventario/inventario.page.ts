import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonSegment, IonSegmentButton,
  IonLabel, IonInput, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, refreshOutline, searchOutline, addOutline,
  checkmarkCircleOutline, addCircleOutline, listOutline, timeOutline, cubeOutline
} from 'ionicons/icons';
import { ProductService } from '../../services/product.service';
import { Product, Category } from '../../models/index';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonButton, IonIcon, IonSegment, IonSegmentButton,
    IonLabel, IonInput, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons
  ],
  template: `
    <ion-content class="inventario-container">
      <div class="header">
        <ion-button fill="clear" [routerLink]="['/pedidos']">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
        <h1>Inventario</h1>
        <ion-button fill="clear" (click)="refresh()">
          <ion-icon name="refresh-outline"></ion-icon>
        </ion-button>
      </div>

      <div class="search-bar">
        <ion-icon name="search-outline"></ion-icon>
        <input type="text" placeholder="Buscar producto..." [(ngModel)]="searchTerm">
      </div>

      <div class="category-tabs-scroll">
        <ion-segment [(ngModel)]="selectedCategory" mode="ios" class="category-segment">
          <ion-segment-button [value]="0">
            <ion-label>Todos</ion-label>
          </ion-segment-button>
          <ion-segment-button *ngFor="let cat of categories" [value]="cat.id">
            <ion-label>{{ cat.name }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div class="products-list">
        <div *ngFor="let product of filteredProducts" class="product-row">
          <div class="product-info">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-price">$ {{ product.price | number:'1.2-2' }}</span>
          </div>
          <div class="stock-info">
            <div class="stock-display" [class.critical]="product.stock <= 5" [class.out]="product.stock === 0">
              <ion-icon name="cube-outline"></ion-icon>
              <span class="stock-value">{{ product.stock }}</span>
            </div>
          </div>
          <div class="stock-actions">
            <ion-button fill="outline" size="small" color="warning" (click)="openAddStockModal(product)">
              <ion-icon name="add-outline"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>

      <ion-modal [isOpen]="showAddModal" (didDismiss)="closeAddModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Agregar Stock</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeAddModal()">Cancelar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="add-stock-content">
            <div class="product-header">
              <h2>{{ selectedProduct?.name }}</h2>
              <p>Stock actual: {{ selectedProduct?.stock }} unidades</p>
            </div>
            <div class="quantity-selector">
              <label>Cantidad a agregar</label>
              <div class="qty-buttons">
                <ion-button (click)="addQty = Math.max(1, addQty - 1)">
                  <ion-icon name="remove-outline"></ion-icon>
                </ion-button>
                <input type="number" [(ngModel)]="addQty" min="1">
                <ion-button (click)="addQty = addQty + 1">
                  <ion-icon name="add-outline"></ion-icon>
                </ion-button>
              </div>
            </div>
            <div class="quick-qty">
              <button *ngFor="let qty of [5, 10, 20, 50]" (click)="addQty = qty" class="quick-btn">+{{ qty }}</button>
            </div>
            <ion-button expand="block" color="success" size="large" (click)="confirmAddStock()">
              <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
              Agregar {{ addQty }} unidades
            </ion-button>
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
        <ion-button fill="clear" [routerLink]="['/historial']">
          <ion-icon name="time-outline"></ion-icon>
          <span>Historial</span>
        </ion-button>
        <ion-button fill="clear" [routerLink]="['/inventario']" class="active">
          <ion-icon name="cube-outline"></ion-icon>
          <span>Inventario</span>
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { --primary: #2563eb; --success: #059669; --warning: #f59e0b; --danger: #dc2626; --gray: #64748b; }
    .inventario-container { --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .header h1 { color: #fff; margin: 0; font-size: 1.25rem; }
    .search-bar { display: flex; align-items: center; gap: 12px; margin: 16px; padding: 12px 16px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; }
    .search-bar ion-icon { color: #94a3b8; font-size: 20px; }
    .search-bar input { flex: 1; background: transparent; border: none; color: #fff; font-size: 1rem; outline: none; }
    .category-tabs-scroll { padding: 0 16px 12px; overflow-x: auto; }
    .category-segment { background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 4px; }
    .category-segment ion-segment-button { --color: #94a3b8; --color-checked: #fff; --indicator-color: #3b82f6; border-radius: 8px; min-height: 36px; font-size: 0.85rem; }
    .products-list { padding: 16px; padding-bottom: 100px; display: flex; flex-direction: column; gap: 8px; }
    .product-row { display: flex; align-items: center; background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 16px; gap: 16px; }
    .product-info { flex: 1; }
    .product-name { display: block; color: #fff; font-weight: 500; }
    .product-price { display: block; color: #3b82f6; font-size: 0.9rem; margin-top: 4px; }
    .stock-display { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(5, 150, 105, 0.2); border-radius: 8px; }
    .stock-display.critical { background: rgba(245, 158, 11, 0.2); }
    .stock-display.out { background: rgba(220, 38, 38, 0.2); }
    .stock-display ion-icon { color: #059669; }
    .stock-display.critical ion-icon { color: #f59e0b; }
    .stock-display.out ion-icon { color: #dc2626; }
    .stock-value { color: #fff; font-weight: 700; font-size: 1.25rem; }
    .add-stock-content { padding: 24px; --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .product-header { text-align: center; margin-bottom: 32px; }
    .product-header h2 { color: #fff; margin: 0; }
    .product-header p { color: #94a3b8; margin-top: 8px; }
    .quantity-selector { margin-bottom: 24px; }
    .quantity-selector label { display: block; color: #fff; margin-bottom: 12px; }
    .qty-buttons { display: flex; align-items: center; justify-content: center; gap: 24px; }
    .qty-buttons input { width: 80px; text-align: center; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-size: 1.5rem; font-weight: 700; padding: 8px; }
    .quick-qty { display: flex; gap: 8px; margin-bottom: 24px; }
    .quick-btn { flex: 1; padding: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; }
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, #0f172a 100%); border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 8px 20px; }
    .bottom-nav ion-button { --color: #94a3b8; display: flex; flex-direction: column; --padding-start: 0; --padding-end: 0; }
    .bottom-nav ion-button.active { --color: #3b82f6; }
    .bottom-nav ion-button span { font-size: 0.7rem; margin-top: 4px; }
    .bottom-nav ion-button ion-icon { font-size: 24px; }
  `]
})
export class InventarioPage implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: number = 0;
  searchTerm: string = '';

  showAddModal = false;
  selectedProduct: Product | null = null;
  addQty: number = 1;

  constructor(private productService: ProductService) {
    addIcons({ arrowBackOutline, refreshOutline, searchOutline, addOutline, checkmarkCircleOutline, addCircleOutline, listOutline, timeOutline, cubeOutline, removeOutline: 'remove-outline' });
  }

  async ngOnInit() { await this.refresh(); }

  async refresh() {
    await this.productService.loadInitialData();
    this.productService.products$.subscribe(prods => { this.products = prods; });
    this.productService.categories$.subscribe(cats => { this.categories = cats; });
  }

  get filteredProducts(): Product[] {
    let filtered = this.products;
    if (this.selectedCategory !== 0) {
      filtered = filtered.filter(p => p.category_id === this.selectedCategory);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }
    return filtered;
  }

  openAddStockModal(product: Product) {
    this.selectedProduct = product;
    this.addQty = 1;
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedProduct = null;
  }

  async confirmAddStock() {
    if (!this.selectedProduct) return;
    const success = await this.productService.addStock(this.selectedProduct.id, this.addQty);
    if (success) {
      this.closeAddModal();
      await this.refresh();
    }
  }
}

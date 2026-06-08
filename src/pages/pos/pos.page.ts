import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Category, Product, CartItem } from '../../models/index';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="pos-container">
      <!-- Header -->
      <div class="header">
        <h1>Callejón del Sabor</h1>
        <div class="header-actions">
          <ion-button color="dark" routerLink="/pedidos">
            <ion-icon name="list-outline" slot="start"></ion-icon>
            Pedidos Activos
          </ion-button>
        </div>
      </div>

      <!-- Categories -->
      <div class="categories-scroll">
        <ion-segment [(ngModel)]="selectedCategory" mode="ios" class="category-segment">
          <ion-segment-button *ngFor="let cat of categories" [value]="cat.id">
            <ion-label>{{ cat.name }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Products Grid -->
      <div class="products-section">
        <div class="products-grid">
          <button
            *ngFor="let product of filteredProducts"
            class="product-card"
            [class.agotado]="product.stock <= 0"
            (click)="product.stock > 0 && addToCartQuick(product)"
          >
            <span class="product-name">{{ product.name }}</span>
            <span class="product-price">\${{ product.price.toFixed(2) }}</span>
            <span class="product-stock" [class.low]="product.stock <= 5">
              {{ product.stock > 0 ? 'Stock: ' + product.stock : 'AGOTADO' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Cart Panel -->
      <div class="cart-panel" [class.open]="cart.length > 0">
        <div class="cart-header">
          <h3>
            <ion-icon name="cart-outline"></ion-icon>
            Carrito
            <span *ngIf="orderType === 'Local'" class="table-badge">Mesa: {{ tableNumber }}</span>
            <span *ngIf="orderType === 'Llevar'" class="table-badge">Para Llevar</span>
          </h3>
          <ion-button fill="clear" size="small" (click)="clearCart()">
            <ion-icon name="trash-outline"></ion-icon>
          </ion-button>
        </div>

        <div class="order-type-switch">
          <ion-segment [(ngModel)]="orderType" mode="ios">
            <ion-segment-button value="Local">
              <ion-label>Local</ion-label>
            </ion-segment-button>
            <ion-segment-button value="Llevar">
              <ion-label>Llevar</ion-label>
            </ion-segment-button>
          </ion-segment>
          <ion-input
            *ngIf="orderType === 'Local'"
            [(ngModel)]="tableNumber"
            placeholder="Mesa #"
            class="table-input"
            type="number"
          ></ion-input>
        </div>

        <div class="cart-items">
          <div *ngFor="let item of cart; let i = index" class="cart-item">
            <div class="item-info">
              <span class="item-name">{{ item.product.name }}</span>
              <span *ngIf="item.is_takeaway" class="takeaway-badge">+ envase</span>
            </div>
            <div class="item-controls">
              <ion-button fill="clear" size="small" (click)="updateQty(i, -1)">
                <ion-icon name="remove-outline"></ion-icon>
              </ion-button>
              <span class="qty">{{ item.quantity }}</span>
              <ion-button fill="clear" size="small" (click)="updateQty(i, 1)">
                <ion-icon name="add-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="danger" size="small" (click)="removeItem(i)">
                <ion-icon name="close-outline"></ion-icon>
              </ion-button>
            </div>
            <div class="item-price">\${{ item.subtotal.toFixed(2) }}</div>
          </div>
        </div>

        <div class="cart-total">
          <span>Total:</span>
          <span class="total-amount">\${{ cartTotal.toFixed(2) }}</span>
        </div>

        <ion-button
          expand="block"
          color="success"
          size="large"
          (click)="createOrder()"
          [disabled]="cart.length === 0 || (orderType === 'Local' && !tableNumber)"
        >
          <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
          Crear Pedido
        </ion-button>
      </div>

      <!-- Product Modal for Takeaway Selection -->
      <ion-modal [isOpen]="showTakeawayModal" (didDismiss)="closeTakeawayModal(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ selectedProduct?.name }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeTakeawayModal(false)">Cancelar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="modal-content">
            <div class="modal-product-info">
              <h2>\${{ selectedProduct?.price.toFixed(2) }}</h2>
              <p *ngIf="selectedProduct?.category_id === 1 && selectedProduct?.name !== 'Choclo Asado'">
                Para llevar suma \$0.25 por envase
              </p>
            </div>
            <div class="modal-quantity">
              <ion-label>Cantidad</ion-label>
              <div class="qty-selector">
                <ion-button (click)="modalQty = modalQty > 1 ? modalQty - 1 : 1">
                  <ion-icon name="remove-outline"></ion-icon>
                </ion-button>
                <span class="qty-display">{{ modalQty }}</span>
                <ion-button (click)="modalQty = modalQty + 1">
                  <ion-icon name="add-outline"></ion-icon>
                </ion-button>
              </div>
            </div>
            <div class="modal-options" *ngIf="selectedProduct?.category_id === 1">
              <ion-button
                expand="block"
                fill="outline"
                size="large"
                (click)="closeTakeawayModal(true, false)"
              >
                Para Comer Aquí
              </ion-button>
              <ion-button
                expand="block"
                color="primary"
                size="large"
                (click)="closeTakeawayModal(true, true)"
              >
                Para Llevar (+\$0.25)
              </ion-button>
            </div>
            <div class="modal-options" *ngIf="selectedProduct?.category_id !== 1">
              <ion-button
                expand="block"
                color="primary"
                size="large"
                (click)="closeTakeawayModal(true, false)"
              >
                Agregar ({{ modalQty }})
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    :host {
      --primary: #2563eb;
      --secondary: #0f172a;
      --success: #059669;
      --warning: #f59e0b;
      --danger: #dc2626;
      --light: #f8fafc;
      --gray: #64748b;
    }

    .pos-container {
      --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header h1 {
      color: #fff;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .categories-scroll {
      padding: 12px 16px;
      overflow-x: auto;
      background: rgba(30, 41, 59, 0.5);
    }

    .category-segment {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 4px;
    }

    .category-segment ion-segment-button {
      --color: #94a3b8;
      --color-checked: #fff;
      --indicator-color: var(--primary);
      --indicator-box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      border-radius: 8px;
      min-height: 40px;
      font-weight: 600;
    }

    .products-section {
      padding: 16px;
      padding-bottom: 200px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .product-card {
      background: linear-gradient(145deg, #334155 0%, #1e293b 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 120px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .product-card:hover:not(.agotado) {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2);
    }

    .product-card.agotado {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .product-name {
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 8px;
    }

    .product-price {
      color: var(--primary);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .product-stock {
      color: var(--gray);
      font-size: 0.75rem;
      margin-top: 8px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }

    .product-stock.low {
      background: rgba(245, 158, 11, 0.2);
      color: var(--warning);
    }

    .cart-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      max-height: 60vh;
      overflow-y: auto;
      z-index: 100;
    }

    .cart-panel.open {
      transform: translateY(0);
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .cart-header h3 {
      color: #fff;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .table-badge {
      background: var(--primary);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .order-type-switch {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }

    .order-type-switch ion-segment {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }

    .table-input {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      color: #fff;
      width: 100px;
    }

    .cart-items {
      max-height: 200px;
      overflow-y: auto;
    }

    .cart-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      color: #fff;
      font-weight: 500;
    }

    .takeaway-badge {
      background: var(--warning);
      color: #000;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .item-controls {
      display: flex;
      align-items: center;
    }

    .qty {
      color: #fff;
      margin: 0 8px;
      font-weight: 600;
    }

    .item-price {
      color: var(--primary);
      font-weight: 600;
      margin-left: auto;
      min-width: 60px;
      text-align: right;
    }

    .cart-total {
      display: flex;
      justify-content: space-between;
      padding: 16px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 8px;
    }

    .cart-total span:first-child {
      color: var(--gray);
      font-size: 1.1rem;
    }

    .total-amount {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
    }

    /* Modal Styles */
    .modal-content {
      padding: 24px;
    }

    .modal-product-info {
      text-align: center;
      margin-bottom: 32px;
    }

    .modal-product-info h2 {
      color: var(--primary);
      font-size: 2.5rem;
      margin: 0;
    }

    .modal-product-info p {
      color: var(--gray);
      margin-top: 8px;
    }

    .modal-quantity {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.2);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .modal-quantity ion-label {
      color: #fff;
      font-weight: 600;
    }

    .qty-selector {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .qty-display {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      min-width: 40px;
      text-align: center;
    }

    .modal-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-options ion-button {
      --border-radius: 12px;
      height: 56px;
      font-weight: 600;
    }
  `]
})
export class PosPage implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  selectedCategory: number = 1;
  cart: CartItem[] = [];
  cartTotal: number = 0;
  orderType: 'Local' | 'Llevar' = 'Local';
  tableNumber: string = '';

  // Modal
  showTakeawayModal = false;
  selectedProduct: Product | null = null;
  modalQty = 1;

  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  async ngOnInit() {
    await this.productService.loadInitialData();
    this.productService.categories$.subscribe(cats => {
      this.categories = cats;
    });
    this.productService.products$.subscribe(prods => {
      this.products = prods;
    });
    this.orderService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cartTotal = this.orderService.getCartTotal();
    });
    await this.orderService.loadActiveOrders();
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p => p.category_id === this.selectedCategory && !p.is_extra);
  }

  addToCartQuick(product: Product) {
    if (product.stock <= 0) return;

    // For main dishes, show modal to select takeaway option
    if (product.category_id === 1) {
      this.selectedProduct = product;
      this.modalQty = 1;
      this.showTakeawayModal = true;
    } else {
      // For other categories, add directly
      this.orderService.addToCart(product, 1, false);
    }
  }

  closeTakeawayModal(confirm: boolean, isTakeaway: boolean = false) {
    if (confirm && this.selectedProduct) {
      this.orderService.addToCart(this.selectedProduct, this.modalQty, isTakeaway);
    }
    this.showTakeawayModal = false;
    this.selectedProduct = null;
    this.modalQty = 1;
  }

  updateQty(index: number, delta: number) {
    const newQty = this.cart[index].quantity + delta;
    if (newQty > 0) {
      this.orderService.updateCartItemQuantity(index, newQty);
    } else if (newQty <= 0) {
      this.removeItem(index);
    }
  }

  removeItem(index: number) {
    this.orderService.removeFromCart(index);
  }

  clearCart() {
    this.orderService.clearCart();
  }

  async createOrder() {
    if (this.cart.length === 0) return;
    if (this.orderType === 'Local' && !this.tableNumber) return;

    const order = await this.orderService.createOrder(
      this.orderType,
      this.orderType === 'Local' ? this.tableNumber : undefined
    );

    if (order) {
      this.clearCart();
      this.tableNumber = '';
      this.orderType = 'Local';
      // Navigate to active orders
      window.location.href = '/pedidos';
    }
  }
}

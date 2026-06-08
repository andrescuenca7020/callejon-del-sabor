import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Order, OrderItem, Payment, Product, CartItem } from '../../models/index';

@Component({
  selector: 'app-pedido-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="detail-container">
      <!-- Header -->
      <div class="header">
        <ion-button fill="clear" (click)="goBack()">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
        <div class="header-title">
          <h1 *ngIf="order?.order_type === 'Local'">Mesa {{ order?.table_number }}</h1>
          <h1 *ngIf="order?.order_type === 'Llevar'">Para Llevar</h1>
          <span class="status-badge active" *ngIf="order?.status === 'Active'">Activo</span>
          <span class="status-badge completed" *ngIf="order?.status === 'Completed'">Completado</span>
        </div>
        <ion-button fill="clear" (click)="showAddModal = true" *ngIf="order?.status === 'Active'">
          <ion-icon name="add-outline"></ion-icon>
        </ion-button>
      </div>

      <!-- Order Info -->
      <div class="order-info">
        <div class="info-card">
          <span class="label">Inicio</span>
          <span class="value">{{ formatDate(order?.created_at!) }}</span>
        </div>
        <div class="info-card">
          <span class="label">Total</span>
          <span class="value total">\${{ order?.total.toFixed(2) || '0.00' }}</span>
        </div>
        <div class="info-card">
          <span class="label">Pagado</span>
          <span class="value paid">\${{ totalPaid.toFixed(2) }}</span>
        </div>
        <div class="info-card highlight">
          <span class="label">Saldo</span>
          <span class="value balance">\${{ balance.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Items List -->
      <div class="section">
        <h3>Productos</h3>
        <div class="items-list">
          <div
            *ngFor="let item of items"
            class="item-row"
            [class.paid]="item.pagado"
            (click)="toggleItemSelection(item)"
          >
            <div class="item-checkbox" *ngIf="paymentMode === 'items' && !item.pagado">
              <ion-icon [name]="selectedItems.includes(item.id!) ? 'checkbox-outline' : 'square-outline'"></ion-icon>
            </div>
            <div class="item-details">
              <span class="item-name">
                {{ item.product_name }}
                <span *ngIf="item.is_takeaway" class="takeaway-tag">(+envase)</span>
              </span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
            <div class="item-price">
              <span *ngIf="item.pagado" class="paid-badge">Pagado</span>
              <span>\${{ item.subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payments History -->
      <div class="section" *ngIf="payments.length > 0">
        <h3>Pagos Realizados</h3>
        <div class="payments-list">
          <div *ngFor="let payment of payments" class="payment-row">
            <div class="payment-info">
              <ion-icon [name]="payment.payment_method === 'Efectivo' ? 'cash-outline' : 'phone-portrait-outline'"></ion-icon>
              <span class="payment-method">{{ payment.payment_method }}</span>
              <span class="payment-time">{{ formatTime(payment.created_at!) }}</span>
            </div>
            <div class="payment-amount">\${{ payment.amount.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- Payment Actions -->
      <div class="payment-actions" *ngIf="order?.status === 'Active' && balance > 0">
        <div class="payment-mode-tabs">
          <button
            class="mode-tab"
            [class.active]="paymentMode === 'amount'"
            (click)="paymentMode = 'amount'"
          >
            <ion-icon name="wallet-outline"></ion-icon>
            Por Monto
          </button>
          <button
            class="mode-tab"
            [class.active]="paymentMode === 'items'"
            (click)="paymentMode = 'items'"
          >
            <ion-icon name="list-outline"></ion-icon>
            Por Consumo
          </button>
        </div>

        <!-- Amount Payment -->
        <div class="payment-form" *ngIf="paymentMode === 'amount'">
          <div class="amount-input">
            <label>Monto a Abonar</label>
            <div class="input-wrapper">
              <span class="currency">$</span>
              <input type="number" [(ngModel)]="paymentAmount" placeholder="0.00" step="0.01">
            </div>
          </div>

          <div class="quick-amounts">
            <button *ngFor="let pct of [25, 50, 75, 100]" (click)="setQuickAmount(pct)" class="quick-btn">
              {{ pct === 100 ? 'Todo' : pct + '%' }}
            </button>
          </div>

          <div class="payment-method-select">
            <button
              class="method-btn"
              [class.active]="paymentMethod === 'Efectivo'"
              (click)="paymentMethod = 'Efectivo'"
            >
              <ion-icon name="cash-outline"></ion-icon>
              Efectivo
            </button>
            <button
              class="method-btn"
              [class.active]="paymentMethod === 'Transferencia'"
              (click)="paymentMethod = 'Transferencia'"
            >
              <ion-icon name="phone-portrait-outline"></ion-icon>
              Transferencia
            </button>
          </div>

          <!-- Vuelto Calculator -->
          <div class="vuelto-section" *ngIf="paymentMethod === 'Efectivo' && paymentAmount > 0">
            <label>Vuelto para:</label>
            <input type="number" [(ngModel)]="cashReceived" placeholder="Con cuánto pagan?" step="0.01">
            <div class="vuelto-result" *ngIf="cashReceived > paymentAmount">
              <span>Vuelto:</span>
              <span class="vuelto-amount">\${{ (cashReceived - paymentAmount).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Transferencia Photo -->
          <div class="photo-section" *ngIf="paymentMethod === 'Transferencia'">
            <label>Foto del Comprobante</label>
            <input type="text" [(ngModel)]="transferRef" placeholder="Referencia o # de transacción" class="ref-input">
          </div>

          <ion-button
            expand="block"
            color="success"
            size="large"
            (click)="processAmountPayment()"
            [disabled]="paymentAmount <= 0 || paymentAmount > balance"
          >
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
            Abonar \${{ paymentAmount.toFixed(2) }}
          </ion-button>
        </div>

        <!-- Items Payment -->
        <div class="payment-form" *ngIf="paymentMode === 'items'">
          <div class="selected-total">
            <span>Items seleccionados: {{ selectedItems.length }}</span>
            <span class="total">\${{ selectedItemsTotal.toFixed(2) }}</span>
          </div>

          <div class="payment-method-select">
            <button
              class="method-btn"
              [class.active]="paymentMethod === 'Efectivo'"
              (click)="paymentMethod = 'Efectivo'"
            >
              <ion-icon name="cash-outline"></ion-icon>
              Efectivo
            </button>
            <button
              class="method-btn"
              [class.active]="paymentMethod === 'Transferencia'"
              (click)="paymentMethod = 'Transferencia'"
            >
              <ion-icon name="phone-portrait-outline"></ion-icon>
              Transferencia
            </button>
          </div>

          <!-- Vuelto Calculator for Items -->
          <div class="vuelto-section" *ngIf="paymentMethod === 'Efectivo' && selectedItemsTotal > 0">
            <label>Vuelto para:</label>
            <input type="number" [(ngModel)]="cashReceived" placeholder="Con cuánto pagan?" step="0.01">
            <div class="vuelto-result" *ngIf="cashReceived > selectedItemsTotal">
              <span>Vuelto:</span>
              <span class="vuelto-amount">\${{ (cashReceived - selectedItemsTotal).toFixed(2) }}</span>
            </div>
          </div>

          <ion-button
            expand="block"
            color="success"
            size="large"
            (click)="processItemsPayment()"
            [disabled]="selectedItems.length === 0"
          >
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
            Cobrar \${{ selectedItemsTotal.toFixed(2) }}
          </ion-button>
        </div>
      </div>

      <!-- Finalize Button -->
      <div class="finalize-section" *ngIf="order?.status === 'Active' && balance <= 0">
        <ion-button
          expand="block"
          color="success"
          size="large"
          (click)="finalizeOrder()"
        >
          <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
          FINALIZAR PEDIDO
        </ion-button>
      </div>

      <!-- Add Products Modal -->
      <ion-modal [isOpen]="showAddModal" (didDismiss)="showAddModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Agregar Productos</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showAddModal = false">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="add-modal-content">
            <div class="add-products-section">
              <ion-segment [(ngModel)]="addCategory" mode="ios">
                <ion-segment-button *ngFor="let cat of categories" [value]="cat.id">
                  <ion-label>{{ cat.name }}</ion-label>
                </ion-segment-button>
              </ion-segment>

              <div class="add-products-grid">
                <button
                  *ngFor="let product of getProductsForCategory(addCategory)"
                  class="add-product-btn"
                  [class.selected]="selectedProductsToAdd.has(product.id)"
                  [class.out-of-stock]="product.stock <= 0"
                  (click)="toggleAddProduct(product)"
                  [disabled]="product.stock <= 0"
                >
                  {{ product.name }}
                  <span class="price">\${{ product.price.toFixed(2) }}</span>
                </button>
              </div>

              <!-- Extra (Bandeja) -->
              <div class="extra-section" *ngIf="hasTakeawayItemsInOrder()">
                <button
                  class="add-product-btn extra"
                  (click)="addBandejaExtra()"
                >
                  <ion-icon name="cube-outline"></ion-icon>
                  Bandeja Extra (+\$0.25)
                </button>
              </div>
            </div>

            <ion-button
              expand="block"
              color="primary"
              (click)="confirmAddProducts()"
              [disabled]="selectedProductsToAdd.size === 0"
            >
              Agregar {{ selectedProductsToAdd.size }} productos
            </ion-button>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Success Toast -->
      <ion-toast
        [isOpen]="showSuccessToast"
        [message]="successMessage"
        [duration]="2000"
        position="top"
        color="success"
        (didDismiss)="showSuccessToast = false"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
    :host {
      --primary: #2563eb;
      --success: #059669;
      --warning: #f59e0b;
      --danger: #dc2626;
      --gray: #64748b;
    }

    .detail-container {
      --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-title {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title h1 {
      color: #fff;
      margin: 0;
      font-size: 1.25rem;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: var(--warning);
      color: #000;
    }

    .status-badge.completed {
      background: var(--success);
      color: #fff;
    }

    .order-info {
      display: flex;
      gap: 8px;
      padding: 16px;
      overflow-x: auto;
    }

    .info-card {
      flex: 1;
      min-width: 80px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }

    .info-card.highlight {
      background: var(--primary);
    }

    .info-card .label {
      display: block;
      color: var(--gray);
      font-size: 0.75rem;
      margin-bottom: 4px;
    }

    .info-card .value {
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .info-card .value.total { color: #fff; }
    .info-card .value.paid { color: var(--success); }
    .info-card .value.balance { color: #fff; }

    .section {
      padding: 16px;
    }

    .section h3 {
      color: #fff;
      margin: 0 0 12px 0;
      font-size: 1rem;
    }

    .items-list, .payments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-row, .payment-row {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 12px;
    }

    .item-row.paid {
      opacity: 0.6;
    }

    .item-checkbox {
      margin-right: 12px;
    }

    .item-checkbox ion-icon {
      font-size: 24px;
      color: var(--primary);
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      color: #fff;
      font-weight: 500;
    }

    .takeaway-tag {
      color: var(--warning);
      font-size: 0.75rem;
      margin-left: 4px;
    }

    .item-qty {
      color: var(--gray);
      font-size: 0.8rem;
      margin-left: 8px;
    }

    .item-price {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
      font-weight: 600;
    }

    .paid-badge {
      background: var(--success);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .payment-row {
      justify-content: space-between;
    }

    .payment-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
    }

    .payment-method {
      font-weight: 500;
    }

    .payment-time {
      color: var(--gray);
      font-size: 0.75rem;
    }

    .payment-amount {
      color: var(--success);
      font-weight: 700;
    }

    .payment-actions {
      padding: 16px;
      background: rgba(0, 0, 0, 0.2);
      margin: 16px;
      border-radius: 16px;
    }

    .payment-mode-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 16px;
    }

    .mode-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: none;
      background: transparent;
      color: var(--gray);
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
    }

    .mode-tab.active {
      background: var(--primary);
      color: #fff;
    }

    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .amount-input label, .vuelto-section label, .photo-section label {
      color: #fff;
      font-size: 0.9rem;
      margin-bottom: 8px;
      display: block;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 8px 16px;
    }

    .currency {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
      margin-right: 8px;
    }

    .input-wrapper input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
      outline: none;
    }

    .quick-amounts {
      display: flex;
      gap: 8px;
    }

    .quick-btn {
      flex: 1;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }

    .quick-btn:active {
      background: var(--primary);
    }

    .payment-method-select {
      display: flex;
      gap: 12px;
    }

    .method-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }

    .method-btn.active {
      border-color: var(--primary);
      background: rgba(37, 99, 235, 0.2);
    }

    .vuelto-section input, .ref-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      font-size: 1rem;
      outline: none;
    }

    .vuelto-result {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding: 8px 16px;
      background: var(--success);
      border-radius: 8px;
    }

    .vuelto-result span:first-child {
      color: rgba(255, 255, 255, 0.8);
    }

    .vuelto-amount {
      color: #fff;
      font-weight: 700;
    }

    .selected-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      color: #fff;
    }

    .selected-total .total {
      color: var(--primary);
      font-weight: 700;
      font-size: 1.25rem;
    }

    .finalize-section {
      padding: 16px;
      padding-bottom: 40px;
    }

    /* Add Modal */
    .add-modal-content {
      padding: 16px;
      --background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .add-products-section {
      margin-bottom: 24px;
    }

    .add-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .add-product-btn {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      color: #fff;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .add-product-btn.selected {
      background: var(--primary);
      border-color: var(--primary);
    }

    .add-product-btn.out-of-stock {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .add-product-btn .price {
      color: var(--gray);
      font-size: 0.9rem;
    }

    .extra-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .add-product-btn.extra {
      flex-direction: row;
      justify-content: center;
      gap: 12px;
      background: var(--warning);
      color: #000;
    }
  `]
})
export class PedidoDetailPage implements OnInit {
  orderId: number = 0;
  order: Order | null = null;
  items: OrderItem[] = [];
  payments: Payment[] = [];
  totalPaid: number = 0;
  balance: number = 0;

  // Payment
  paymentMode: 'amount' | 'items' = 'amount';
  paymentAmount: number = 0;
  paymentMethod: 'Efectivo' | 'Transferencia' = 'Efectivo';
  cashReceived: number = 0;
  transferRef: string = '';
  selectedItems: number[] = [];

  // Add modal
  showAddModal = false;
  addCategory: number = 1;
  categories: any[] = [];
  products: Product[] = [];
  selectedProductsToAdd: Map<number, { product: Product; qty: number; isTakeaway: boolean }> = new Map();

  // Toast
  showSuccessToast = false;
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    await this.loadData();
  }

  async loadData() {
    this.order = await this.orderService.getOrderById(this.orderId);
    if (!this.order) {
      this.router.navigate(['/pedidos']);
      return;
    }

    this.items = await this.orderService.getOrderItems(this.orderId);
    this.payments = await this.orderService.getPayments(this.orderId);
    this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
    this.balance = this.order.total - this.totalPaid;

    // Load products for add modal
    await this.productService.loadInitialData();
    this.productService.categories$.subscribe(cats => {
      this.categories = cats;
    });
    this.productService.products$.subscribe(prods => {
      this.products = prods;
    });
  }

  goBack() {
    this.router.navigate(['/pedidos']);
  }

  getProductsForCategory(categoryId: number): Product[] {
    return this.products.filter(p => p.category_id === categoryId && !p.is_extra && p.stock > 0);
  }

  get selectedItemsTotal(): number {
    return this.items
      .filter(i => this.selectedItems.includes(i.id!))
      .reduce((sum, i) => sum + i.subtotal, 0);
  }

  toggleItemSelection(item: OrderItem) {
    if (item.pagado || this.paymentMode !== 'items') return;

    const index = this.selectedItems.indexOf(item.id!);
    if (index >= 0) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item.id!);
    }
  }

  setQuickAmount(percent: number) {
    this.paymentAmount = Math.round(this.balance * percent) / 100;
  }

  async processAmountPayment() {
    const payment = await this.orderService.processPayment(
      this.orderId,
      this.paymentAmount,
      this.paymentMethod,
      this.transferRef || undefined,
      this.cashReceived ? `Recibido: $${this.cashReceived}, Vuelto: $${(this.cashReceived - this.paymentAmount).toFixed(2)}` : undefined
    );

    if (payment) {
      this.successMessage = `Pago de $${this.paymentAmount.toFixed(2)} registrado`;
      this.showSuccessToast = true;
      this.paymentAmount = 0;
      this.cashReceived = 0;
      this.transferRef = '';
      await this.loadData();
    }
  }

  async processItemsPayment() {
    const result = await this.orderService.processPaymentByItems(
      this.orderId,
      this.selectedItems,
      this.paymentMethod,
      this.transferRef || undefined
    );

    if (result.payment) {
      this.successMessage = `Pago de $${result.total.toFixed(2)} registrado`;
      this.showSuccessToast = true;
      this.selectedItems = [];
      this.cashReceived = 0;
      this.transferRef = '';
      await this.loadData();

      // Check if order is complete
      if (this.order?.status === 'Completed') {
        setTimeout(() => {
          this.router.navigate(['/pedidos']);
        }, 1500);
      }
    }
  }

  async finalizeOrder() {
    const success = await this.orderService.finalizeOrder(this.orderId);
    if (success) {
      this.successMessage = 'Pedido finalizado';
      this.showSuccessToast = true;
      setTimeout(() => {
        this.router.navigate(['/pedidos']);
      }, 1000);
    }
  }

  hasTakeawayItemsInOrder(): boolean {
    return this.items.some(i => i.is_takeaway && !i.pagado);
  }

  toggleAddProduct(product: Product) {
    if (this.selectedProductsToAdd.has(product.id)) {
      this.selectedProductsToAdd.delete(product.id);
    } else {
      this.selectedProductsToAdd.set(product.id, { product, qty: 1, isTakeaway: false });
    }
  }

  async addBandejaExtra() {
    const bandejaProduct = this.products.find(p => p.name === 'Bandeja extra para llevar');
    if (bandejaProduct) {
      await this.orderService.addItemsToOrder(this.orderId, [{
        product: bandejaProduct,
        quantity: 1,
        is_takeaway: true,
        subtotal: 0.25,
        extra_charge: 0.25
      }]);
      this.successMessage = 'Bandeja extra agregada';
      this.showSuccessToast = true;
      await this.loadData();
    }
  }

  async confirmAddProducts() {
    const itemsToAdd: CartItem[] = [];
    this.selectedProductsToAdd.forEach((value) => {
      itemsToAdd.push({
        product: value.product,
        quantity: value.qty,
        is_takeaway: value.isTakeaway,
        subtotal: value.product.price * value.qty,
        extra_charge: value.isTakeaway ? 0.25 * value.qty : 0
      });
    });

    if (itemsToAdd.length > 0) {
      await this.orderService.addItemsToOrder(this.orderId, itemsToAdd);
      this.successMessage = `${itemsToAdd.length} productos agregados`;
      this.showSuccessToast = true;
      this.showAddModal = false;
      this.selectedProductsToAdd.clear();
      await this.loadData();
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}

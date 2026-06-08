import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabase } from '../models/supabase';
import { Category, Product } from '../models/index';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private productsSubject = new BehaviorSubject<Product[]>([]);

  categories$ = this.categoriesSubject.asObservable();
  products$ = this.productsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    await this.loadCategories();
    await this.loadProducts();
  }

  async loadCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      this.categoriesSubject.next(data);
    }
    return data || [];
  }

  async loadProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('category_id')
      .order('sort_order');

    if (!error && data) {
      this.productsSubject.next(data);
    }
    return data || [];
  }

  getProductsByCategory(categoryId: number): Product[] {
    return this.productsSubject.value.filter(p => p.category_id === categoryId);
  }

  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find(p => p.id === id);
  }

  async updateStock(productId: number, quantity: number): Promise<boolean> {
    const product = this.getProductById(productId);
    if (!product) return false;

    const newStock = Math.max(0, product.stock - quantity);

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      await this.loadProducts();
      return true;
    }
    return false;
  }

  async addStock(productId: number, quantity: number): Promise<boolean> {
    const product = this.getProductById(productId);
    if (!product) return false;

    const newStock = product.stock + quantity;

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      await this.loadProducts();
      return true;
    }
    return false;
  }

  isInStock(productId: number, quantity: number = 1): boolean {
    const product = this.getProductById(productId);
    return product ? product.stock >= quantity : false;
  }
}

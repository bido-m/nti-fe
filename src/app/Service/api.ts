import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  category_id?: number | null;
  stock: number;
  category?: Category;
  specifications?: { [key: string]: string };
  rating?: { rate: number; count: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'https://fakestoreapi.com';

  private readonly defaultCategories: Category[] = [
    { id: 1, name: 'Electronics', slug: 'electronics', icon: 'mobile' },
    { id: 2, name: 'Jewelry', slug: 'jewelery', icon: 'gem' },
    { id: 3, name: "Men's Clothing", slug: "men's clothing", icon: 'shirt' },
    { id: 4, name: "Women's Clothing", slug: "women's clothing", icon: 'bag' }
  ];

  private cartSubject = new BehaviorSubject<CartItem[]>(this.getStoredCart());
  public cart$ = this.cartSubject.asObservable();
  public cartCount$ = this.cart$.pipe(
    map(items => items.reduce((acc, item) => acc + item.quantity, 0))
  );
  public cartTotal$ = this.cart$.pipe(
    map(items => items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0))
  );

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return of(this.defaultCategories);
  }

  getProducts(categoryId?: number, searchQuery?: string): Observable<Product[]> {
    let url = `${this.baseUrl}/products`;
    if (categoryId) {
      const cat = this.defaultCategories.find(c => c.id === categoryId);
      if (cat) {
        url = `${this.baseUrl}/products/category/${encodeURIComponent(cat.slug)}`;
      }
    }

    return this.http.get<any[]>(url).pipe(
      map((remoteProds) => {
        const mapped = (remoteProds || []).map(p => this.mapToProduct(p));
        const custom = this.getCustomProducts();

        let combined = [...mapped, ...custom];

        if (categoryId) {
          combined = combined.filter(p => p.category_id === categoryId);
        }

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          combined = combined.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }

        return combined;
      }),
      catchError(() => {
        let list = this.getCustomProducts();
        if (categoryId) list = list.filter(p => p.category_id === categoryId);
        return of(list);
      })
    );
  }

  getProductById(id: number | string): Observable<Product | null> {
    const numId = Number(id);

    // البحث في المنتجات المضافة محلياً أولاً لضمان فتحها حتى بعد الريفريش
    const customMatch = this.getCustomProducts().find(p => p.id === numId);
    if (customMatch) {
      return of(customMatch);
    }

    return this.http.get<any>(`${this.baseUrl}/products/${id}`).pipe(
      map(p => p ? this.mapToProduct(p) : null),
      catchError(() => of(null))
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const customList = this.getCustomProducts();
    const newId = 200 + customList.length + 1;
    const categoryObj = this.defaultCategories.find(c => c.id === product.category_id) || this.defaultCategories[0];

    const newProduct: Product = {
      id: newId,
      title: product.title || 'Untitled Product',
      description: product.description || '',
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 10,
      category_id: categoryObj.id,
      category: categoryObj,
      image_url: product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      specifications: {
        'Category': categoryObj.name,
        'Rating': '5.0 / 5 (New Arrival)',
        'Warranty': '1 Year International Warranty',
        'Return Policy': '30-Day Hassle-Free Returns'
      }
    };

    customList.unshift(newProduct);
    this.saveCustomProducts(customList);

    return this.http.post<any>(`${this.baseUrl}/products`, {
      title: newProduct.title,
      price: newProduct.price,
      description: newProduct.description,
      image: newProduct.image_url,
      category: categoryObj.slug
    }).pipe(
      map(() => newProduct),
      catchError(() => of(newProduct))
    );
  }

  addToCart(product: Product, quantity = 1): void {
    const items = [...this.cartSubject.value];
    const existingIndex = items.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({ id: Date.now(), product, quantity });
    }

    this.saveCart(items);
  }

  removeFromCart(productId: number): void {
    const items = this.cartSubject.value.filter(i => i.product.id !== productId);
    this.saveCart(items);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  private saveCart(items: CartItem[]): void {
    try { localStorage.setItem('lux_cart', JSON.stringify(items)); } catch {}
    this.cartSubject.next(items);
  }

  private getStoredCart(): CartItem[] {
    try {
      const stored = localStorage.getItem('lux_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getCustomProducts(): Product[] {
    try {
      const stored = localStorage.getItem('lux_custom_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveCustomProducts(products: Product[]): void {
    try { localStorage.setItem('lux_custom_products', JSON.stringify(products)); } catch {}
  }

  private mapToProduct(item: any): Product {
    const catSlug = (item.category || '').toLowerCase();
    const matchedCat = this.defaultCategories.find(c => c.slug === catSlug) || {
      id: 1,
      name: item.category || 'General',
      slug: catSlug
    };

    return {
      id: Number(item.id),
      title: item.title,
      description: item.description,
      price: Number(item.price),
      image_url: item.image || item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      category_id: matchedCat.id,
      category: matchedCat,
      stock: item.rating?.count ? Math.min(Math.max(item.rating.count, 5), 45) : 15,
      rating: item.rating,
      specifications: {
        'Category': matchedCat.name,
        'Rating': item.rating ? `${item.rating.rate} / 5 (${item.rating.count} reviews)` : '4.8 / 5',
        'Warranty': '1 Year Official International Warranty',
        'Return Policy': '30-Day Hassle-Free Returns',
        'Authenticity': '100% Certified Genuine'
      }
    };
  }
}

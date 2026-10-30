import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { AuthService } from './auth';

export interface Category {
  _id?: string;
  id: string | number;
  name: string;
  slug: string;
  image?: { secure_url?: string; public_id?: string } | string;
  icon?: string;
}

export interface Subcategory {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  category_id?: any;
}

export interface Brand {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  logo?: { secure_url?: string; public_id?: string } | string;
}

export interface Product {
  _id?: string;
  id: string | number;
  name: string;
  title: string; // compatibility alias
  slug?: string;
  description?: string | null;
  price: number;
  stock: number;
  colors?: string[];
  sizes?: string[];
  image?: { secure_url?: string; public_id?: string };
  image_url?: string | null;
  category_id?: any;
  category?: Category;
  subcategory_id?: any;
  subcategory?: Subcategory;
  brand_id?: any;
  brand?: Brand;
  specifications?: { [key: string]: string };
  rating?: { rate: number; count: number };
}

export interface CartItem {
  id: string | number;
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'https://nti-be.vercel.app';

  // Reactive Cart Signal for immediate, zoneless UI updates
  public readonly cart = signal<CartItem[]>(this.getStoredCart());
  public readonly cartCount = computed(() =>
    this.cart().reduce((acc, item) => acc + item.quantity, 0)
  );
  public readonly cartTotal = computed(() =>
    this.cart().reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  );

  // Observable compatibility
  private cartSubject = new BehaviorSubject<CartItem[]>(this.cart());
  public cart$ = this.cartSubject.asObservable();
  public cartCount$ = this.cart$.pipe(map(items => items.reduce((a, b) => a + b.quantity, 0)));
  public cartTotal$ = this.cart$.pipe(map(items => items.reduce((a, b) => a + (b.product.price * b.quantity), 0)));

  // Fallback categories in case backend hasn't populated them yet
  private readonly fallbackCategories: Category[] = [
    { id: 'cat_electronics', name: 'Electronics', slug: 'electronics', icon: 'mobile' },
    { id: 'cat_watches', name: 'Luxury Watches', slug: 'watches', icon: 'gem' },
    { id: 'cat_fashion', name: 'Haute Couture', slug: 'fashion', icon: 'shirt' },
    { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', icon: 'bag' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Sync cart on startup if logged in
    if (this.authService.isLoggedIn()) {
      this.fetchBackendCart().subscribe();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('x', token).set('authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ================= CATEGORIES =================
  getCategories(): Observable<Category[]> {
    return this.http.get<{ message?: string; count?: number; data?: any[] }>(`${this.baseUrl}/category`).pipe(
      map(res => {
        const list = res.data || (Array.isArray(res) ? res : []);
        if (list.length === 0) return this.fallbackCategories;
        return list.map(c => ({
          _id: c._id,
          id: c._id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          image: c.image?.secure_url || c.image,
          icon: 'gem'
        }));
      }),
      catchError(() => of(this.fallbackCategories))
    );
  }

  // ================= SUBCATEGORIES =================
  getSubcategories(categoryId?: string): Observable<Subcategory[]> {
    return this.http.get<{ message?: string; subcategories?: any[] }>(`${this.baseUrl}/subcategory`).pipe(
      map(res => {
        let list = res.subcategories || [];
        if (categoryId) {
          list = list.filter(s => {
            const catId = typeof s.category_id === 'object' ? s.category_id?._id : s.category_id;
            return String(catId) === String(categoryId);
          });
        }
        return list.map(s => ({
          _id: s._id,
          id: s._id,
          name: s.name,
          slug: s.slug,
          category_id: s.category_id
        }));
      }),
      catchError(() => of([]))
    );
  }

  // ================= BRANDS =================
  getBrands(): Observable<Brand[]> {
    return this.http.get<{ message?: string; count?: number; data?: any[] }>(`${this.baseUrl}/brand`).pipe(
      map(res => {
        const list = res.data || (Array.isArray(res) ? res : []);
        return list.map(b => ({
          _id: b._id,
          id: b._id,
          name: b.name,
          slug: b.slug,
          logo: b.logo?.secure_url || b.logo
        }));
      }),
      catchError(() => of([]))
    );
  }

  // ================= PRODUCTS =================
  getProducts(categoryId?: string | number, searchQuery?: string, brandId?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('category_id', String(categoryId));
    if (searchQuery && searchQuery.trim()) params = params.set('search', searchQuery.trim());
    if (brandId) params = params.set('brand_id', brandId);

    return this.http.get<{ message?: string; products?: any[] }>(`${this.baseUrl}/product`, { params }).pipe(
      map(res => {
        const rawList = res.products || (Array.isArray(res) ? res : []);
        const mapped = rawList.map(p => this.mapToProduct(p));

        // In-memory filter fallback just in case backend query parameters vary
        let results = mapped;
        if (categoryId) {
          results = results.filter(p => {
            const pCatId = p.category?._id || p.category_id;
            return String(pCatId) === String(categoryId);
          });
        }
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          results = results.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }

        // Merge any locally created mock products if available
        const local = this.getCustomProducts();
        if (local.length > 0) {
          results = [...local, ...results];
        }

        return results;
      }),
      catchError((err) => {
        console.warn('API Error fetching products from backend, falling back to cached:', err);
        let list = this.getCustomProducts();
        if (categoryId) {
          list = list.filter(p => String(p.category_id) === String(categoryId));
        }
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          list = list.filter(p => p.name.toLowerCase().includes(q));
        }
        return of(list);
      })
    );
  }

  getProductById(id: string | number): Observable<Product | null> {
    const stringId = String(id);
    const local = this.getCustomProducts().find(p => String(p.id) === stringId || String(p._id) === stringId);
    if (local) return of(local);

    return this.http.get<{ message?: string; product?: any }>(`${this.baseUrl}/product/${id}`).pipe(
      map(res => {
        const p = res.product || res;
        return p ? this.mapToProduct(p) : null;
      }),
      catchError(() => of(null))
    );
  }

  createProduct(data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category_id: string;
    subcategory_id: string;
    brand_id: string;
    colors?: string[];
    sizes?: string[];
    image_url?: string;
  }, imageFile?: File): Observable<any> {
    const headers = this.getAuthHeaders();

    if (imageFile) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      formData.append('stock', String(data.stock));
      formData.append('category_id', data.category_id);
      formData.append('subcategory_id', data.subcategory_id);
      formData.append('brand_id', data.brand_id);
      if (data.colors) formData.append('colors', JSON.stringify(data.colors));
      if (data.sizes) formData.append('sizes', JSON.stringify(data.sizes));
      formData.append('image', imageFile);

      return this.http.post<any>(`${this.baseUrl}/product`, formData, { headers });
    } else {
      return this.http.post<any>(`${this.baseUrl}/product`, data, { headers });
    }
  }

  deleteProduct(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/product/${id}`, { headers });
  }

  // ================= CART OPERATIONS =================
  fetchBackendCart(): Observable<CartItem[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ message: string; data?: { products: any[] }; totalCartPrice?: number }>(
      `${this.baseUrl}/cart`,
      { headers }
    ).pipe(
      map(res => {
        const backendProducts = res.data?.products || [];
        const items: CartItem[] = backendProducts
          .filter(item => item.product_id)
          .map(item => ({
            id: item.product_id._id || item.product_id.id,
            product: this.mapToProduct(item.product_id),
            quantity: item.quantity
          }));
        this.updateCartState(items);
        return items;
      }),
      catchError(() => of(this.cart()))
    );
  }

  addToCart(product: Product, quantity = 1): void {
    const items = [...this.cart()];
    const productIdStr = String(product._id || product.id);
    const existingIndex = items.findIndex(i => String(i.product._id || i.product.id) === productIdStr);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
      if (items[existingIndex].quantity <= 0) {
        items.splice(existingIndex, 1);
      }
    } else if (quantity > 0) {
      items.push({ id: product._id || product.id, product, quantity });
    }

    this.updateCartState(items);

    // If logged in, sync with backend
    if (this.authService.isLoggedIn() && product._id) {
      const headers = this.getAuthHeaders();
      this.http.post(`${this.baseUrl}/cart`, { product_id: product._id, quantity }, { headers })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  removeFromCart(productId: string | number): void {
    const idStr = String(productId);
    const items = this.cart().filter(i => String(i.product._id || i.product.id) !== idStr);
    this.updateCartState(items);

    if (this.authService.isLoggedIn()) {
      const headers = this.getAuthHeaders();
      this.http.delete(`${this.baseUrl}/cart/product/${productId}`, { headers })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  clearCart(): void {
    this.updateCartState([]);
    if (this.authService.isLoggedIn()) {
      const headers = this.getAuthHeaders();
      this.http.delete(`${this.baseUrl}/cart/clear`, { headers })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  checkout(address?: string, phone?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/order`, {
      address: address || 'Cairo, Egypt',
      phone: phone || '01000000000',
      paymentMethod: 'cash'
    }, { headers }).pipe(
      tap(() => this.clearCart())
    );
  }

  private updateCartState(items: CartItem[]): void {
    try {
      localStorage.setItem('lux_cart', JSON.stringify(items));
    } catch {}
    this.cart.set(items);
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

  public mapToProduct(item: any): Product {
    const id = item._id || item.id || 'prod_' + Math.random().toString(36).substring(2, 9);
    const name = item.name || item.title || 'Untitled Product';
    const imageUrl = item.image?.secure_url ||
      (typeof item.image === 'string' ? item.image : null) ||
      item.image_url ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

    const categoryObj = item.category_id && typeof item.category_id === 'object'
      ? { _id: item.category_id._id, id: item.category_id._id, name: item.category_id.name, slug: item.category_id.slug }
      : (item.category || { id: item.category_id || 1, name: 'Exclusive', slug: 'exclusive' });

    const brandObj = item.brand_id && typeof item.brand_id === 'object'
      ? { _id: item.brand_id._id, id: item.brand_id._id, name: item.brand_id.name, logo: item.brand_id.logo }
      : item.brand;

    const subcategoryObj = item.subcategory_id && typeof item.subcategory_id === 'object'
      ? { _id: item.subcategory_id._id, id: item.subcategory_id._id, name: item.subcategory_id.name }
      : item.subcategory;

    return {
      _id: item._id || id,
      id: id,
      name: name,
      title: name,
      slug: item.slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: item.description || '',
      price: Number(item.price) || 0,
      stock: item.stock !== undefined ? Number(item.stock) : 15,
      image_url: imageUrl,
      image: { secure_url: imageUrl, public_id: item.image?.public_id || '' },
      category_id: categoryObj._id || categoryObj.id,
      category: categoryObj,
      brand_id: brandObj?._id,
      brand: brandObj,
      subcategory_id: subcategoryObj?._id,
      subcategory: subcategoryObj,
      colors: Array.isArray(item.colors) ? item.colors : [],
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      rating: item.rating || { rate: 4.9, count: 32 },
      specifications: {
        'Category': categoryObj.name || 'Exclusive',
        'Brand': brandObj?.name || 'Luxury Edition',
        'Authenticity': '100% Certified Genuine',
        'Warranty': '2 Years International Official Guarantee',
        'Delivery': 'Express Courier with White Glove Service'
      }
    };
  }
}

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
  createdAt?: string;
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

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  product_id: string;
  user_id?: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  product_id: Product;
  quantity: number;
  price?: number;
  _id?: string;
}

export interface Order {
  _id: string;
  id?: string;
  user_id?: any;
  products: OrderItem[];
  totalPrice?: number;
  totalOrderPrice?: number;
  status: 'pending' | 'completed' | 'canceled' | string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  id: string | number;
  name: string;
  title: string;
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

  // Reactive Cart Signal for immediate UI updates
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

  // Fallback categories in case backend hasn't populated them
  private readonly fallbackCategories: Category[] = [
    { id: 'cat_electronics', name: 'Electronics & Audio', slug: 'electronics', icon: 'bolt' },
    { id: 'cat_watches', name: 'Luxury Watches', slug: 'watches', icon: 'clock' },
    { id: 'cat_fashion', name: 'Apparel & Lifestyle', slug: 'apparel', icon: 'shirt' },
    { id: 'cat_accessories', name: 'Minimalist Accessories', slug: 'accessories', icon: 'bag' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
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
          image: c.image?.secure_url || c.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          icon: 'tag'
        }));
      }),
      catchError(() => of(this.fallbackCategories))
    );
  }

  getCategoryById(id: string): Observable<Category | null> {
    return this.http.get<{ message?: string; data?: any }>(`${this.baseUrl}/category/${id}`).pipe(
      map(res => {
        const c = res.data || res;
        return c ? {
          _id: c._id,
          id: c._id,
          name: c.name,
          slug: c.slug,
          image: c.image?.secure_url || c.image
        } : null;
      }),
      catchError(() => of(null))
    );
  }

  createCategory(name: string, imageFile?: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.post<any>(`${this.baseUrl}/category`, formData, { headers });
  }

  updateCategory(id: string, name: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/category/${id}`, { name }, { headers });
  }

  deleteCategory(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/category/${id}`, { headers });
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

  getSubcategoryById(id: string): Observable<Subcategory | null> {
    return this.http.get<{ message?: string; data?: any }>(`${this.baseUrl}/subcategory/${id}`).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    );
  }

  createSubcategory(name: string, category_id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/subcategory`, { name, category_id }, { headers });
  }

  updateSubcategory(id: string, data: { name: string; slug?: string; category_id?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/subcategory/${id}`, data);
  }

  deleteSubcategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/subcategory/${id}`);
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
          logo: b.logo?.secure_url || b.logo || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'
        }));
      }),
      catchError(() => of([]))
    );
  }

  getBrandById(id: string): Observable<Brand | null> {
    return this.http.get<{ message?: string; data?: any }>(`${this.baseUrl}/brand/${id}`).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    );
  }

  createBrand(name: string, logoFile?: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('name', name);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return this.http.post<any>(`${this.baseUrl}/brand`, formData, { headers });
  }

  updateBrand(id: string, name: string, logoFile?: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('name', name);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return this.http.put<any>(`${this.baseUrl}/brand/${id}`, formData, { headers });
  }

  deleteBrand(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/brand/${id}`, { headers });
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
        let results = rawList.map(p => this.mapToProduct(p));

        if (categoryId) {
          results = results.filter(p => {
            const pCatId = p.category?._id || p.category_id;
            return String(pCatId) === String(categoryId);
          });
        }
        if (brandId) {
          results = results.filter(p => {
            const pBrandId = p.brand?._id || p.brand_id;
            return String(pBrandId) === String(brandId);
          });
        }
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          results = results.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }

        const local = this.getCustomProducts();
        if (local.length > 0) {
          results = [...local, ...results];
        }

        return results;
      }),
      catchError((err) => {
        console.warn('Backend product error, using cached:', err);
        return of(this.getCustomProducts());
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

  updateProduct(id: string, data: { price?: number; stock?: number; description?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/product/${id}`, data, { headers });
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

    let newQuantity = quantity;
    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
      newQuantity = items[existingIndex].quantity;
      if (items[existingIndex].quantity <= 0) {
        items.splice(existingIndex, 1);
      }
    } else if (quantity > 0) {
      items.push({ id: product._id || product.id, product, quantity });
    }

    this.updateCartState(items);

    if (this.authService.isLoggedIn() && product._id) {
      const headers = this.getAuthHeaders();
      if (existingIndex > -1 && newQuantity > 0) {
        this.http.put(`${this.baseUrl}/cart/quantity`, { product_id: product._id, quantity: newQuantity }, { headers })
          .pipe(catchError(() => of(null)))
          .subscribe();
      } else if (existingIndex === -1 && quantity > 0) {
        this.http.post(`${this.baseUrl}/cart`, { product_id: product._id, quantity }, { headers })
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
    }
  }

  updateQuantity(productId: string | number, quantity: number): void {
    const idStr = String(productId);
    const items = [...this.cart()];
    const index = items.findIndex(i => String(i.product._id || i.product.id) === idStr);

    if (index > -1) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
        return;
      }
      items[index].quantity = quantity;
      this.updateCartState(items);

      if (this.authService.isLoggedIn()) {
        const headers = this.getAuthHeaders();
        const pId = items[index].product._id || idStr;
        this.http.put(`${this.baseUrl}/cart/quantity`, { product_id: pId, quantity }, { headers })
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
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

  // ================= ORDERS =================
  createOrder(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/order`, {}, { headers }).pipe(
      tap(() => this.clearCart())
    );
  }

  getMyOrders(): Observable<Order[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ message?: string; count?: number; data?: Order[] }>(`${this.baseUrl}/order/my-orders`, { headers }).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getOrderById(orderId: string): Observable<Order | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ message?: string; data?: Order }>(`${this.baseUrl}/order/${orderId}`, { headers }).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    );
  }

  cancelOrder(orderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/order/${orderId}/cancel`, {}, { headers });
  }

  getAllOrders(): Observable<Order[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ message?: string; count?: number; data?: Order[] }>(`${this.baseUrl}/order`, { headers }).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'canceled'): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/order/${orderId}/status`, { status }, { headers });
  }

  // ================= REVIEWS =================
  getProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<{ message?: string; count?: number; data?: Review[] }>(`${this.baseUrl}/review/product/${productId}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  addReview(productId: string, rating: number, comment: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.baseUrl}/review`, { product_id: productId, rating, comment }, { headers });
  }

  updateReview(reviewId: string, rating: number, comment: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.baseUrl}/review/${reviewId}`, { rating, comment }, { headers });
  }

  deleteReview(reviewId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.baseUrl}/review/${reviewId}`, { headers });
  }

  // ================= HELPER & STATE =================
  private updateCartState(items: CartItem[]): void {
    try {
      localStorage.setItem('shopify_cart', JSON.stringify(items));
    } catch {}
    this.cart.set(items);
    this.cartSubject.next(items);
  }

  private getStoredCart(): CartItem[] {
    try {
      const stored = localStorage.getItem('shopify_cart') || localStorage.getItem('lux_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getCustomProducts(): Product[] {
    try {
      const stored = localStorage.getItem('shopify_custom_products') || localStorage.getItem('lux_custom_products');
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
      : (item.category || { id: item.category_id || 1, name: 'General', slug: 'general' });

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
      stock: item.stock !== undefined ? Number(item.stock) : 20,
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
      rating: item.rating || { rate: 4.8, count: 24 },
      specifications: {
        'Category': categoryObj.name || 'General',
        'Brand': brandObj?.name || 'Curated',
        'Authenticity': '100% Certified Genuine',
        'Warranty': '2 Years Official Warranty',
        'Delivery': 'Express Insured Courier'
      }
    };
  }
}

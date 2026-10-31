import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faTrash,
  faBoxOpen,
  faTags,
  faStore,
  faLayerGroup,
  faCheck,
  faCircleExclamation,
  faClock,
  faCircleCheck,
  faBan,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, Category, Subcategory, Brand, Product, Order } from '../../Service/api';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminDashboard implements OnInit {
  faPlus = faPlus;
  faTrash = faTrash;
  faBoxOpen = faBoxOpen;
  faTags = faTags;
  faStore = faStore;
  faLayerGroup = faLayerGroup;
  faCheck = faCheck;
  faCircleExclamation = faCircleExclamation;
  faClock = faClock;
  faCircleCheck = faCircleCheck;
  faBan = faBan;
  faArrowRight = faArrowRight;

  activeTab = signal<'products' | 'catalog' | 'orders'>('products');

  // Products
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  subcategories = signal<Subcategory[]>([]);
  brands = signal<Brand[]>([]);

  // Product Form
  pName = signal<string>('');
  pDescription = signal<string>('');
  pPrice = signal<number | null>(null);
  pStock = signal<number | null>(20);
  pCategoryId = signal<string>('');
  pSubcategoryId = signal<string>('');
  pBrandId = signal<string>('');
  selectedProductImage: File | null = null;
  productImagePreview = signal<string | null>(null);

  // Category Form
  catName = signal<string>('');
  selectedCatImage: File | null = null;

  // Subcategory Form
  subName = signal<string>('');
  subCatId = signal<string>('');

  // Brand Form
  brandName = signal<string>('');
  selectedBrandLogo: File | null = null;

  // Orders Admin
  orders = signal<Order[]>([]);

  // State
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  public apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.apiService.getCategories().subscribe(c => {
      this.categories.set(c);
      if (c.length > 0 && !this.pCategoryId()) {
        this.pCategoryId.set(c[0]._id || String(c[0].id));
        this.subCatId.set(c[0]._id || String(c[0].id));
      }
      this.cdr.markForCheck();
    });

    this.apiService.getSubcategories().subscribe(s => {
      this.subcategories.set(s);
      if (s.length > 0 && !this.pSubcategoryId()) {
        this.pSubcategoryId.set(s[0]._id || String(s[0].id));
      }
      this.cdr.markForCheck();
    });

    this.apiService.getBrands().subscribe(b => {
      this.brands.set(b);
      if (b.length > 0 && !this.pBrandId()) {
        this.pBrandId.set(b[0]._id || String(b[0].id));
      }
      this.cdr.markForCheck();
    });

    this.apiService.getProducts().subscribe(p => {
      this.products.set(p);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });

    this.loadOrders();
  }

  loadOrders(): void {
    this.apiService.getAllOrders().subscribe(o => {
      this.orders.set(o);
      this.cdr.markForCheck();
    });
  }

  onProductFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedProductImage = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.productImagePreview.set(e.target?.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedProductImage);
    }
  }

  onCatFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedCatImage = input.files[0];
    }
  }

  onBrandLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedBrandLogo = input.files[0];
    }
  }

  createProduct(): void {
    if (!this.pName() || !this.pPrice()) {
      this.errorMsg.set('Name and price are required.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.cdr.markForCheck();

    const payload = {
      name: this.pName(),
      description: this.pDescription(),
      price: Number(this.pPrice()),
      stock: Number(this.pStock() || 10),
      category_id: this.pCategoryId(),
      subcategory_id: this.pSubcategoryId() || this.pCategoryId(),
      brand_id: this.pBrandId()
    };

    this.apiService.createProduct(payload, this.selectedProductImage || undefined).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMsg.set('Product created successfully!');
        this.pName.set('');
        this.pDescription.set('');
        this.pPrice.set(null);
        this.productImagePreview.set(null);
        this.selectedProductImage = null;
        this.loadAllData();
        setTimeout(() => this.successMsg.set(null), 3500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Error creating product.');
        this.cdr.markForCheck();
      }
    });
  }

  deleteProduct(id: string): void {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.apiService.deleteProduct(id).subscribe({
      next: () => {
        this.successMsg.set('Product deleted.');
        this.loadAllData();
        setTimeout(() => this.successMsg.set(null), 2500);
      },
      error: (err) => alert(err?.error?.message || 'Error deleting product.')
    });
  }

  createCategory(): void {
    if (!this.catName()) return;
    this.isSubmitting.set(true);
    this.apiService.createCategory(this.catName(), this.selectedCatImage || undefined).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.catName.set('');
        this.selectedCatImage = null;
        this.successMsg.set('Category created successfully!');
        this.loadAllData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to create category.');
      }
    });
  }

  createSubcategory(): void {
    if (!this.subName() || !this.subCatId()) return;
    this.isSubmitting.set(true);
    this.apiService.createSubcategory(this.subName(), this.subCatId()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.subName.set('');
        this.successMsg.set('Subcategory created successfully!');
        this.loadAllData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to create subcategory.');
      }
    });
  }

  createBrand(): void {
    if (!this.brandName()) return;
    this.isSubmitting.set(true);
    this.apiService.createBrand(this.brandName(), this.selectedBrandLogo || undefined).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.brandName.set('');
        this.selectedBrandLogo = null;
        this.successMsg.set('Brand created successfully!');
        this.loadAllData();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to create brand.');
      }
    });
  }

  updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'canceled'): void {
    this.apiService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.successMsg.set(`Order status updated to "${status}".`);
        this.loadOrders();
        setTimeout(() => this.successMsg.set(null), 2500);
      },
      error: (err) => alert(err?.error?.message || 'Error updating order status.')
    });
  }
}

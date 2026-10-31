import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMagnifyingGlass,
  faSliders,
  faXmark,
  faRotateRight,
  faCheck,
  faFilter,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import { ProductList } from '../product-list/product-list';
import { ApiService, Category, Brand, Product } from '../../Service/api';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductList, FontAwesomeModule],
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  faMagnifyingGlass = faMagnifyingGlass;
  faSliders = faSliders;
  faXmark = faXmark;
  faRotateRight = faRotateRight;
  faCheck = faCheck;
  faFilter = faFilter;
  faStore = faStore;

  // Reactive State Signals
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  selectedBrandId = signal<string | null>(null);
  searchQuery = signal<string>('');
  sortBy = signal<string>('default');
  onlyInStock = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  addedToast = signal<string | null>(null);

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadProducts();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  loadBrands(): void {
    this.apiService.getBrands().subscribe({
      next: (brandsList) => {
        this.brands.set(brandsList);
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const catId = this.selectedCategoryId() || undefined;
    const query = this.searchQuery() || undefined;
    const brandId = this.selectedBrandId() || undefined;

    this.apiService.getProducts(catId, query, brandId).subscribe({
      next: (prods) => {
        let results = [...prods];

        if (this.onlyInStock()) {
          results = results.filter(p => p.stock > 0);
        }

        if (this.sortBy() === 'price-low') {
          results.sort((a, b) => a.price - b.price);
        } else if (this.sortBy() === 'price-high') {
          results.sort((a, b) => b.price - a.price);
        } else if (this.sortBy() === 'name') {
          results.sort((a, b) => a.name.localeCompare(b.name));
        }

        this.products.set(results);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  selectCategory(categoryId: string | number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.loadProducts();
  }

  selectBrand(brandId: string | null): void {
    this.selectedBrandId.set(brandId);
    this.loadProducts();
  }

  toggleInStock(): void {
    this.onlyInStock.update(v => !v);
    this.loadProducts();
  }

  onSearch(): void {
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadProducts();
  }

  resetAllFilters(): void {
    this.selectedCategoryId.set(null);
    this.selectedBrandId.set(null);
    this.searchQuery.set('');
    this.sortBy.set('default');
    this.onlyInStock.set(false);
    this.loadProducts();
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortBy.set(val);
    this.loadProducts();
  }

  handleAddToCart(product: Product): void {
    this.apiService.addToCart(product, 1);
    this.addedToast.set(`Added "${product.title}" to your cart!`);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.addedToast.set(null);
      this.cdr.markForCheck();
    }, 2800);
  }
}

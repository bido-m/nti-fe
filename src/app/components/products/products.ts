import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMagnifyingGlass,
  faSliders,
  faXmark,
  faRotateRight,
  faCrown,
  faCheck,
  faFilter
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
  faCrown = faCrown;
  faCheck = faCheck;
  faFilter = faFilter;

  // Modern Angular Signals (Zoneless Reactivity)
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  selectedBrandId = signal<string | null>(null);
  searchQuery = signal<string>('');
  sortBy = signal<string>('default');
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
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  loadBrands(): void {
    this.apiService.getBrands().subscribe({
      next: (brandsList) => {
        this.brands.set(brandsList);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
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
        let sorted = [...prods];
        if (this.sortBy() === 'price-low') {
          sorted.sort((a, b) => a.price - b.price);
        } else if (this.sortBy() === 'price-high') {
          sorted.sort((a, b) => b.price - a.price);
        } else if (this.sortBy() === 'name') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }

        this.products.set(sorted);
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

  onSearch(): void {
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadProducts();
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortBy.set(val);
    this.loadProducts();
  }

  handleAddToCart(product: Product): void {
    this.apiService.addToCart(product, 1);
    this.addedToast.set(`Added "${product.title}" to your luxury bag!`);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.addedToast.set(null);
      this.cdr.markForCheck();
    }, 2800);
  }
}

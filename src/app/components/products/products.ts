import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductList } from '../product-list/product-list';
import { ApiService, Category, Product } from '../../Service/api';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductList],
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  searchQuery: string = '';
  isLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => (this.categories = cats)
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.apiService.getProducts(this.selectedCategoryId || undefined, this.searchQuery).subscribe({
      next: (prods) => {
        this.products = prods;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.loadProducts();
  }

  onSearch(): void {
    this.loadProducts();
  }

  handleAddToCart(product: Product): void {
    alert(`تمت إضافة "${product.title}" إلى السلة بنجاح!`);
  }
}

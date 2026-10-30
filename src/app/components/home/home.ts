import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCrown,
  faAward,
  faRotate,
  faHeadphones,
  faArrowRight,
  faShieldHalved,
  faGem,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { ProductList } from '../product-list/product-list';
import { ApiService, Category, Product } from '../../Service/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, ProductList],
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  faCrown = faCrown;
  faArrowRight = faArrowRight;
  faGem = faGem;
  faCheck = faCheck;

  // Zoneless Reactivity using Signals
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  isLoading = signal<boolean>(true);
  addedToast = signal<string | null>(null);

  whyChoose = [
    {
      head: 'Masterpiece Quality',
      icon: faGem,
      info: 'Handpicked products that meet the highest standards of timeless excellence and artisanship.'
    },
    {
      head: '100% Certified Genuine',
      icon: faAward,
      info: 'Every individual piece is inspected by certified specialists and backed with cryptographic proof.'
    },
    {
      head: 'White Glove Returns',
      icon: faRotate,
      info: '30-day effortless returns with complimentary insured courier pickup straight from your door.'
    },
    {
      head: '24/7 Private Concierge',
      icon: faHeadphones,
      info: 'Our dedicated VIP advisory team is always available for personal consultations and custom orders.'
    }
  ];

  brands = [
    { name: 'Apple', tag: 'Titanium Series' },
    { name: 'Rolex', tag: 'Geneva Horlogerie' },
    { name: 'Patek Philippe', tag: 'Complications' },
    { name: 'Audemars Piguet', tag: 'Royal Oak' },
    { name: 'Cartier', tag: 'High Jewelry' }
  ];

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadCategories();
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

  loadProducts(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const catId = this.selectedCategoryId() || undefined;
    this.apiService.getProducts(catId).subscribe({
      next: (prods) => {
        this.products.set(prods);
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

  selectCategory(id: string | number | null): void {
    this.selectedCategoryId.set(id);
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

  scrollToProducts(): void {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

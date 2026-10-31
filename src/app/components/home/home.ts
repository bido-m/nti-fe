import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faTruckFast,
  faShieldHalved,
  faRotate,
  faHeadphones,
  faCheck,
  faStar,
  faEnvelope,
  faBagShopping,
  faTag
} from '@fortawesome/free-solid-svg-icons';
import { ProductList } from '../product-list/product-list';
import { ApiService, Category, Product } from '../../Service/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, ProductList],
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  faArrowRight = faArrowRight;
  faTruckFast = faTruckFast;
  faShieldHalved = faShieldHalved;
  faRotate = faRotate;
  faHeadphones = faHeadphones;
  faCheck = faCheck;
  faStar = faStar;
  faEnvelope = faEnvelope;
  faBagShopping = faBagShopping;
  faTag = faTag;

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  isLoading = signal<boolean>(true);
  addedToast = signal<string | null>(null);

  newsletterEmail = signal<string>('');
  newsletterSuccess = signal<boolean>(false);

  features = [
    {
      title: 'Free Express Shipping',
      desc: 'On all domestic & international orders over $150',
      icon: faTruckFast
    },
    {
      title: '100% Certified Authentic',
      desc: 'Direct from brand houses & vetted manufacturers',
      icon: faShieldHalved
    },
    {
      title: '30-Day Easy Returns',
      desc: 'Hassle-free exchanges or full refunds guaranteed',
      icon: faRotate
    },
    {
      title: '24/7 Dedicated Support',
      desc: 'Expert customer care always ready to assist you',
      icon: faHeadphones
    }
  ];

  brands = [
    { name: 'Apple', logo: 'https://res.cloudinary.com/gl2sbgtp/image/upload/v1793395405/e-comm/brands/iymxpcwjg8xbnmtlygxv.jpg' },
    { name: 'Sony', logo: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150' },
    { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150' },
    { name: 'Rolex', logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150' }
  ];

  testimonials = [
    {
      name: 'Sarah Jenkins',
      title: 'Verified Buyer',
      comment: 'The fastest delivery and exceptional packaging. The iPhone arrived within 24 hours in mint condition. Truly a 5-star experience!',
      rating: 5
    },
    {
      name: 'Omar Farouk',
      title: 'Tech Enthusiast',
      comment: 'Top quality products with official manufacturer warranties. Customer support resolved my inquiry in minutes.',
      rating: 5
    },
    {
      name: 'Elena Rostova',
      title: 'Verified Buyer',
      comment: 'Flawless checkout experience. The slide-out cart and fast order confirmation make this store my go-to shop.',
      rating: 5
    }
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
    this.addedToast.set(`Added "${product.title}" to your cart!`);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.addedToast.set(null);
      this.cdr.markForCheck();
    }, 2800);
  }

  scrollToProducts(): void {
    const el = document.getElementById('bestsellers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onSubscribeNewsletter(): void {
    if (this.newsletterEmail().trim()) {
      this.newsletterSuccess.set(true);
      setTimeout(() => {
        this.newsletterSuccess.set(false);
        this.newsletterEmail.set('');
        this.cdr.markForCheck();
      }, 4000);
    }
  }
}

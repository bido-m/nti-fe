import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faWandMagicSparkles,
  faAward,
  faRotate,
  faHeadphones,
  faArrowRight
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
  categories: Category[] = [];
  products: Product[] = [];
  selectedCategoryId: number | null = null;
  isLoading = true;

  faArrowRight = faArrowRight;

  whyChoose = [
    {
      head: 'Premium Quality',
      icon: faWandMagicSparkles,
      info: 'Handpicked products that meet the highest standards of excellence'
    },
    {
      head: 'Certified Products',
      icon: faAward,
      info: 'All items are verified and come with authenticity guarantee'
    },
    {
      head: 'Easy Returns',
      icon: faRotate,
      info: '30-day hassle-free returns with no questions asked policy'
    },
    {
      head: '24/7 Support',
      icon: faHeadphones,
      info: 'Our dedicated team is always ready to assist you anytime'
    }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.apiService.getProducts(this.selectedCategoryId || undefined).subscribe({
      next: (prods) => {
        this.products = prods;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId = id;
    this.loadProducts();
  }

  handleAddToCart(product: Product): void {
    alert(`تمت إضافة "${product.title}" إلى السلة بنجاح!`);
  }

  scrollToProducts(): void {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

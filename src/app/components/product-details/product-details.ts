import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart,
  faCartShopping,
  faAward,
  faRotate
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, Product } from '../../Service/api';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  styleUrl: './product-details.css',
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  isLoading = true;
  quantity = 1;
  addedAlert = false;

  faHeart = faHeart;
  faCartShopping = faCartShopping;
  faAward = faAward;
  faRotate = faRotate;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(id);
      }
    });
  }

  fetchProduct(id: string): void {
    this.isLoading = true;
    this.addedAlert = false;
    this.quantity = 1;

    this.apiService.getProductById(id).subscribe({
      next: (prod) => {
        this.product = prod;
        this.isLoading = false;
        if (prod && prod.category_id) {
          this.apiService.getProducts(prod.category_id).subscribe({
            next: (list) => {
              this.relatedProducts = list.filter(p => p.id !== prod.id).slice(0, 4);
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  increment(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onAddToCart(): void {
    if (!this.product) return;
    this.addedAlert = true;
    setTimeout(() => {
      this.addedAlert = false;
    }, 3000);
  }

  getSpecKeys(specs?: { [key: string]: string }): string[] {
    return specs ? Object.keys(specs) : [];
  }
}

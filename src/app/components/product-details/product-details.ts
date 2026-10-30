import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart,
  faCartShopping,
  faAward,
  faRotate,
  faShieldHalved,
  faCrown,
  faCheck,
  faTruckFast,
  faArrowLeft,
  faPlus,
  faMinus,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, Product } from '../../Service/api';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  styleUrl: './product-details.css',
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  faHeart = faHeart;
  faCartShopping = faCartShopping;
  faAward = faAward;
  faRotate = faRotate;
  faShieldHalved = faShieldHalved;
  faCrown = faCrown;
  faCheck = faCheck;
  faTruckFast = faTruckFast;
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faMinus = faMinus;
  faStar = faStar;

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  quantity = signal<number>(1);
  addedAlert = signal<boolean>(false);
  selectedColor = signal<string | null>(null);
  selectedSize = signal<string | null>(null);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public apiService = inject(ApiService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(id);
      }
    });
  }

  fetchProduct(id: string): void {
    this.isLoading.set(true);
    this.addedAlert.set(false);
    this.quantity.set(1);
    this.cdr.markForCheck();

    this.apiService.getProductById(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.isLoading.set(false);

        if (prod) {
          if (prod.colors && prod.colors.length > 0) {
            this.selectedColor.set(prod.colors[0]);
          }
          if (prod.sizes && prod.sizes.length > 0) {
            this.selectedSize.set(prod.sizes[0]);
          }

          const catId = prod.category?._id || prod.category_id;
          if (catId) {
            this.apiService.getProducts(catId).subscribe({
              next: (list) => {
                const prodIdStr = String(prod._id || prod.id);
                this.relatedProducts.set(
                  list.filter(p => String(p._id || p.id) !== prodIdStr).slice(0, 4)
                );
                this.cdr.markForCheck();
              }
            });
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.product.set(null);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  increment(): void {
    const p = this.product();
    if (p && this.quantity() < p.stock) {
      this.quantity.update(q => q + 1);
      this.cdr.markForCheck();
    }
  }

  decrement(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
      this.cdr.markForCheck();
    }
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
    this.cdr.markForCheck();
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
    this.cdr.markForCheck();
  }

  onAddToCart(): void {
    const p = this.product();
    if (!p) return;

    this.apiService.addToCart(p, this.quantity());
    this.addedAlert.set(true);
    this.cdr.markForCheck();

    setTimeout(() => {
      this.addedAlert.set(false);
      this.cdr.markForCheck();
    }, 2800);
  }

  getSpecKeys(specs?: { [key: string]: string }): string[] {
    return specs ? Object.keys(specs) : [];
  }
}

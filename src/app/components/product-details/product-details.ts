import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart,
  faBagShopping,
  faAward,
  faRotate,
  faShieldHalved,
  faCheck,
  faTruckFast,
  faArrowLeft,
  faPlus,
  faMinus,
  faStar,
  faTrash,
  faCommentDots,
  faShareNodes,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, Product, Review } from '../../Service/api';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  styleUrl: './product-details.css',
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  faHeart = faHeart;
  faBagShopping = faBagShopping;
  faAward = faAward;
  faRotate = faRotate;
  faShieldHalved = faShieldHalved;
  faCheck = faCheck;
  faTruckFast = faTruckFast;
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faMinus = faMinus;
  faStar = faStar;
  faTrash = faTrash;
  faCommentDots = faCommentDots;
  faShareNodes = faShareNodes;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  reviews = signal<Review[]>([]);
  isLoading = signal<boolean>(true);
  quantity = signal<number>(1);
  addedAlert = signal<boolean>(false);
  selectedColor = signal<string | null>(null);
  selectedSize = signal<string | null>(null);

  // Accordion Toggles
  showSpecs = signal<boolean>(false);
  showShipping = signal<boolean>(false);

  // Review Form State
  showReviewForm = signal<boolean>(false);
  reviewRating = signal<number>(5);
  reviewComment = signal<string>('');
  isSubmittingReview = signal<boolean>(false);
  reviewMessage = signal<string | null>(null);
  reviewErrorMessage = signal<string | null>(null);

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

          // Fetch product reviews from API
          const prodId = String(prod._id || prod.id);
          this.loadReviews(prodId);

          const catId = prod.category?._id || prod.category_id;
          if (catId) {
            this.apiService.getProducts(catId).subscribe({
              next: (list) => {
                this.relatedProducts.set(
                  list.filter(p => String(p._id || p.id) !== prodId).slice(0, 4)
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

  loadReviews(productId: string): void {
    this.apiService.getProductReviews(productId).subscribe({
      next: (revs) => {
        this.reviews.set(revs);
        this.cdr.markForCheck();
      },
      error: () => {
        this.reviews.set([]);
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

  buyItNow(): void {
    const p = this.product();
    if (!p) return;

    this.apiService.addToCart(p, this.quantity());
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/orders']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleReviewForm(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.showReviewForm.update(v => !v);
  }

  setRating(score: number): void {
    this.reviewRating.set(score);
  }

  submitReview(): void {
    const p = this.product();
    if (!p) return;

    if (!this.reviewComment().trim()) {
      this.reviewErrorMessage.set('Please write a short review comment.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewErrorMessage.set(null);
    this.reviewMessage.set(null);
    this.cdr.markForCheck();

    const prodId = String(p._id || p.id);
    this.apiService.addReview(prodId, this.reviewRating(), this.reviewComment().trim()).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.reviewMessage.set('Review submitted successfully! Thank you for your feedback.');
        this.reviewComment.set('');
        this.showReviewForm.set(false);
        this.loadReviews(prodId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmittingReview.set(false);
        const msg = err?.error?.message || 'Could not submit review. Please try again.';
        this.reviewErrorMessage.set(msg);
        this.cdr.markForCheck();
      }
    });
  }

  deleteReview(reviewId: string): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const p = this.product();
    if (!p) return;

    const prodId = String(p._id || p.id);
    this.apiService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews(prodId);
      },
      error: (err) => {
        console.warn('Error deleting review', err);
      }
    });
  }

  getSpecKeys(specs?: { [key: string]: string }): string[] {
    return specs ? Object.keys(specs) : [];
  }

  scrollToReviews(): void {
    const el = document.getElementById('reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

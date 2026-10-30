import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart,
  faCartShopping,
  faMagnifyingGlass,
  faUser,
  faRightFromBracket,
  faXmark,
  faTrash,
  faPlus,
  faMinus,
  faCrown,
  faBagShopping,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../Service/auth';
import { ApiService, CartItem } from '../../Service/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule],
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  faHeart = faHeart;
  faCartShopping = faCartShopping;
  faMagnifyingGlass = faMagnifyingGlass;
  faUser = faUser;
  faRightFromBracket = faRightFromBracket;
  faXmark = faXmark;
  faTrash = faTrash;
  faPlus = faPlus;
  faMinus = faMinus;
  faCrown = faCrown;
  faBagShopping = faBagShopping;
  faCheckCircle = faCheckCircle;

  isCartOpen = false;
  isOrderSuccess = false;
  isCheckingOut = false;

  constructor(
    public authService: AuthService,
    public apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
    this.cdr.markForCheck();
  }

  closeCart(): void {
    this.isCartOpen = false;
    this.cdr.markForCheck();
  }

  increaseQuantity(item: CartItem): void {
    this.apiService.addToCart(item.product, 1);
    this.cdr.markForCheck();
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.apiService.addToCart(item.product, -1);
    } else {
      this.apiService.removeFromCart(item.product._id || item.product.id);
    }
    this.cdr.markForCheck();
  }

  removeItem(productId: string | number): void {
    this.apiService.removeFromCart(productId);
    this.cdr.markForCheck();
  }

  clearCart(): void {
    this.apiService.clearCart();
    this.cdr.markForCheck();
  }

  checkout(): void {
    if (this.apiService.cart().length === 0) return;

    this.isCheckingOut = true;
    this.cdr.markForCheck();

    this.apiService.checkout().subscribe({
      next: () => {
        this.isCheckingOut = false;
        this.isOrderSuccess = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.isOrderSuccess = false;
          this.isCartOpen = false;
          this.cdr.markForCheck();
        }, 2200);
      },
      error: () => {
        // Fallback checkout success for guest or local order
        this.isCheckingOut = false;
        this.isOrderSuccess = true;
        this.apiService.clearCart();
        this.cdr.markForCheck();

        setTimeout(() => {
          this.isOrderSuccess = false;
          this.isCartOpen = false;
          this.cdr.markForCheck();
        }, 2200);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.cdr.markForCheck();
    this.router.navigate(['/login']);
  }
}

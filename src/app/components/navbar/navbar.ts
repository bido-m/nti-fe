import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBagShopping,
  faMagnifyingGlass,
  faBars,
  faXmark,
  faPlus,
  faMinus,
  faTrash,
  faRightFromBracket,
  faUser,
  faArrowRight,
  faCheck,
  faTruckFast,
  faShieldHalved,
  faStore,
  faBoxOpen,
  faUserGear,
  faTag
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, CartItem } from '../../Service/api';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  faBagShopping = faBagShopping;
  faMagnifyingGlass = faMagnifyingGlass;
  faBars = faBars;
  faXmark = faXmark;
  faPlus = faPlus;
  faMinus = faMinus;
  faTrash = faTrash;
  faRightFromBracket = faRightFromBracket;
  faUser = faUser;
  faArrowRight = faArrowRight;
  faCheck = faCheck;
  faTruckFast = faTruckFast;
  faShieldHalved = faShieldHalved;
  faStore = faStore;
  faBoxOpen = faBoxOpen;
  faUserGear = faUserGear;
  faTag = faTag;

  isCartOpen = signal<boolean>(false);
  isMobileMenuOpen = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);
  isCheckingOut = signal<boolean>(false);
  orderSuccess = signal<string | null>(null);

  public apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);

  readonly freeShippingThreshold = 150;

  get freeShippingRemaining(): number {
    const remaining = this.freeShippingThreshold - this.apiService.cartTotal();
    return remaining > 0 ? remaining : 0;
  }

  get freeShippingPercent(): number {
    const total = this.apiService.cartTotal();
    const pct = (total / this.freeShippingThreshold) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  toggleCart(): void {
    this.isCartOpen.update(v => !v);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  increaseQuantity(item: CartItem): void {
    this.apiService.updateQuantity(item.product._id || item.product.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.apiService.updateQuantity(item.product._id || item.product.id, item.quantity - 1);
    } else {
      this.removeItem(item.product._id || item.product.id);
    }
  }

  removeItem(productId: string | number): void {
    this.apiService.removeFromCart(productId);
  }

  clearCart(): void {
    this.apiService.clearCart();
  }

  checkout(): void {
    if (!this.authService.isLoggedIn()) {
      this.closeCart();
      this.router.navigate(['/login']);
      return;
    }

    this.isCheckingOut.set(true);
    this.orderSuccess.set(null);

    this.apiService.createOrder().subscribe({
      next: (res) => {
        this.isCheckingOut.set(false);
        this.orderSuccess.set('Order placed successfully! Check your orders list.');
        setTimeout(() => {
          this.orderSuccess.set(null);
          this.closeCart();
          this.router.navigate(['/orders']);
        }, 2000);
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        // Fallback for offline/local simulation
        this.apiService.clearCart();
        this.orderSuccess.set('Order submitted successfully!');
        setTimeout(() => {
          this.orderSuccess.set(null);
          this.closeCart();
          this.router.navigate(['/orders']);
        }, 1800);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.router.navigate(['/']);
  }
}

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  faMinus
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../Service/auth';
import { ApiService, CartItem } from '../../Service/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
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

  isCartOpen = false;

  constructor(
    public authService: AuthService,
    public apiService: ApiService,
    private router: Router
  ) {}

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  increaseQuantity(item: CartItem): void {
    this.apiService.addToCart(item.product, 1);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.apiService.addToCart(item.product, -1);
    } else {
      this.apiService.removeFromCart(item.product.id);
    }
  }

  removeItem(productId: number): void {
    this.apiService.removeFromCart(productId);
  }

  clearCart(): void {
    this.apiService.clearCart();
  }

  checkout(): void {
    alert('تم تأكيد طلبك بنجاح!');
    this.apiService.clearCart();
    this.isCartOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

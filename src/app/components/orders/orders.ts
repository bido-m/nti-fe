import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBoxOpen,
  faClock,
  faCircleCheck,
  faBan,
  faArrowLeft,
  faRotateRight,
  faBagShopping,
  faCheck,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { ApiService, Order } from '../../Service/api';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  faBoxOpen = faBoxOpen;
  faClock = faClock;
  faCircleCheck = faCircleCheck;
  faBan = faBan;
  faArrowLeft = faArrowLeft;
  faRotateRight = faRotateRight;
  faBagShopping = faBagShopping;
  faCheck = faCheck;
  faTrash = faTrash;

  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(true);
  cancelingId = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  private apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.apiService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  cancelOrder(orderId: string): void {
    if (!confirm('Are you sure you want to cancel this order? Product stock will be returned.')) return;

    this.cancelingId.set(orderId);
    this.cdr.markForCheck();

    this.apiService.cancelOrder(orderId).subscribe({
      next: () => {
        this.cancelingId.set(null);
        this.successMsg.set('Order has been cancelled successfully.');
        this.loadOrders();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: (err) => {
        this.cancelingId.set(null);
        alert(err?.error?.message || 'Failed to cancel order.');
        this.cdr.markForCheck();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }
}

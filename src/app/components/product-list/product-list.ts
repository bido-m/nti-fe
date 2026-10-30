import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBagShopping,
  faStar,
  faEye,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { Product } from '../../Service/api';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList {
  @Input() products: Product[] = [];
  @Input() isLoading = false;
  @Output() addToCart = new EventEmitter<Product>();

  faBagShopping = faBagShopping;
  faStar = faStar;
  faEye = faEye;
  faShieldHalved = faShieldHalved;

  onAddToCart(product: Product, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(product);
  }
}

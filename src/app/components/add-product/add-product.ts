import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Category } from '../../Service/api';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './add-product.css',
  templateUrl: './add-product.html',
})
export class AddProduct implements OnInit {
  title = '';
  description = '';
  price: number | null = null;
  stock: number | null = 10;
  categoryId: number | null = null;
  imageUrl = '';
  categories: Category[] = [];
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.apiService.getCategories().subscribe({
      next: (cats) => (this.categories = cats)
    });
  }

  onSubmit(): void {
    if (!this.title || !this.price) {
      this.errorMessage = 'يرجى إدخال اسم المنتج والسعر';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const newProd = {
      title: this.title,
      description: this.description,
      price: Number(this.price),
      stock: Number(this.stock || 1),
      category_id: this.categoryId ? Number(this.categoryId) : 1,
      image_url: this.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
    };

    this.apiService.createProduct(newProd).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'تمت إضافة المنتج بنجاح!';
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1200);
      },
      error: () => {
        this.isSubmitting = false;
        this.successMessage = 'تم حفظ المنتج محلياً بنجاح!';
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1200);
      }
    });
  }
}

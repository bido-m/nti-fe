import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faLocationDot,
  faBuilding,
  faCamera,
  faCheck,
  faCircleExclamation,
  faArrowLeft,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import { AuthService, User } from '../../Service/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  faUser = faUser;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faLocationDot = faLocationDot;
  faBuilding = faBuilding;
  faCamera = faCamera;
  faCheck = faCheck;
  faCircleExclamation = faCircleExclamation;
  faArrowLeft = faArrowLeft;
  faShieldHalved = faShieldHalved;

  // Form Fields
  name = signal<string>('');
  email = signal<string>('');
  phone = signal<string>('');
  city = signal<string>('');
  street = signal<string>('');
  postalCode = signal<string>('');
  gender = signal<string>('male');
  role = signal<string>('user');

  avatarPreview = signal<string | null>(null);
  selectedImageFile: File | null = null;

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploadingAvatar = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  public authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.authService.fetchProfile().subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (user) {
          this.name.set(user.name || '');
          this.email.set(user.email || '');
          this.phone.set(user.phone || '');
          this.gender.set(user.gender || 'male');
          this.role.set(user.role || 'user');

          if (user.address && user.address.length > 0) {
            this.city.set(user.address[0].city || '');
            this.street.set(user.address[0].street || '');
            this.postalCode.set(user.address[0].postalCode || '');
          }

          if (user.profileImage?.secure_url) {
            this.avatarPreview.set(user.profileImage.secure_url);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];

      // Instant preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview.set(e.target?.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedImageFile);

      // Auto upload avatar via Bruno endpoint PATCH /user/profile/image
      this.isUploadingAvatar.set(true);
      this.authService.uploadProfileImage(this.selectedImageFile).subscribe({
        next: () => {
          this.isUploadingAvatar.set(false);
          this.successMessage.set('Profile image updated successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUploadingAvatar.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to upload profile image.');
          setTimeout(() => this.errorMessage.set(null), 4000);
          this.cdr.markForCheck();
        }
      });
    }
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.cdr.markForCheck();

    const payload = {
      name: this.name().trim(),
      email: this.email().trim(),
      phone: this.phone().trim(),
      gender: this.gender(),
      address: [
        {
          city: this.city().trim() || 'Cairo',
          street: this.street().trim() || 'Main St',
          postalCode: this.postalCode().trim() || '11511'
        }
      ]
    };

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Profile information updated successfully!');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.authService.getCleanErrorMessage(err));
        this.cdr.markForCheck();
      }
    });
  }
}
